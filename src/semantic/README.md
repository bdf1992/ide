# Semantic Boundary — STUB

Owns the future promoted implementation of versioned canonical program meaning.

## Owns

- semantic IR types;
- kernel version;
- well-formedness/type rules;
- operational and failure semantics;
- admitted normalization/equivalence rules that truly belong to the kernel boundary.

## Does not own

- personal vocabulary;
- LLM interpretation;
- UI/editor concerns;
- target runtime behavior;
- workspace revisions;
- transport bindings.

## Current implementation

`SEMANTIC-KERNEL.md` is the specification. `poc/semantic-core.js` is the current POC 0.1 implementation candidate.

This directory intentionally contains no promoted kernel code yet.

## Promotion trigger

Promote only after POC 0.1 closes with actual browser evidence and the extraction can preserve the declared Kernel 0.1 behavior without importing POC UI/agent concerns.
