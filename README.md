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

## Host portability invariant

Open Chat IDE is one product with multiple host profiles, not separate Chat and Work forks.

**Chat is the minimum supported product profile.** The browser/side-panel core must remain useful without assuming Cloud Browser, localhost, native processes, MCP, or Work-only providers. Work may add stronger providers and transports behind the same capability contracts, custody rules, and evidence semantics.

See [`architecture/HOST-PROFILES.md`](./architecture/HOST-PROFILES.md) and [`PARITY.md`](./PARITY.md).

## Architecture map

The repository now separates **architecture shape** from **implementation standing**:

- [`architecture/TYPOLOGY.md`](./architecture/TYPOLOGY.md) — what kinds of things exist and what authority each kind has.
- [`architecture/TOPOLOGY.md`](./architecture/TOPOLOGY.md) — which boundaries may connect and in what direction.
- [`architecture/PROVIDERS.md`](./architecture/PROVIDERS.md) — how capabilities bind to concrete IDE/runtime machinery.
- [`architecture/HOST-PROFILES.md`](./architecture/HOST-PROFILES.md) — how Chat, Work, and future local hosts vary without forking the product.
- [`architecture/AI-NATIVE.md`](./architecture/AI-NATIVE.md) — the repository-specific meaning of AI-native design.
- [`contracts/README.md`](./contracts/README.md) — versioned draft envelopes allowed to cross those boundaries; contracts carry shape, not ambient authority.
- [`src/README.md`](./src/README.md) — future implementation-boundary stubs; their presence is not an implementation claim.
- [`STATUS.md`](./STATUS.md) — explicit IMPLEMENTED / POC / STUB / SPEC / FUTURE ledger.
- [`PARITY.md`](./PARITY.md) — one-product parity contract across the stable IDE, research artifacts, and host profiles.

The architectural skeleton is intentionally ahead of extracted modules. Working behavior remains where it is until promotion/extraction is justified by evidence.

## Agentic language initiative

This repository also hosts a research initiative in **projectional, verifiable, agent-assisted programming**.

The central idea is not to make syntax authoritative. A personal dialect, Python, mathematical notation, or another admitted surface can project the same canonical semantic program. LLMs may help elaborate unfamiliar expressions and propose mappings, but they do not decide semantic correctness or execution standing.

Read these files before changing that architecture:

- [`AGENTIC-LANGUAGE.md`](./AGENTIC-LANGUAGE.md) — product/research concept and authority boundaries.
- [`SEMANTIC-KERNEL.md`](./SEMANTIC-KERNEL.md) — trusted microkernel 0.1 and semantic standing model.
- [`RESEARCH.md`](./RESEARCH.md) — POC 0.1–0.4 experimental protocol and success criteria.
- [`poc/README.md`](./poc/README.md) — executable POC 0.1 scope, defeat suite, and evidence status.
- [`poc/neural-elaboration/README.md`](./poc/neural-elaboration/README.md) — isolated POC 0.2 custom-model corpus and evaluator candidate.

Project constitution:

> **Syntax is personal, fluid, and expendable.**  
> **Meaning is canonical, explicit, and versioned.**  
> **Translation is untrusted until independently reconstructed.**  
> **Execution standing is earned from evidence, never inferred from confidence.**

Experimental maturity and semantic expressive power are separate axes. Proving POC 0.1–0.4 does not require prematurely expanding the semantic kernel.

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

Shared capability changes must additionally state Chat behavior, Work behavior, and provider-unavailable behavior. Work-specific machinery may strengthen the IDE but must remain optional to the Chat baseline unless the product requirement is explicitly changed.

Semantic-language contributions must additionally classify themselves as a projection extension, normalization extension, or kernel extension. Kernel changes carry the highest burden of evidence.

Open-source substrate and licensing boundaries are recorded in [`THIRD_PARTY.md`](./THIRD_PARTY.md).

## Status

Current IDE baseline: **side-panel prototype with revision-aware chat patching**.

Current language/research baseline: **Semantic Microkernel 0.1 architecture is frozen; an executable POC 0.1 implementation candidate exists under `poc/`, with real CPython `ast.parse` S2 checking, independent S3 reconstruction, S4 observation comparison, and a built-in defeat suite**.

Current host baseline: **Chat is IMPLEMENTED as the portable browser/side-panel profile; Work is a SPEC for optional stronger adapters/providers, not a second product implementation**.

The larger concern boundaries under `src/` are intentionally **STUBS**, and the boundary envelopes under `contracts/` are intentionally **SPECS**. Neither directory is a claim that a shared modular runtime, bus, or validator already exists. See [`STATUS.md`](./STATUS.md) for the authoritative implementation-state vocabulary.

POC 0.1 is not declared experimentally complete until that browser/Pyodide suite is actually executed in the supported surface and all required defeat cases pass. Do not expand the kernel merely to make the POC more impressive before that closure.
