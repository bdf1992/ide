# Syntax Provider Lab — POC

This lab proves the first concrete provider behind the transport-neutral capability boundary without changing the stable IDE.

```text
CAPABILITY_REQUEST/1
        |
        v
 syntax.tree / syntax.query
        |
        v
 Tree-sitter provider
        |
        v
 @vscode/tree-sitter-wasm
        |
        v
 CAPABILITY_RESULT/1
```

## Why this slice

Syntax observation is deliberately low authority:

- it reads supplied source but does not mutate workspace state;
- it does not execute user code;
- it does not admit semantic meaning;
- provider failure can be represented without affecting editing;
- the same capability can later be fulfilled by another compatible provider.

The public surface is `syntax.*`, not Tree-sitter-specific API. Tree-sitter is an implementation choice behind the provider boundary.

## Upstream substrate

The POC pins `@vscode/tree-sitter-wasm@0.3.1` and loads these assets from jsDelivr:

- `wasm/tree-sitter.js`
- `wasm/tree-sitter.wasm`
- `wasm/tree-sitter-python.wasm`

The package contains the Tree-sitter browser runtime and grammar WASM files used by VS Code. Version `0.3.1` is built around Tree-sitter `0.25.10`, so the runtime and Python grammar travel as one compatibility set rather than mixing independently versioned binaries.

No third-party source is copied into this repository.

## Operations

### `syntax.tree`

Input:

```json
{
  "language": "python",
  "source": "x = 1\n"
}
```

Returns a bounded structural summary with source-addressable ranges and `has_error` parse evidence.

### `syntax.query`

Input:

```json
{
  "language": "python",
  "source": "def add(a, b): return a + b\n",
  "query": "(function_definition name: (identifier) @name) @definition.function"
}
```

Returns bounded captures with capture name, node type, text, and source range.

## Run

Serve the repository root over HTTP; WASM and fixture fetches should not be tested from `file://`.

```text
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/poc/provider-syntax/
```

Use **Run acceptance** to exercise the provider against the durable fixtures under `examples/core-acceptance/`.

## Built-in acceptance

The browser harness checks:

1. calculator fixture loads and parses with no syntax error;
2. calculator function definitions are query-addressable;
3. Kanban fixture loads and parses with no syntax error;
4. `Task` and `Board` class definitions are query-addressable;
5. malformed Python produces `has_error: true` instead of model inference;
6. unsupported languages produce an explicit `unsupported` result;
7. a missing grammar asset produces a bounded `provider_unavailable` failure.

These checks speak `CAPABILITY_REQUEST/1` and `CAPABILITY_RESULT/1` directly.

## Bounds

The POC deliberately limits:

- Python only;
- `syntax.tree` and `syntax.query` only;
- 200,000 input characters;
- 200 query captures;
- tree summary depth and children per node.

No mutation operation is available.

## Standing

This is **POC**, not stable product capability.

Static source checks can verify JavaScript/HTML shape, but browser execution is the evidence required to claim the provider actually loads and passes its acceptance suite. Until that evidence exists, `src/provider/` remains a STUB boundary and stable `index.html` must not depend on this lab.

## Promotion trigger

Promotion into the stable IDE requires:

1. built-in browser acceptance passes in the supported surface;
2. exact dependency/version provenance remains documented in `THIRD_PARTY.md`;
3. capability semantics remain provider-neutral;
4. provider-unavailable behavior leaves workspace editing/custody intact;
5. the integration reuses current workspace source rather than creating a shadow workspace;
6. `STATUS.md` is updated only to the standing actually earned.
