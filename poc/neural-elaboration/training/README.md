# Optional Qwen3-VL LoRA Run

Training is intentionally downstream of the frozen corpus and evaluator. Nothing in
this directory is needed by the browser IDE or semantic kernel.

## Candidate base

Start with `Qwen/Qwen3-VL-4B-Instruct`. A 4B VLM is the more credible first LoRA target
for the project's current 16 GB VRAM workstation. The participant contract remains
model-neutral; this choice is a practical probe, not an architectural dependency.

Use the upstream [Qwen3-VL training framework](https://github.com/QwenLM/Qwen3-VL/tree/main/qwen-vl-finetune)
rather than maintaining a second trainer here. Its documented dependency set currently
identifies:

```text
torch==2.6.0
torchvision==0.21.0
transformers==4.57.0.dev0
deepspeed==0.17.1
flash_attn==2.7.4.post1
triton==3.2.0
accelerate==1.7.0
torchcodec==0.2
peft==0.17.1
```

Treat that set as an upstream environment lock, not as a dependency of Open Chat IDE.
Recheck it against the exact upstream revision used for a real run.

## Prepare data

```bash
python3 poc/neural-elaboration/src/generate_corpus.py \
  --families 2048 \
  --output poc/neural-elaboration/runs/corpus

python3 poc/neural-elaboration/src/export_qwen.py \
  --input poc/neural-elaboration/runs/corpus/training/train.sft.jsonl \
  --output poc/neural-elaboration/runs/corpus/training/qwen-train.json
```

Register the exported file in the upstream framework's `qwenvl/data/__init__.py`:

```python
TSR_IDE = {
    "annotation_path": "/absolute/path/to/qwen-train.json",
    "data_path": "/absolute/path/to/poc/neural-elaboration/runs/corpus",
}

data_dict["tsr_ide"] = TSR_IDE
```

The participant-facing image paths are relative to the corpus root, so `data_path`
must point at that root.

## First run shape

Begin with language and multimodal projector/LLM LoRA while keeping the vision tower
frozen. Use one epoch first as a plumbing check. Preserve the exact upstream commit,
base-model revision, corpus manifest, command, GPU/runtime facts, seed, and resulting
adapter digest in the run record.

Minimum comparison:

1. frozen base model;
2. frozen base plus text-serialized TSR;
3. LoRA adapter;
4. constant-refusal baseline.
5. deterministic Personal/Alien surface-parser baseline.

Do not select a checkpoint from challenge performance. Validation may select; challenge
is opened once for the experiment receipt.

## Required receipt before any claim

- corpus manifest and hashes;
- base model and exact revision;
- adapter hash;
- training configuration and seed;
- validation and challenge evaluator reports;
- per-projection metrics;
- refusal behavior;
- relation-signal ablations;
- equal-budget frozen-base comparison;
- observed peak VRAM and wall time.

Until that receipt exists, the repository has a runnable model **testbed**, not a
trained custom model.

The first governed run is tracked in repository issue `#7`.
