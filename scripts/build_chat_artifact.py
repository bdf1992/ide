#!/usr/bin/env python3
"""Export the canonical Chat IDE shell without creating a second implementation."""

from __future__ import annotations

import argparse
import hashlib
from pathlib import Path


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Copy canonical index.html byte-for-byte into an attachable Chat artifact."
    )
    parser.add_argument("--source", default="index.html", help="Canonical Chat shell input")
    parser.add_argument(
        "--output",
        default="dist/open-chat-ide-chat.html",
        help="Generated Chat artifact path",
    )
    args = parser.parse_args()

    source = Path(args.source)
    output = Path(args.output)

    if not source.is_file():
        raise SystemExit(f"source not found: {source}")

    data = source.read_bytes()
    if b"<title>Open Chat IDE</title>" not in data:
        raise SystemExit(f"source does not look like the canonical Open Chat IDE shell: {source}")

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(data)

    exported = output.read_bytes()
    if exported != data:
        raise SystemExit("export drift: output bytes do not match canonical source")

    digest = sha256(data)
    print(f"source: {source}")
    print(f"output: {output}")
    print(f"sha256: {digest}")
    print("chat-artifact: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
