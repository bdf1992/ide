# Projection Boundary — STUB

Owns surfaces that render or reconstruct admitted semantics.

## Owns

- Personal/alternate dialect rendering;
- Python emission;
- target AST-to-IR reconstruction;
- correspondence/source maps;
- projection-local normalization helpers where explicitly justified.

## Does not own

- semantic admission;
- kernel expansion;
- LLM authority;
- runtime execution;
- workspace mutation.

## Current implementation

POC 0.1 contains a Personal parser, Python emitter, alien renderer, and independent Python semantic reader in `poc/semantic-core.js`.

Those are experimental producers/checkers, not yet a shared product projection module.

## Promotion trigger

Extract only after POC 0.1 closes and the stable IDE needs semantic projections. Preserve the distinction between untrusted producer code and independent reconstruction evidence.
