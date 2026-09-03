#!/usr/bin/env python3
"""Fixture-tree tests for check_status_derivation.py's STUB and SPEC derivation.

Each test builds a tiny throwaway repo tree (a STATUS.md plus the src/ or
contracts/ shape it describes) and asserts what run_checks derives from it.
No test touches the real ide tree; scripts/check_status_derivation.py itself
is exercised separately as a CI step against the live STATUS.md.
"""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from check_status_derivation import run_checks  # noqa: E402

STATUS_HEADER = (
    "# Status Ledger\n\n"
    "| Concern | Status | Current location | Notes |\n"
    "|---|---|---|---|\n"
)


class TempRepo:
    """A throwaway repo root under tempfile, cleaned up on exit."""

    def __enter__(self) -> Path:
        self._tmp = tempfile.TemporaryDirectory()
        return Path(self._tmp.name)

    def __exit__(self, *exc: object) -> None:
        self._tmp.cleanup()


def write_status(root: Path, row: str) -> Path:
    status_md = root / "STATUS.md"
    status_md.write_text(STATUS_HEADER + row + "\n", encoding="utf-8", newline="\n")
    return status_md


class StubDerivationTests(unittest.TestCase):
    def test_stub_graded_stub_with_only_readme_matches(self) -> None:
        with TempRepo() as root:
            (root / "src/capability").mkdir(parents=True)
            (root / "src/capability/README.md").write_text("placeholder\n", encoding="utf-8")
            status_md = write_status(root, "| Capability layer | STUB | `src/capability/` | boundary named |")

            findings = run_checks(root, status_md)

        self.assertEqual(findings, [])

    def test_stub_graded_stub_but_has_real_code_flags_drift(self) -> None:
        with TempRepo() as root:
            (root / "src/capability").mkdir(parents=True)
            (root / "src/capability/README.md").write_text("placeholder\n", encoding="utf-8")
            (root / "src/capability/index.js").write_text("export const capability = {};\n", encoding="utf-8")
            status_md = write_status(root, "| Capability layer | STUB | `src/capability/` | boundary named |")

            findings = run_checks(root, status_md)

        self.assertEqual(len(findings), 1)
        finding = findings[0]
        self.assertEqual(finding.declared, "STUB")
        self.assertEqual(finding.derived, "CODE_PRESENT")

    def test_implemented_graded_but_dir_is_stub_shaped_flags_drift(self) -> None:
        with TempRepo() as root:
            (root / "src/runtime").mkdir(parents=True)
            (root / "src/runtime/README.md").write_text("placeholder\n", encoding="utf-8")
            status_md = write_status(root, "| Runtime module | IMPLEMENTED | `src/runtime/` | should have code |")

            findings = run_checks(root, status_md)

        self.assertEqual(len(findings), 1)
        finding = findings[0]
        self.assertEqual(finding.declared, "IMPLEMENTED")
        self.assertEqual(finding.derived, "STUB_SHAPE")

    def test_implemented_graded_with_real_code_matches(self) -> None:
        with TempRepo() as root:
            (root / "src/runtime").mkdir(parents=True)
            (root / "src/runtime/index.js").write_text("export function run() {}\n", encoding="utf-8")
            status_md = write_status(root, "| Runtime module | IMPLEMENTED | `src/runtime/` | shared runtime |")

            findings = run_checks(root, status_md)

        self.assertEqual(findings, [])

    def test_future_graded_stub_shaped_dir_is_never_flagged(self) -> None:
        with TempRepo() as root:
            (root / "src/agent").mkdir(parents=True)
            (root / "src/agent/README.md").write_text("placeholder\n", encoding="utf-8")
            status_md = write_status(root, "| Agent semantic elaboration | FUTURE | `src/agent/` | not yet even a stub |")

            findings = run_checks(root, status_md)

        self.assertEqual(findings, [])

    def test_mixed_grade_row_is_never_flagged(self) -> None:
        with TempRepo() as root:
            (root / "src/workspace").mkdir(parents=True)
            (root / "src/workspace/index.js").write_text("export const ws = {};\n", encoding="utf-8")
            status_md = write_status(
                root,
                "| Workspace state | SPEC + partial implementation | `src/workspace/` | draft schema, code exists |",
            )

            findings = run_checks(root, status_md)

        self.assertEqual(findings, [])

    def test_missing_stub_dir_flags_drift(self) -> None:
        with TempRepo() as root:
            status_md = write_status(root, "| Provider layer | STUB | `src/provider/` | boundary named |")

            findings = run_checks(root, status_md)

        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].derived, "MISSING")


class SpecDerivationTests(unittest.TestCase):
    def test_spec_graded_schema_with_no_consumer_matches(self) -> None:
        with TempRepo() as root:
            (root / "contracts").mkdir(parents=True)
            (root / "contracts/fixture-thing.schema.json").write_text("{}\n", encoding="utf-8")
            status_md = write_status(
                root,
                "| Fixture envelope | SPEC | `contracts/fixture-thing.schema.json` | result shape only |",
            )

            findings = run_checks(root, status_md)

        self.assertEqual(findings, [])

    def test_spec_graded_schema_with_a_consumer_flags_drift(self) -> None:
        with TempRepo() as root:
            (root / "contracts").mkdir(parents=True)
            (root / "contracts/fixture-thing.schema.json").write_text("{}\n", encoding="utf-8")
            (root / "validate.py").write_text(
                "SCHEMA = 'fixture-thing.schema.json'\n", encoding="utf-8"
            )
            status_md = write_status(
                root,
                "| Fixture envelope | SPEC | `contracts/fixture-thing.schema.json` | result shape only |",
            )

            findings = run_checks(root, status_md)

        self.assertEqual(len(findings), 1)
        finding = findings[0]
        self.assertEqual(finding.declared, "SPEC")
        self.assertEqual(finding.derived, "HAS_CONSUMER")

    def test_implemented_graded_schema_with_a_consumer_matches(self) -> None:
        with TempRepo() as root:
            (root / "contracts").mkdir(parents=True)
            (root / "contracts/fixture-thing.schema.json").write_text("{}\n", encoding="utf-8")
            (root / "validate.py").write_text(
                "SCHEMA = 'fixture-thing.schema.json'\n", encoding="utf-8"
            )
            status_md = write_status(
                root,
                "| Fixture envelope | IMPLEMENTED | `contracts/fixture-thing.schema.json` | validated |",
            )

            findings = run_checks(root, status_md)

        self.assertEqual(findings, [])

    def test_implemented_graded_schema_with_no_consumer_flags_drift(self) -> None:
        with TempRepo() as root:
            (root / "contracts").mkdir(parents=True)
            (root / "contracts/fixture-thing.schema.json").write_text("{}\n", encoding="utf-8")
            status_md = write_status(
                root,
                "| Fixture envelope | IMPLEMENTED | `contracts/fixture-thing.schema.json` | validated |",
            )

            findings = run_checks(root, status_md)

        self.assertEqual(len(findings), 1)
        finding = findings[0]
        self.assertEqual(finding.declared, "IMPLEMENTED")
        self.assertEqual(finding.derived, "NO_CONSUMER")

    def test_missing_schema_file_flags_drift(self) -> None:
        with TempRepo() as root:
            (root / "contracts").mkdir(parents=True)
            status_md = write_status(
                root,
                "| Fixture envelope | SPEC | `contracts/fixture-thing.schema.json` | result shape only |",
            )

            findings = run_checks(root, status_md)

        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].derived, "MISSING")

    def test_a_reference_inside_contracts_itself_does_not_count_as_a_consumer(self) -> None:
        with TempRepo() as root:
            (root / "contracts").mkdir(parents=True)
            (root / "contracts/fixture-thing.schema.json").write_text("{}\n", encoding="utf-8")
            # A sibling .py file inside contracts/ that names the schema must not count: the
            # consumer search deliberately excludes contracts/ itself (self-reference is not use).
            (root / "contracts/notes.py").write_text(
                "# see fixture-thing.schema.json\n", encoding="utf-8"
            )
            status_md = write_status(
                root,
                "| Fixture envelope | SPEC | `contracts/fixture-thing.schema.json` | result shape only |",
            )

            findings = run_checks(root, status_md)

        self.assertEqual(findings, [])


if __name__ == "__main__":
    unittest.main()
