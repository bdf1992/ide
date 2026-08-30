# Evidence Boundary — STUB

Owns inspectable records of what actually happened and what standing a claim earned.

## Owns

- diagnostics;
- test results;
- runtime observations/failures;
- semantic standing results;
- reconstructed IR comparison results;
- receipts and provenance needed to explain a result.

## Does not own

- semantic admission;
- workspace mutation;
- agent confidence;
- projection generation;
- runtime execution itself.

## Evidence rule

Evidence reports a computed fact at a declared boundary.

```text
claim
  -> check/run/reconstruct
  -> result
  -> receipt/diagnostic
```

A receipt must not claim more than its inputs support.

## Current implementation

The stable IDE exposes terminal/runtime evidence directly. POC 0.1 computes S0-S4 standing and defeat-suite results inside `poc/semantic-core.js`.

A shared evidence/receipt schema has not yet been promoted.

## Promotion trigger

Extract this layer when stable semantic mode needs reusable standing/receipt rendering or when multiple experiments need a common machine-readable evidence envelope.
