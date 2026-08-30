# Typology

Typology answers: **what kind of thing is this?**

The goal is to prevent files, agents, semantic programs, receipts, experiments, adapters, providers, and contracts from being treated as interchangeable just because they all contain data or code.

## Core kinds

| Kind | Meaning | Authority |
|---|---|---|
| Human intent | user request, choice, correction, admission | can authorize user-owned choices; not executable semantics by itself |
| Agent proposal | model-produced explanation, edit, semantic candidate, adapter suggestion | proposed input only |
| Workspace state | files, revisions, tabs, selections, terminal evidence | authoritative for the supplied workspace snapshot/revision |
| IDE primitive | editor, terminal, explorer, diagnostics, command | interaction surface; does not define semantics |
| Capability | named operation such as `file.read`, `python.run`, `semantic.verify` | defines an action boundary, not permission by itself |
| Contract | versioned data shape crossing a boundary | constrains representation; grants no ambient authority |
| Adapter | host/transport binding for a capability | makes an operation reachable; cannot enlarge capability meaning or authority |
| Provider | concrete implementation binding behind a capability | may fulfill an accepted operation; availability grants no authority by itself |
| Semantic program | canonical admitted IR under a declared kernel version | authoritative meaning for the semantic lane |
| Projection | textual/structural rendering of admitted semantics | expression of meaning; not authority over meaning |
| Candidate semantics | proposed IR not yet admitted | unresolved/provisional |
| Admission | explicit transition from candidate to admitted meaning/rule | grants standing only within its declared scope |
| Execution | one run of an admitted program or ordinary Python target | produces runtime observations/failures |
| Evidence | parser results, tests, diffs, diagnostics, reconstructed IR, observations | supports a claim; strength depends on source and independence |
| Receipt | structured summary of computed evidence and standing | reports evidence; cannot exceed it |
| Experiment | bounded hypothesis + mechanism + success/failure criterion | research scope, not product capability |
| Product capability | behavior promoted into the stable IDE | supported user-facing behavior after required evidence |

## Important distinctions

### Proposal is not admission

```text
agent output -> candidate -> explicit admission/check -> standing
```

### Contract is not capability or authority

```text
contract = what data may cross
capability = what operation may be requested
authority = whether this actor may cause the effect
```

A valid request envelope can still be refused.

### Adapter is not provider

```text
adapter  = how a host/transport reaches a capability
provider = how an accepted capability reaches concrete machinery
```

An MCP adapter and a browser UI may call the same capability. A Tree-sitter, Git, LSP, or runtime provider may fulfill it. Neither transport reachability nor provider availability grants permission to cause the effect.

### Projection is not semantics

```text
Personal text  \
Python text     ---> canonical semantic program
Math view      /
```

Changing a projection can be cheap. Changing canonical semantics is a kernel change.

### Evidence is not authority

Evidence can justify standing. It does not itself create a semantic rule or overwrite workspace custody.

### Experiment is not capability

A successful experiment may justify promotion. A POC directory existing does not mean the stable IDE supports that capability.

## Change classes

Every agentic-language change should primarily be one of:

- **projection extension** — new expression of existing meaning;
- **normalization extension** — new target form reconstructing an existing meaning;
- **kernel extension** — new admitted meaning.

Every IDE change should primarily be one of:

- **IDE primitive**;
- **agent behavior**;
- **adapter/protocol**;
- **provider integration**;
- **new UI**.

These classifications are orthogonal. For example, a projection extension might require no new UI at all.
