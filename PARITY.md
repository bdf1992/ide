# IDE / Research / Host Parity Contract

Open Chat IDE has one product surface, one research program, and multiple host profiles. The `poc/` directory is an experimental proving ground, not a second IDE. Chat, Work, and future local hosts are provider/transport profiles, not separate products.

## Parity invariant

A research artifact may temporarily have a narrower UI or a stricter subset, and a host profile may have stronger providers, but neither may silently diverge from the shared product on capability meaning, authority boundaries, workspace custody, or evidence claims.

The stable IDE remains the product shell. Research capabilities graduate into it only after their experiment earns the required evidence. Chat remains the minimum supported host profile; Work may extend provider availability without becoming a hidden prerequisite for the core product.

## Shared baselines

The stable IDE and research artifacts should share, unless an experiment explicitly records an exception:

- the same Pyodide/CPython browser runtime family and pinned version where browser Python is used;
- the same browser/side-panel Chat compatibility baseline;
- the same evidence-over-confidence rule;
- the same LLM authority boundary: agent output is proposed input, not semantic authority;
- the same user-custody rule: no silent overwrite of newer workspace state;
- the same revision-aware `IDE_STATE_PACKET/1` / `IDE_PATCH/1` contract when workspace mutation is involved;
- the same transport-neutral capability meaning across hosts;
- the same repository documents as the durable architecture source;
- the same rule that verification/standing labels must be computed from actual evidence.

Current shared browser runtime baseline: Pyodide `v314.0.6` / CPython 3.14 family.

## Host parity

Host differences belong in adapters and providers.

```text
                 shared capability
                        |
             same gates / same meaning
                 /              \
              Chat              Work
        browser provider    stronger provider
```

Required invariants:

- Chat is a real supported profile, not merely a fallback demo.
- Work may add LSP, native/server Git, stronger runtimes, cloud/browser automation, MCP, or other host bindings when available.
- Work availability may not widen a capability's authority.
- A Work provider may return richer evidence, but common result/error semantics must remain comparable.
- A capability that is not feasible in Chat must have an explicit Chat status such as typed `unsupported`; it must not vanish from the architecture.
- Editing, browser workspace custody, ordinary browser Python execution, and the state-packet/patch seam must not acquire an undeclared Work-only dependency.
- Core acceptance fixtures must continue to run against Chat-compatible machinery. Work-specific acceptance may extend, not replace, that baseline.

See [`architecture/HOST-PROFILES.md`](./architecture/HOST-PROFILES.md).

## Deliberate non-parity

Research artifacts are allowed to differ from the stable IDE when the difference isolates a hypothesis. Host profiles are allowed to differ in implementation substrate when capability semantics stay invariant.

Examples:

- `poc/semantic-poc.html` may use plain textareas instead of Monaco because editor fidelity is not part of POC 0.1.
- POC 0.1 supports only Kernel 0.1 semantics even though the stable IDE can execute general Python through Pyodide.
- The POC may expose internal IR and standing details more directly than the normal product UI.
- Work may use an LSP server for `language.references` while Chat uses a browser/worker provider or returns typed unsupported until one is earned.
- Work may use native/server Git while Chat later uses a browser-compatible Git provider over the same materialized workspace revision.

These differences must not become permanent competing product implementations.

## Promotion rule

A research capability moves into the stable product only when:

1. its research question has an explicit success criterion in `RESEARCH.md` or its governing issue;
2. the required evidence has been gathered in the supported environment;
3. known defeat cases fail at the expected boundaries;
4. the capability can be expressed through ordinary IDE primitives where possible;
5. integration preserves workspace, agent-protocol, runtime, and host-profile behavior;
6. the POC remains useful as a narrow regression fixture or is retired deliberately;
7. Chat behavior, Work behavior, and provider-unavailable behavior are explicit before shared promotion.

For POC 0.1 this means: do not make Semantic Split part of the normal editor until the built-in defeat suite has actually run successfully in the supported browser environment.

## Research parity matrix

| Concern | Stable IDE | POC 0.1 | Requirement |
|---|---|---|---|
| Browser runtime | Pyodide v314.0.6 | Pyodide v314.0.6 | must match |
| Python parser/runtime | CPython via Pyodide | CPython via Pyodide | must match family |
| Editor | Monaco + fallback | textarea | may differ during experiment |
| Workspace persistence | localStorage | ephemeral POC state | may differ; POC cannot become durable SoR |
| Agent authority | proposed edits only | no LLM in trusted loop | must not weaken |
| Revision safety | IDE_PATCH base revision | not applicable to isolated POC | required when POC mutates workspace |
| Verification | runtime/tests/evidence | S0-S4 computed standing | must be computed |
| Semantic authority | ordinary Python runtime | Kernel 0.1 | explicit difference by experiment |
| Durable architecture | repository docs | repository docs | must match |

## Host parity matrix

| Concern | Chat profile | Work profile | Requirement |
|---|---|---|---|
| Product shell | browser/side-panel baseline | same shared shell or compatible host bootstrap | must not fork product semantics |
| Workspace custody | browser workspace + revision gate | same authority model | Work cannot become alternate workspace authority |
| Python | Pyodide baseline | Pyodide or stronger admitted provider | same `python.run` meaning |
| Syntax | browser Tree-sitter candidate | same or alternate provider | same ranges/query semantics |
| Language intelligence | browser/worker when feasible or typed unsupported | LSP/server allowed | same `language.*` contracts |
| VCS | browser-compatible provider when earned | native/server Git allowed | same bounded VCS semantics |
| Agent transport | state packet / patch baseline | baseline plus optional richer adapter | richer transport grants no extra authority |
| Failure | visible degraded/unsupported outcome | visible degraded/unsupported outcome | no model guess substituted for missing provider |

## Drift checks

Before merging a change that touches `index.html`, `poc/`, runtime loading, adapters/providers, agent protocols, or semantic standing, ask:

1. Did a pinned dependency/runtime version diverge without a declared host/experiment reason?
2. Did either research or a host profile gain a stronger authority claim?
3. Did a POC or host invent a second authoritative workspace or patch protocol?
4. Did the stable IDE claim a research capability before its evidence closed?
5. Did shared code acquire a Work-only assumption that breaks the Chat baseline?
6. Does a capability now mean something materially different across providers?
7. Is the divergence deliberate, documented, testable, and temporary or host-specific?

If the answer exposes unexplained drift, restore parity or document the bounded exception before merging.

## Long-term shape

The intended architecture is:

```text
ChatGPT conversation / agent plane
                |
        Open Chat IDE shell
                |
       shared capability core
                |
        host profile binding
          /             \
        Chat             Work
          \             /
           provider layer
          /           \
 ordinary Python   semantic mode
                      |
              Semantic Kernel
```

Research and stronger hosts should strengthen the same IDE rather than fork it.
