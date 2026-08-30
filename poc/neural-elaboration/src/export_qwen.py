#!/usr/bin/env python3
"""Export the frozen training split to Qwen-VL's documented conversation format."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    with path.open(encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


def convert(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    converted = []
    for record in records:
        user = record["messages"][0]
        assistant = record["messages"][1]
        text_parts = [part["text"] for part in user["content"] if part["type"] == "text"]
        images = [part["image"] for part in user["content"] if part["type"] == "image"]
        prompt = "\n\n".join(text_parts)
        if images:
            prompt = "\n".join("<image>" for _ in images) + "\n" + prompt
        item: dict[str, Any] = {
            "id": record["case_id"],
            "conversations": [
                {"from": "human", "value": prompt},
                {"from": "gpt", "value": assistant["content"]},
            ],
        }
        if len(images) == 1:
            item["image"] = images[0]
        elif images:
            item["image"] = images
        converted.append(item)
    return converted


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    converted = convert(load_jsonl(args.input))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(converted, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({"examples": len(converted), "output": str(args.output)}, sort_keys=True))


if __name__ == "__main__":
    main()

