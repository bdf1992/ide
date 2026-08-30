#!/usr/bin/env python3
"""Run all adapter challenge cases across every executable reference lane."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from challenges.python.reference import ChallengeError, solve


ROOT = Path(__file__).resolve().parent


def load_cases() -> list[dict[str, Any]]:
    packet = json.loads((ROOT / "cases.json").read_text())
    if packet.get("protocol") != "ADAPTER_CHALLENGE_CASES/1":
        raise RuntimeError("unexpected challenge case protocol")
    return packet["cases"]


def run_python(cases: list[dict[str, Any]]) -> dict[str, Any]:
    results = []
    for fixture in cases:
        observed = None
        error = None
        try:
            observed = solve(fixture["challenge"], fixture["input"])
        except ChallengeError as exc:
            error = exc.code
        ok = (
            error == fixture["expected_error"]
            if "expected_error" in fixture
            else error is None and observed == fixture["expected"]
        )
        results.append(
            {
                "id": fixture["id"],
                "challenge": fixture["challenge"],
                "ok": ok,
                "observed": observed,
                "error": error,
            }
        )
    return {"language": "python", "results": results}


def run_javascript() -> dict[str, Any]:
    node = shutil.which("node")
    if not node:
        return {
            "language": "javascript",
            "runtime_error": "node executable not found",
            "results": [],
        }
    completed = subprocess.run(
        [node, str(ROOT / "javascript" / "run-cases.mjs")],
        check=False,
        capture_output=True,
        text=True,
    )
    try:
        report = json.loads(completed.stdout)
    except json.JSONDecodeError:
        return {
            "language": "javascript",
            "runtime_error": completed.stderr or "JavaScript runner returned invalid JSON",
            "results": [],
        }
    if completed.returncode not in {0, 1}:
        report["runtime_error"] = completed.stderr or f"node exited {completed.returncode}"
    return report


def summarize(reports: list[dict[str, Any]], cases: list[dict[str, Any]]) -> dict[str, Any]:
    challenge_order = list(dict.fromkeys(case["challenge"] for case in cases))
    matrix: dict[str, dict[str, dict[str, int]]] = defaultdict(dict)
    for report in reports:
        grouped: dict[str, list[bool]] = defaultdict(list)
        for result in report.get("results", []):
            grouped[result["challenge"]].append(bool(result["ok"]))
        for challenge in challenge_order:
            values = grouped.get(challenge, [])
            matrix[challenge][report["language"]] = {
                "passed": sum(values),
                "total": len(values),
            }
    return {
        "protocol": "ADAPTER_CHALLENGE_REPORT/1",
        "cases": len(cases),
        "languages": [report["language"] for report in reports],
        "matrix": matrix,
        "runtime_errors": {
            report["language"]: report["runtime_error"]
            for report in reports
            if report.get("runtime_error")
        },
        "ok": all(
            not report.get("runtime_error")
            and len(report.get("results", [])) == len(cases)
            and all(result["ok"] for result in report["results"])
            for report in reports
        ),
    }


def print_table(report: dict[str, Any]) -> None:
    languages = report["languages"]
    print("challenge".ljust(26), *(language.rjust(12) for language in languages))
    print("-" * (27 + 13 * len(languages)))
    for challenge, lanes in report["matrix"].items():
        cells = []
        for language in languages:
            cell = lanes[language]
            cells.append(f"{cell['passed']}/{cell['total']}".rjust(12))
        print(challenge.ljust(26), *cells)
    for language, detail in report["runtime_errors"].items():
        print(f"runtime error [{language}]: {detail}", file=sys.stderr)
    print(f"\nADAPTER_CHALLENGE_REPORT/1: {'PASS' if report['ok'] else 'FAIL'}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="emit the report as JSON")
    args = parser.parse_args(argv)
    cases = load_cases()
    report = summarize([run_python(cases), run_javascript()], cases)
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print_table(report)
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
