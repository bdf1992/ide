from __future__ import annotations

import copy
import json
import unittest
from pathlib import Path

from challenges.python.reference import ChallengeError, SOLVERS, solve, solitaire_deal


ROOT = Path(__file__).resolve().parents[1]


class PythonReferenceTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads((ROOT / "manifest.json").read_text())
        cls.cases = json.loads((ROOT / "cases.json").read_text())["cases"]

    def test_manifest_and_solver_coverage_match(self) -> None:
        declared = {item["id"] for item in self.manifest["challenges"]}
        self.assertEqual(declared, set(SOLVERS))
        self.assertEqual(declared, {case["challenge"] for case in self.cases})

    def test_shared_oracle_cases(self) -> None:
        for case in self.cases:
            with self.subTest(case=case["id"]):
                supplied = copy.deepcopy(case["input"])
                if "expected_error" in case:
                    with self.assertRaises(ChallengeError) as caught:
                        solve(case["challenge"], supplied)
                    self.assertEqual(caught.exception.code, case["expected_error"])
                else:
                    self.assertEqual(solve(case["challenge"], supplied), case["expected"])
                self.assertEqual(supplied, case["input"], "solver mutated supplied input")

    def test_solitaire_deal_has_one_visible_card_per_column(self) -> None:
        deal = solitaire_deal()
        self.assertEqual([len(column) for column in deal["tableau"]], list(range(1, 8)))
        self.assertEqual(len(deal["stock"]), 24)
        self.assertTrue(all(sum(card["face_up"] for card in column) == 1 for column in deal["tableau"]))


if __name__ == "__main__":
    unittest.main()
