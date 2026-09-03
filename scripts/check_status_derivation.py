#!/usr/bin/env python3
"""Derive STUB and SPEC grades from the tree and diff them against STATUS.md.

STATUS.md hand-grades every component IMPLEMENTED / POC / STUB / SPEC / FUTURE.
Two of those five words are mechanically checkable against the tree itself:

- STUB  -- a named ``src/<x>/`` directory that holds only a README-like file
           and nothing else (no code, no subdirectories).
- SPEC  -- a named ``contracts/*.schema.json`` file that nothing in the repo
           imports, loads, or validates against (no consumer, no validator).

IMPLEMENTED, POC, and FUTURE stay entirely human judgment calls. This script
has no opinion about them and never edits STATUS.md; it only reports where
the tree disagrees with what STATUS.md currently states for a STUB- or
SPEC-shaped location, or where a location that is graded STUB/SPEC no longer
has that shape.

FUTURE is a deliberate escape hatch: a FUTURE-graded ``src/`` directory may
also contain nothing but a README (a placeholder for a named direction that
is not yet even a stub boundary), and the tree alone cannot tell that intent
apart from a genuine STUB. So this script never compares a FUTURE row.
Likewise a row whose Status cell is not an exact single grade (for example
"SPEC + partial implementation") is a row STATUS.md already flagged as
mixed, and is skipped rather than second-guessed.
"""
from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

TABLE_ROW_RE = re.compile(r"^\|(.+)\|\s*$")
BACKTICK_RE = re.compile(r"`([^`]+)`")
CONSUMER_SUFFIXES = (".js", ".mjs", ".ts", ".py", ".html")
README_NAME_RE = re.compile(r"^readme(\.[a-z0-9]+)?$", re.IGNORECASE)


@dataclass
class StatusRow:
    concern: str
    status: str
    location_cell: str
    notes: str
    line_no: int


@dataclass
class Finding:
    concern: str
    line_no: int
    location: str
    declared: str
    derived: str
    detail: str

    def render(self) -> str:
        return (
            f"line {self.line_no}: {self.concern} [{self.location}] "
            f"declared={self.declared} derived={self.derived} -- {self.detail}"
        )


def parse_status_table(status_md: Path) -> list[StatusRow]:
    rows: list[StatusRow] = []
    in_table = False
    for line_no, raw_line in enumerate(status_md.read_text(encoding="utf-8").splitlines(), start=1):
        line = raw_line.rstrip("\n")
        match = TABLE_ROW_RE.match(line)
        if not match:
            in_table = False
            continue
        cells = [c.strip() for c in match.group(1).split("|")]
        if len(cells) < 4:
            continue
        if cells[0] == "Concern" and cells[1] == "Status":
            in_table = True
            continue
        if not in_table:
            continue
        if set(cells[0]) <= {"-"}:
            # separator row: |---|---|---|---|
            continue
        rows.append(StatusRow(concern=cells[0], status=cells[1], location_cell=cells[2], notes=cells[3], line_no=line_no))
    return rows


def classify_stub_dir(repo_root: Path, rel_dir: str) -> tuple[str, str]:
    """Return (shape, detail) for a src/ directory: STUB_SHAPE, CODE_PRESENT, or MISSING."""
    d = repo_root / rel_dir
    if not d.is_dir():
        return "MISSING", f"{rel_dir} does not exist"
    entries = sorted(p.name for p in d.iterdir())
    if not entries:
        return "CODE_PRESENT", f"{rel_dir} is empty (no README, no code)"
    non_readme = [e for e in entries if not README_NAME_RE.match(e)]
    subdirs = [p.name for p in d.iterdir() if p.is_dir()]
    if not non_readme and not subdirs:
        return "STUB_SHAPE", f"{rel_dir} holds only {', '.join(entries)}"
    return "CODE_PRESENT", f"{rel_dir} holds {', '.join(entries)}"


def has_consumer(repo_root: Path, schema_path: str) -> tuple[bool, str]:
    """Search the tree (outside contracts/) for anything that names this schema file."""
    schema_name = Path(schema_path).name
    hits: list[str] = []
    for suffix in CONSUMER_SUFFIXES:
        for candidate in repo_root.rglob(f"*{suffix}"):
            rel = candidate.relative_to(repo_root).as_posix()
            if rel.startswith("contracts/"):
                continue
            if rel.startswith("dist/") or "/node_modules/" in rel or rel.startswith("node_modules/"):
                continue
            if rel.startswith(".git/") or "/.git/" in rel:
                continue
            try:
                text = candidate.read_text(encoding="utf-8", errors="ignore")
            except OSError:
                continue
            if schema_name in text:
                hits.append(rel)
    if hits:
        return True, f"referenced by {', '.join(sorted(hits))}"
    return False, f"nothing outside contracts/ references {schema_name}"


def extract_locations(location_cell: str) -> list[str]:
    return BACKTICK_RE.findall(location_cell)


def expand_schema_globs(repo_root: Path, location: str) -> list[str]:
    if location == "contracts/":
        return sorted(
            p.relative_to(repo_root).as_posix() for p in (repo_root / "contracts").glob("*.schema.json")
        )
    if "*" in location:
        return sorted(p.relative_to(repo_root).as_posix() for p in repo_root.glob(location))
    return [location]


def check_stub(row: StatusRow, repo_root: Path, location: str) -> Finding | None:
    shape, detail = classify_stub_dir(repo_root, location)
    declared = row.status
    if declared == "STUB":
        if shape != "STUB_SHAPE":
            return Finding(row.concern, row.line_no, location, declared, shape, detail)
        return None
    if declared in ("IMPLEMENTED", "POC"):
        if shape != "CODE_PRESENT":
            return Finding(row.concern, row.line_no, location, declared, shape, detail)
        return None
    # FUTURE, and anything else (mixed grades), is a human call: no opinion.
    return None


def check_spec(row: StatusRow, repo_root: Path, location: str) -> Finding | None:
    for schema_path in expand_schema_globs(repo_root, location):
        if not (repo_root / schema_path).is_file():
            return Finding(row.concern, row.line_no, schema_path, row.status, "MISSING", f"{schema_path} does not exist")
        consumed, detail = has_consumer(repo_root, schema_path)
        derived = "HAS_CONSUMER" if consumed else "NO_CONSUMER"
        declared = row.status
        if declared == "SPEC":
            if derived != "NO_CONSUMER":
                return Finding(row.concern, row.line_no, schema_path, declared, derived, detail)
        elif declared in ("IMPLEMENTED", "POC"):
            if derived != "HAS_CONSUMER":
                return Finding(row.concern, row.line_no, schema_path, declared, derived, detail)
        # FUTURE and mixed grades: no opinion.
    return None


def run_checks(repo_root: Path, status_md: Path) -> list[Finding]:
    findings: list[Finding] = []
    for row in parse_status_table(status_md):
        for location in extract_locations(row.location_cell):
            if location.startswith("src/") and location.endswith("/"):
                finding = check_stub(row, repo_root, location)
                if finding:
                    findings.append(finding)
            elif location == "contracts/" or (
                location.startswith("contracts/") and location.endswith(".schema.json")
            ):
                finding = check_spec(row, repo_root, location)
                if finding:
                    findings.append(finding)
    return findings


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Derive STUB/SPEC grades from the tree and report drift against STATUS.md."
    )
    parser.add_argument("--root", default=".", help="Repository root (default: current directory)")
    parser.add_argument("--status", default="STATUS.md", help="Path to STATUS.md, relative to --root")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit 1 if any drift is found (default: always exit 0; this check is diagnostic-only)",
    )
    args = parser.parse_args()

    repo_root = Path(args.root).resolve()
    status_md = repo_root / args.status
    if not status_md.is_file():
        print(f"error: {status_md} not found", file=sys.stderr)
        return 2

    findings = run_checks(repo_root, status_md)

    rows = parse_status_table(status_md)
    stub_or_spec_locations = sum(
        1
        for row in rows
        for location in extract_locations(row.location_cell)
        if (location.startswith("src/") and location.endswith("/"))
        or location == "contracts/"
        or (location.startswith("contracts/") and location.endswith(".schema.json"))
    )
    print(f"status-derivation: {len(rows)} rows read, {stub_or_spec_locations} derivable locations checked")
    if not findings:
        print("status-derivation: no drift found")
    else:
        print(f"status-derivation: {len(findings)} drift finding(s)")
        for finding in findings:
            print(f"  {finding.render()}")

    if args.strict and findings:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
