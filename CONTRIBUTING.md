# Contributing

Open Chat IDE is intentionally small. Contributions should improve the quality of the IDE experience without turning the repository into a second IDE framework.

This repository also contains the agentic-language research system. Changes to language semantics carry a different burden than changes to syntax or UI.

## Before changing code

1. Read `README.md`, `STATUS.md`, `architecture/README.md`, `architecture/TYPOLOGY.md`, `architecture/TOPOLOGY.md`, `architecture/PROVIDERS.md`, `architecture/HOST-PROFILES.md`, `architecture/AI-NATIVE.md`, `contracts/README.md`, `PARITY.md`, `AGENTS.md`, `IDE-SKILL.md`, `AGENTIC-LANGUAGE.md`, `SEMANTIC-KERNEL.md`, and `RESEARCH.md`.
2. Reproduce or describe the need in terms of an IDE primitive, agent behavior, adapter/protocol, provider, contract change, projection extension, normalization extension, kernel extension, architecture/status change, or genuinely new UI.
3. Prefer the smallest layer that can solve the problem.
4. Check whether Monaco, xterm.js, Pyodide, Tree-sitter, Git/LSP tooling, or an existing browser API already provides the underlying machinery.
5. Check `STATUS.md` before assuming a named directory, schema, architecture component, host profile, or provider is implemented.

## Architecture and status discipline

The architecture skeleton is allowed to describe future boundaries before those boundaries are implemented.

When adding or changing a stub:

- state what the concern owns;
- state what it explicitly does not own;
- identify where current working behavior actually lives;
- identify the promotion trigger;
- keep its `STATUS.md` entry accurate.

Do not move code merely to make the directory tree resemble the architecture diagram.

Use the status words literally:

- **IMPLEMENTED** — stable product behavior exists;
- **POC** — executable experiment exists but is not promoted;
- **STUB** — boundary named, implementation incomplete/absent;
- **SPEC** — contract defined, evidence/implementation may be incomplete;
- **FUTURE** — direction only.

## Crossing contract discipline

Use `contracts/` for stable boundary shapes, not for internal convenience objects.

Before adding or changing a contract, identify:

- the producer;
- the consumer;
- the boundary crossed;
- what authority the object does **not** carry;
- the versioning impact;
- whether a real producer/consumer pair exists yet.

Keep paired distinctions separate:

```text
state evidence      != mutation proposal
capability request  != capability result
semantic candidate  != admitted semantic program
execution result    != evidence receipt
```

A schema is SPEC until supported product code validates it on both sides of a crossing. Do not promote a contract because examples serialize successfully.

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

### Preserve the Chat baseline

Chat is the minimum supported product host, not a disposable fallback tier.

The primary artifact must remain suitable for ChatGPT side-panel/browser use. Changes that require Cloud Browser, a local server, native process, privileged browser API, MCP service, or another stronger host must be optional adapters/providers rather than assumptions of the Chat build.

Work and future local hosts may provide stronger implementations behind the same capability contracts. They may not silently redefine capability meaning, workspace custody, or authority.

For any capability intended to be shared product infrastructure, state explicitly:

- Chat behavior;
- Work behavior;
- provider-unavailable/degraded behavior;
- which semantics and gates remain invariant across hosts.

Core acceptance fixtures must remain Chat-compatible. Work-specific fixtures may extend the acceptance set but must not replace the Chat baseline.

### Preserve graceful degradation

External browser modules may be blocked by the preview environment. The IDE should fail visibly and retain useful baseline editing/state behavior rather than present a broken blank surface.

### Keep AI-native behavior explicit

AI-native changes should make state, requested capabilities, authority boundaries, and resulting evidence more explicit—not merely add model calls.

A useful feature proposal should answer:

- what explicit state the agent sees;
- what named capability/action it requests;
- what gate controls the effect;
- what evidence/artifact records the result;
- whether repeated admitted inference can become deterministic.

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
2. Classify the change and affected concern boundary.
3. Work on a focused branch.
4. Keep commits small enough to explain.
5. Open a PR that states the behavior/status before and after the change.
6. Include verification evidence and known side-panel/host limitations.
7. Prefer squash merge for focused feature/fix PRs unless preserving commit history has a specific value.

Tiny documentation corrections may be committed directly when repository policy permits it.

## Pull request checklist

A PR should answer:

- What user/research problem does this solve?
- What class of change is this?
- Which typology/concern owns it?
- What topology/boundary does it cross?
- Which contract crosses that boundary, if any?
- Who produces and consumes that contract?
- What authority does the contract explicitly not carry?
- Why does it belong in this layer?
- What is the status before and after: IMPLEMENTED / POC / STUB / SPEC / FUTURE?
- Why is any status promotion earned?
- What existing open-source primitive was reused?
- What new dependency, if any, was introduced and why?
- What is the Chat behavior?
- What is the Work behavior?
- What happens when the stronger provider/host is unavailable?
- Does the Chat side-panel/fallback path still work?
- What was tested or manually verified in each affected host profile?
- Does it preserve unrelated workspace state?
- Does it introduce or alter `IDE_STATE_PACKET/1` / `IDE_PATCH/1` semantics?
- Does it alter the semantic kernel version or trusted computing base?
- Which S-level is actually earned, and from what computed evidence?
- Which negative/defeat cases were tested?
- Did IDE/research/host parity change, and is any exception documented?

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
- Keep STUB modules free of copied placeholder implementation unless the placeholder itself is the explicit experiment.
- Keep contract validators separate from authority decisions; shape validity alone must never grant permission.
- Keep host-specific adapters/providers outside shared capability semantics.

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

- closing the Chat-browser acceptance of the current provider POCs;
- promoting workspace materialization into the stable browser Python path when earned;
- durable workspace export/import;
- folders and rename/delete operations;
- find-in-file/workspace;
- diagnostics/Problems;
- stronger Python language intelligence where practical in-browser;
- revision-safe agent patches;
- a transport-neutral capability layer that can back Work/local adapters without making them Chat prerequisites.

Agentic-language work should currently favor only POC 0.1:

- Kernel 0.1 accumulator semantics;
- deterministic Personal parser;
- reference evaluator;
- Python emitter;
- real CPython `ast.parse()` through Pyodide;
- independent Python AST-to-IR reconstruction;
- computed S0-S4 standing;
- defeat mutations defined in `RESEARCH.md`.

Architecture work may continue through stubs/status/contract clarification, but should not imply implementation promotion.

Do not add branching, functions, records, effects, tensors, or open-ended LLM elaboration until the smaller certifying-projection loop is demonstrably working.
