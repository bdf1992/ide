# AGENTS.md

This repository builds a deliberately small, open-source, in-chat IDE experience for ChatGPT's side panel and a projectional, verifiable agentic-language research system.

## Read first

Before making changes, read:

1. `README.md`
2. `STATUS.md`
3. `architecture/README.md`
4. `architecture/TYPOLOGY.md`
5. `architecture/TOPOLOGY.md`
6. `architecture/AI-NATIVE.md`
7. `PARITY.md`
8. `IDE-SKILL.md`
9. `CONTRIBUTING.md`
10. `AGENTIC-LANGUAGE.md`
11. `SEMANTIC-KERNEL.md`
12. `RESEARCH.md`
13. the files you intend to modify

Do not reconstruct architecture from chat history when the repository can answer the question.

## Status discipline

Treat the status vocabulary in `STATUS.md` literally:

- **IMPLEMENTED** — stable product path exists;
- **POC** — executable experiment exists but is not promoted;
- **STUB** — boundary/responsibility is named, implementation is incomplete or absent;
- **SPEC** — contract is defined, implementation evidence may still be incomplete;
- **FUTURE** — direction only.

Never infer implementation from a directory, README, type name, capability name, architecture diagram, or agent description.

When adding a stub, state what it owns, what it does not own, where current behavior actually lives, and what would justify promotion.

## Product invariants

1. **In-chat first.** The primary IDE experience must remain usable in ChatGPT's side panel.
2. **Proven substrate first.** Prefer mature open-source editor/runtime components over custom replacements.
3. **Minimal core.** Explorer, editor, tabs, docs, completion, terminal, diagnostics, tests, diffs, and commands are preferred over bespoke teaching dashboards.
4. **Chat is the reasoning plane.** Do not embed a second full chatbot unless there is a demonstrated product need.
5. **Teach through IDE primitives.** Learning behavior belongs primarily in the skill, prompts, contextual docs, commands, traces, diagnostics, diffs, correspondence, and inspectable receipts.
6. **Preserve user custody.** User-written code and newer workspace state must not be silently overwritten.
7. **Evidence over confidence.** Runtime output, tests, diagnostics, repository state, semantic receipts, and explicit workspace packets are stronger than model confidence.
8. **One product line.** Preserve the stable IDE / research parity contract in `PARITY.md`; POCs may isolate hypotheses but must not become competing IDE/runtime/authority stacks.

## AI-native invariants

Use `architecture/AI-NATIVE.md` as the project-specific definition.

- Agents consume explicit state rather than assumed ambient context.
- Actions should become named capabilities when a stable reusable boundary exists.
- Agent output remains proposed input until the relevant authority/custody/admission gate is crossed.
- Human acceptance/correction is a normal protocol operation, not a failure of autonomy.
- Useful work should leave inspectable state/evidence for the next human or agent.
- Repeated accepted neural inference should become deterministic rules/adapters/codebooks when practical.
- Do not add LLM calls merely to make a module look AI-native.

## Concern boundaries

The `src/` tree is a boundary skeleton, not current implementation topology.

Intended concerns:

- `workspace` — files/revisions/snapshots/patch custody;
- `runtime` — Pyodide/CPython execution;
- `semantic` — canonical versioned program meaning;
- `projection` — render/reconstruct semantic surfaces;
- `agent` — proposal/elaboration behavior outside trusted semantics;
- `capability` — transport-neutral operation contracts;
- `adapter` — environment/transport bindings;
- `evidence` — diagnostics/tests/receipts/standing.

Do not move working code into these directories solely for architectural appearance. Extract only when the boundary is useful and parity/evidence can be preserved.

## Agentic-language invariants

1. **Syntax is projection, not authority.** Personal syntax, Python, math, and scrambled dialects are surfaces over admitted semantics.
2. **Meaning is versioned.** Only the declared semantic kernel defines admitted program meaning.
3. **LLM output is candidate elaboration.** An LLM may propose semantics or projection rules; it cannot admit them by confidence alone.
4. **No silent semantic invention.** Unknown operations remain unresolved or explicitly proposed for kernel extension.
5. **Adapters are untrusted producers.** Generated target code must be independently reconstructed before receiving semantic standing.
6. **Standing is computed.** Never hardcode `verified`, S-levels, test counts, certificates, or equivalence claims in UI or fixtures unless clearly marked as mock/demo content.
7. **Failure classes stay distinct.** Parse failure, kernel rejection, target syntax failure, semantic mismatch, assertion failure, and observation mismatch are different outcomes.
8. **Experimental maturity is not semantic breadth.** Do not enlarge the kernel merely to make a POC more impressive.

## Change classification

Before changing the agentic language, classify the work as exactly one primary class:

### Projection extension

Adds a new expression of existing meaning.

Burden: parsing/codebook tests and proof that canonical semantics are unchanged.

### Normalization extension

Adds a new target-language form that reconstructs an existing semantic normal form.

Burden: equivalence rule, side conditions, positive/negative cases, and independent reconstruction evidence.

### Kernel extension

Adds new admitted meaning.

Burden: versioned IR definition, type/well-formedness rules, operational semantics, failure semantics, adapter obligations, and positive/negative tests. Prefer composition before choosing this class.

Do not smuggle a kernel extension into a projection or normalization change.

## Agent operating rules

- Inspect before editing.
- Make the smallest coherent change that satisfies the request.
- Preserve unrelated files and behavior.
- Prefer reversible and reviewable changes.
- Do not add a framework because a small adapter would work.
- Do not duplicate capability already supplied by Monaco, xterm.js, Pyodide, browser APIs, or another selected dependency.
- Keep browser-preview restrictions in mind: CDN/module loading may fail, so important editing/state workflows should degrade safely.
- Avoid hidden network dependencies for core user data or workspace custody.
- When adding a dependency, pin or clearly identify the version and document why it is needed.
- Keep the side-panel artifact understandable without a large build system until a build system is clearly justified.
- For POC 0.1, do not broaden beyond the reference accumulator semantics unless a prerequisite is genuinely missing.
- Preserve concern topology: convenience layers may depend inward on contracts, but must not redefine custody, semantics, or standing.

## IDE change classification

Before adding UI, classify the requested behavior:

- **IDE primitive** — use an existing editor/terminal/language feature.
- **Agent behavior** — implement in `IDE-SKILL.md` or prompt/command behavior.
- **Adapter/protocol** — implement in the thin workspace/MCP-shaped seam.
- **New UI** — only when the first three cannot express the requirement clearly.

A new permanent panel should be treated as a design decision, not a convenience.

## Protocol rules

`IDE_STATE_PACKET/1` is supplied workspace evidence. `IDE_PATCH/1` is a proposed change, not authority to overwrite arbitrary state.

When revision information exists:

- include the base revision in proposed patches;
- reject or re-derive stale patches;
- never silently merge conflicting full-file replacements.

Keep capability names transport-neutral where possible so a later local MCP adapter can expose the same semantics.

For the language layer, prefer similarly explicit operations such as `semantic.propose`, `semantic.admit`, `projection.render`, `projection.reconstruct`, `semantic.verify`, and `receipt.inspect`; capability naming does not grant authority.

## Verification

For any behavioral change, verify at the narrowest useful level:

- editor behavior works with Monaco when available;
- fallback editing remains usable when Monaco is unavailable;
- Python behavior works through Pyodide when available;
- blocked runtime/module loading fails visibly rather than corrupting state;
- existing keyboard shortcuts continue to work;
- workspace state is preserved across ordinary edits/tab changes;
- agent patches do not modify unrelated files.

For agentic-language work additionally verify:

- the declared kernel version;
- the exact standing level earned;
- expected failure stage for negative cases;
- source IR and reconstructed target IR where equivalence is claimed;
- actual target parser/runtime use rather than simulated evidence when the POC requires independence.

For architecture/stub work additionally verify:

- `STATUS.md` matches reality;
- typology/ownership is not contradictory;
- topology introduces no hidden authority edge;
- a STUB is not described as product capability;
- parity exceptions are explicit and temporary.

For bug fixes, add or record a reproducible before/after case when practical.

## Handoff

A useful agent handoff states:

- what changed;
- what was intentionally not changed;
- whether the change is projection, normalization, kernel, IDE, agent, adapter, architecture, or status behavior;
- evidence used to verify it;
- semantic kernel version and standing when relevant;
- any known browser/ChatGPT sandbox limitation;
- current IMPLEMENTED/POC/STUB/SPEC/FUTURE status affected;
- the next smallest unresolved capability.
