from __future__ import annotations

import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
EXPERIMENT = ROOT / "poc" / "neural-elaboration"


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


generator = load_module("generate_corpus", EXPERIMENT / "src" / "generate_corpus.py")
evaluator = load_module("evaluate", EXPERIMENT / "src" / "evaluate.py")
qwen_export = load_module("export_qwen", EXPERIMENT / "src" / "export_qwen.py")
surface_parser = load_module("surface_parser", EXPERIMENT / "baselines" / "surface_parser.py")


class NeuralElaborationTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.output = Path(cls.temp.name) / "corpus"
        cls.manifest = generator.build(cls.output)

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def load(self, relative: str):
        return evaluator.load_jsonl(self.output / relative)

    def test_corpus_has_120_cases_and_five_modalities(self):
        self.assertEqual(sum(self.manifest["cases"].values()), 120)
        self.assertEqual(set(self.manifest["modalities"]), set(generator.MODALITIES))
        for split, case_count in self.manifest["cases"].items():
            self.assertEqual(case_count, self.manifest["families"][split] * 5)

    def test_generator_scales_without_changing_case_shape(self):
        with tempfile.TemporaryDirectory() as directory:
            manifest = generator.build(Path(directory) / "scaled", family_count=40)
        self.assertEqual(sum(manifest["cases"].values()), 200)
        self.assertEqual(manifest["supported_families"] % 2, 0)
        self.assertGreater(manifest["unsupported_families"], 0)

    def test_manifest_is_stable_when_unowned_run_files_exist(self):
        extra = self.output / "training" / "participant-output.json"
        extra.write_text("not generator-owned\n", encoding="utf-8")
        repeated = generator.build(self.output)
        self.assertEqual(repeated, self.manifest)
        self.assertNotIn("training/participant-output.json", repeated["files"])

    def test_family_split_isolation(self):
        split_families = []
        for split in ("train", "validation", "challenge"):
            split_families.append({record["family_id"] for record in self.load(f"ground/{split}.jsonl")})
        self.assertTrue(split_families[0].isdisjoint(split_families[1]))
        self.assertTrue(split_families[0].isdisjoint(split_families[2]))
        self.assertTrue(split_families[1].isdisjoint(split_families[2]))

    def test_causal_trajectory_split_isolation(self):
        split_trajectories = []
        for split in ("train", "validation", "challenge"):
            split_trajectories.append({record["trajectory_id"] for record in self.load(f"ground/{split}.jsonl")})
        self.assertTrue(split_trajectories[0].isdisjoint(split_trajectories[1]))
        self.assertTrue(split_trajectories[0].isdisjoint(split_trajectories[2]))
        self.assertTrue(split_trajectories[1].isdisjoint(split_trajectories[2]))

    def test_causal_data_flip_changes_ir_but_preserves_tokens_and_relations(self):
        records = [
            record
            for split in ("train", "validation", "challenge")
            for record in self.load(f"ground/{split}.jsonl")
            if record["projection"] == "personal" and record["expected"]["disposition"] == "propose"
        ]
        grouped = {}
        for record in records:
            grouped.setdefault(record["trajectory_id"], []).append(record)
        for pair in grouped.values():
            self.assertEqual(len(pair), 2)
            pair.sort(key=lambda record: record["mutation_class"])
            first, second = pair
            self.assertNotEqual(first["expected"]["candidate_ir"], second["expected"]["candidate_ir"])
            first_tsr = first["expected"]["typed_structure"]
            second_tsr = second["expected"]["typed_structure"]
            self.assertEqual(first_tsr["tokens"], second_tsr["tokens"])
            self.assertEqual(evaluator.relation_set(first["expected"]), evaluator.relation_set(second["expected"]))
            self.assertNotEqual(first_tsr["data_refs"][0]["sha256"], second_tsr["data_refs"][0]["sha256"])

    def test_each_family_is_cross_modal_and_semantically_invariant(self):
        for split in ("train", "validation", "challenge"):
            grouped = {}
            for record in self.load(f"ground/{split}.jsonl"):
                grouped.setdefault(record["family_id"], []).append(record)
            for records in grouped.values():
                self.assertEqual({record["projection"] for record in records}, set(generator.MODALITIES))
                expected = records[0]["expected"]
                if expected["disposition"] == "propose":
                    ir = expected["candidate_ir"]
                    self.assertTrue(all(record["expected"]["candidate_ir"] == ir for record in records))
                else:
                    self.assertTrue(all(record["expected"]["disposition"] == "refuse" for record in records))

    def test_participant_inputs_do_not_contain_expected_output(self):
        for split in ("train", "validation", "challenge"):
            for record in self.load(f"participant/{split}.jsonl"):
                self.assertNotIn("expected", record)
                self.assertNotIn("candidate_ir", record)
                self.assertNotIn("disposition", record)

    def test_image_cas_matches_bytes(self):
        for split in ("train", "validation", "challenge"):
            for record in self.load(f"participant/{split}.jsonl"):
                if record["source"]["kind"] != "image":
                    continue
                path = self.output / record["source"]["path"]
                self.assertEqual(generator.digest_bytes(path.read_bytes()), record["source"]["sha256"])

    def test_oracle_predictions_score_exactly(self):
        ground = self.load("ground/challenge.jsonl")
        predictions = {record["case_id"]: record["expected"] for record in ground}
        report = evaluator.score(ground, predictions)
        self.assertEqual(report["summary"]["schema_valid_rate"], 1.0)
        self.assertEqual(report["summary"]["semantic_exact_accuracy"], 1.0)
        self.assertEqual(report["summary"]["relation_f1"], 1.0)
        self.assertEqual(report["summary"]["grounding_f1"], 1.0)

    def test_constant_refusal_loses_to_oracle(self):
        ground = self.load("ground/challenge.jsonl")
        predictions = evaluator.baseline_predictions(ground, "constant-refusal")
        report = evaluator.score(ground, predictions)
        self.assertLess(report["summary"]["semantic_exact_accuracy"], 0.5)

    def test_surface_parser_is_stronger_but_modality_bounded(self):
        inputs = self.load("participant/challenge.jsonl")
        ground = self.load("ground/challenge.jsonl")
        records = surface_parser.predict(inputs)
        predictions = {record["case_id"]: record["proposal"] for record in records}
        report = evaluator.score(ground, predictions)
        refusal = evaluator.score(ground, evaluator.baseline_predictions(ground, "constant-refusal"))
        self.assertGreater(
            report["summary"]["semantic_exact_accuracy"],
            refusal["summary"]["semantic_exact_accuracy"],
        )
        self.assertLess(report["summary"]["semantic_exact_accuracy"], 1.0)
        self.assertEqual(report["by_projection"]["personal"]["semantic_exact_accuracy"], 1.0)
        self.assertEqual(report["by_projection"]["alien"]["semantic_exact_accuracy"], 1.0)
        self.assertEqual(report["by_projection"]["image"]["semantic_exact_accuracy"], 0.0)

    def test_wrong_relation_signal_is_detected_independently(self):
        ground = [record for record in self.load("ground/challenge.jsonl") if record["expected"]["disposition"] == "propose"]
        record = ground[0]
        proposal = json.loads(json.dumps(record["expected"]))
        proposal["typed_structure"]["signals"][0]["relation"] = "shuffled"
        report = evaluator.score([record], {record["case_id"]: proposal})
        self.assertEqual(report["summary"]["semantic_exact_accuracy"], 1.0)
        self.assertLess(report["summary"]["relation_f1"], 1.0)

    def test_wrong_image_bbox_is_detected_independently(self):
        ground = [
            record
            for record in self.load("ground/challenge.jsonl")
            if record["expected"]["disposition"] == "propose" and record["projection"] == "image"
        ]
        record = ground[0]
        proposal = json.loads(json.dumps(record["expected"]))
        proposal["typed_structure"]["data_refs"][0]["selectors"][0]["value"] = [0, 0, 1, 1]
        report = evaluator.score([record], {record["case_id"]: proposal})
        self.assertEqual(report["summary"]["semantic_exact_accuracy"], 1.0)
        self.assertEqual(report["summary"]["relation_f1"], 1.0)
        self.assertLess(report["summary"]["grounding_f1"], 1.0)

    def test_uncontracted_model_fields_are_rejected(self):
        proposal = {
            "protocol": "SEMANTIC_PROPOSAL/1",
            "kernel_version": "0.1",
            "disposition": "refuse",
            "refusal": {"code": "UNRESOLVED"},
            "standing": "S4",
        }
        valid, detail = evaluator.valid_shape(proposal)
        self.assertFalse(valid)
        self.assertIn("unexpected", detail)

    def test_reference_family_matches_javascript_kernel_sample(self):
        program = generator.valid_program(0)
        personal = generator.render_text(program, "personal")
        script = (
            "import {parsePersonal} from './poc/semantic-core.js';"
            f"console.log(JSON.stringify(parsePersonal({json.dumps(personal)})));"
        )
        result = subprocess.run(
            ["node", "--input-type=module", "-e", script],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        self.assertEqual(json.loads(result.stdout), program)

    def test_qwen_export_matches_upstream_media_contract(self):
        training = self.load("training/train.sft.jsonl")
        converted = qwen_export.convert(training)
        self.assertEqual(len(converted), len(training))
        image_examples = [record for record in converted if "image" in record]
        text_examples = [record for record in converted if "image" not in record]
        self.assertTrue(image_examples)
        self.assertTrue(text_examples)
        self.assertTrue(all(record["conversations"][0]["value"].startswith("<image>\n") for record in image_examples))
        self.assertTrue(all("<image>" not in record["conversations"][1]["value"] for record in image_examples))


if __name__ == "__main__":
    unittest.main()
