# Providers

Providers answer: **which concrete implementation fulfills an accepted capability in this environment?**

They are the missing structural layer between transport-neutral capability semantics and proven IDE/runtime machinery.

## Provider is not adapter

```text
adapter  = host / transport binding
provider = implementation / substrate binding
```

Examples:

```text
ChatGPT state packet ---- adapter ----\
Browser UI -------------- direct ------> capability gate
Local MCP --------------- adapter ----/
                                      |
                                      v
                               provider resolution
                         /          |          |          \
                      LSP      Tree-sitter    Git       Runtime
```

An adapter may serialize, deserialize, forward, and report host availability. It may not redefine the operation.

A provider may invoke a concrete library, process, runtime, or service. It may not grant authority merely because the implementation is available.

## Resolution rule

Provider resolution is deliberately boring:

1. parse/validate the capability request;
2. apply capability-level preconditions and authority/custody gates;
3. resolve a provider that explicitly declares support for the operation in the current environment;
4. invoke it with the bounded request;
5. normalize the implementation outcome into `CAPABILITY_RESULT/1` or a narrower declared result;
6. emit diagnostics/evidence needed to explain the outcome.

A provider registry is a deterministic implementation map, **not** a hidden service locator, permission system, or semantic authority.

## Initial capability-to-provider map

This table is a target map, not an implementation-status claim.

| Capability family | Candidate operation | Browser provider candidate | Local/provider candidate | Notes |
|---|---|---|---|---|
| workspace | `workspace.snapshot`, `file.read`, `file.patch` | existing browser workspace behavior, later extracted | local filesystem workspace provider | revision/custody gates stay above provider execution |
| editor | `editor.reveal`, `editor.selection`, `editor.diagnostics` | Monaco | Monaco/VS Code-compatible host | editor UI behavior should remain IDE primitives where possible |
| language | `language.hover`, `language.definition`, `language.references`, `language.rename` | LSP client over Worker/WebSocket when available | Pyright or another LSP server | capability contract targets LSP-shaped semantics, not Pyright-specific transport |
| syntax | `syntax.query`, `syntax.node-at` | Tree-sitter WASM | Tree-sitter native/WASM | syntax evidence is not semantic-kernel admission |
| vcs | `vcs.status`, `vcs.diff` | isomorphic-git against browser filesystem | native git / compatible provider | use `git.*` only for operations whose semantics are intentionally Git-specific |
| terminal | `terminal.exec` | bounded browser command/runtime shim | local shell provider | xterm.js renders terminal I/O; it is not itself command authority |
| tests | `tests.run` | runtime-specific browser runner | local test runner | test result remains evidence, not authority |
| debug | `debug.stack`, `debug.inspect` | future runtime-specific provider | debugger/DAP-backed provider | FUTURE until a real supported execution lane exists |
| runtime | `python.run`, future `runtime.execute` | Pyodide | local CPython / other admitted runtime | runtime result does not decide semantic standing |
| semantic | `semantic.propose`, `semantic.admit`, `semantic.verify` | semantic modules after promotion | same contracts, alternate host binding | provider cannot bypass kernel/admission rules |
| projection | `projection.render`, `projection.reconstruct` | projection implementation after promotion | alternate host implementation | reconstruction must remain independently checkable where standing requires it |
| receipt | `receipt.inspect` | evidence layer | evidence layer | inspection is read-only with respect to standing |

## Browser-first constraints

The stable side-panel product should degrade safely when a provider cannot load in the browser sandbox.

- A missing LSP server must not break editing.
- A missing Tree-sitter grammar must not corrupt workspace state.
- Browser Git networking may require host/CORS support; local status/diff can still be useful without remote mutation.
- Runtime/provider failures must be visible and typed rather than converted into model guesses.
- Core workspace custody cannot depend on a provider that requires an external network service.

## Provider descriptor — future contract shape

Do not add this schema until a real producer/consumer pair needs it. When earned, a provider descriptor should be able to state at least:

```text
provider id
provider version
supported capability operations
supported environments
availability state
implementation dependency/version
known constraints
```

It must not contain an ambient permission grant.

## Dependency rule

```text
transport adapter ---> capability contracts <--- provider
                           |
                           v
                   authority/custody gates
                           |
                           v
                     provider invocation
                           |
                           v
                  concrete IDE machinery
                           |
                           v
                        evidence
```

The capability contract is the invariant seam. Adapters and providers may vary around it.

## Promotion path

1. keep current stable behavior where it is;
2. name the capability operation that already exists;
3. identify the concrete substrate currently fulfilling it;
4. extract the smallest provider binding without changing product behavior;
5. verify parity and refusal behavior;
6. only then add alternate providers or transports.

This keeps Open Chat IDE as the AI-native control/custody/evidence layer over proven IDE machinery rather than reimplementing that machinery.
