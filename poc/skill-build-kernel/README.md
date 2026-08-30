# Skill Build Kernel POC 0.1

This experiment proves the smallest deterministic slice of the IDE's wiki + skill + tree + build idea.

It is intentionally not a learning dashboard, XP system, autonomous skill author, or stable IDE capability.

## Research question

Can explicit wiki knowledge, reusable skills, challenge evidence, skill requirements, and a point-limited build resolve into a small active skill set using only deterministic rules?

## Product vocabulary

```text
Experience -> Wiki -> Skills -> Tree -> Build -> Active Skills
```

- **Experience** — what happened during work. POC 0.1 does not yet persist raw trajectories.
- **Wiki** — persistent owned knowledge represented here by typed wiki entries.
- **Skill** — a reusable procedure that may depend on other skills and may require challenge evidence.
- **Challenge** — a deterministic check associated with a skill.
- **Evidence** — an observed result compared with the challenge's expected result.
- **Tree** — the set of skills and their prerequisite relationships. It may form a DAG even when shown as a tree.
- **Build** — the selected skills under a point budget.
- **Active Skills** — the selected skills after all structural, evidence, prerequisite, and budget checks pass.

## Important separations

```text
wiki knowledge      != active skill
skill availability  != capability permission
points              != authority
owner               != truth
LLM proposal         != validation
```

This POC never modifies Semantic Kernel 0.1 and does not participate in semantic admission.

## Files

- `kernel.mjs` — deterministic validation and build resolution.
- `accumulator-example.mjs` — tiny learning fixture grounded in the existing accumulator example.
- `run-tests.mjs` — happy-path, progression, and defeat cases.

The core module uses no external dependency and is browser-compatible ES modules. The test runner uses Node only as a convenient local execution host; stable product integration is not claimed.

## Record shape

POC 0.1 intentionally keeps the record vocabulary small.

### Wiki entry

```js
{
  id: "iteration",
  type: "concept", // concept | pattern | example | mistake | vocabulary
  owner: "user",  // user | agent | shared
  related: ["binding"]
}
```

### Skill

```js
{
  id: "trace-loop",
  name: "Trace a loop",
  cost: 1,
  uses: ["iteration"],
  needs: ["read-values"],
  checked_by: ["trace-loop-basic"]
}
```

### Challenge and evidence

```js
{
  id: "trace-loop-basic",
  tests: "trace-loop",
  kind: "exact",
  expected: [0, 1, 4, 8, 13]
}

{
  id: "trace-loop-run-1",
  challenge: "trace-loop-basic",
  observed: [0, 1, 4, 8, 13]
}
```

POC 0.1 validates exact observed data against expected data. It does not yet authenticate who produced an evidence record. A later real challenge runner must own that custody boundary before evidence can support stable product progression claims.

### Tree and build

```js
{
  id: "python-accumulator",
  skills: ["read-values", "trace-loop", "build-accumulator"]
}

{
  id: "starter-build",
  tree: "python-accumulator",
  budget: 3,
  selected: ["read-values", "trace-loop"]
}
```

## Deterministic checks

The validator checks:

1. required record fields and admitted entry types/owners;
2. duplicate identifiers;
3. missing wiki, skill, challenge, tree, and build references;
4. skill prerequisite cycles;
5. challenge/evidence agreement;
6. selected-skill prerequisite closure;
7. required challenge evidence for selected skills;
8. point-budget overspend.

The resolver then reports:

```text
budget
active skills
available skills
locked skills + reasons
```

A skill is **available** only when its prerequisites are active, its required challenge evidence passes, and its cost fits the build's remaining points.

## Accumulator slice

The example reuses the repository's existing Kernel 0.1 learning ground without changing its semantics:

```text
Binding -> Iteration -> Accumulator

Read values -> Trace a loop -> Build an accumulator
```

The POC demonstrates three states:

1. `Read values` is active; `Trace a loop` is locked until its challenge evidence exists.
2. Passing the trace challenge makes `Trace a loop` available.
3. Selecting it makes `Build an accumulator` reachable, and passing that challenge makes the final skill available within the remaining point budget.

## Run

```bash
node poc/skill-build-kernel/run-tests.mjs
```

Expected result:

```text
skill-build-kernel: all tests passed
```

## Deliberately future

- raw execution trajectory capture;
- WikiSkill-style wiki maintenance and skill proposals;
- portable `SKILL.md` import/export;
- public skill catalog/SkillNet scouting providers;
- XP/level curves;
- user interface or graphical tree;
- persistent database/index;
- cryptographic or custody-authenticated evidence;
- automatic capability provisioning;
- autonomous build changes.

Those should be added only after this small deterministic core proves useful.
