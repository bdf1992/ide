# Open Chat IDE

A deliberately small, in-chat IDE that opens in ChatGPT's side panel and uses proven open-source browser components instead of inventing a new editor stack.

Canonical repository: `https://github.com/bdf1992/ide`

## Product invariant

The IDE experience lives in ChatGPT's side panel. The ChatGPT conversation is the reasoning/agent plane.

The core stays intentionally boring:

- Monaco Editor — VS Code's editor core
- xterm.js — terminal UI
- Pyodide / CPython — in-browser Python runtime
- ChatGPT conversation — agent/reasoning plane
- `IDE_STATE_PACKET/1` / `IDE_PATCH/1` — minimal shared-state seam

Do not replace ordinary IDE primitives with custom teaching dashboards when files, tabs, hover docs, completion, terminal, diagnostics, tests, diffs, or commands can express the need.

## Current capabilities

- Explorer file selection
- Multi-file tabs with close/open behavior
- New-file creation
- `Ctrl+P` quick-open
- `Ctrl+S` save
- `Ctrl+Enter` run
- Cursor line/column status
- Monaco language modes for common text/code files
- Python hover documentation for keywords and common built-ins
- Python built-in completion names
- xterm.js terminal surface
- Pyodide-backed Python execution
- Small shell: `help`, `ls`, `cat FILE`, `clear`, `python FILE`
- Browser workspace persistence through local storage
- Shared IDE state packet to ChatGPT
- Preview/apply patch seam from ChatGPT

## Persistence

Browser local storage is convenience state, not the durable system of record. The GitHub repository is the durable product source. Workspace export/import and stronger revision-safe persistence are planned before the browser workspace should be treated as durable project storage.

## Agent behavior

Read [`IDE-SKILL.md`](./IDE-SKILL.md) for the LLM operating contract and [`AGENTS.md`](./AGENTS.md) for repository contribution rules.

For future work sessions, start from this repository rather than reconstructing the IDE from chat history.

## Contributing

Read [`CONTRIBUTING.md`](./CONTRIBUTING.md). Changes should preserve the minimal-core principle and demonstrate why a new capability belongs in the IDE core rather than in agent behavior or an existing IDE primitive.

## Status

Current baseline: **v0.2 prototype**.

The next conservative core pass is expected to focus on durable workspace import/export, file/folder operations, search, diagnostics, and revision-safe agent patches before adding richer teaching behavior.
