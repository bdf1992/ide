#!/usr/bin/env python3
"""Generate a deterministic multimodal Kernel 0.1 elaboration corpus."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError as exc:  # pragma: no cover - exercised by operator environment
    raise SystemExit("Pillow is required to render the visual projection: pip install pillow") from exc


PROTOCOL = "SEMANTIC_PROPOSAL/1"
KERNEL_VERSION = "0.1"
TSR_VERSION = "TSR/0.1"
MODALITIES = ("personal", "alien", "python", "structure", "image")
SYSTEM_PROMPT = (
    "Map the supplied projection to Kernel 0.1. Return one SEMANTIC_PROPOSAL/1 JSON "
    "object. Propose only admitted Bind, Iterate, AddUpdate, Assert, Observe, Lit, Ref, "
    "and Eq meaning. Refuse undeclared meaning. Confidence does not grant standing."
)


def canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def digest_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def lit(value: Any) -> dict[str, Any]:
    return {"kind": "Lit", "value": value}


def ref(name: str) -> dict[str, Any]:
    return {"kind": "Ref", "name": name}


def valid_program(index: int) -> dict[str, Any]:
    target_names = ("total", "sum", "acc", "reservoir", "ledger")
    source_names = ("values", "items", "samples", "stones", "charges")
    binding_names = ("x", "item", "sample", "stone", "charge")
    labels = ("Result", "Sum", "Reading", "Level", "Charge")
    trajectory = index // 2
    causal_variant = index % 2
    suffix = "" if trajectory < len(target_names) else f"_{trajectory}"
    target = target_names[trajectory % len(target_names)] + suffix
    source = source_names[(trajectory * 2) % len(source_names)] + suffix
    binding = binding_names[(trajectory * 3) % len(binding_names)] + suffix
    initial = trajectory % 4
    count = 2 + trajectory % 4
    seed = hashlib.sha256(f"values:{trajectory}".encode()).digest()
    values = [(seed[step] % 9) + 1 for step in range(count)]
    values[-1] += causal_variant
    expected = initial + sum(values)
    return {
        "kind": "Program",
        "statements": [
            {"kind": "Bind", "name": target, "expr": lit(initial)},
            {"kind": "Bind", "name": source, "expr": lit(values)},
            {
                "kind": "Iterate",
                "binding": binding,
                "source": ref(source),
                "body": [{"kind": "AddUpdate", "target": target, "value": ref(binding)}],
            },
            {
                "kind": "Assert",
                "condition": {"kind": "Eq", "left": ref(target), "right": lit(expected)},
            },
            {
                "kind": "Observe",
                "label": labels[trajectory % len(labels)] + (suffix.replace("_", " ") if suffix else ""),
                "value": ref(target),
            },
        ],
    }


def invalid_program(index: int) -> dict[str, Any]:
    program = valid_program(index)
    program["statements"][2]["body"][0]["kind"] = "MultiplyUpdate"
    return program


def split_for(index: int, supported_count: int) -> str:
    if index < supported_count:
        bucket = (index // 2) % 10
        if bucket < 7:
            return "train"
        if bucket == 7:
            return "validation"
        return "challenge"
    offset = index - supported_count
    if offset < 4:
        return ("train", "train", "validation", "challenge")[offset]
    bucket = offset % 10
    if bucket < 7:
        return "train"
    if bucket == 7:
        return "validation"
    return "challenge"


def render_text(program: dict[str, Any], modality: str) -> str:
    statements = program["statements"]
    target = statements[0]["name"]
    initial = statements[0]["expr"]["value"]
    source = statements[1]["name"]
    values = statements[1]["expr"]["value"]
    loop = statements[2]
    binding = loop["binding"]
    update_kind = loop["body"][0]["kind"]
    expected = statements[3]["condition"]["right"]["value"]
    label = statements[4]["label"]
    if modality == "personal":
        verb = "gather" if update_kind == "AddUpdate" else "multiply"
        return "\n".join(
            [
                f"let {target} = {initial}",
                f"let {source} = {json.dumps(values, separators=(',', ':'))}",
                "",
                f"each {binding} from {source}",
                f"    {verb} {binding} into {target}",
                "",
                f"require {target} == {expected}",
                f"expose {json.dumps(label)} {target}",
            ]
        )
    if modality == "alien":
        verb = "meld" if update_kind == "AddUpdate" else "amplify"
        return "\n".join(
            [
                f"nest {target} = {initial}",
                f"nest {source} = {json.dumps(values, separators=(',', ':'))}",
                "",
                f"orbit {binding} across {source}",
                f"    {verb} {binding} toward {target}",
                "",
                f"verify {target} == {expected}",
                f"beam {json.dumps(label)} {target}",
            ]
        )
    if modality == "python":
        operator = "+=" if update_kind == "AddUpdate" else "*="
        return "\n".join(
            [
                f"{target} = {initial}",
                f"{source} = {json.dumps(values, separators=(',', ':'))}",
                f"for {binding} in {source}:",
                f"    {target} {operator} {binding}",
                f"assert {target} == {expected}",
                f"__observe__({json.dumps(label)}, {target})",
            ]
        )
    if modality == "structure":
        update = "AddUpdate" if update_kind == "AddUpdate" else "MultiplyUpdate"
        return "\n".join(
            [
                "Program",
                f"├ Bind {target} ← {initial}",
                f"├ Bind {source} ← {json.dumps(values, separators=(',', ':'))}",
                f"├ Iterate {binding} over {source}",
                f"│ └ {update} {target} ← {binding}",
                f"├ Assert Eq {target} {expected}",
                f"└ Observe {json.dumps(label)} {target}",
            ]
        )
    raise ValueError(f"text rendering unavailable for {modality}")


def draw_arrow(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int]) -> None:
    draw.line((start, end), fill=(91, 108, 128), width=3)
    x, y = end
    draw.polygon(((x, y), (x - 7, y - 11), (x + 7, y - 11)), fill=(91, 108, 128))


def render_image(program: dict[str, Any], path: Path) -> None:
    image = Image.new("RGB", (860, 640), (245, 247, 250))
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default(size=18)
    title_font = ImageFont.load_default(size=24)
    statements = program["statements"]
    target = statements[0]["name"]
    source = statements[1]["name"]
    binding = statements[2]["binding"]
    update = statements[2]["body"][0]["kind"]
    expected = statements[3]["condition"]["right"]["value"]
    label = statements[4]["label"]
    rows = [
        ("BIND", f"{target} = {statements[0]['expr']['value']}", (211, 228, 255)),
        ("BIND", f"{source} = {statements[1]['expr']['value']}", (211, 228, 255)),
        ("ITERATE", f"{binding} over {source}", (225, 215, 255)),
        ("ADD" if update == "AddUpdate" else "MULTIPLY", f"{target} <- {binding}", (207, 240, 222) if update == "AddUpdate" else (255, 214, 214)),
        ("ASSERT", f"{target} == {expected}", (255, 235, 196)),
        ("OBSERVE", f"{label}: {target}", (208, 237, 240)),
    ]
    draw.text((34, 22), "KERNEL 0.1 PROJECTION", fill=(31, 41, 55), font=title_font)
    x, width, height, gap, y0 = 120, 620, 70, 22, 78
    previous_bottom = None
    for row, (kind, detail, color) in enumerate(rows):
        y = y0 + row * (height + gap)
        if previous_bottom is not None:
            draw_arrow(draw, (x + width // 2, previous_bottom), (x + width // 2, y - 4))
        draw.rounded_rectangle((x, y, x + width, y + height), radius=12, fill=color, outline=(92, 107, 128), width=2)
        draw.text((x + 22, y + 14), kind, fill=(24, 34, 48), font=font)
        draw.text((x + 190, y + 14), detail, fill=(24, 34, 48), font=font)
        previous_bottom = y + height
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", optimize=False, compress_level=9)


def evidence_selectors(modality: str) -> list[dict[str, Any]]:
    if modality == "image":
        rows = [(120, 78 + row * 92, 740, 148 + row * 92) for row in range(6)]
        return [
            {"token_id": "stmt:0", "kind": "bbox", "value": rows[0]},
            {"token_id": "stmt:1", "kind": "bbox", "value": rows[1]},
            {"token_id": "stmt:2", "kind": "bbox", "value": rows[2]},
            {"token_id": "stmt:2", "kind": "bbox", "value": rows[3]},
            {"token_id": "stmt:3", "kind": "bbox", "value": rows[4]},
            {"token_id": "stmt:4", "kind": "bbox", "value": rows[5]},
        ]
    line_map = {
        "personal": ((0, 0), (1, 1), (3, 4), (6, 6), (7, 7)),
        "alien": ((0, 0), (1, 1), (3, 4), (6, 6), (7, 7)),
        "python": ((0, 0), (1, 1), (2, 3), (4, 4), (5, 5)),
        "structure": ((1, 1), (2, 2), (3, 4), (5, 5), (6, 6)),
    }
    return [
        {"token_id": f"stmt:{index}", "kind": "line-span", "value": list(span)}
        for index, span in enumerate(line_map[modality])
    ]


def typed_structure(program: dict[str, Any], source_sha: str, modality: str) -> dict[str, Any]:
    statements = program["statements"]
    variables: dict[str, str] = {}
    for statement in statements:
        if statement["kind"] == "Bind":
            value = statement["expr"]["value"]
            variables[statement["name"]] = "Collection<Int>" if isinstance(value, list) else "Int"
    tokens = [{"id": "program", "kind": "Program", "type": "Program"}]
    tokens.extend(
        {"id": f"var:{name}", "kind": "Variable", "type": value_type}
        for name, value_type in sorted(variables.items())
    )
    for index, statement in enumerate(statements):
        tokens.append({"id": f"stmt:{index}", "kind": statement["kind"], "type": "Statement"})
    relations: list[tuple[str, str, str]] = []
    for index, statement in enumerate(statements):
        sid = f"stmt:{index}"
        relations.append(("program", sid, "contains"))
        if statement["kind"] == "Bind":
            relations.append((sid, f"var:{statement['name']}", "binds"))
        elif statement["kind"] == "Iterate":
            relations.append((sid, f"var:{statement['source']['name']}", "iterates"))
            body = statement["body"][0]
            relations.append((sid, f"var:{body['target']}", "updates" if body["kind"] == "AddUpdate" else "unsupported-update"))
        elif statement["kind"] == "Assert":
            relations.append((sid, f"var:{statement['condition']['left']['name']}", "asserts"))
        elif statement["kind"] == "Observe":
            relations.append((sid, f"var:{statement['value']['name']}", "observes"))
    phase = {"contains": 0.0, "binds": 0.5, "iterates": 1.0, "updates": 1.5, "asserts": 2.0, "observes": 2.5, "unsupported-update": 3.0}
    signals = [
        {
            "source": source,
            "target": target,
            "relation": relation,
            "frame": "semantic",
            "dimension": 1,
            "basis": "relation-phase-v0",
            "harmonic": 1,
            "phase_radians": phase[relation],
            "magnitude": 1.0,
        }
        for source, target, relation in relations
    ]
    return {
        "version": TSR_VERSION,
        "data_refs": [
            {
                "sha256": source_sha,
                "media_type": "image/png" if modality == "image" else "text/plain",
                "selectors": evidence_selectors(modality),
            }
        ],
        "tokens": tokens,
        "token_state": [{"token_id": token["id"], "state": "candidate"} for token in tokens],
        "signals": signals,
    }


def proposal(program: dict[str, Any], source_sha: str, modality: str, supported: bool) -> dict[str, Any]:
    if not supported:
        return {
            "protocol": PROTOCOL,
            "kernel_version": KERNEL_VERSION,
            "disposition": "refuse",
            "refusal": {
                "code": "UNDECLARED_OPERATION",
                "detail": "MultiplyUpdate is not admitted by Kernel 0.1",
            },
        }
    return {
        "protocol": PROTOCOL,
        "kernel_version": KERNEL_VERSION,
        "disposition": "propose",
        "candidate_ir": program,
        "typed_structure": typed_structure(program, source_sha, modality),
    }


def write_jsonl(path: Path, records: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        for record in records:
            handle.write(canonical_json(record) + "\n")


def build(output: Path, family_count: int = 24) -> dict[str, Any]:
    if family_count < 8:
        raise ValueError("family_count must be at least 8")
    invalid_count = max(4, family_count // 6)
    supported_count = family_count - invalid_count
    if supported_count % 2:
        supported_count -= 1
        invalid_count += 1
    participant: dict[str, list[dict[str, Any]]] = {name: [] for name in ("train", "validation", "challenge")}
    ground: dict[str, list[dict[str, Any]]] = {name: [] for name in participant}
    sft: list[dict[str, Any]] = []
    generated_paths: set[Path] = set()
    families: dict[str, set[str]] = {name: set() for name in participant}
    trajectories: dict[str, set[str]] = {name: set() for name in participant}
    for family_index in range(family_count):
        supported = family_index < supported_count
        program = valid_program(family_index) if supported else invalid_program(family_index)
        split = split_for(family_index, supported_count)
        family_id = digest_bytes(f"family:{family_index}".encode())[:16]
        trajectory_number = family_index // 2 if supported else family_index
        trajectory_id = digest_bytes(f"trajectory:{trajectory_number}".encode())[:16]
        families[split].add(family_id)
        trajectories[split].add(trajectory_id)
        for modality in MODALITIES:
            if modality == "image":
                temp_path = output / "images" / f"pending-{family_index}.png"
                render_image(program, temp_path)
                source_bytes = temp_path.read_bytes()
                case_id = digest_bytes(f"{family_id}:{modality}".encode())[:20]
                final_path = output / "images" / f"case-{case_id}.png"
                temp_path.replace(final_path)
                generated_paths.add(final_path)
                source = {"kind": "image", "path": str(final_path.relative_to(output)), "sha256": digest_bytes(source_bytes)}
            else:
                text = render_text(program, modality)
                source_bytes = text.encode("utf-8")
                case_id = digest_bytes(f"{family_id}:{modality}".encode())[:20]
                source = {"kind": "text", "text": text, "sha256": digest_bytes(source_bytes)}
            request = {
                "case_id": case_id,
                "family_id": family_id,
                "split": split,
                "projection": modality,
                "system": SYSTEM_PROMPT,
                "source": source,
            }
            expected = proposal(program, source["sha256"], modality, supported)
            participant[split].append(request)
            ground[split].append(
                {
                    "case_id": case_id,
                    "family_id": family_id,
                    "trajectory_id": trajectory_id,
                    "split": split,
                    "projection": modality,
                    "mutation_class": (
                        "base"
                        if supported and family_index % 2 == 0
                        else "causal-data-flip"
                        if supported
                        else "unsupported-operation"
                    ),
                    "expected": expected,
                }
            )
            if split == "train":
                content: list[dict[str, Any]] = [{"type": "text", "text": SYSTEM_PROMPT}]
                if source["kind"] == "image":
                    content.append({"type": "image", "image": source["path"]})
                else:
                    content.append({"type": "text", "text": source["text"]})
                sft.append(
                    {
                        "case_id": case_id,
                        "messages": [
                            {"role": "user", "content": content},
                            {"role": "assistant", "content": canonical_json(expected)},
                        ],
                    }
                )
    for split in participant:
        participant[split].sort(key=lambda record: record["case_id"])
        ground[split].sort(key=lambda record: record["case_id"])
        write_jsonl(output / "participant" / f"{split}.jsonl", participant[split])
        write_jsonl(output / "ground" / f"{split}.jsonl", ground[split])
        generated_paths.add(output / "participant" / f"{split}.jsonl")
        generated_paths.add(output / "ground" / f"{split}.jsonl")
    sft.sort(key=lambda record: record["case_id"])
    write_jsonl(output / "training" / "train.sft.jsonl", sft)
    generated_paths.add(output / "training" / "train.sft.jsonl")
    files: dict[str, str] = {}
    for path in sorted(generated_paths):
        files[str(path.relative_to(output))] = digest_bytes(path.read_bytes())
    manifest = {
        "protocol": "TSR_CORPUS/0.1",
        "kernel_version": KERNEL_VERSION,
        "requested_families": family_count,
        "supported_families": supported_count,
        "unsupported_families": invalid_count,
        "families": {split: len(ids) for split, ids in families.items()},
        "trajectories": {split: len(ids) for split, ids in trajectories.items()},
        "cases": {split: len(records) for split, records in participant.items()},
        "modalities": list(MODALITIES),
        "files": files,
    }
    manifest_path = output / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--families", type=int, default=24)
    args = parser.parse_args()
    manifest = build(args.output.resolve(), family_count=args.families)
    print(
        json.dumps(
            {
                "protocol": manifest["protocol"],
                "requested_families": manifest["requested_families"],
                "cases": manifest["cases"],
                "manifest": str((args.output.resolve() / "manifest.json")),
            },
            indent=2,
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
