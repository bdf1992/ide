# AGENTS.md

This repository builds a deliberately small, open-source, in-chat IDE experience for ChatGPT's side panel.

## Read first

Before making changes, read:

1. `README.md`
2. `IDE-SKILL.md`
3. `CONTRIBUTING.md`
4. the files you intend to modify

Do not reconstruct architecture from chat history when the repository can answer the question.

## Product invariants

1. **In-chat first.** The primary IDE experience must remain usable in ChatGPT's side panel.
2. **Proven substrate first.** Prefer mature open-source editor/runtime components over custom replacements.
3. **Minimal core.** Explorer, editor, tabs, docs, completion, terminal, diagnostics, tests, diffs, and commands are preferred over bespoke teaching dashboards.
4. **Chat is the reasoning plane.** Do not embed a second full chatbot unless there is a demonstrated product need.
5. **Teach through IDE primitives.** Learning behavior belongs primarily in the skill, prompts, contextual docs, commands, traces, diagnostics, and diffs.
6. **Preserve user custody.** User-written code and newer workspace state must not be silently overwritten.
7. **Evidence over confidence.** Runtime output, tests, diagnostics, repository state, and explicit workspace packets are stronger than model confidence.

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

## Change classification

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

## Verification

For any behavioral change, verify at the narrowest useful level:

- editor behavior works with Monaco when available;
- fallback editing remains usable when Monaco is unavailable;
- Python behavior works through Pyodide when available;
- blocked runtime/module loading fails visibly rather than corrupting state;
- existing keyboard shortcuts continue to work;
- workspace state is preserved across ordinary edits/tab changes;
- agent patches do not modify unrelated files.

For bug fixes, add or record a reproducible before/after case when practical.

## Handoff

A useful agent handoff states:

- what changed;
- what was intentionally not changed;
- evidence used to verify it;
- any known browser/ChatGPT sandbox limitation;
- the next smallest unresolved capability.
