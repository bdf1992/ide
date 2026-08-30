# Topology

Topology answers: **what may connect to what, across which boundary, and in which direction?**

The system is intentionally asymmetric. Human/agent convenience sits outside smaller custody, capability, provider, runtime, semantic, and evidence boundaries.

## Planes

```text
1. REASONING PLANE
   Human <-> ChatGPT conversation

2. INTERACTION PLANE
   Open Chat IDE shell
   editor / explorer / terminal / diagnostics / commands

3. CAPABILITY PLANE
   explicit operation contracts, gates, and transport adapters

4. PROVIDER PLANE
   concrete implementation bindings selected after capability acceptance

5. EXECUTION PLANES
   a) ordinary Python -> Pyodide/CPython
   b) semantic program -> Kernel -> projection -> target runtime

6. EVIDENCE PLANE
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
    provider/capability implementation -> caller/evidence

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

### Human/agent/host -> capability -> provider

```text
intent
   -> host adapter when needed
   -> CAPABILITY_REQUEST/1
   -> capability/authority/custody gate
   -> provider resolution
   -> concrete substrate
   -> CAPABILITY_RESULT/1
```

A well-formed capability request may still be refused, unsupported, unavailable, or fail. A provider being installed or reachable does not make the request authorized.

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
provider availability ---------X--> widened authority
provider fallback -------------X--> changed capability meaning
valid contract ----------------X--> automatic authorization
receipt wording ---------------X--> stronger standing
```

## One-way dependency constraints

- `agent` may depend on capability contracts; kernel must not depend on an LLM.
- `projection` may depend on semantic types; semantic types must not depend on a particular projection.
- `evidence` may observe runtime/kernel results; those results must not depend on decorative evidence UI.
- `adapter` may bind host/transport details; capability contracts should remain host/transport-neutral.
- `provider` may bind implementation/runtime details; capability contracts should remain independent of a particular provider.
- provider resolution occurs after applicable capability/authority/custody checks and must not become a hidden permission system.
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
                 adapter / direct host call
                           |
                    capability boundary
                           |
                      gates / policy
                           |
                    provider binding
                           |
       +-----------+-------+-------+-----------+
       |           |               |           |
       v           v               v           v
     LSP         syntax           VCS        runtime
   provider      provider       provider      provider
       |           |               |           |
 language srv  Tree-sitter    Git substrate  Pyodide/CPython
       |           |               |           |
       +-----------+-------+-------+-----------+
                           v
                      evidence plane
                receipts / tests / traces
```
