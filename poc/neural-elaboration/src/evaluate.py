#!/usr/bin/env python3
"""Architecture-neutral evaluator for SEMANTIC_PROPOSAL/1 outputs."""

from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    records = []
    with path.open(encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, 1):
            if not line.strip():
                continue
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError as exc:
                raise ValueError(f"{path}:{line_number}: {exc}") from exc
    return records


def valid_shape(proposal: Any) -> tuple[bool, str]:
    if not isinstance(proposal, dict):
        return False, "proposal is not an object"
    if proposal.get("protocol") != "SEMANTIC_PROPOSAL/1":
        return False, "wrong protocol"
    if proposal.get("kernel_version") != "0.1":
        return False, "wrong kernel version"
    allowed = {"protocol", "kernel_version", "disposition", "candidate_ir", "typed_structure", "refusal"}
    unexpected = set(proposal) - allowed
    if unexpected:
        return False, f"unexpected proposal fields: {sorted(unexpected)}"
    disposition = proposal.get("disposition")
    if disposition == "propose":
        if not isinstance(proposal.get("candidate_ir"), dict):
            return False, "proposal lacks candidate_ir"
        structure = proposal.get("typed_structure")
        if not isinstance(structure, dict) or structure.get("version") != "TSR/0.1":
            return False, "proposal lacks TSR/0.1 typed_structure"
        structure_allowed = {"version", "data_refs", "tokens", "token_state", "signals"}
        if set(structure) - structure_allowed:
            return False, "typed_structure contains unexpected fields"
        for key in ("data_refs", "tokens", "token_state", "signals"):
            if not isinstance(structure.get(key), list):
                return False, f"typed_structure.{key} must be an array"
        return True, "valid proposal"
    if disposition == "refuse":
        refusal = proposal.get("refusal")
        if not isinstance(refusal, dict) or not isinstance(refusal.get("code"), str):
            return False, "refusal lacks code"
        return True, "valid refusal"
    return False, "unknown disposition"


def relation_set(proposal: dict[str, Any]) -> set[tuple[str, str, str]]:
    structure = proposal.get("typed_structure", {})
    return {
        (signal.get("source"), signal.get("target"), signal.get("relation"))
        for signal in structure.get("signals", [])
        if isinstance(signal, dict)
    }


def selector_set(proposal: dict[str, Any]) -> set[str]:
    structure = proposal.get("typed_structure", {})
    selectors = []
    for data_ref in structure.get("data_refs", []):
        if isinstance(data_ref, dict):
            selectors.extend(data_ref.get("selectors", []))
    return {json.dumps(selector, sort_keys=True, separators=(",", ":")) for selector in selectors}


def f1(expected: set[Any], observed: set[Any]) -> float:
    if not expected and not observed:
        return 1.0
    if not expected or not observed:
        return 0.0
    overlap = len(expected & observed)
    precision = overlap / len(observed)
    recall = overlap / len(expected)
    return 2 * precision * recall / (precision + recall) if overlap else 0.0


def baseline_predictions(ground: list[dict[str, Any]], name: str) -> dict[str, dict[str, Any]]:
    if name != "constant-refusal":
        raise ValueError(f"unknown baseline: {name}")
    proposal = {
        "protocol": "SEMANTIC_PROPOSAL/1",
        "kernel_version": "0.1",
        "disposition": "refuse",
        "refusal": {"code": "UNRESOLVED"},
    }
    return {record["case_id"]: proposal for record in ground}


def score(ground: list[dict[str, Any]], predictions: dict[str, dict[str, Any]]) -> dict[str, Any]:
    counts = Counter()
    by_projection: dict[str, Counter[str]] = defaultdict(Counter)
    receipts = []
    relation_total = 0.0
    grounding_total = 0.0
    for record in ground:
        case_id = record["case_id"]
        expected = record["expected"]
        observed = predictions.get(case_id)
        counts["cases"] += 1
        projection_counts = by_projection[record["projection"]]
        projection_counts["cases"] += 1
        shape_ok, detail = valid_shape(observed)
        if shape_ok:
            counts["schema_valid"] += 1
        disposition_ok = shape_ok and observed["disposition"] == expected["disposition"]
        if disposition_ok:
            counts["disposition_correct"] += 1
            projection_counts["disposition_correct"] += 1
        semantic_ok = False
        relation_score = 0.0
        grounding_score = 0.0
        if disposition_ok and expected["disposition"] == "refuse":
            semantic_ok = observed["refusal"]["code"] == expected["refusal"]["code"]
        elif disposition_ok:
            semantic_ok = observed.get("candidate_ir") == expected.get("candidate_ir")
            relation_score = f1(relation_set(expected), relation_set(observed))
            grounding_score = f1(selector_set(expected), selector_set(observed))
        if expected["disposition"] == "propose":
            counts["relation_cases"] += 1
            relation_total += relation_score
            grounding_total += grounding_score
        if semantic_ok:
            counts["semantic_exact"] += 1
            projection_counts["semantic_exact"] += 1
        receipts.append(
            {
                "case_id": case_id,
                "projection": record["projection"],
                "schema_valid": shape_ok,
                "disposition_correct": disposition_ok,
                "semantic_exact": semantic_ok,
                "relation_f1": relation_score,
                "grounding_f1": grounding_score,
                "detail": detail,
            }
        )
    total = counts["cases"] or 1
    summary = {
        "cases": counts["cases"],
        "schema_valid_rate": counts["schema_valid"] / total,
        "disposition_accuracy": counts["disposition_correct"] / total,
        "semantic_exact_accuracy": counts["semantic_exact"] / total,
        "relation_f1": relation_total / (counts["relation_cases"] or 1),
        "grounding_f1": grounding_total / (counts["relation_cases"] or 1),
    }
    projections = {
        name: {
            "cases": values["cases"],
            "disposition_accuracy": values["disposition_correct"] / values["cases"],
            "semantic_exact_accuracy": values["semantic_exact"] / values["cases"],
        }
        for name, values in sorted(by_projection.items())
    }
    return {"protocol": "TSR_EVALUATION/0.1", "summary": summary, "by_projection": projections, "receipts": receipts}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ground", type=Path, required=True)
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--predictions", type=Path)
    source.add_argument("--baseline", choices=("constant-refusal",))
    parser.add_argument("--report", type=Path, required=True)
    args = parser.parse_args()
    ground = load_jsonl(args.ground)
    if args.baseline:
        predictions = baseline_predictions(ground, args.baseline)
    else:
        records = load_jsonl(args.predictions)
        predictions = {record["case_id"]: record["proposal"] for record in records}
    report = score(ground, predictions)
    report["ground_sha256"] = hashlib.sha256(args.ground.read_bytes()).hexdigest()
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(report["summary"], indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
