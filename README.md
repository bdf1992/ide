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

## Agentic language initiative

This repository also hosts a research initiative in **projectional, verifiable, agent-assisted programming**.

The central idea is not to make syntax authoritative. A personal dialect, Python, mathematical notation, or another admitted surface can project the same canonical semantic program. LLMs may help elaborate unfamiliar expressions and propose mappings, but they do not decide semantic correctness or execution standing.

Read these files before changing that architecture:

- [`AGENTIC-LANGUAGE.md`](./AGENTIC-LANGUAGE.md) — product/research concept and authority boundaries.
- [`SEMANTIC-KERNEL.md`](./SEMANTIC-KERNEL.md) — trusted microkernel 0.1 and semantic standing model.
- [`RESEARCH.md`](./RESEARCH.md) — POC 0.1–0.4 experimental protocol and success criteria.
- [`PARITY.md`](./PARITY.md) — contract keeping the research artifacts aligned with the stable IDE/runtime/authority model.
- [`poc/README.md`](./poc/README.md) — executable POC 0.1 scope, defeat suite, and evidence status.

Project constitution:

> **Syntax is personal, fluid, and expendable.**  
> **Meaning is canonical, explicit, and versioned.**  
> **Translation is untrusted until independently reconstructed.**  
> **Execution standing is earned from evidence, never inferred from confidence.**

Experimental maturity and semantic expressive power are separate axes. Proving POC 0.1–0.4 does not require prematurely expanding the semantic kernel.

The POC is a proving ground, not a parallel IDE. Runtime, authority, custody, and evidence rules must remain in parity with the stable shell; temporary UI differences are allowed only when they isolate an experiment. See `PARITY.md`.

## Current capabilities

- Explorer file selection
- Multi-file tabs with close/open behavior
- New-file creation
- `Ctrl+P` quick-open
- `Ctrl+S` save
- `Ctrl+Enter` run
- Cursor line/column status
- Monaco language modes for common text/code files
- Python hover documentation for core syntax
- Python built-in completion names
- xterm.js terminal surface
- Pyodide-backed Python execution
- Small shell: `help`, `ls`, `cat FILE`, `clear`, `python FILE`
- Browser workspace persistence through local storage
- Shared IDE state packet to ChatGPT
- Preview/apply patch seam from ChatGPT
- Revision-aware patch refusal when a patch declares a stale `base_revision`

## Persistence

Browser local storage is convenience state, not the durable system of record. The GitHub repository is the durable product source. Workspace export/import and stronger portable persistence should land before the browser workspace is treated as durable project storage.

## Agent behavior

Read [`IDE-SKILL.md`](./IDE-SKILL.md) for the LLM operating contract and [`AGENTS.md`](./AGENTS.md) for repository contribution rules.

For future work sessions, start from this repository rather than reconstructing the IDE from chat history.

## Contributing

Read [`CONTRIBUTING.md`](./CONTRIBUTING.md). Changes should preserve the minimal-core principle and demonstrate why a new capability belongs in the IDE core rather than in agent behavior or an existing IDE primitive.

Semantic-language contributions must additionally classify themselves as a projection extension, normalization extension, or kernel extension. Kernel changes carry the highest burden of evidence. Changes touching `index.html`, `poc/`, runtime loading, protocols, or standing must also pass the parity/drift checks in `PARITY.md`.

Open-source substrate and licensing boundaries are recorded in [`THIRD_PARTY.md`](./THIRD_PARTY.md).

## Status

Current IDE baseline: **side-panel prototype with revision-aware chat patching**.

Current language/research baseline: **Semantic Microkernel 0.1 architecture is frozen; an executable POC 0.1 implementation candidate exists under `poc/`, with real CPython `ast.parse` S2 checking, independent S3 reconstruction, S4 observation comparison, and a built-in defeat suite**.

IDE/research parity baseline: **both the stable shell and POC 0.1 currently pin Pyodide `v314.0.6` and share the same evidence, agent-authority, and browser-runtime constraints**.

POC 0.1 is not declared experimentally complete until that browser/Pyodide suite is actually executed in the supported surface and all required defeat cases pass. Do not expand the kernel merely to make the POC more impressive before that closure.
