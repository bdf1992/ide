# Skill Progression Boundary — STUB

This boundary owns the plain, deterministic model for persistent wiki knowledge, reusable skills, challenges/evidence, skill relationships, point-limited builds, and resolved active skills.

The product vocabulary is intentionally small:

```text
Experience -> Wiki -> Skills -> Tree -> Build -> Active Skills
```

The executable experiment currently lives under `poc/skill-build-kernel/`. This directory names the durable responsibility only; it does not claim stable IDE integration.

## Owns

- definitions for Wiki Entry, Skill, Challenge, Evidence, Tree, and Build records;
- machine-relevant relationships among those records;
- deterministic structural and prerequisite checks;
- point-budget validation;
- deterministic resolution of a valid build into active, available, and locked skills;
- the rule that wiki growth and skill activation are separate states;
- inspectable progression diagnostics/receipts produced from explicit records.

## Does not own

- semantic-program meaning or Kernel 0.1 admission;
- workspace custody or permission to modify files;
- capability authorization;
- provider selection or runtime execution;
- truth merely because an actor owns a wiki entry;
- skill admission merely because an LLM proposed it;
- XP curves, gamification policy, or claims of intelligence;
- autonomous wiki maintenance or autonomous skill evolution;
- permanent learning UI.

## Authority rule

A build describes **which validated skill instructions are selected for an actor or task**. It does not grant authority to perform the operations mentioned by those skills.

```text
validated evidence -> earned/available skill
point budget       -> selected skill
selected skills    -> active skill set

active skill set   -X-> workspace authority
active skill set   -X-> semantic admission
active skill set   -X-> capability permission
```

Capability, custody, semantic, provider, and evidence gates remain where the existing architecture defines them.

## Plain implementation model

The system should be understandable without requiring graph-theory vocabulary:

- **Definitions** — what each record must contain.
- **Relationships** — what a skill needs, uses, or is checked by.
- **Rules** — prerequisite, cycle, evidence, and point-budget constraints.
- **Checks** — deterministic diagnostics for one concrete state.
- **Resolution** — the active / available / locked skill set for one valid build.

A visual skill tree may later project these relationships, but the view is not the source of truth.

## Paper lineage

The progression loop is informed by WikiSkill's separation of raw experience, persistent wiki knowledge, and validated skills. The IDE extends that pattern with explicit ownership, skill relationships, point-limited builds, and an active skill set.

The important asymmetry is preserved:

> Wiki knowledge may accumulate without automatically becoming an admitted or active skill.

Portable `SKILL.md` formats and public skill catalogs may later be import/provider surfaces. Imported material remains candidate input until local checks admit it.

## Current implementation

- Stable IDE integration: **none**.
- Shared capability operations: **none**.
- Executable POC: `poc/skill-build-kernel/`.
- Semantic kernel impact: **none**; Kernel 0.1 remains unchanged.

## Promotion trigger

Consider extracting reusable implementation here only after the POC proves:

1. deterministic record/relationship validation;
2. expected failure for cycles, missing references, unmet prerequisites, invalid evidence, and overspent builds;
3. stable build resolution into active / available / locked skills;
4. a real producer for challenge evidence rather than hand-authored demo evidence;
5. Chat-compatible integration that does not widen workspace, semantic, or capability authority.
