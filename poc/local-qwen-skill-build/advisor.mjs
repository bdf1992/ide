import { resolveBuild, validateState } from "../skill-build-kernel/kernel.mjs";
import {
  accumulatorState,
  addAccumulatorEvidence,
  addTraceEvidence,
  stateWith,
} from "../skill-build-kernel/accumulator-example.mjs";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function scenarioState(name = "trace") {
  if (name === "base") return clone(accumulatorState);
  if (name === "trace") return stateWith(addTraceEvidence);
  if (name === "full") return stateWith(addTraceEvidence, addAccumulatorEvidence);
  throw new Error(`unknown scenario: ${name}; expected base, trace, or full`);
}

export function publicState(state) {
  return {
    wiki: state.wiki.map(({ id, type, owner, related }) => ({ id, type, owner, related })),
    skills: state.skills.map(({ id, name, cost, uses, needs, checked_by }) => ({ id, name, cost, uses, needs, checked_by })),
    evidence: state.evidence.map(({ id, challenge }) => ({ id, challenge })),
    tree: state.tree,
    build: state.build,
    current_resolution: resolveBuild(state),
  };
}

export function buildAdvisorMessages(state, goal = "Choose the strongest legal learning build available now.") {
  const system = [
    "You are a build advisor inside a programming-learning IDE.",
    "You may only propose a skill selection. A deterministic checker decides whether it is legal.",
    "Do not invent skill ids, evidence, prerequisites, points, or permissions.",
    "Select only skills that can legally be active now. Include every selected prerequisite explicitly.",
    "Never treat points or selected skills as authority to edit files or change program semantics.",
    "Return one JSON object only, with no prose outside it:",
    '{"protocol":"BUILD_PROPOSAL/1","selected":["skill-id"],"reason":"short explanation"}',
  ].join("\n");

  const user = JSON.stringify({ goal, state: publicState(state) }, null, 2);
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

export function applyBuildProposal(state, proposal) {
  if (!proposal || proposal.protocol !== "BUILD_PROPOSAL/1" || !Array.isArray(proposal.selected)) {
    return {
      accepted: false,
      errors: [{ code: "INVALID_BUILD_PROPOSAL", path: "proposal", message: "expected BUILD_PROPOSAL/1 with selected[]" }],
    };
  }

  const candidate = clone(state);
  candidate.build.selected = [...proposal.selected];
  const validation = validateState(candidate);
  if (!validation.valid) {
    return { accepted: false, proposal, errors: validation.errors };
  }
  return { accepted: true, proposal, resolution: resolveBuild(candidate), candidate };
}
