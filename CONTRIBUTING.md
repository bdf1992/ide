# Contributing

Open Chat IDE is intentionally small. Contributions should improve the quality of the IDE experience without turning the repository into a second IDE framework.

## Before changing code

1. Read `README.md`, `AGENTS.md`, and `IDE-SKILL.md`.
2. Reproduce or describe the need in terms of an IDE primitive, agent behavior, adapter/protocol, or genuinely new UI.
3. Prefer the smallest layer that can solve the problem.
4. Check whether Monaco, xterm.js, Pyodide, or an existing browser API already provides the capability.

## Design principles

### Keep the core boring

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

Pedagogical behavior should usually live in `IDE-SKILL.md`, contextual documentation, commands, traces, diagnostics, or chat reasoning rather than permanent visual chrome.

### Preserve the in-chat constraint

The primary artifact must remain suitable for ChatGPT side-panel use. Changes that require a local server, native process, or privileged browser API must be optional adapters rather than assumptions of the chat build.

### Preserve graceful degradation

External browser modules may be blocked by the preview environment. The IDE should fail visibly and retain useful baseline editing/state behavior rather than present a broken blank surface.

## Contribution workflow

For non-trivial work:

1. Open or identify an issue describing the user-visible need and acceptance criteria.
2. Work on a focused branch.
3. Keep commits small enough to explain.
4. Open a PR that states the behavior before and after the change.
5. Include verification evidence and known side-panel limitations.
6. Prefer squash merge for focused feature/fix PRs unless preserving commit history has a specific value.

Tiny documentation corrections may be committed directly when repository policy permits it.

## Pull request checklist

A PR should answer:

- What user problem does this solve?
- Why does the change belong in the IDE core rather than agent behavior?
- What existing open-source primitive was reused?
- What new dependency, if any, was introduced and why?
- Does the side-panel/fallback path still work?
- What was tested or manually verified?
- Does it preserve unrelated workspace state?
- Does it introduce or alter `IDE_STATE_PACKET/1` / `IDE_PATCH/1` semantics?

## Code practices

- Prefer plain, readable code over clever abstractions.
- Keep state ownership explicit.
- Avoid global mutation when a small local boundary is practical.
- Validate imported/pasted agent data before applying it.
- Escape or render user-controlled content safely; do not inject it as trusted HTML.
- Keep long-running work bounded and surface failure states.
- Maintain keyboard accessibility and visible focus for interactive controls.
- Avoid intercepting browser/host shortcuts unless the IDE action clearly owns the shortcut.
- Prefer deterministic file ordering and stable identifiers where state packets depend on them.

## Agent and patch safety

Agent output is untrusted proposed input until validated.

- Validate protocol version and required fields.
- Preview meaningful edits before applying them.
- Prefer revision-safe changes.
- Reject malformed or stale patches instead of guessing intent.
- Do not let a patch silently delete or rewrite unrelated files.
- Keep execution separate from edit application unless the user explicitly requests both.

## Dependencies and licensing

Use mature open-source dependencies only when they replace meaningful custom implementation or materially improve compatibility.

When adding or upgrading a dependency:

- record its name and version;
- link/document the upstream project in the relevant source or documentation;
- preserve its license/notice obligations;
- avoid unnecessary overlapping packages.

The repository's own project license should be chosen explicitly by the owner; do not infer or change it as part of an unrelated contribution.

## Current near-term scope

The next core-quality work should favor:

- durable workspace export/import;
- folders and rename/delete operations;
- find-in-file/workspace;
- diagnostics/Problems;
- stronger Python language intelligence where practical in-browser;
- revision-safe agent patches;
- a transport-neutral capability layer that can later back a local MCP adapter.

Use the IDE for real learning/work sessions before expanding beyond these foundations.
