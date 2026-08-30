# Cross-Language Adapter Challenges

This ladder contains small, deterministic **reference application cores**. Python and
JavaScript receive the same JSON inputs and must produce the same JSON outputs or the
same stable failure code.

The word "solved" is deliberately bounded:

> A reference lane is solved when it satisfies every declared case and invariant for
> the headless core defined here.

It does not mean the application has a production UI, persistence, networking,
security hardening, or Kernel 0.1 standing.

## Ladder

| Level | Challenge | Tested distinction |
|---:|---|---|
| 1 | Hello World | values, defaults, formatting |
| 2 | Snake | direction, growth, collision, state transition |
| 3 | Pong | continuous step, reflection, scoring |
| 4 | Klondike Solitaire | deal topology and stacking rules |
| 5 | File Watcher | pure snapshot difference before OS effects |
| 6 | Scientific Calculator | lexical form, precedence, functions, failures |
| 7 | Kanban | identity-preserving event reduction |
| 8 | Minesweeper | neighborhood traversal and terminal state |
| 9 | Model Recommendations | constraints, weighted ranking, corrections |

The feature requirements in [`manifest.json`](./manifest.json) are pressure on a future
typed structural representation and adapter layer. They are not admitted semantic
nodes.

## Run the matrix

```bash
python3 challenges/run_matrix.py
```

Run one lane directly:

```bash
python3 -m unittest challenges.python.test_reference -v
node --test challenges/javascript/test-reference.mjs
```

## Add a language

1. Implement a `solve(challenge, input)` dispatcher without reading expected results.
2. Reuse `cases.json` unchanged.
3. Return JSON-compatible values and stable `ChallengeError.code` failures.
4. Add independent language-native invariants in that lane's tests.
5. Register the runtime command in `run_matrix.py`.
6. Record any intentionally unsupported case as a visible failure; do not silently
   borrow another lane's implementation.

## Translation exercise

For each level, attempt:

```text
source lane
  -> typed structural candidate
  -> target adapter
  -> target runtime
  -> shared observations
  -> mismatch report
```

A passing oracle case shows observational agreement for that input. It does not prove
general semantic equivalence. A useful adapter should also preserve the declared
identities, boundaries, failure classes, and state transitions in the manifest.
