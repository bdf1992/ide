# Host Profiles

Open Chat IDE is one product with multiple host profiles, not separate forks.

A host profile answers: **which transports and concrete providers are available in this environment?** It does not redefine capability meaning, workspace custody, semantic authority, or evidence rules.

## Product invariant

**Chat is the minimum supported product profile.**

A capability may gain a stronger provider in Work or a future local host, but the shared product must retain an explicit Chat behavior: implemented, degraded, or typed unsupported. Work-only infrastructure must not silently become a prerequisite for editing, workspace custody, ordinary Python execution, or the agent state/patch seam.

```text
                         shared IDE core
                 custody / capabilities / evidence
                              |
                 +------------+-------------+
                 |                          |
                 v                          v
             CHAT PROFILE                WORK PROFILE
          browser-contained            extended host
          lightweight providers        stronger providers
          state packet / patch         richer adapters
                 |                          |
                 +------------+-------------+
                              |
                       same contracts
```

## Chat profile

The Chat profile is the lowest-assumption environment and therefore the compatibility baseline.

Expected properties:

- runs from the browser/side-panel artifact without requiring a local daemon;
- workspace custody remains in the browser-owned workspace/revision model;
- ordinary Python uses the browser Pyodide provider;
- editing remains available if optional providers fail to load;
- agent interaction can always fall back to `IDE_STATE_PACKET/1` / `IDE_PATCH/1`;
- read-only browser providers such as Tree-sitter may enrich the experience when available;
- provider-unavailable outcomes are typed rather than replaced by model guesses;
- no capability may assume Cloud Browser, localhost, native Git, a shell daemon, or an MCP server merely because those are available elsewhere.

Chat is not a demo tier. It is the portable core of the product.

## Work profile

The Work profile may bind the same capability contracts to stronger host machinery.

Candidate examples:

- browser/cloud filesystem or repository bindings;
- native/server Git provider behind `vcs.*`;
- LSP servers behind `language.*`;
- stronger test/debug/runtime providers;
- MCP or other host adapters where supported;
- cloud/browser automation that is unavailable in the Chat profile.

Work providers are optional implementations. Their availability does not widen authority.

```text
language.references
      |
      +-- Chat -> browser/worker provider OR typed unsupported
      |
      +-- Work -> LSP/server provider
```

Both branches return the same capability meaning and bounded result semantics.

## No-fork rule

Do not create `chat-ide` and `work-ide` as independently evolving applications.

Prefer:

```text
shared shell
shared workspace model
shared capability contracts
shared evidence model
        |
 host profile resolution
   /             \
chat             work
```

A separate host entry point is acceptable when the host needs different bootstrapping, but it must compose the shared core rather than copy it.

## Capability matrix

Every capability promoted beyond POC should record both host profiles.

| Capability family | Chat expectation | Work expectation |
|---|---|---|
| workspace custody | browser workspace + revision gate | same authority model; stronger persistence may bind behind it |
| `python.run` / runtime | Pyodide | Pyodide or stronger admitted runtime provider |
| `syntax.*` | Tree-sitter WASM candidate | same or alternate Tree-sitter provider |
| `tests.run` | browser/runtime-backed subset | richer native/server runner allowed |
| `vcs.status` / `vcs.diff` | browser-compatible provider when earned | native/server Git provider allowed |
| `language.*` | browser/worker provider when practical; otherwise typed unsupported | LSP/server provider |
| `terminal.exec` | bounded browser command/runtime surface | stronger shell provider only with explicit authority |
| debug | typed unsupported until a real browser provider exists | DAP/runtime provider when earned |
| agent transport | state packet / patch baseline | state packet / patch plus optional MCP/host adapters |

This table is a compatibility target, not an implementation-status claim.

## Promotion rule

A new provider or capability PR must answer:

1. What is the Chat behavior?
2. What is the Work behavior?
3. Which parts are shared capability semantics versus host/provider binding?
4. What happens when the stronger provider is unavailable?
5. Does any host gain authority that the capability contract did not already permit?
6. Can the Chat baseline still edit, inspect state, and recover without the Work provider?

If those answers are missing, the capability is not ready to become shared product infrastructure.

## Testing rule

Acceptance should be layered:

```text
CORE acceptance
  must run against Chat-compatible providers

HOST acceptance
  proves Work/local enhancements independently

PARITY acceptance
  proves both hosts preserve the same capability semantics,
  custody rules, and result/error classifications
```

Core fixtures must not require Work-only services. A Work-specific fixture may be added for stronger behavior, but it cannot replace the Chat-compatible fixture.

## Future local profile

A local/BYOM profile may eventually join Chat and Work. It should follow the same rule: stronger substrate, same capability contracts and custody boundaries.

The host-profile system exists to preserve portability while letting the IDE exploit better machinery when it is genuinely available.
