# Crossing Contracts

This directory names the envelopes allowed to cross architectural boundaries.

These files are **SPEC/STUB artifacts**. They describe shape and ownership; they do not imply that a shared event bus, RPC layer, validator, or adapter runtime exists.

## Why contracts exist

The architecture separates concerns by type and topology. Contracts make the permitted edges explicit:

```text
workspace ── state packet ──> agent / capability
agent ── capability request ──> capability gate
capability ── result ──> caller
agent / parser ── semantic candidate ──> admission boundary
admission ── semantic program ──> projection / runtime / verifier
runtime ── execution result ──> evidence
evidence ── receipt ──> human / agent / UI
agent ── IDE patch proposal ──> workspace revision gate
```

## Contract inventory

| Contract | Producer | Consumer | Authority |
|---|---|---|---|
| `ide-state-packet.schema.json` | workspace | agent/capability | evidence only |
| `ide-patch.schema.json` | agent/tool | workspace | proposed mutation only |
| `capability-request.schema.json` | human/agent/UI | capability layer | request only |
| `capability-result.schema.json` | capability implementation | caller/evidence | reports bounded result |
| `semantic-candidate.schema.json` | parser/LLM/human | admission boundary | proposal only |
| `semantic-program.schema.json` | admission/kernel path | projection/runtime | admitted meaning |
| `execution-result.schema.json` | runtime | evidence/UI | observed execution result |
| `evidence-receipt.schema.json` | evidence layer | human/agent/UI | computed claim record |

## Authority rule

A contract carries data, not ambient authority.

- A `capability-request` does not grant permission to execute.
- An `IDE_PATCH/1` does not grant permission to overwrite stale workspace state.
- A `semantic-candidate` is never admitted semantics.
- An `execution-result` does not by itself prove semantic equivalence.
- An `evidence-receipt` records checks already performed; it cannot strengthen those checks by wording.

## Versioning

Contracts are versioned independently from the semantic kernel. Breaking a contract shape requires a contract version change. Expanding semantic meaning requires a kernel version change. These are different events.

## Promotion

A schema may move from STUB/SPEC toward IMPLEMENTED only when a real producer and consumer both validate the same shape in the supported IDE path. Until then, these files are architecture fixtures and review targets.