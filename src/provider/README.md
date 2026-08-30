# Provider Boundary — STUB

Owns implementation bindings that fulfill transport-neutral capabilities against concrete IDE/runtime substrates.

A provider is not a transport adapter. An adapter makes a capability reachable from a host or protocol; a provider makes the capability real by invoking a concrete implementation.

## Candidate provider families

```text
workspace provider   -> browser workspace / future local filesystem
editor provider      -> Monaco-backed editor primitives
language provider    -> LSP client -> Pyright or another language server
syntax provider      -> Tree-sitter / equivalent parser
vcs provider         -> isomorphic-git / native git
terminal provider    -> browser command shim / local shell
runtime provider     -> Pyodide / local CPython / other admitted runtime
test provider        -> runtime-appropriate test runner
debug provider       -> runtime/debugger integration
```

These are candidate bindings, not implementation claims.

## Owns

- binding one or more capability operations to a concrete implementation;
- provider identity and availability;
- implementation-specific setup and invocation;
- translation of implementation outcomes into the declared capability result shape;
- implementation-specific diagnostics needed to explain unavailable/failed execution.

## Does not own

- capability meaning;
- authorization or custody policy;
- transport/protocol serialization;
- workspace overwrite authority;
- semantic admission or kernel meaning;
- UI rendering;
- proof or standing inflation.

## AI-native rule

Provider selection happens only after the requested operation is known and applicable gates have accepted the request.

```text
request
  -> capability / authority / custody gate
  -> provider resolution
  -> concrete substrate
  -> bounded result
  -> evidence
```

A fallback provider may change availability or performance. It may not silently change the meaning, scope, or authority of the requested capability.

## Current implementation

Concrete behavior still lives primarily in `index.html` and POC artifacts. There is no shared provider registry, provider interface, or dispatcher in the stable product path.

## Promotion trigger

Extract a provider when a stable capability contract needs a reusable concrete implementation boundary, or when the same capability can be fulfilled by more than one substrate without changing its meaning.

Do not build a plugin framework merely because the provider type exists.
