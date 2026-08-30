# Status Ledger

This file prevents architecture, stubs, experiments, and implemented product behavior from being mistaken for one another.

Status words:

- **IMPLEMENTED** — exists in the stable IDE/product path.
- **POC** — executable research implementation exists but is not yet promoted.
- **STUB** — responsibility/boundary is named; implementation is intentionally incomplete or absent.
- **SPEC** — semantic/research contract is defined but implementation evidence may be incomplete.
- **FUTURE** — named direction only; no implementation claim.

## Current map

| Concern | Status | Current location | Notes |
|---|---|---|---|
| IDE shell | IMPLEMENTED | `index.html` | Monaco/fallback, explorer, tabs, terminal, agent patch seam |
| Workspace custody/revision | IMPLEMENTED | `index.html` | browser-local state + revision-aware patch refusal |
| Portable workspace snapshots | IMPLEMENTED | `index.html` | explicit `IDE_WORKSPACE/1` export/import; import confirmation + revision advance |
| Python runtime | IMPLEMENTED | `index.html` | Pyodide v314.0.6 / CPython browser runtime |
| Agent operating contract | IMPLEMENTED | `IDE-SKILL.md`, `AGENTS.md` | behavioral contract, not autonomous runtime |
| Capability layer | STUB | `src/capability/` | transport-neutral names exist; shared implementation not extracted yet |
| Adapter layer | STUB | `src/adapter/` | future chat/local/MCP bindings; no shared adapter runtime yet |
| Local workbench adapter | POC | `local/server.py`, `index.html` | optional loopback host + model health/candidate proposal HTTP routes; not MCP |
| Workspace module | STUB | `src/workspace/` | boundary extracted conceptually; implementation still embedded in `index.html` |
| Runtime module | STUB | `src/runtime/` | boundary named; implementation still embedded in stable/P0.1 artifacts |
| Semantic Kernel 0.1 specification | SPEC | `SEMANTIC-KERNEL.md` | canonical accumulator semantics frozen for P0.1 |
| Semantic POC engine | POC | `poc/semantic-core.js` | implementation candidate; browser defeat suite still must close experiment |
| Semantic POC UI | POC | `poc/semantic-poc.html` | intentionally not stable IDE UI |
| Projection module | STUB | `src/projection/` | POC has emitter/reconstructor; stable shared module not promoted |
| Evidence/receipt module | STUB | `src/evidence/` | POC computes standing; shared product evidence layer not promoted |
| Agent semantic elaboration | POC | `local/server.py`, `index.html`, POC 0.2 | optional candidate-only local proposal path; not in trusted POC 0.1 loop |
| TSR neural elaboration harness | POC | `poc/neural-elaboration/` | deterministic multimodal corpus/evaluator candidate; no trained weights or stable integration claimed |
| TSR proposal contract | SPEC | `poc/neural-elaboration/contract/` | model-neutral candidate/refusal envelope; model output remains untrusted |
| TSR custom LoRA weights | FUTURE | issue #7 | training has not been run; no weight or performance claim exists |
| Adaptive codebook | FUTURE | POC 0.3 | no implementation claim |
| Semantic learning experiment | FUTURE | POC 0.4 | protocol defined; experiment not run |
| Branch/functions/records/effects/tensors | FUTURE | Kernel 0.2–0.6 | do not expand before core experiment closure |

## Promotion discipline

Moving a concern from STUB/POC to IMPLEMENTED requires evidence appropriate to that concern and preservation of `PARITY.md`.

A file existing is not sufficient evidence of implementation.

## Current next closure

The next research closure remains POC 0.1:

1. run the built-in defeat suite in the supported browser/side-panel environment;
2. record the actual computed results;
3. correct any boundary/implementation defect;
4. only then consider promoting semantic mode into the stable IDE shell.

The POC 0.2 candidate harness may evolve independently as an isolated testbed, but it
does not bypass this closure or earn integration into `index.html`.
