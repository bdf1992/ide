# AGENTS.md

This repository builds a deliberately small, open-source, in-chat IDE experience for ChatGPT's side panel and a projectional, verifiable agentic-language research system.

## Read first

Before making changes, read:

1. `README.md`
2. `IDE-SKILL.md`
3. `CONTRIBUTING.md`
4. `AGENTIC-LANGUAGE.md`
5. `SEMANTIC-KERNEL.md`
6. `RESEARCH.md`
7. `PARITY.md`
8. the files you intend to modify

Do not reconstruct architecture from chat history when the repository can answer the question.

## Product invariants

1. **In-chat first.** The primary IDE experience must remain usable in ChatGPT's side panel.
2. **Proven substrate first.** Prefer mature open-source editor/runtime components over custom replacements.
3. **Minimal core.** Explorer, editor, tabs, docs, completion, terminal, diagnostics, tests, diffs, and commands are preferred over bespoke teaching dashboards.
4. **Chat is the reasoning plane.** Do not embed a second full chatbot unless there is a demonstrated product need.
5. **Teach through IDE primitives.** Learning behavior belongs primarily in the skill, prompts, contextual docs, commands, traces, diagnostics, diffs, correspondence, and inspectable receipts.
6. **Preserve user custody.** User-written code and newer workspace state must not be silently overwritten.
7. **Evidence over confidence.** Runtime output, tests, diagnostics, repository state, semantic receipts, and explicit workspace packets are stronger than model confidence.
8. **One IDE, one research substrate.** `poc/` is a proving ground, not a competing IDE or runtime contract.

## Agentic-language invariants

1. **Syntax is projection, not authority.** Personal syntax, Python, math, and scrambled dialects are surfaces over admitted semantics.
2. **Meaning is versioned.** Only the declared semantic kernel defines admitted program meaning.
3. **LLM output is candidate elaboration.** An LLM may propose semantics or projection rules; it cannot admit them by confidence alone.
4. **No silent semantic invention.** Unknown operations remain unresolved or explicitly proposed for kernel extension.
5. **Adapters are untrusted producers.** Generated target code must be independently reconstructed before receiving semantic standing.
6. **Standing is computed.** Never hardcode `verified`, S-levels, test counts, certificates, or equivalence claims in UI or fixtures unless clearly marked as mock/demo content.
7. **Failure classes stay distinct.** Parse failure, kernel rejection, target syntax failure, semantic mismatch, assertion failure, and observation mismatch are different outcomes.
8. **Experimental maturity is not semantic breadth.** Do not enlarge the kernel merely to make a POC more impressive.

## Parity rules

Follow `PARITY.md` whenever work touches `index.html`, `poc/`, runtime loading, workspace/patch protocols, semantic standing, or promotion of research behavior into the stable IDE.

- Keep the stable IDE and research artifacts on the same pinned Pyodide/CPython runtime baseline unless an experiment explicitly documents why not.
- Do not create a second workspace-state, patch, or agent-authority protocol for research mode.
- Temporary UI differences are allowed only when they isolate the hypothesis under test.
- Do not promote a research capability into the main shell until its declared success criteria and defeat cases have been exercised in the supported environment.
- When a deliberate parity exception exists, record it as temporary and explain the removal/promotion condition.

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

For parity-sensitive work additionally verify:

- stable IDE and POC runtime versions remain aligned;
- no new protocol or authority seam was introduced only on one side;
- any deliberate UI/runtime divergence is documented in `PARITY.md` or the POC contract;
- promotion into the stable IDE is backed by the experiment's required evidence.

For bug fixes, add or record a reproducible before/after case when practical.

## Handoff

A useful agent handoff states:

- what changed;
- what was intentionally not changed;
- whether the change is projection, normalization, kernel, IDE, agent behavior, or parity maintenance;
- evidence used to verify it;
- semantic kernel version and standing when relevant;
- any deliberate parity exception;
- any known browser/ChatGPT sandbox limitation;
- the next smallest unresolved capability.
