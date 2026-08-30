# Contributing

Open Chat IDE is intentionally small. Contributions should improve the quality of the IDE experience without turning the repository into a second IDE framework.

This repository also contains the agentic-language research system. Changes to language semantics carry a different burden than changes to syntax or UI.

## Before changing code

1. Read `README.md`, `AGENTS.md`, `IDE-SKILL.md`, `AGENTIC-LANGUAGE.md`, `SEMANTIC-KERNEL.md`, and `RESEARCH.md`.
2. Reproduce or describe the need in terms of an IDE primitive, agent behavior, adapter/protocol, projection extension, normalization extension, kernel extension, or genuinely new UI.
3. Prefer the smallest layer that can solve the problem.
4. Check whether Monaco, xterm.js, Pyodide, or an existing browser API already provides the capability.

## Design principles

### Keep the IDE core boring

Prefer established IDE conventions:

- Explorer
- tabs
- command/quick open
- contextual hover documentation
- completion
- terminal
- diagnostics/problems
- tests
- diffs
- go-to-definition/refactoring when language support allows it

Do not add a custom dashboard when an ordinary IDE surface can carry the behavior.

### Keep teaching behavior separate

Pedagogical behavior should usually live in `IDE-SKILL.md`, contextual documentation, commands, traces, diagnostics, correspondence, or chat reasoning rather than permanent visual chrome.

### Preserve the in-chat constraint

The primary artifact must remain suitable for ChatGPT side-panel use. Changes that require a local server, native process, or privileged browser API must be optional adapters rather than assumptions of the chat build.

### Preserve graceful degradation

External browser modules may be blocked by the preview environment. The IDE should fail visibly and retain useful baseline editing/state behavior rather than present a broken blank surface.

## Agentic-language contribution classes

### Projection extension

Use this when adding a new surface phrase/dialect/rendering for meaning already represented by the current kernel.

Required evidence:

- the exact existing semantic node/normal form;
- parser/codebook/render tests;
- evidence that kernel semantics and version are unchanged;
- ambiguous forms rejected rather than guessed.

### Normalization extension

Use this when adding a new target-language syntax that should count as an existing semantic meaning.

Required evidence:

- the target AST shape;
- explicit normalization rule;
- side conditions/types/effects required by the rule;
- positive and negative examples;
- independent reconstruction evidence;
- no widening beyond the stated target form.

### Kernel extension

Use this only when the program genuinely needs meaning that cannot be composed from the existing kernel.

Required evidence:

- new canonical IR node(s);
- version change;
- well-formedness/type rules;
- operational semantics;
- failure semantics;
- normalization/equivalence implications;
- adapter obligations;
- positive and negative tests;
- migration/compatibility impact on prior receipts.

Kernel growth should be slow. Surface-language growth may be fast.

## Contribution workflow

For non-trivial work:

1. Open or identify an issue describing the user-visible or research need and acceptance criteria.
2. Classify the change.
3. Work on a focused branch.
4. Keep commits small enough to explain.
5. Open a PR that states the behavior before and after the change.
6. Include verification evidence and known side-panel limitations.
7. Prefer squash merge for focused feature/fix PRs unless preserving commit history has a specific value.

Tiny documentation corrections may be committed directly when repository policy permits it.

## Pull request checklist

A PR should answer:

- What user/research problem does this solve?
- What class of change is this?
- Why does it belong in this layer?
- What existing open-source primitive was reused?
- What new dependency, if any, was introduced and why?
- Does the side-panel/fallback path still work?
- What was tested or manually verified?
- Does it preserve unrelated workspace state?
- Does it introduce or alter `IDE_STATE_PACKET/1` / `IDE_PATCH/1` semantics?
- Does it alter the semantic kernel version or trusted computing base?
- Which S-level is actually earned, and from what computed evidence?
- Which negative/defeat cases were tested?

## Code practices

- Prefer plain, readable code over clever abstractions.
- Keep state ownership explicit.
- Avoid global mutation when a small local boundary is practical.
- Validate imported/pasted agent data before applying it.
- Escape or render user-controlled content safely; do not inject it as trusted HTML.
- Keep long-running work bounded and surface failure states.
- Maintain keyboard accessibility and visible focus for interactive controls.
- Avoid intercepting browser/host shortcuts unless the IDE action clearly owns the shortcut.
- Prefer deterministic file ordering and stable identifiers where state packets or semantic receipts depend on them.
- Never encode verification status as decorative/static UI state when it should be computed.
- Keep independent verifier code genuinely independent from producer shortcuts when independence is part of the research claim.

## Agent and patch safety

Agent output is untrusted proposed input until validated.

- Validate protocol version and required fields.
- Preview meaningful edits before applying them.
- Prefer revision-safe changes.
- Reject malformed or stale patches instead of guessing intent.
- Do not let a patch silently delete or rewrite unrelated files.
- Keep execution separate from edit application unless the user explicitly requests both.
- LLM-proposed semantics must remain candidate state until the appropriate admission path is completed.

## Dependencies and licensing

Use mature open-source dependencies only when they replace meaningful custom implementation or materially improve compatibility.

When adding or upgrading a dependency:

- record its name and version;
- link/document the upstream project in the relevant source or documentation;
- preserve its license/notice obligations;
- avoid unnecessary overlapping packages.

The repository's own project license should be chosen explicitly by the owner; do not infer or change it as part of an unrelated contribution.

## Current near-term scope

IDE-quality work should favor:

- durable workspace export/import;
- folders and rename/delete operations;
- find-in-file/workspace;
- diagnostics/Problems;
- stronger Python language intelligence where practical in-browser;
- revision-safe agent patches;
- a transport-neutral capability layer that can later back a local MCP adapter.

Agentic-language work should currently favor only POC 0.1:

- Kernel 0.1 accumulator semantics;
- deterministic Personal parser;
- reference evaluator;
- Python emitter;
- real CPython `ast.parse()` through Pyodide;
- independent Python AST-to-IR reconstruction;
- computed S0-S4 standing;
- defeat mutations defined in `RESEARCH.md`.

Do not add branching, functions, records, effects, tensors, or open-ended LLM elaboration until the smaller certifying-projection loop is demonstrably working.
