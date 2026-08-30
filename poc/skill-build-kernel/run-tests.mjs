import assert from "node:assert/strict";
import { resolveBuild, validateState } from "./kernel.mjs";
import {
  accumulatorState,
  accumulatorEvidence,
  addAccumulatorEvidence,
  addTraceEvidence,
  selectAccumulator,
  selectTraceLoop,
  stateWith,
  traceEvidence,
} from "./accumulator-example.mjs";

function errorCodes(result) {
  return new Set(result.errors.map((error) => error.code));
}

function locked(result, skillId) {
  return result.locked.find((entry) => entry.id === skillId);
}

function reasonCodes(entry) {
  return new Set(entry.reasons.map((reason) => reason.code));
}

// 1. Base state is structurally valid. Only the root skill is active.
{
  const result = resolveBuild(accumulatorState);
  assert.equal(result.valid, true);
  assert.deepEqual(result.active, ["read-values"]);
  assert.deepEqual(result.available, []);
  assert.deepEqual(result.budget, { available: 3, spent: 1, remaining: 2 });
  assert(reasonCodes(locked(result, "trace-loop")).has("NEEDS_EVIDENCE"));
  assert(reasonCodes(locked(result, "build-accumulator")).has("NEEDS_SKILL"));
}

// 2. Passing the trace challenge makes trace-loop available, but does not auto-select it.
{
  const state = stateWith(addTraceEvidence);
  const result = resolveBuild(state);
  assert.equal(result.valid, true);
  assert.deepEqual(result.active, ["read-values"]);
  assert.deepEqual(result.available, ["trace-loop"]);
}

// 3. Selecting an earned skill activates it. The next skill is still locked on evidence.
{
  const state = stateWith(addTraceEvidence, selectTraceLoop);
  const result = resolveBuild(state);
  assert.equal(result.valid, true);
  assert.deepEqual(result.active, ["read-values", "trace-loop"]);
  assert(reasonCodes(locked(result, "build-accumulator")).has("NEEDS_EVIDENCE"));
}

// 4. Passing the accumulator challenge makes the final skill available within the remaining point.
{
  const state = stateWith(addTraceEvidence, selectTraceLoop, addAccumulatorEvidence);
  const result = resolveBuild(state);
  assert.equal(result.valid, true);
  assert.deepEqual(result.available, ["build-accumulator"]);
  assert.deepEqual(result.budget, { available: 3, spent: 2, remaining: 1 });
}

// 5. Selecting all earned skills produces the complete three-point build.
{
  const state = stateWith(addTraceEvidence, selectTraceLoop, addAccumulatorEvidence, selectAccumulator);
  const result = resolveBuild(state);
  assert.equal(result.valid, true);
  assert.deepEqual(result.active, ["build-accumulator", "read-values", "trace-loop"]);
  assert.deepEqual(result.available, []);
  assert.deepEqual(result.budget, { available: 3, spent: 3, remaining: 0 });
}

// 6. A failed challenge attempt is valid history, but it cannot satisfy a selected skill.
{
  const state = stateWith(selectTraceLoop);
  const failed = traceEvidence();
  failed.id = "trace-loop-failed";
  failed.observed[3].after = 12;
  state.evidence.push(failed);
  const result = validateState(state);
  assert.equal(result.valid, false);
  assert(errorCodes(result).has("SKILL_EVIDENCE_REQUIRED"));
  assert(!errorCodes(result).has("UNKNOWN_CHALLENGE"));
}

// 7. Skill knowledge references must resolve to real wiki entries.
{
  const state = stateWith((draft) => {
    draft.skills[0].uses = ["missing-concept"];
  });
  const result = validateState(state);
  assert.equal(result.valid, false);
  assert(errorCodes(result).has("UNKNOWN_WIKI_ENTRY"));
}

// 8. Prerequisite cycles are rejected deterministically.
{
  const state = stateWith((draft) => {
    draft.skills[0].needs = ["build-accumulator"];
  });
  const result = validateState(state);
  assert.equal(result.valid, false);
  assert(errorCodes(result).has("SKILL_CYCLE"));
}

// 9. A build cannot spend more points than its budget.
{
  const state = stateWith(addTraceEvidence, selectTraceLoop, addAccumulatorEvidence, selectAccumulator, (draft) => {
    draft.build.budget = 2;
  });
  const result = validateState(state);
  assert.equal(result.valid, false);
  assert(errorCodes(result).has("BUILD_OVERSPENT"));
}

// 10. Evidence cannot bypass prerequisite selection.
{
  const state = stateWith((draft) => {
    draft.evidence.push(accumulatorEvidence());
    draft.build.selected.push("build-accumulator");
  });
  const result = validateState(state);
  assert.equal(result.valid, false);
  assert(errorCodes(result).has("SKILL_PREREQUISITE_REQUIRED"));
}

// 11. Evidence must name an admitted challenge.
{
  const state = stateWith((draft) => {
    const evidence = traceEvidence();
    evidence.id = "unknown-challenge-run";
    evidence.challenge = "not-a-challenge";
    draft.evidence.push(evidence);
  });
  const result = validateState(state);
  assert.equal(result.valid, false);
  assert(errorCodes(result).has("UNKNOWN_CHALLENGE"));
}

console.log("skill-build-kernel: all tests passed");
