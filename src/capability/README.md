# Capability Boundary — STUB

Owns transport-neutral names and contracts for things the IDE/agent can request.

## Candidate capability families

```text
workspace.*
file.*
editor.*
language.*
syntax.*
vcs.*
terminal.*
python.*
runtime.*
tests.*
debug.*
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

Candidate IDE-machine operations include:

- `vcs.status`
- `vcs.diff`
- `language.hover`
- `language.references`
- `syntax.query`
- `terminal.exec`
- `tests.run`
- `debug.stack`
- future generalized `runtime.execute`

Prefer `vcs.*` for provider-neutral version-control semantics. Use `git.*` only where the requested operation is intentionally Git-specific.

## Owns

- operation names;
- request/response shapes;
- capability-level preconditions/errors;
- transport-neutral semantics of an operation;
- the invariant boundary providers must satisfy.

## Does not own

- authorization by mere existence;
- UI rendering;
- protocol transport;
- concrete provider implementation details;
- semantic-kernel meaning;
- runtime implementation details.

## AI-native rule

A capability is an addressable action boundary, not ambient autonomy.

```text
agent / UI / host proposes capability call
        -> authority/custody checks
        -> provider resolution
        -> implementation executes
        -> evidence returned
```

Provider resolution happens after the operation is known and applicable gates accept it. A provider fallback must not silently change operation meaning, scope, or authority.

## Current implementation

Names exist in `IDE-SKILL.md`; the stable IDE still exposes its small behavior directly rather than through a shared capability dispatcher or provider registry.

## Promotion trigger

Extract shared contracts when at least two surfaces/adapters need the same operation, when two providers can fulfill the same operation, or when semantic mode is promoted into the stable IDE.
