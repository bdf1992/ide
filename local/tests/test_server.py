from __future__ import annotations

import json
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from local.server import build_server


class FakeModelHandler(BaseHTTPRequestHandler):
    proposal = {
        "protocol": "SEMANTIC_PROPOSAL/1",
        "kernel_version": "0.1",
        "disposition": "refuse",
        "refusal": {"code": "UNDECLARED_OPERATION"},
    }

    def log_message(self, format: str, *args: object) -> None:
        return

    def _json(self, value: object) -> None:
        payload = json.dumps(value).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self) -> None:
        if self.path == "/v1/models":
            self._json({"data": [{"id": "test-model"}]})
            return
        self.send_error(404)

    def do_POST(self) -> None:
        if self.path != "/v1/chat/completions":
            self.send_error(404)
            return
        length = int(self.headers["Content-Length"])
        request = json.loads(self.rfile.read(length))
        assert request["model"] == "test-model"
        self._json(
            {"choices": [{"message": {"content": json.dumps(self.proposal)}}]}
        )


class ServerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.model = ThreadingHTTPServer(("127.0.0.1", 0), FakeModelHandler)
        cls.model_thread = threading.Thread(target=cls.model.serve_forever, daemon=True)
        cls.model_thread.start()
        cls.temp = tempfile.TemporaryDirectory()
        Path(cls.temp.name, "index.html").write_text("<title>fixture</title>")
        Path(cls.temp.name, ".secret").write_text("not served")
        Path(cls.temp.name, "local").mkdir()
        Path(cls.temp.name, "local", "visible.txt").write_text("not indexed")
        cls.bridge = build_server(
            Path(cls.temp.name),
            "127.0.0.1",
            0,
            model_url=f"http://127.0.0.1:{cls.model.server_port}",
            model_name=None,
            model_api_key=None,
        )
        cls.bridge_thread = threading.Thread(target=cls.bridge.serve_forever, daemon=True)
        cls.bridge_thread.start()
        cls.base = f"http://127.0.0.1:{cls.bridge.server_port}"

    @classmethod
    def tearDownClass(cls) -> None:
        cls.bridge.shutdown()
        cls.bridge.server_close()
        cls.model.shutdown()
        cls.model.server_close()
        cls.temp.cleanup()

    def get_json(self, path: str) -> tuple[int, dict[str, object]]:
        with urllib.request.urlopen(self.base + path) as response:
            return response.status, json.loads(response.read())

    def post_json(self, path: str, value: object) -> tuple[int, dict[str, object]]:
        request = urllib.request.Request(
            self.base + path,
            data=json.dumps(value).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request) as response:
            return response.status, json.loads(response.read())

    def test_serves_same_ide_artifact(self) -> None:
        with urllib.request.urlopen(self.base + "/") as response:
            self.assertEqual(response.status, 200)
            self.assertIn(b"fixture", response.read())

    def test_hidden_files_and_directory_indexes_are_not_served(self) -> None:
        for path in ("/.secret", "/local/"):
            with self.subTest(path=path):
                with self.assertRaises(urllib.error.HTTPError) as caught:
                    urllib.request.urlopen(self.base + path)
                self.assertEqual(caught.exception.code, 404)

    def test_health_declares_narrow_capabilities(self) -> None:
        status, payload = self.get_json("/api/health")
        self.assertEqual(status, 200)
        self.assertEqual(payload["protocol"], "LOCAL_IDE_BRIDGE/1")
        self.assertEqual(payload["custody"], "browser-workspace")
        self.assertEqual(payload["capabilities"], ["model.health", "semantic.propose"])

    def test_model_health_discovers_model(self) -> None:
        status, payload = self.get_json("/api/model/health")
        self.assertEqual(status, 200)
        self.assertEqual(payload["model"], "test-model")

    def test_semantic_proposal_is_candidate_only(self) -> None:
        status, payload = self.post_json(
            "/api/model/propose",
            {"request_id": "case-1", "source": "multiply total by value"},
        )
        self.assertEqual(status, 200)
        self.assertEqual(payload["protocol"], "LOCAL_MODEL_RESULT/1")
        self.assertEqual(payload["authority"], "candidate-only")
        self.assertEqual(payload["proposal"], FakeModelHandler.proposal)

    def test_empty_source_is_rejected_before_model_call(self) -> None:
        with self.assertRaises(urllib.error.HTTPError) as caught:
            self.post_json("/api/model/propose", {"source": ""})
        self.assertEqual(caught.exception.code, 400)
        payload = json.loads(caught.exception.read())
        self.assertEqual(payload["error"]["code"], "SOURCE_REQUIRED")

    def test_incomplete_proposal_does_not_cross_bridge(self) -> None:
        original = FakeModelHandler.proposal
        FakeModelHandler.proposal = {
            "protocol": "SEMANTIC_PROPOSAL/1",
            "kernel_version": "0.1",
            "disposition": "propose",
            "candidate_ir": {},
        }
        try:
            with self.assertRaises(urllib.error.HTTPError) as caught:
                self.post_json("/api/model/propose", {"source": "total plus value"})
            self.assertEqual(caught.exception.code, 502)
            payload = json.loads(caught.exception.read())
            self.assertEqual(payload["error"]["code"], "MODEL_PROPOSAL_MISSING_TSR")
        finally:
            FakeModelHandler.proposal = original


if __name__ == "__main__":
    unittest.main()
