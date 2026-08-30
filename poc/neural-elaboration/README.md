# POC 0.2 Candidate — TSR Neural Elaboration

This directory is the first custom-model testbed for Open Chat IDE. It asks whether a
small open-weight vision-language adapter can propose Kernel 0.1 meaning from several
surface projections without becoming part of the trusted semantic kernel.

It is an **agent/model experiment**. It does not change Kernel 0.1, execution standing,
workspace custody, or the stable IDE.

## Model role

```text
Personal / alien / Python / structure / image
                    |
                    v
          untrusted model adapter
                    |
                    v
        SEMANTIC_PROPOSAL/1 candidate
                    |
                    v
       unchanged Kernel 0.1 admission
                    |
                    v
        existing S1-S4 evidence path
```

The proposed custom model is initially a LoRA adapter over an open-weight multimodal
base, not a foundation model trained from scratch. The first practical target is the
4B-class Qwen3-VL Instruct family so the experiment remains plausible on a 16 GB GPU.
The participant contract is model-neutral so another VLM can be tested against the
same frozen corpus and oracle.

## Representation under test

Each accepted proposal may carry a typed structural representation with four distinct
parts:

- `data_refs` — content-addressed source material;
- `tokens` — typed semantic identities;
- `token_state` — proposal-local state, never runtime or admission standing;
- `signals` — frame-relative typed relationships between tokens.

`data_refs` also carry modality-native evidence selectors: line spans for textual
projections and bounding boxes for image projections. Grounding is scored independently
from semantic identity and relation signals.

Signals are experimental relational carriers. Their phase and magnitude fields are not
facts, authority, or a claim that semantic relations are literally Fourier components.
They make relation type, direction, frame, and intended impact independently ablatable.

## Corpus

The generator creates 24 semantic families with five projections each:

- Personal dialect;
- alien/scrambled dialect;
- Python;
- structural outline;
- rendered image diagram.

Twenty families express admitted Kernel 0.1 programs. Four contain an undeclared
`MultiplyUpdate` and require explicit refusal. All projections of one family remain in
the same train, validation, or challenge split. The admitted families form controlled
base/causal pairs: one collection value changes, so source data and canonical literals
change while token identity and relation-signal topology remain stable. Entire causal
trajectories are kept in one split.

Generated data is kept out of source control. Build it with:

```bash
python3 poc/neural-elaboration/src/generate_corpus.py \
  --output poc/neural-elaboration/runs/corpus
```

The 24-family default is a fast regression fixture. Generate a first training-scale
candidate without changing the protocol:

```bash
python3 poc/neural-elaboration/src/generate_corpus.py \
  --families 2048 \
  --output poc/neural-elaboration/runs/corpus-2048
```

Increasing count increases lexical, literal, causal-pair, refusal, and rendered-image
instances. It does not increase Kernel 0.1 expressive breadth.

The first measured 2,048-family generation is recorded in
[`observations/2026-08-30-corpus-scale.md`](./observations/2026-08-30-corpus-scale.md).

Participant-visible inputs are written under `participant/`. Frozen expected results
are written separately under `ground/`. Only the train split receives an SFT export
containing targets.

## Evaluation

Participant output is JSONL with one record per case:

```json
{"case_id":"…","proposal":{"protocol":"SEMANTIC_PROPOSAL/1","kernel_version":"0.1","disposition":"propose","candidate_ir":{}}}
```

or an explicit refusal:

```json
{"case_id":"…","proposal":{"protocol":"SEMANTIC_PROPOSAL/1","kernel_version":"0.1","disposition":"refuse","refusal":{"code":"UNDECLARED_OPERATION"}}}
```

Score a participant without exposing the oracle to it:

```bash
python3 poc/neural-elaboration/src/evaluate.py \
  --ground poc/neural-elaboration/runs/corpus/ground/challenge.jsonl \
  --predictions predictions.jsonl \
  --report poc/neural-elaboration/runs/challenge-report.json
```

Create a deliberately simple comparison baseline:

```bash
python3 poc/neural-elaboration/src/evaluate.py \
  --ground poc/neural-elaboration/runs/corpus/ground/challenge.jsonl \
  --baseline constant-refusal \
  --report poc/neural-elaboration/runs/refusal-baseline.json
```

Run the stronger deterministic surface parser baseline:

```bash
python3 poc/neural-elaboration/baselines/surface_parser.py \
  --input poc/neural-elaboration/runs/corpus/participant/challenge.jsonl \
  --output poc/neural-elaboration/runs/surface-parser.jsonl

python3 poc/neural-elaboration/src/evaluate.py \
  --ground poc/neural-elaboration/runs/corpus/ground/challenge.jsonl \
  --predictions poc/neural-elaboration/runs/surface-parser.jsonl \
  --report poc/neural-elaboration/runs/surface-parser-report.json
```

This baseline should own the admitted Personal/Alien grammar and lose outside it. A
custom model earns value through grounded cross-projection generalization, not by
replacing a deterministic parser where one already exists.

## Deterministic regression

Run the complete local harness with one command:

```bash
python3 -m unittest discover -s poc/neural-elaboration/tests -v
```

This verifies generation, CAS integrity, family split isolation, multimodal parity,
line/bounding-box grounding, refusal cases, proposal validation, evaluator behavior, and parity with the current
JavaScript Kernel 0.1 reference program. It does not train or validate model weights.

The optional [training adapter](./training/README.md) exports the train split into the
official Qwen-VL conversation format and defines the evidence required from a local
LoRA run.

## Standing

- Corpus generator and evaluator: **POC** after local tests pass.
- Proposal contract: **SPEC**.
- LoRA weights: **FUTURE** until an actual training run and held-out receipts exist.
- Candidate transport/display in the optional local workbench: **POC**. Semantic
  admission, verification, and normal-editor integration remain **FUTURE**, gated by
  POC 0.1 closure plus this experiment's own evidence.
