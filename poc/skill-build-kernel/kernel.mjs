const ENTRY_TYPES = new Set(["concept", "pattern", "example", "mistake", "vocabulary"]);
const OWNERS = new Set(["user", "agent", "shared"]);

function diagnostic(code, path, message) {
  return { code, path, message };
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}

function isStringArray(value) {
  return Array.isArray(value) && value.every(isNonEmptyString);
}

function duplicateIds(records) {
  const seen = new Set();
  const duplicates = new Set();
  for (const record of records) {
    if (!isObject(record) || !isNonEmptyString(record.id)) continue;
    if (seen.has(record.id)) duplicates.add(record.id);
    seen.add(record.id);
  }
  return [...duplicates].sort();
}

function indexById(records) {
  return new Map(records.filter(isObject).filter((record) => isNonEmptyString(record.id)).map((record) => [record.id, record]));
}

function exactEqual(left, right) {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((value, index) => exactEqual(value, right[index]));
  }
  if (isObject(left) && isObject(right)) {
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();
    return exactEqual(leftKeys, rightKeys) && leftKeys.every((key) => exactEqual(left[key], right[key]));
  }
  return false;
}

export function evidencePasses(challenge, evidence) {
  if (!challenge || !evidence || challenge.kind !== "exact") return false;
  return evidence.challenge === challenge.id && exactEqual(evidence.observed, challenge.expected);
}

function validateRecordIds(records, label, errors) {
  records.forEach((record, index) => {
    if (!isObject(record)) {
      errors.push(diagnostic("INVALID_RECORD", `${label}[${index}]`, `${label} record must be an object`));
      return;
    }
    if (!isNonEmptyString(record.id)) {
      errors.push(diagnostic("INVALID_ID", `${label}[${index}].id`, `${label} id must be a non-empty string`));
    }
  });
  for (const id of duplicateIds(records)) {
    errors.push(diagnostic("DUPLICATE_ID", label, `duplicate ${label} id: ${id}`));
  }
}

function detectSkillCycles(skills, errors) {
  const byId = indexById(skills);
  const visiting = new Set();
  const visited = new Set();

  function visit(id, trail) {
    if (visiting.has(id)) {
      const start = trail.indexOf(id);
      const cycle = [...trail.slice(start), id];
      errors.push(diagnostic("SKILL_CYCLE", `skills.${id}.needs`, `skill prerequisite cycle: ${cycle.join(" -> ")}`));
      return;
    }
    if (visited.has(id)) return;

    visiting.add(id);
    const skill = byId.get(id);
    for (const needed of skill?.needs ?? []) {
      if (byId.has(needed)) visit(needed, [...trail, id]);
    }
    visiting.delete(id);
    visited.add(id);
  }

  for (const id of [...byId.keys()].sort()) visit(id, []);
}

export function passedChallengeIds(state) {
  const challenges = indexById(Array.isArray(state?.challenges) ? state.challenges : []);
  const passed = new Set();
  for (const evidence of Array.isArray(state?.evidence) ? state.evidence : []) {
    if (!isObject(evidence)) continue;
    const challenge = challenges.get(evidence.challenge);
    if (evidencePasses(challenge, evidence)) passed.add(challenge.id);
  }
  return passed;
}

export function validateState(state) {
  const errors = [];

  if (!isObject(state)) {
    return { valid: false, errors: [diagnostic("INVALID_STATE", "$", "state must be an object")] };
  }

  const collections = ["wiki", "skills", "challenges", "evidence"];
  for (const key of collections) {
    if (!Array.isArray(state[key])) {
      errors.push(diagnostic("INVALID_COLLECTION", key, `${key} must be an array`));
    }
  }

  if (!isObject(state.tree)) errors.push(diagnostic("INVALID_TREE", "tree", "tree must be an object"));
  if (!isObject(state.build)) errors.push(diagnostic("INVALID_BUILD", "build", "build must be an object"));
  if (errors.length) return { valid: false, errors };

  validateRecordIds(state.wiki, "wiki", errors);
  validateRecordIds(state.skills, "skills", errors);
  validateRecordIds(state.challenges, "challenges", errors);
  validateRecordIds(state.evidence, "evidence", errors);

  const wikiById = indexById(state.wiki);
  const skillsById = indexById(state.skills);
  const challengesById = indexById(state.challenges);

  state.wiki.forEach((entry, index) => {
    if (!isObject(entry)) return;
    if (!ENTRY_TYPES.has(entry.type)) {
      errors.push(diagnostic("INVALID_WIKI_TYPE", `wiki[${index}].type`, `unsupported wiki entry type: ${String(entry.type)}`));
    }
    if (!OWNERS.has(entry.owner)) {
      errors.push(diagnostic("INVALID_WIKI_OWNER", `wiki[${index}].owner`, `unsupported wiki owner: ${String(entry.owner)}`));
    }
    if (entry.related !== undefined && !isStringArray(entry.related)) {
      errors.push(diagnostic("INVALID_RELATIONSHIPS", `wiki[${index}].related`, "related must be an array of wiki entry ids"));
    }
    for (const related of entry.related ?? []) {
      if (!wikiById.has(related)) {
        errors.push(diagnostic("UNKNOWN_WIKI_ENTRY", `wiki.${entry.id}.related`, `unknown related wiki entry: ${related}`));
      }
    }
  });

  state.skills.forEach((skill, index) => {
    if (!isObject(skill)) return;
    if (!isNonEmptyString(skill.name)) {
      errors.push(diagnostic("INVALID_SKILL_NAME", `skills[${index}].name`, "skill name must be a non-empty string"));
    }
    if (!Number.isInteger(skill.cost) || skill.cost < 0) {
      errors.push(diagnostic("INVALID_SKILL_COST", `skills[${index}].cost`, "skill cost must be a non-negative integer"));
    }

    for (const field of ["uses", "needs", "checked_by"]) {
      if (skill[field] !== undefined && !isStringArray(skill[field])) {
        errors.push(diagnostic("INVALID_SKILL_RELATIONSHIP", `skills[${index}].${field}`, `${field} must be an array of ids`));
      }
    }

    for (const wikiId of skill.uses ?? []) {
      if (!wikiById.has(wikiId)) {
        errors.push(diagnostic("UNKNOWN_WIKI_ENTRY", `skills.${skill.id}.uses`, `unknown wiki entry: ${wikiId}`));
      }
    }
    for (const needed of skill.needs ?? []) {
      if (!skillsById.has(needed)) {
        errors.push(diagnostic("UNKNOWN_SKILL", `skills.${skill.id}.needs`, `unknown prerequisite skill: ${needed}`));
      }
    }
    for (const challengeId of skill.checked_by ?? []) {
      const challenge = challengesById.get(challengeId);
      if (!challenge) {
        errors.push(diagnostic("UNKNOWN_CHALLENGE", `skills.${skill.id}.checked_by`, `unknown challenge: ${challengeId}`));
      } else if (challenge.tests !== skill.id) {
        errors.push(diagnostic("CHALLENGE_SKILL_MISMATCH", `skills.${skill.id}.checked_by`, `${challengeId} tests ${challenge.tests}, not ${skill.id}`));
      }
    }
  });

  state.challenges.forEach((challenge, index) => {
    if (!isObject(challenge)) return;
    if (!skillsById.has(challenge.tests)) {
      errors.push(diagnostic("UNKNOWN_SKILL", `challenges[${index}].tests`, `unknown tested skill: ${String(challenge.tests)}`));
    }
    if (challenge.kind !== "exact") {
      errors.push(diagnostic("INVALID_CHALLENGE_KIND", `challenges[${index}].kind`, `unsupported challenge kind: ${String(challenge.kind)}`));
    }
    if (!("expected" in challenge)) {
      errors.push(diagnostic("MISSING_EXPECTED", `challenges[${index}].expected`, "exact challenge requires expected data"));
    }
  });

  state.evidence.forEach((evidence, index) => {
    if (!isObject(evidence)) return;
    if (!challengesById.has(evidence.challenge)) {
      errors.push(diagnostic("UNKNOWN_CHALLENGE", `evidence[${index}].challenge`, `unknown challenge: ${String(evidence.challenge)}`));
    }
    if (!("observed" in evidence)) {
      errors.push(diagnostic("MISSING_OBSERVED", `evidence[${index}].observed`, "evidence requires observed data"));
    }
  });

  detectSkillCycles(state.skills, errors);

  if (!isNonEmptyString(state.tree.id)) {
    errors.push(diagnostic("INVALID_ID", "tree.id", "tree id must be a non-empty string"));
  }
  if (!isStringArray(state.tree.skills)) {
    errors.push(diagnostic("INVALID_TREE_SKILLS", "tree.skills", "tree skills must be an array of skill ids"));
  } else {
    const treeSkillSet = new Set(state.tree.skills);
    if (treeSkillSet.size !== state.tree.skills.length) {
      errors.push(diagnostic("DUPLICATE_TREE_SKILL", "tree.skills", "tree cannot contain the same skill more than once"));
    }
    for (const skillId of state.tree.skills) {
      const skill = skillsById.get(skillId);
      if (!skill) {
        errors.push(diagnostic("UNKNOWN_SKILL", "tree.skills", `tree references unknown skill: ${skillId}`));
        continue;
      }
      for (const needed of skill.needs ?? []) {
        if (!treeSkillSet.has(needed)) {
          errors.push(diagnostic("TREE_PREREQUISITE_MISSING", `tree.skills.${skillId}`, `tree omits prerequisite ${needed} required by ${skillId}`));
        }
      }
    }
  }

  if (!isNonEmptyString(state.build.id)) {
    errors.push(diagnostic("INVALID_ID", "build.id", "build id must be a non-empty string"));
  }
  if (state.build.tree !== state.tree.id) {
    errors.push(diagnostic("BUILD_TREE_MISMATCH", "build.tree", `build references ${String(state.build.tree)} but supplied tree is ${String(state.tree.id)}`));
  }
  if (!Number.isInteger(state.build.budget) || state.build.budget < 0) {
    errors.push(diagnostic("INVALID_BUILD_BUDGET", "build.budget", "build budget must be a non-negative integer"));
  }
  if (!isStringArray(state.build.selected)) {
    errors.push(diagnostic("INVALID_BUILD_SELECTION", "build.selected", "selected must be an array of skill ids"));
  } else {
    const selected = new Set(state.build.selected);
    const treeSkills = new Set(Array.isArray(state.tree.skills) ? state.tree.skills : []);
    const passed = passedChallengeIds(state);

    if (selected.size !== state.build.selected.length) {
      errors.push(diagnostic("DUPLICATE_SELECTED_SKILL", "build.selected", "build cannot select the same skill more than once"));
    }

    let spent = 0;
    for (const skillId of state.build.selected) {
      const skill = skillsById.get(skillId);
      if (!skill) {
        errors.push(diagnostic("UNKNOWN_SKILL", "build.selected", `build selects unknown skill: ${skillId}`));
        continue;
      }
      if (!treeSkills.has(skillId)) {
        errors.push(diagnostic("SKILL_NOT_IN_TREE", "build.selected", `build selects skill outside tree: ${skillId}`));
      }
      spent += Number.isInteger(skill.cost) ? skill.cost : 0;

      for (const needed of skill.needs ?? []) {
        if (!selected.has(needed)) {
          errors.push(diagnostic("SKILL_PREREQUISITE_REQUIRED", `build.selected.${skillId}`, `${skillId} requires selected prerequisite ${needed}`));
        }
      }
      for (const challengeId of skill.checked_by ?? []) {
        if (!passed.has(challengeId)) {
          errors.push(diagnostic("SKILL_EVIDENCE_REQUIRED", `build.selected.${skillId}`, `${skillId} requires passing evidence for ${challengeId}`));
        }
      }
    }

    if (Number.isInteger(state.build.budget) && spent > state.build.budget) {
      errors.push(diagnostic("BUILD_OVERSPENT", "build", `build spends ${spent} points but budget is ${state.build.budget}`));
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.sort((a, b) => `${a.code}:${a.path}:${a.message}`.localeCompare(`${b.code}:${b.path}:${b.message}`)),
  };
}

export function resolveBuild(state) {
  const validation = validateState(state);
  if (!validation.valid) {
    return { valid: false, errors: validation.errors };
  }

  const skillsById = indexById(state.skills);
  const selected = new Set(state.build.selected);
  const passed = passedChallengeIds(state);
  const spent = state.build.selected.reduce((sum, id) => sum + skillsById.get(id).cost, 0);
  const remaining = state.build.budget - spent;
  const active = [...selected].sort();
  const available = [];
  const locked = [];

  for (const skillId of [...state.tree.skills].sort()) {
    if (selected.has(skillId)) continue;
    const skill = skillsById.get(skillId);
    const reasons = [];

    for (const needed of skill.needs ?? []) {
      if (!selected.has(needed)) reasons.push({ code: "NEEDS_SKILL", detail: needed });
    }
    for (const challengeId of skill.checked_by ?? []) {
      if (!passed.has(challengeId)) reasons.push({ code: "NEEDS_EVIDENCE", detail: challengeId });
    }
    if (skill.cost > remaining) {
      reasons.push({ code: "NEEDS_POINTS", detail: String(skill.cost - remaining) });
    }

    if (reasons.length === 0) {
      available.push(skillId);
    } else {
      locked.push({ id: skillId, reasons });
    }
  }

  return {
    valid: true,
    build: state.build.id,
    tree: state.tree.id,
    budget: {
      available: state.build.budget,
      spent,
      remaining,
    },
    active,
    available,
    locked,
  };
}
