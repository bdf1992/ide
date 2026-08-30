#!/usr/bin/env python3
"""Local-first host and optional model bridge for Open Chat IDE.

The browser workspace remains the custody boundary. This process serves the same
static IDE artifact and forwards explicit semantic proposal requests to an
OpenAI-compatible local model endpoint. A forwarded response is still only an
untrusted SEMANTIC_PROPOSAL/1 candidate.
"""

from __future__ import annotations

import argparse
import json
import os
import socket
import sys
import urllib.error
import urllib.parse
import urllib.request
import uuid
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


BRIDGE_PROTOCOL = "LOCAL_IDE_BRIDGE/1"
MODEL_RESULT_PROTOCOL = "LOCAL_MODEL_RESULT/1"
PROPOSAL_PROTOCOL = "SEMANTIC_PROPOSAL/1"
KERNEL_VERSION = "0.1"
MAX_REQUEST_BYTES = 2 * 1024 * 1024
DEFAULT_MODEL_URL = "http://127.0.0.1:8000"


class BridgeError(Exception):
    """An expected bridge error with an HTTP status and stable code."""

    def __init__(self, status: HTTPStatus, code: str, detail: str):
        super().__init__(detail)
        self.status = status
        self.code = code
        self.detail = detail


def _json_bytes(value: Any) -> bytes:
    return json.dumps(value, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _authorization_headers(api_key: str | None) -> dict[str, str]:
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    return headers


def _http_json(
    url: str,
    *,
    method: str = "GET",
    body: dict[str, Any] | None = None,
    api_key: str | None = None,
    timeout: float = 10.0,
) -> Any:
    request = urllib.request.Request(
        url,
        data=None if body is None else _json_bytes(body),
        headers=_authorization_headers(api_key),
        method=method,
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            payload = response.read(MAX_REQUEST_BYTES + 1)
    except urllib.error.HTTPError as exc:
        detail = exc.read(4096).decode("utf-8", errors="replace")
        raise BridgeError(
            HTTPStatus.BAD_GATEWAY,
            "MODEL_HTTP_ERROR",
            f"Model endpoint returned HTTP {exc.code}: {detail}",
        ) from exc
    except (urllib.error.URLError, TimeoutError, socket.timeout) as exc:
        raise BridgeError(
            HTTPStatus.SERVICE_UNAVAILABLE,
            "MODEL_UNAVAILABLE",
            f"Could not reach model endpoint: {exc}",
        ) from exc

    if len(payload) > MAX_REQUEST_BYTES:
        raise BridgeError(
            HTTPStatus.BAD_GATEWAY,
            "MODEL_RESPONSE_TOO_LARGE",
            "Model response exceeded the 2 MiB bridge limit.",
        )
    try:
        return json.loads(payload)
    except json.JSONDecodeError as exc:
        raise BridgeError(
            HTTPStatus.BAD_GATEWAY,
            "MODEL_RESPONSE_INVALID_JSON",
            "Model endpoint did not return JSON.",
        ) from exc


def _first_model_id(models_payload: Any) -> str | None:
    if not isinstance(models_payload, dict) or not isinstance(models_payload.get("data"), list):
        return None
    for item in models_payload["data"]:
        if isinstance(item, dict) and isinstance(item.get("id"), str) and item["id"]:
            return item["id"]
    return None


def _extract_message_text(completion: Any) -> str:
    try:
        content = completion["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise BridgeError(
            HTTPStatus.BAD_GATEWAY,
            "MODEL_RESPONSE_MALFORMED",
            "Model completion did not contain choices[0].message.content.",
        ) from exc

    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = [item.get("text", "") for item in content if isinstance(item, dict)]
        if any(parts):
            return "".join(parts)
    raise BridgeError(
        HTTPStatus.BAD_GATEWAY,
        "MODEL_RESPONSE_MALFORMED",
        "Model completion content was not textual.",
    )


def _parse_json_object(text: str) -> dict[str, Any]:
    candidate = text.strip()
    if candidate.startswith("```"):
        lines = candidate.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        candidate = "\n".join(lines).strip()
    try:
        value = json.loads(candidate)
    except json.JSONDecodeError as exc:
        raise BridgeError(
            HTTPStatus.BAD_GATEWAY,
            "MODEL_PROPOSAL_INVALID_JSON",
            "Model output was not one JSON object.",
        ) from exc
    if not isinstance(value, dict):
        raise BridgeError(
            HTTPStatus.BAD_GATEWAY,
            "MODEL_PROPOSAL_INVALID_SHAPE",
            "Model output must be a JSON object.",
        )
    return value


def _validate_proposal(proposal: dict[str, Any]) -> None:
    if proposal.get("protocol") != PROPOSAL_PROTOCOL:
        raise BridgeError(
            HTTPStatus.BAD_GATEWAY,
            "MODEL_PROPOSAL_WRONG_PROTOCOL",
            f"Expected {PROPOSAL_PROTOCOL}.",
        )
    if proposal.get("kernel_version") != KERNEL_VERSION:
        raise BridgeError(
            HTTPStatus.BAD_GATEWAY,
            "MODEL_PROPOSAL_WRONG_KERNEL",
            f"Expected Kernel {KERNEL_VERSION}.",
        )
    disposition = proposal.get("disposition")
    if disposition == "propose":
        if not isinstance(proposal.get("candidate_ir"), dict):
            raise BridgeError(
                HTTPStatus.BAD_GATEWAY,
                "MODEL_PROPOSAL_MISSING_IR",
                "A proposed result requires candidate_ir.",
            )
        structure = proposal.get("typed_structure")
        required_parts = ("data_refs", "tokens", "token_state", "signals")
        if (
            not isinstance(structure, dict)
            or structure.get("version") != "TSR/0.1"
            or any(not isinstance(structure.get(part), list) for part in required_parts)
        ):
            raise BridgeError(
                HTTPStatus.BAD_GATEWAY,
                "MODEL_PROPOSAL_MISSING_TSR",
                "A proposed result requires a complete TSR/0.1 typed_structure.",
            )
    elif disposition == "refuse":
        refusal = proposal.get("refusal")
        if not isinstance(refusal, dict) or not isinstance(refusal.get("code"), str):
            raise BridgeError(
                HTTPStatus.BAD_GATEWAY,
                "MODEL_PROPOSAL_MISSING_REFUSAL",
                "A refused result requires refusal.code.",
            )
    else:
        raise BridgeError(
            HTTPStatus.BAD_GATEWAY,
            "MODEL_PROPOSAL_BAD_DISPOSITION",
            "Proposal disposition must be propose or refuse.",
        )


def _proposal_messages(request: dict[str, Any]) -> list[dict[str, str]]:
    source = request.get("source")
    if not isinstance(source, str) or not source.strip():
        raise BridgeError(
            HTTPStatus.BAD_REQUEST,
            "SOURCE_REQUIRED",
            "source must be a non-empty string.",
        )
    projection = request.get("projection", "auto")
    if not isinstance(projection, str) or len(projection) > 64:
        raise BridgeError(
            HTTPStatus.BAD_REQUEST,
            "PROJECTION_INVALID",
            "projection must be a short string.",
        )

    system = (
        "You are an untrusted semantic elaborator for Open Chat IDE. "
        "Return exactly one JSON object using protocol SEMANTIC_PROPOSAL/1 and "
        "kernel_version 0.1. You may propose only Kernel 0.1 nodes: Bind, Iterate, "
        "AddUpdate, Assert, Observe, Lit, Ref, and Eq. If the source requires any "
        "other operation or is ambiguous, return disposition refuse with a stable "
        "refusal code. Never claim admission, execution, equivalence, or standing."
    )
    user = json.dumps(
        {
            "projection": projection,
            "source": source,
            "output_contract": {
                "protocol": PROPOSAL_PROTOCOL,
                "kernel_version": KERNEL_VERSION,
                "disposition": "propose | refuse",
                "propose_requires": {
                    "candidate_ir": "object",
                    "typed_structure": {
                        "version": "TSR/0.1",
                        "data_refs": "array",
                        "tokens": "array",
                        "token_state": "array",
                        "signals": "array",
                    },
                },
                "refuse_requires": {"refusal": {"code": "string"}},
            },
        },
        ensure_ascii=False,
    )
    return [{"role": "system", "content": system}, {"role": "user", "content": user}]


class LocalIDEHandler(SimpleHTTPRequestHandler):
    server_version = "OpenChatIDE/0.1"

    def __init__(
        self,
        *args: Any,
        directory: str,
        model_url: str,
        model_name: str | None,
        model_api_key: str | None,
        **kwargs: Any,
    ) -> None:
        self.model_url = model_url.rstrip("/")
        self.model_name = model_name
        self.model_api_key = model_api_key
        super().__init__(*args, directory=directory, **kwargs)

    def log_message(self, format: str, *args: Any) -> None:
        sys.stderr.write(f"[local] {self.address_string()} {format % args}\n")

    def _send_json(self, status: HTTPStatus, value: Any) -> None:
        payload = _json_bytes(value)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _send_error(self, error: BridgeError) -> None:
        self._send_json(
            error.status,
            {
                "protocol": BRIDGE_PROTOCOL,
                "ok": False,
                "error": {"code": error.code, "detail": error.detail},
            },
        )

    def _read_json(self) -> dict[str, Any]:
        raw_length = self.headers.get("Content-Length")
        try:
            length = int(raw_length or "0")
        except ValueError as exc:
            raise BridgeError(
                HTTPStatus.BAD_REQUEST, "CONTENT_LENGTH_INVALID", "Invalid Content-Length."
            ) from exc
        if length <= 0:
            raise BridgeError(HTTPStatus.BAD_REQUEST, "BODY_REQUIRED", "JSON body required.")
        if length > MAX_REQUEST_BYTES:
            raise BridgeError(
                HTTPStatus.REQUEST_ENTITY_TOO_LARGE,
                "REQUEST_TOO_LARGE",
                "Request exceeded the 2 MiB bridge limit.",
            )
        try:
            value = json.loads(self.rfile.read(length))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise BridgeError(
                HTTPStatus.BAD_REQUEST, "INVALID_JSON", "Request body must be valid JSON."
            ) from exc
        if not isinstance(value, dict):
            raise BridgeError(
                HTTPStatus.BAD_REQUEST, "INVALID_JSON_SHAPE", "Request body must be an object."
            )
        return value

    def _model_status(self) -> dict[str, Any]:
        models = _http_json(
            f"{self.model_url}/v1/models",
            api_key=self.model_api_key,
            timeout=2.0,
        )
        selected = self.model_name or _first_model_id(models)
        return {
            "protocol": BRIDGE_PROTOCOL,
            "ok": True,
            "model_endpoint": self.model_url,
            "model": selected,
        }

    def do_GET(self) -> None:
        if self.path == "/api/health":
            self._send_json(
                HTTPStatus.OK,
                {
                    "protocol": BRIDGE_PROTOCOL,
                    "ok": True,
                    "custody": "browser-workspace",
                    "capabilities": ["model.health", "semantic.propose"],
                },
            )
            return
        if self.path == "/api/model/health":
            try:
                self._send_json(HTTPStatus.OK, self._model_status())
            except BridgeError as error:
                self._send_error(error)
            return
        path = urllib.parse.urlsplit(self.path).path
        if any(part.startswith(".") for part in Path(path).parts):
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        super().do_GET()

    def list_directory(self, path: str) -> None:
        self.send_error(HTTPStatus.NOT_FOUND)
        return None

    def do_POST(self) -> None:
        if self.path != "/api/model/propose":
            self._send_error(
                BridgeError(HTTPStatus.NOT_FOUND, "ROUTE_NOT_FOUND", "Unknown API route.")
            )
            return
        try:
            request = self._read_json()
            model = request.get("model") or self.model_name
            if model is not None and not isinstance(model, str):
                raise BridgeError(
                    HTTPStatus.BAD_REQUEST, "MODEL_INVALID", "model must be a string."
                )
            if not model:
                model = self._model_status().get("model")
            if not model:
                raise BridgeError(
                    HTTPStatus.SERVICE_UNAVAILABLE,
                    "MODEL_NOT_SELECTED",
                    "No model was configured or discovered.",
                )
            request_id = request.get("request_id") or str(uuid.uuid4())
            if not isinstance(request_id, str) or len(request_id) > 128:
                raise BridgeError(
                    HTTPStatus.BAD_REQUEST,
                    "REQUEST_ID_INVALID",
                    "request_id must be a short string.",
                )
            completion = _http_json(
                f"{self.model_url}/v1/chat/completions",
                method="POST",
                api_key=self.model_api_key,
                timeout=120.0,
                body={
                    "model": model,
                    "messages": _proposal_messages(request),
                    "temperature": 0,
                    "max_tokens": 2048,
                },
            )
            proposal = _parse_json_object(_extract_message_text(completion))
            _validate_proposal(proposal)
            self._send_json(
                HTTPStatus.OK,
                {
                    "protocol": MODEL_RESULT_PROTOCOL,
                    "request_id": request_id,
                    "model": model,
                    "authority": "candidate-only",
                    "proposal": proposal,
                },
            )
        except BridgeError as error:
            self._send_error(error)


def build_server(
    root: Path,
    host: str,
    port: int,
    *,
    model_url: str,
    model_name: str | None,
    model_api_key: str | None,
) -> ThreadingHTTPServer:
    handler = partial(
        LocalIDEHandler,
        directory=str(root),
        model_url=model_url,
        model_name=model_name,
        model_api_key=model_api_key,
    )
    return ThreadingHTTPServer((host, port), handler)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    repo_root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=4310)
    parser.add_argument("--root", type=Path, default=repo_root)
    parser.add_argument(
        "--model-url",
        default=os.environ.get("OPEN_CHAT_IDE_MODEL_URL", DEFAULT_MODEL_URL),
    )
    parser.add_argument("--model", default=os.environ.get("OPEN_CHAT_IDE_MODEL"))
    parser.add_argument(
        "--model-api-key", default=os.environ.get("OPEN_CHAT_IDE_MODEL_API_KEY")
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    root = args.root.resolve()
    if not (root / "index.html").is_file():
        print(f"error: {root} does not contain index.html", file=sys.stderr)
        return 2
    if args.host not in {"127.0.0.1", "::1", "localhost"}:
        print(
            "warning: non-loopback binding exposes the local bridge to your network",
            file=sys.stderr,
        )
    server = build_server(
        root,
        args.host,
        args.port,
        model_url=args.model_url,
        model_name=args.model,
        model_api_key=args.model_api_key,
    )
    print(f"Open Chat IDE: http://{args.host}:{server.server_port}")
    print(f"Model endpoint: {args.model_url.rstrip('/')}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
