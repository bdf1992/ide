# Topology

Topology answers: **what may connect to what, across which boundary, and in which direction?**

The system is intentionally asymmetric. Human/agent convenience sits outside smaller custody, runtime, semantic, and evidence boundaries.

## Planes

```text
1. REASONING PLANE
   Human <-> ChatGPT conversation

2. INTERACTION PLANE
   Open Chat IDE shell
   editor / explorer / terminal / diagnostics / commands

3. CAPABILITY PLANE
   explicit operations and adapters

4. EXECUTION PLANES
   a) ordinary Python -> Pyodide/CPython
   b) semantic program -> Kernel -> projection -> target runtime

5. EVIDENCE PLANE
   output / diagnostics / receipts / standing / tests
```

## Boundary contracts

`contracts/` names the envelopes allowed to cross these planes. The schemas are SPEC/STUB artifacts, not evidence that a shared transport exists.

```text
IDE_STATE_PACKET/1
    workspace -> reasoning/capability

IDE_PATCH/1
    reasoning/tool -> workspace revision gate

CAPABILITY_REQUEST/1
    human/agent/UI -> capability gate

CAPABILITY_RESULT/1
    capability implementation -> caller/evidence

SEMANTIC_CANDIDATE/1
    parser/human/agent -> admission boundary

SEMANTIC_PROGRAM/1
    admission/kernel path -> projection/runtime/verifier

EXECUTION_RESULT/1
    runtime -> evidence

EVIDENCE_RECEIPT/1
    evidence -> human/agent/UI
```

Contracts constrain what crosses an edge. They do not grant permission to cross it.

## Primary crossings

### Chat -> IDE

```text
agent proposal
   -> IDE_PATCH/1
   -> revision check
   -> preview
   -> user/apply boundary
   -> workspace mutation
```

The conversation never receives implicit write authority over the browser workspace.

### IDE -> Chat

```text
workspace state
   -> IDE_STATE_PACKET/1
   -> explicit snapshot/revision
   -> reasoning context
```

ChatGPT should not claim live editor state beyond supplied evidence.

### Human/agent -> capability

```text
intent
   -> CAPABILITY_REQUEST/1
   -> capability/authority gate
   -> bounded implementation
   -> CAPABILITY_RESULT/1
```

A well-formed capability request may still be refused, unsupported, or fail.

### Personal expression -> semantics

```text
surface expression
   -> deterministic parser/codebook
       OR unresolved expression -> agent candidate
   -> SEMANTIC_CANDIDATE/1
   -> admission/kernel validation
   -> SEMANTIC_PROGRAM/1
```

The LLM may participate before admission, never in place of admission. Candidate and admitted program are distinct object types.

### Semantic program -> target projection

```text
SEMANTIC_PROGRAM/1
   -> untrusted emitter
   -> target source
   -> real target parser
   -> independent semantic reconstruction
   -> equivalence gate
   -> execution standing
```

### Runtime -> evidence

```text
execution
   -> EXECUTION_RESULT/1
   -> comparison/tests
   -> EVIDENCE_RECEIPT/1
   -> human + agent inspection
```

Evidence flows outward. It must not silently mutate inward semantic rules.

## Forbidden shortcuts

Do not create these edges:

```text
LLM confidence ----------------X--> semantic admission
projection text ---------------X--> kernel definition
POC success claim -------------X--> product capability
runtime output ----------------X--> proof of equivalence
stale agent patch -------------X--> workspace overwrite
adapter convenience -----------X--> widened authority
valid contract ----------------X--> automatic authorization
receipt wording ---------------X--> stronger standing
```

## One-way dependency constraints

- `agent` may depend on capability contracts; kernel must not depend on an LLM.
- `projection` may depend on semantic types; semantic types must not depend on a particular projection.
- `evidence` may observe runtime/kernel results; those results must not depend on decorative evidence UI.
- `adapter` may bind transport/runtime details; domain contracts should remain transport-neutral.
- contract schemas may describe crossings; they must not become a hidden service locator or authority system.
- `poc/` may prove a candidate capability; stable `index.html` should not depend on an unclosed experiment.

## Intended long-term topology

```text
                        Human
                          |
                    ChatGPT Agent
                          |
                  proposal / explain
                          v
+--------------------------------------------------+
|                  Open Chat IDE                   |
| workspace custody | editor | terminal | problems|
+--------------------------+-----------------------+
                           |
                    capability boundary
                           |
          +----------------+----------------+
          |                                 |
          v                                 v
  ordinary Python lane               semantic lane
  Pyodide / CPython              canonical Kernel IR
          |                         /             \
          |                   projections      verifier
          |                         |             |
          +-------------+-----------+-------------+
                        v
                   evidence plane
                receipts / tests / traces
```
