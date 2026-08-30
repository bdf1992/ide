# POC 0.1 — Certifying Projection

`semantic-poc.html` is the executable research artifact for the first experiment defined in `RESEARCH.md`.

It intentionally does not replace the stable Open Chat IDE shell yet.

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
- S2 — real CPython accepts the target syntax.
- S3 — an independent Python semantic reader reconstructs equivalent Kernel 0.1 IR.
- S4 — declared observations and failure class agree between the reference interpreter and Python execution.

No standing label is intended to be hardcoded; it must be earned by execution.

## Required defeat cases

1. `total += x` → `total *= x`: S2 passes, S3 fails.
2. Rename the Python update target: S2 passes, S3 fails.
3. Invalid Python syntax: S2 fails.
4. Change the assertion consistently to a false invariant: S0–S3 pass, S4 records `AssertionFailure` equivalently rather than calling the program invalid.
5. Use an undeclared Personal semantic operation: S1 or earlier refuses admission; the agent cannot invent a kernel operation.

## Trust boundary

The Personal parser, Python emitter, dialect renderer, and UI are untrusted producers.

The POC trusts the Kernel 0.1 specification/implementation, CPython parser supplied by Pyodide for target syntax, the independent Python-to-Kernel reader for its stated subset, and the comparison logic. This is a translation-validation experiment, not a claim of a fully verified compiler.
