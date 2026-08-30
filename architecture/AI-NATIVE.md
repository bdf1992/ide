# AI-Native Shape

"AI-native" in Open Chat IDE does **not** mean putting an LLM inside every component.

It means the system is designed from the beginning for agents to reason over explicit state, propose bounded actions, produce inspectable artifacts, and participate without becoming hidden authority.

## AI-native principles

### 1. State is addressable

Agents reason over explicit artifacts and snapshots rather than assumed ambient UI state.

Examples:

- files and revisions;
- `IDE_STATE_PACKET/1`;
- canonical semantic IR;
- diagnostics and receipts;
- experiment status.

### 2. Actions are capabilities

Prefer named, typed operations over vague autonomy.

Examples:

```text
file.read
file.patch
python.run
semantic.propose
semantic.verify
projection.reconstruct
receipt.inspect
```

Capability naming describes what can be requested. It does not itself grant permission or standing.

### 3. Proposals are first-class

Agent output is represented as proposed input that can be previewed, rejected, admitted, or checked.

```text
intent -> proposal -> gate -> effect -> evidence
```

### 4. Authority is explicit

The model is useful precisely because it can be creative outside the trusted boundary.

- LLM: interpretation, explanation, suggestion, adapter drafting.
- Workspace contract: custody/revision authority.
- Semantic kernel: admitted meaning.
- Target runtime: execution behavior.
- Evidence checker: standing for stated claims.

No component inherits another component's authority by convenience.

### 5. Evidence is native output

Agentic work should naturally leave inspectable evidence:

- patches and diffs;
- runtime output;
- diagnostics;
- semantic reconstruction;
- standing receipts;
- experiment results.

A useful result is not only an answer; it is an answer with enough state/evidence for the next human or agent to continue safely.

### 6. Human collaboration is part of the protocol

Human interaction is not an exception path around autonomy. Acceptance, correction, admission, and ambiguity resolution are normal operations in the system.

### 7. Determinism replaces repeated inference when possible

If an agent repeatedly resolves the same admitted meaning, that knowledge should be compilable into deterministic codebooks, adapters, tests, or rules where practical.

The desired direction is often:

```text
neural proposal
   -> explicit admission
   -> symbolic rule
   -> deterministic reuse
```

### 8. Local/browser operation remains a first-class pattern

The baseline should remain useful with user-owned browser/runtime state and without requiring a hosted agent backend. Local model or MCP-style adapters may be added later without changing the authority model.

## What AI-native does not mean

It does not mean:

- autonomous writes without custody checks;
- model confidence treated as evidence;
- natural language replacing formal semantics;
- every module calling an LLM;
- inventing custom UI for behavior an IDE already expresses;
- hiding state transitions behind a conversational veneer;
- claiming completed automation because an agent can describe it.

## Design test

For a proposed feature, ask:

1. What explicit state does the agent read?
2. What typed capability does it request?
3. What authority boundary gates the effect?
4. What artifact/evidence records the result?
5. Can repeated accepted inference become deterministic?
6. Can another agent or human resume from the resulting state without reconstructing hidden context?

If those questions have clear answers, the feature is likely AI-native in the sense intended by this repository.
