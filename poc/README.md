# POC 0.1 — Certifying Projection

`semantic-poc.html` is the executable research artifact for the first experiment defined in `RESEARCH.md`. `semantic-core.js` contains the experiment logic so the UI remains a thin inspection surface.

It intentionally does not replace the stable Open Chat IDE shell yet. It inherits the runtime, authority, custody, and evidence constraints in [`PARITY.md`](../PARITY.md); this directory is a proving ground, not a second IDE.

## Claim under test

Can a tiny Personal projection and a Python projection reconstruct to the same Kernel 0.1 semantic program, with the Python side interpreted independently through real CPython `ast.parse`?

## Reference program

```text
let total = 0
let values = [1, 3, 4, 5]

each x from values
    gather x into total

require total == 13
expose "Result" total
```

## Standing

- S0 — Personal surface elaborates to IR.
- S1 — IR is admitted by Kernel 0.1.
- S2 — real CPython `ast.parse` accepts the target syntax.
- S3 — a separate Python semantic reader reconstructs equivalent Kernel 0.1 IR.
- S4 — declared observations and failure class agree between the reference interpreter and Python execution.

S2 and S3 are deliberately separate: valid Python syntax is not the same thing as a supported or equivalent semantic projection.

No standing label is hardcoded; the UI renders computed stage results.

## Built-in defeat suite

The executable artifact includes `Run defeat suite`, which computes these cases:

1. Happy path → S4 pass.
2. `total += x` → `total *= x` → S2 passes, S3 fails.
3. Rename the Python update target → S2 passes, S3 fails.
4. Invalid Python syntax → S2 fails.
5. Change the assertion consistently to `999` → S0–S3 pass and S4 reports an agreed `AssertionFailure` rather than kernel rejection.
6. Use an undeclared Personal operation → refused at S1 or earlier; the agent cannot invent a kernel operation.

## Trust boundary

The Personal parser, Python emitter, dialect renderer, and UI are untrusted producers.

The POC trusts the Kernel 0.1 implementation for its stated semantics, CPython's parser supplied by Pyodide for S2, the separate Python-to-Kernel reader for S3, and the comparison logic. This is a translation-validation experiment, not a claim of a fully verified compiler.

Kernel loop bindings are local. Python's leaked final `for` binding is therefore not treated as canonical observable state in POC 0.1; S4 compares declared observations and failure class rather than raw implementation stores.

## IDE parity

POC 0.1 currently shares the stable IDE's Pyodide `v314.0.6` / CPython 3.14 browser runtime baseline.

Deliberate differences are narrow and experimental:

- the POC uses textareas rather than Monaco because editor fidelity is not part of POC 0.1;
- the POC keeps state ephemeral rather than introducing a second durable workspace model;
- the POC supports only Kernel 0.1 semantics even though the main IDE can execute ordinary Python.

If POC code begins mutating the user's real IDE workspace, it must use the existing revision-aware workspace/patch authority model rather than creating a separate one.

Semantic Split should not be promoted into `index.html` until POC 0.1 closes with actual browser execution evidence.

## Current evidence

The source has been statically reviewed against the research contract and the stage boundaries are represented separately in code. This environment cannot execute the browser-hosted Pyodide module, so the browser defeat suite has **not** been claimed as run here.

POC 0.1 should be considered an **implementation candidate** until the artifact is opened in the supported browser/ChatGPT surface and the built-in defeat suite reports all cases passing from actual execution.
