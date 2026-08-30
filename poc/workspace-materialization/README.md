# Workspace Materialization Lab — POC

This experiment addresses issue #18 by turning one authoritative workspace snapshot/revision into one bounded **derived filesystem view** for runtime/tool providers.

```text
CAPABILITY_REQUEST/1 workspace.materialize
        |
        v
canonical snapshot + revision
        |
        v
materialization plan
        |
        v
provider-owned derived root
        |
        +--> Pyodide runtime
        +--> future Git/tests/LSP consumers
```

The filesystem view is not a second workspace and carries no write-back authority.

## Pieces

- `materialize.js` — provider-neutral planning/custody logic. No browser or Pyodide dependency.
- `test.js` — Node acceptance harness using an in-memory fake filesystem.
- `pyodide-adapter.js` — thin adapter from the generic filesystem operations to the existing Pyodide 314.0.6 MEMFS/runtime.
- `index.html` + `lab.js` — browser acceptance harness over the durable examples in `examples/core-acceptance/`.

## Materialization rules

A plan is deterministic for the same revision and file content. Workspace paths are normalized to `/`; absolute paths and parent traversal are refused; normalization collisions fail rather than silently overwriting; only text files are accepted by this POC.

The derived root is version/content addressed under `/workspace/views/`. The current POC uses a small deterministic FNV-1a identifier for repeatable view naming. It is a **manifest identifier, not a cryptographic security digest**.

Before writing a view, the filesystem adapter resets that provider-owned root. This means runtime-created files disappear when the same canonical revision is rematerialized. A new revision/content set receives a different root, so stale provider files are never part of the new descriptor.

## Run deterministic core acceptance

```text
node poc/workspace-materialization/test.js
```

Expected final line:

```text
workspace-materialization: PASS
```

This verifies path safety, deterministic plans, stale-revision refusal, derived-write cleanup, new-revision separation, and normalized-path collision handling without requiring a browser.

## Run browser/Pyodide acceptance

Serve the repository root:

```text
python -m http.server 8000
```

Open:

```text
http://localhost:8000/poc/workspace-materialization/
```

Press **Run acceptance**.

The browser harness uses the same Pyodide `v314.0.6` CDN/runtime baseline as the stable IDE. Pyodide exposes its Emscripten filesystem through `pyodide.FS`; this lab uses that existing machinery rather than adding BrowserFS, LightningFS, IndexedDB, or another workspace implementation.

## Browser acceptance target

The built-in suite requires:

1. Pyodide loads;
2. the four durable fixture files materialize from one snapshot;
3. calculator prints `calculator: PASS`;
4. Kanban prints `kanban: PASS`;
5. `multifile/main.py` imports its sibling `math_core.py` and prints `multifile: PASS` through the generic runner;
6. a runtime-created file disappears after rematerialization and never appears in the canonical snapshot;
7. path traversal is refused before a filesystem write;
8. a stale workspace revision is refused.

The generic Python runner executes the selected path from its own parent directory and adds that directory to `sys.path`, so sibling imports work without fixture-specific import rules.

## Standing

This is **POC**. The deterministic core test can pass outside the browser, but stable IDE integration is not earned until the Pyodide browser acceptance also passes in the supported surface.

`index.html` remains unchanged. Promotion should extract only the smallest proven materialization helper and then change the stable runner to consume the materialized revision. The stable workspace remains authoritative; runtime filesystem state remains derived.

## Next dependency

Once browser acceptance closes, the same materialization descriptor becomes the candidate shared input for `python.run`, `tests.run`, and local Git/LSP providers. Whether isomorphic-git can consume this filesystem directly or needs a tiny filesystem adapter should be decided only after this seam is proven.
