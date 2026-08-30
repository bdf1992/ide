# Source Boundary Skeleton

`src/` names the intended implementation boundaries for the larger system. These directories are **stubs unless `STATUS.md` says otherwise**.

Working code is not moved here merely to make the tree look complete. Extraction happens only when a boundary has earned enough stability to justify a shared module.

## Intended concerns

```text
src/
├── workspace/    user-owned files, revisions, snapshots, patch custody
├── runtime/      Pyodide/CPython loading and execution services
├── semantic/     trusted semantic-kernel implementation after promotion
├── projection/   render/reconstruct/normalize surfaces around semantics
├── agent/        proposal/elaboration helpers outside trusted semantics
├── capability/   transport-neutral operation contracts
├── adapter/      chat/local/MCP/browser bindings for capabilities
└── evidence/     diagnostics, receipts, standing, test/trace artifacts
```

## Dependency intent

```text
agent -----------+
projection ------+--> capability contracts
adapter ---------+          |
UI/product ------+          v
                         workspace/runtime
                              |
                         semantic kernel
                              |
                           evidence
```

This diagram is conceptual, not a mandate that every module directly imports every layer shown.

## Rules

- The semantic kernel must not depend on an LLM, UI, or transport adapter.
- Workspace custody must remain valid even when agent features are unavailable.
- Runtime APIs should expose execution results without deciding semantic standing.
- Projection producers are untrusted relative to semantic admission/equivalence.
- Evidence reports facts/results; it does not mutate semantic rules.
- Capability contracts should remain useful across ChatGPT-side-panel and future local/MCP-shaped bindings.
- Avoid duplicating code from `index.html` or `poc/` just to populate these stubs.

## Promotion

When a concern is extracted from `index.html` or `poc/`:

1. identify the existing behavior and evidence;
2. preserve parity with the stable surface;
3. extract the smallest reusable contract/module;
4. update `STATUS.md` from STUB to the earned state;
5. retain or deliberately retire the prior fixture.
