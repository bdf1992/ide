# Research Protocol

This project is a formal engineering and learning experiment in projectional, verifiable, agent-assisted programming.

The experimental roadmap and the semantic-kernel roadmap are separate axes. Do not treat adding language features as evidence that the core hypothesis has been validated.

## Research map

```text
POC 0.1                    POC 0.2                    POC 0.3                    POC 0.4
Certifying Projection      Neural Elaboration         Adaptive Codebook          Semantic Invariance

Can different syntax       Can an LLM suggest         Can admitted proposals     Does structural fluency
share verified identity?   semantics safely?          become deterministic?      transfer across syntax?
```

## POC 0.1 — Certifying Projection

### Research question

Can two syntactically distinct representations—initially Personal DSL and Python—share a machine-checkable semantic identity without trusting the target emitter?

### Experimental pipeline

```text
Personal source
    -> deterministic Parser A
    -> Canonical IR-A
    -> Kernel 0.1 admission
    -> reference execution
    -> Python emitter
    -> real CPython ast.parse() in Pyodide
    -> independent Python semantic reader
    -> Canonical IR-B
    -> normalize(IR-A) == normalize(IR-B)
    -> target execution
    -> compare declared observations
```

Parser A/emitter logic and the independent Python semantic reader must not share translation shortcuts that could cause the same bug to falsely validate itself.

### Reference program

Use only the Kernel 0.1 accumulator program from `SEMANTIC-KERNEL.md`.

### Required defeat tests

1. Change Python `total += x` to `total *= x`.
   - S2 should pass.
   - S3 must fail with ADD vs MUL semantic divergence.
2. Rename the target identifier.
   - S2 may pass.
   - S3 must fail.
3. Introduce invalid Python syntax.
   - S2 must fail.
4. Change the assertion from `13` to `999` consistently in both projections.
   - S0-S3 may pass.
   - S4 must report assertion failure rather than kernel rejection.
5. Introduce an undeclared semantic operation in the Personal surface.
   - it must not receive Kernel 0.1 admission.

### Success criterion

The happy path earns S4 from actual computed checks, and every defeat mutation halts/fails at the expected boundary.

The UI may not display standing, test counts, certificates, or verification claims unless they are backed by actual computed evidence.

## POC 0.2 — Neural Elaboration

### Research question

Can an LLM act as an open-ended syntactic elaborator without gaining authority over the semantic kernel?

### Mechanism

```text
unknown personal expression
        -> deterministic parser cannot resolve
        -> LLM proposes candidate IR + explanation
        -> proposal is frozen
        -> human chooses Accept Once / Admit Rule / Reject
        -> accepted candidate enters unchanged Kernel 0.1 admission
        -> ordinary S1-S4 pipeline continues
```

The LLM is outside the trusted computing base.

### Success criterion

Zero unadmitted LLM proposals can alter executable semantic state, produce execution standing, or expand the kernel.

## POC 0.3 — Adaptive Codebook

### Research question

Can repeated admitted neural interpretations compile into deterministic user-specific projection rules, reducing repeated LLM interpretation for recurring intents?

### Mechanism

Admitted mappings are stored declaratively and versioned, for example:

```yaml
dialect: personal
version: 0.3
mappings:
  add_update:
    - "gather {value} into {target}"
    - "pour {value} toward {target}"
    - "meld {value} with {target}"
```

Recognized patterns resolve symbolically. Novel patterns may invoke the POC 0.2 proposal flow.

### Measures

Track:

- deterministic resolution rate;
- admitted-rule coverage;
- rule reuse rate;
- novel-expression rate;
- LLM invocation rate per recurring semantic intent;
- rejected/ambiguous proposal rate.

Do not require LLM invocation count to decrease monotonically across arbitrary novel language. The claim is increased deterministic coverage for repeated/admitted intents.

### Success criterion

Previously admitted recurring intents increasingly resolve without an LLM while kernel semantics remain unchanged.

## POC 0.4 — Semantic Invariance Learning

### Research question

Does semantic identification survive syntactic perturbation?

This first experiment does not claim superiority over traditional instruction. It measures transfer across representation.

### Mechanism

Present semantically identical or contrasting programs through several projections:

- Personal dialect;
- Python;
- mathematical/structural notation;
- unseen scrambled vocabulary.

Ask the learner to identify structural concepts such as accumulator, iteration, update, branch, function, or state transition as later kernels make them available.

### Measures

Track:

- semantic-identification accuracy;
- response time;
- confidence;
- hints required;
- performance on unseen vocabulary;
- performance across projection switches.

### Success criterion

The learner can identify admitted computational structures above chance and with useful consistency when lexical cues are changed or removed.

## Two-dimensional roadmap

Experimental maturity:

```text
P0.1 Certify
  -> P0.2 Neural
  -> P0.3 Adapt
  -> P0.4 Learn
```

Semantic power:

```text
K0.1 Accumulate
  -> K0.2 Branch
  -> K0.3 Function
  -> K0.4 Record
  -> K0.5 Effects
  -> K0.6 Tensors
```

Do not advance horizontally merely because a later POC would look more interesting with more syntax. P0.1-P0.4 can and should be validated against the smallest practical kernel.

## Experimental hygiene

- A projection feature is not a kernel feature.
- An LLM proposal is not semantic evidence.
- A successful runtime example is not proof of translation equivalence.
- A round trip is weaker when producer and checker share the same implementation assumptions.
- An assertion failure is not the same as an invalid program.
- A target-language incidental behavior is not automatically canonical semantics.
- "Verified" must always state the standing level and kernel version.

## Initial POC artifact

The first persuasive demonstration should be tiny:

1. Personal and Python views show the same accumulator program.
2. Status earns `S4` from real checks.
3. Changing Python `+=` to `*=` keeps Python syntactically valid but revokes S3.
4. Changing it back restores standing.
5. Swapping the Personal surface to an alien vocabulary leaves the canonical IR and Python semantics unchanged.

That interaction demonstrates the central research claim without requiring a large language or a large IDE.