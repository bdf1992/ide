#!/usr/bin/env python3
"""Deterministic Personal/alien parser baseline for the neural experiment."""

from __future__ import annotations

import argparse
import importlib.util
import json
import subprocess
from pathlib import Path
from typing import Any


IDE_ROOT = Path(__file__).resolve().parents[3]
EXPERIMENT = IDE_ROOT / "poc" / "neural-elaboration"


def load_generator():
    path = EXPERIMENT / "src" / "generate_corpus.py"
    spec = importlib.util.spec_from_file_location("tsr_generate_corpus", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


GENERATOR = load_generator()


def parse_surfaces(records: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    selected = [record for record in records if record["projection"] in ("personal", "alien")]
    script = """
import fs from 'node:fs';
import {parsePersonal, validateKernel} from './poc/semantic-core.js';
const records = JSON.parse(fs.readFileSync(0, 'utf8'));
const result = records.map(record => {
  try {
    const ir = parsePersonal(record.source.text);
    validateKernel(ir);
    return {case_id: record.case_id, ok: true, ir};
  } catch (error) {
    return {case_id: record.case_id, ok: false, detail: String(error.message || error)};
  }
});
process.stdout.write(JSON.stringify(result));
"""
    completed = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        cwd=IDE_ROOT,
        input=json.dumps(selected),
        text=True,
        capture_output=True,
        check=True,
    )
    return {record["case_id"]: record for record in json.loads(completed.stdout)}


def predict(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    parsed = parse_surfaces(records)
    predictions = []
    for record in records:
        result = parsed.get(record["case_id"])
        if result and result["ok"]:
            proposal = GENERATOR.proposal(
                result["ir"], record["source"]["sha256"], record["projection"], True
            )
        elif result:
            proposal = {
                "protocol": GENERATOR.PROTOCOL,
                "kernel_version": GENERATOR.KERNEL_VERSION,
                "disposition": "refuse",
                "refusal": {"code": "UNDECLARED_OPERATION", "detail": result["detail"]},
            }
        else:
            proposal = {
                "protocol": GENERATOR.PROTOCOL,
                "kernel_version": GENERATOR.KERNEL_VERSION,
                "disposition": "refuse",
                "refusal": {"code": "UNRESOLVED", "detail": "baseline has no parser for this projection"},
            }
        predictions.append({"case_id": record["case_id"], "proposal": proposal})
    return predictions


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    with args.input.open(encoding="utf-8") as handle:
        records = [json.loads(line) for line in handle if line.strip()]
    predictions = predict(records)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8", newline="\n") as handle:
        for record in predictions:
            handle.write(json.dumps(record, sort_keys=True, separators=(",", ":")) + "\n")
    print(json.dumps({"predictions": len(predictions), "output": str(args.output)}, sort_keys=True))


if __name__ == "__main__":
    main()

