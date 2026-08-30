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

### Personal expression -> semantics

```text
surface expression
   -> deterministic parser/codebook
       OR unresolved expression -> agent candidate
   -> candidate IR
   -> admission/kernel validation
   -> admitted semantic program
```

The LLM may participate before admission, never in place of admission.

### Semantic program -> target projection

```text
admitted IR
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
   -> observations/failure
   -> comparison/tests
   -> receipt/diagnostic
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
```

## One-way dependency constraints

- `agent` may depend on capability contracts; kernel must not depend on an LLM.
- `projection` may depend on semantic types; semantic types must not depend on a particular projection.
- `evidence` may observe runtime/kernel results; those results must not depend on decorative evidence UI.
- `adapter` may bind transport/runtime details; domain contracts should remain transport-neutral.
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
