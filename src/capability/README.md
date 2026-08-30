# Capability Boundary — STUB

Owns transport-neutral names and contracts for things the IDE/agent can request.

## Candidate capability families

```text
workspace.*
file.*
editor.*
python.*
tests.*
semantic.*
projection.*
receipt.*
dialect.*
```

Examples already named in `IDE-SKILL.md` include:

- `workspace.snapshot`
- `file.read`
- `file.patch`
- `python.run`
- `semantic.propose`
- `semantic.admit`
- `semantic.verify`
- `projection.render`
- `projection.reconstruct`
- `receipt.inspect`

## Owns

- operation names;
- request/response shapes;
- capability-level preconditions/errors;
- transport-neutral semantics of an operation.

## Does not own

- authorization by mere existence;
- UI rendering;
- protocol transport;
- semantic-kernel meaning;
- runtime implementation details.

## AI-native rule

A capability is an addressable action boundary, not ambient autonomy.

```text
agent proposes capability call
        -> authority/custody checks
        -> implementation executes
        -> evidence returned
```

## Current implementation

Names exist in `IDE-SKILL.md`; the stable IDE still exposes its small behavior directly rather than through a shared capability dispatcher.

## Promotion trigger

Extract shared contracts when at least two surfaces/adapters need the same operation or when semantic mode is promoted into the stable IDE.
