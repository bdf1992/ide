# Status Ledger

This file prevents architecture, stubs, experiments, contracts, and implemented product behavior from being mistaken for one another.

Status words:

- **IMPLEMENTED** — exists in the stable IDE/product path.
- **POC** — executable research implementation exists but is not yet promoted.
- **STUB** — responsibility/boundary is named; implementation is intentionally incomplete or absent.
- **SPEC** — a contract/semantic/research definition exists but implementation evidence may be incomplete.
- **FUTURE** — named direction only; no implementation claim.

## Current map

| Concern | Status | Current location | Notes |
|---|---|---|---|
| IDE shell | IMPLEMENTED | `index.html` | Monaco/fallback, explorer, tabs, terminal, agent patch seam |
| Chat host baseline | IMPLEMENTED | `index.html`, `IDE-SKILL.md` | browser/side-panel core with state packet / patch seam; Chat remains the minimum supported host profile |
| Work host profile | SPEC | `architecture/HOST-PROFILES.md` | optional stronger host/providers are defined architecturally; no shared Work adapter runtime claimed |
| Workspace custody/revision | IMPLEMENTED | `index.html` | browser-local state + revision-aware patch refusal |
| Python runtime | IMPLEMENTED | `index.html` | Pyodide v314.0.6 / CPython browser runtime |
| Agent operating contract | IMPLEMENTED | `IDE-SKILL.md`, `AGENTS.md` | behavioral contract, not autonomous runtime |
| Workspace state/patch envelope | SPEC + partial implementation | `contracts/ide-*.schema.json`, `index.html` | existing packet/patch behavior now has draft schemas; runtime validation is not yet schema-driven |
| Crossing contract set | SPEC | `contracts/` | typed envelopes defined; no shared contract validator/bus claimed |
| Capability layer | STUB | `src/capability/` | transport-neutral names exist; shared implementation/gate not extracted yet |
| Capability request/result envelopes | SPEC | `contracts/capability-*.schema.json` | request/result shapes only; authority gate/runtime not implemented |
| Adapter layer | STUB | `src/adapter/` | Chat/browser/Work/local/MCP host bindings; no shared adapter runtime yet |
| Provider layer | STUB | `src/provider/`, `architecture/PROVIDERS.md` | implementation-binding type and target map defined; no shared provider registry/dispatcher yet |
| Syntax provider | POC | `poc/provider-syntax/` | isolated `syntax.tree`/`syntax.query` Tree-sitter provider candidate; browser acceptance still required before promotion |
| Workspace materialization | POC | `poc/workspace-materialization/` | provider-neutral derived-view core passes deterministic Node acceptance; Pyodide browser acceptance still required before stable integration |
| Workspace module | STUB | `src/workspace/` | boundary extracted conceptually; implementation still embedded in `index.html` |
| Runtime module | STUB | `src/runtime/` | boundary named; implementation still embedded in stable/P0.1 artifacts |
| Execution result envelope | SPEC | `contracts/execution-result.schema.json` | result shape only; product runtime does not yet emit this contract |
| Semantic Kernel 0.1 specification | SPEC | `SEMANTIC-KERNEL.md` | canonical accumulator semantics frozen for P0.1 |
| Semantic candidate/program envelopes | SPEC | `contracts/semantic-*.schema.json` | proposal and admission shapes are distinct; no general admission service exists |
| Semantic POC engine | POC | `poc/semantic-core.js` | implementation candidate; browser defeat suite still must close experiment |
| Semantic POC UI | POC | `poc/semantic-poc.html` | intentionally not stable IDE UI |
| Projection module | STUB | `src/projection/` | POC has emitter/reconstructor; stable shared module not promoted |
| Evidence/receipt module | STUB | `src/evidence/` | POC computes standing; shared product evidence layer not promoted |
| Evidence receipt envelope | SPEC | `contracts/evidence-receipt.schema.json` | receipt shape only; no generic product receipt emitter/validator yet |
| Skill progression boundary | STUB | `src/skill/` | owns wiki/skill/challenge/tree/build definitions and active-skill resolution rules; points/active skills grant no capability or workspace authority |
| Skill build kernel | POC | `poc/skill-build-kernel/` | dependency-free deterministic validation/resolution candidate over the Kernel 0.1 accumulator learning fixture; no stable IDE integration or authenticated challenge runner claimed |
| WikiSkill-style experience evolution | FUTURE | issue #26 | persistent raw trajectories, wiki maintenance, skill proposal/admission, XP/level policy, and public skill scouting remain outside POC 0.1 |
| Agent semantic elaboration | FUTURE | `src/agent/`, POC 0.2 | LLM proposal path deliberately not in trusted POC 0.1 loop |
| TSR neural elaboration harness | POC | `poc/neural-elaboration/` | deterministic multimodal corpus/evaluator candidate; no trained weights or stable integration claimed |
| TSR proposal contract | SPEC | `poc/neural-elaboration/contract/` | model-neutral candidate/refusal envelope; model output remains untrusted |
| TSR custom LoRA weights | FUTURE | issue #7 | training has not been run; no weight or performance claim exists |
| Adaptive codebook | FUTURE | POC 0.3 | no implementation claim |
| Semantic learning experiment | FUTURE | POC 0.4 | protocol defined; experiment not run |
| Branch/functions/records/effects/tensors | FUTURE | Kernel 0.2–0.6 | do not expand before core experiment closure |

## Promotion discipline

Moving a concern from STUB/POC/SPEC to IMPLEMENTED requires evidence appropriate to that concern and preservation of `PARITY.md`.

A file or schema existing is not sufficient evidence of implementation.

For a crossing contract specifically, promotion requires at least one real producer and consumer validating the same versioned shape in the supported product path.

For a provider specifically, promotion requires a real capability operation to be fulfilled through the provider boundary without changing the operation's custody, authority, or result semantics.

For a multi-host capability specifically, promotion requires explicit Chat behavior, Work behavior, provider-unavailable behavior, and evidence that stronger hosts do not redefine shared capability semantics or make the Chat core unusable.

For skill progression specifically, promotion additionally requires a real challenge/evidence producer, deterministic failure cases, explicit Chat behavior, and proof that active-skill resolution does not become hidden capability authorization or semantic admission.

## Current next closure

The next research closure remains POC 0.1:

1. run the built-in defeat suite in the supported browser/side-panel environment;
2. record the actual computed results;
3. correct any boundary/implementation defect;
4. only then consider promoting semantic mode into the stable IDE shell.

Provider POCs and the isolated skill-build POC may evolve in parallel, but they do not bypass this closure or become stable product behavior without their own acceptance evidence.

The POC 0.2 candidate harness may evolve independently as an isolated testbed, but it
does not bypass this closure or earn integration into `index.html`.
