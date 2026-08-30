# Runtime Boundary — STUB

Owns the future shared browser execution service.

## Owns

- loading/pinning Pyodide;
- CPython execution requests;
- stdout/stderr capture;
- runtime availability/failure state;
- target syntax/runtime helpers that are genuinely runtime concerns.

## Does not own

- workspace custody;
- semantic admission;
- translation equivalence;
- agent authority;
- evidence labels beyond raw runtime results.

## Current implementation

Pyodide `v314.0.6` is currently loaded independently by `index.html` and the POC semantic engine under the parity contract.

## Promotion trigger

Extract this module when stable IDE and promoted semantic capability need a shared loader/execution API, while keeping `PARITY.md` runtime guarantees intact.
