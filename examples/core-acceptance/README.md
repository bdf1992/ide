# Core Acceptance Examples

These examples are deliberately small, dependency-free applications for exercising Open Chat IDE without confusing application complexity with IDE capability.

They are acceptance fixtures, not product features.

## Why these examples

The stable IDE already has a revisioned browser workspace, Monaco/fallback editing, terminal output, and single-file Python execution through Pyodide. The examples below give those primitives something more meaningful than `hello world` to operate on while leaving obvious seams for the provider architecture to earn later.

## Host-profile rule

The acceptance pack also protects product portability.

**Chat is the required core baseline.** Work may add stronger providers, but Work-specific acceptance extends rather than replaces Chat-core acceptance.

`acceptance.json` records this explicitly:

- `REQUIRED_PASS` — must work in the Chat baseline now;
- `TARGET_PASS_AFTER_PROMOTION` — a known Chat gap with a defined promotion target;
- `MUST_NOT_REGRESS` — stronger hosts must preserve the existing core behavior;
- `MUST_NOT_BYPASS_CHAT_TARGET` — a stronger host is not evidence that the portable Chat gap is closed.

Provider standing in that manifest is metadata, not an implementation claim beyond `STATUS.md`.

## Current-pass fixtures

### `scientific_calculator.py`

A safe AST-based scientific calculator using only the Python standard library.

Exercises:

- Python editing and completion;
- functions, names, calls, operators, and error paths;
- `python.run` / current Pyodide execution behavior;
- terminal output;
- deterministic assertions.

Expected final line:

```text
calculator: PASS
```

### `kanban.py`

A tiny stateful domain application with dataclasses, methods, mutation, aggregation, JSON serialization, and assertions.

Exercises:

- a realistic small application shape without framework noise;
- classes, references, rename/hover candidates for future language providers;
- runtime state transitions;
- structured output that future evidence tooling can inspect.

Expected final line:

```text
kanban: PASS
```

## Deliberate boundary fixture

`multifile/` contains a normal two-file Python program. It is intentionally **not expected to work in the stable IDE yet** because the browser workspace is not currently materialized as a Python importable filesystem before execution.

That makes it a useful acceptance target for the next provider slice rather than a hidden defect:

```text
workspace state
  -> workspace/runtime materialization
  -> python.run
  -> sibling import succeeds
```

When that capability is implemented, `multifile/main.py` should print:

```text
multifile: 42
multifile: PASS
```

Do not special-case this fixture inside the runtime. Fix the general workspace/materialization boundary.

A Work provider making multi-file execution possible does **not** by itself close this fixture. The Chat-compatible materialization/runtime path must earn the target too.

## Provider ladder

These same files can progressively exercise richer provider-backed capabilities without changing the applications:

| Stage | Capability | Example observation |
|---|---|---|
| current | `python.run` | run calculator and Kanban |
| POC | `syntax.query` | locate function/class/call nodes deterministically |
| POC | workspace materialization | run `multifile/main.py` with sibling import |
| next | `language.hover` | inspect `Board`, `evaluate`, standard-library names |
| next | `language.references` | find calls to `evaluate` or uses of `Task` |
| next | `vcs.status` / `vcs.diff` | modify one fixture and report the exact delta |
| later | `tests.run` | run fixture assertions through a named test capability |
| later | evidence receipt | report provider, operation, result, diagnostics, and revision |

## Acceptance rule

A provider integration should be tested against these fixtures through the same capability contract an agent or UI would use. Avoid fixture-specific hooks, ambient authority, or direct library calls from agent behavior.

For shared product promotion, record:

1. Chat result;
2. Work result when a Work binding exists;
3. provider-unavailable result;
4. evidence that capability meaning, custody, and result/error semantics remain invariant across hosts.
