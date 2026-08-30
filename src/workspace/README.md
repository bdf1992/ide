# Workspace Boundary — STUB

Owns the future shared contract for user workspace custody.

## Owns

- files and paths;
- active/open workspace references;
- workspace revision;
- snapshots/state packets;
- preview/apply patch boundary;
- stale-write refusal;
- future import/export durability adapters.

## Does not own

- Python execution semantics;
- semantic-kernel meaning;
- LLM reasoning;
- proof/standing claims;
- UI layout.

## Current implementation

The current working implementation remains embedded in `index.html` and browser `localStorage`.

`IDE_STATE_PACKET/1` and revision-aware `IDE_PATCH/1` are the existing external seam.

## Promotion trigger

Extract a shared workspace module only when doing so reduces duplication or is needed by a promoted semantic mode/durable workspace capability without weakening current custody behavior.
