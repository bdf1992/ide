# IDE / Research Parity Contract

Open Chat IDE has one product surface and one research program. The `poc/` directory is an experimental proving ground, not a second IDE.

## Parity invariant

A research artifact may temporarily have a narrower UI or a stricter subset, but it must not silently diverge from the main IDE on runtime assumptions, authority boundaries, workspace custody, or semantic claims.

The stable IDE remains the product shell. Research capabilities graduate into it only after their experiment earns the required evidence.

## Shared baselines

The stable IDE and research artifacts should share, unless an experiment explicitly records an exception:

- the same Pyodide/CPython browser runtime family and pinned version;
- the same browser-only / side-panel execution constraint;
- the same evidence-over-confidence rule;
- the same LLM authority boundary: agent output is proposed input, not semantic authority;
- the same user-custody rule: no silent overwrite of newer workspace state;
- the same revision-aware `IDE_STATE_PACKET/1` / `IDE_PATCH/1` contract when workspace mutation is involved;
- the same repository documents as the durable architecture source;
- the same rule that verification/standing labels must be computed from actual evidence.

Current shared runtime baseline: Pyodide `v314.0.6` / CPython 3.14 family.

## Deliberate non-parity

Research artifacts are allowed to differ from the stable IDE when the difference isolates a hypothesis.

Examples:

- `poc/semantic-poc.html` may use plain textareas instead of Monaco because editor fidelity is not part of POC 0.1.
- POC 0.1 supports only Kernel 0.1 semantics even though the stable IDE can execute general Python through Pyodide.
- The POC may expose internal IR and standing details more directly than the normal product UI.

These differences must not become permanent competing implementations.

## Promotion rule

A research capability moves into `index.html` only when:

1. its research question has an explicit success criterion in `RESEARCH.md`;
2. the required evidence has been gathered in the supported browser/side-panel environment;
3. known defeat cases fail at the expected boundaries;
4. the capability can be expressed through ordinary IDE primitives where possible;
5. integration preserves workspace, agent-protocol, and runtime behavior;
6. the POC remains useful as a narrow regression fixture or is retired deliberately.

For POC 0.1 this means: do not make Semantic Split part of the normal editor until the built-in defeat suite has actually run successfully in the supported browser environment.

## Parity matrix

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

## Drift checks

Before merging a change that touches `index.html`, `poc/`, runtime loading, agent protocols, or semantic standing, ask:

1. Did a pinned dependency/runtime version diverge?
2. Did either surface gain a stronger authority claim than the other?
3. Did a POC invent a second workspace or patch protocol?
4. Did the stable IDE claim a research capability before its evidence closed?
5. Did research code depend on a browser/runtime assumption the stable IDE cannot satisfy?
6. Is the divergence deliberate, documented, and temporary?

If the answer exposes unexplained drift, restore parity or document the experimental exception before merging.

## Long-term shape

The intended architecture is:

```text
ChatGPT conversation / agent plane
                |
        Open Chat IDE shell
                |
      shared browser runtime
                |
       capability adapters
          /           \
 ordinary Python   semantic mode
                      |
              Semantic Kernel
```

The research program should strengthen the IDE rather than fork it.