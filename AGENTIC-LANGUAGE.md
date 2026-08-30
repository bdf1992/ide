# Agentic Language

This repository is not only an editor project. It is an experiment in **projectional, verifiable, agent-assisted programming**.

## Core idea

The program is not its surface syntax.

A user may write through a personal dialect, Python, mathematical notation, a scrambled learning dialect, or another admitted projection. Each surface must elaborate to a canonical semantic program before it can receive execution standing.

```text
personal syntax ─┐
python syntax ────┼──> canonical semantic program ──> checked projection ──> execution
math syntax ──────┤
other dialect ────┘
```

The language is therefore best understood as a **personally projectable semantic language with certifying translations**.

## Why "agentic"

The agent is part of the language environment, but it is not the semantic authority.

The agent may:

- interpret unfamiliar user expressions;
- propose candidate semantic forms;
- explain mappings between projections;
- propose new projection/codebook rules;
- generate candidate target-language adapters;
- explain receipts, failures, and structural correspondences.

The agent may not:

- silently invent new semantic primitives;
- decide that its own translation is correct;
- bypass kernel admission;
- grant execution standing to an unverified projection;
- turn confidence into evidence.

The central rule is:

> **A model may propose new expressions of existing meaning; it may not silently create new meaning.**

## Authority layers

### 1. Surface / projection layer

Personal and replaceable.

Examples:

```text
each x from values
    gather x into total
```

```text
orbit x across values
    meld x toward total
```

```python
for x in values:
    total += x
```

These may all represent the same semantic program.

### 2. Elaboration layer

Turns a surface expression into candidate semantics.

Elaboration may be deterministic through an admitted grammar/codebook or assisted by an LLM when the surface is not yet recognized.

LLM output remains a candidate until explicitly admitted.

### 3. Semantic microkernel

Small, versioned, deterministic, and trusted.

It defines:

- the canonical IR;
- valid value and expression forms;
- valid statements;
- typing/well-formedness rules;
- evaluation/transition rules;
- failures;
- normal forms and admitted equivalence rules.

See `SEMANTIC-KERNEL.md`.

### 4. Projection adapters

Translate admitted semantics into target representations such as Python.

Adapters are **untrusted producers**. Their output must be independently reconstructed and checked before it gains execution standing.

### 5. Execution and evidence

A verified projection may be run. Reference-kernel behavior and target behavior can then be compared over declared observations.

## Three kinds of extension

These must never be confused.

### Projection extension

Adds another way to express existing meaning.

```text
"pour {value} toward {target}"
    -> AddUpdate(target, value)
```

Cheap. Does not enlarge the semantic kernel.

### Normalization extension

Adds a new proven/checked way for target syntax to reconstruct an existing semantic normal form.

Example:

```python
total = total + x
```

may later normalize to the same `AddUpdate(total, x)` meaning as:

```python
total += x
```

This requires equivalence evidence.

### Kernel extension

Adds genuinely new program meaning, such as branching, functions, records, effects, or tensors.

Expensive. Requires a versioned semantic specification, failure behavior, tests, and review.

Prefer composition of existing primitives before expanding the kernel.

## Learning model

The project teaches computation by holding semantics fixed while changing notation.

The learner should be able to move among views such as:

```text
Personal        Python                 Structural

 each x         for x in values:       Iterate
 from values        total += x         ├ source: values
 gather x                                ├ binding: x
 into total                              └ AddUpdate(total, x)
```

A scramble/dialect view may deliberately replace familiar vocabulary while preserving semantic identity. This tests whether the learner recognizes computational structure rather than memorized words.

The teaching sequence is:

```text
surface
  -> parse/elaborate
  -> semantic structure
  -> type/effect obligations
  -> target projection
  -> reverse reconstruction
  -> equivalence evidence
  -> execution/observation
```

This exposes compiler and programming concepts through ordinary work rather than requiring syntax-first memorization.

## Fundamental project constitution

> **Syntax is personal, fluid, and expendable.**  
> **Meaning is canonical, explicit, and versioned.**  
> **Translation is untrusted until independently reconstructed.**  
> **Execution standing is earned from evidence, never inferred from confidence.**

The IDE should make these properties visible through ordinary editor affordances—split views, hover/correspondence, diagnostics, terminal output, and inspectable receipts—rather than turning them into a permanent dashboard.