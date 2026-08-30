# Semantic Microkernel

This file defines the trusted semantic center of the agentic language experiment.

The microkernel is intentionally much smaller than the surface language. Surface syntax, codebooks, LLM elaboration, formatters, adapters, UI, and explanations are outside the trusted computing base.

## Kernel 0.1 objective

Kernel 0.1 represents exactly enough computation to express and verify a simple accumulator program.

It is deliberately not a general programming language.

## Canonical values

```text
Value
├── Int
├── Bool
└── Collection<Value>
```

## Canonical expressions

```text
Expr
├── Lit(value)
├── Ref(name)
└── Eq(left, right)
```

## Canonical statements

```text
Stmt
├── Bind(name, expr)
├── Iterate(binding, sourceExpr, body[])
├── AddUpdate(target, valueExpr)
├── Assert(conditionExpr)
└── Observe(label, valueExpr)
```

```text
Program := Stmt[]
```

The initial kernel prefers semantic composition over special-purpose constructs. For example, equality is an expression and `Assert` consumes a Boolean expression rather than introducing a separate `AssertEqual` primitive.

## Machine state

Kernel evaluation uses:

```text
Store σ       : VariableName -> Value
Observations ω: List<(Label, Value)>
```

Evaluation returns either success or a defined failure:

```text
ExecutionResult
├── Success(store, observations)
└── Failure(kind, store?, observations)
```

## Expression semantics

### Literal

```text
eval(Lit(v), σ) = v
```

### Reference

```text
if x ∈ dom(σ):
    eval(Ref(x), σ) = σ[x]
else:
    UnboundReference(x)
```

### Equality

```text
eval(Eq(a, b), σ) = (eval(a, σ) == eval(b, σ))
```

Kernel 0.1 equality is defined only over admitted Kernel 0.1 values.

## Statement semantics

### Bind

```text
v := eval(expr, σ)
σ' := σ[name -> v]
```

### AddUpdate

```text
current := σ[target]
value   := eval(valueExpr, σ)

require current : Int
require value   : Int

σ' := σ[target -> current + value]
```

Failure conditions include an unbound target or non-integer operands.

### Iterate

```text
collection := eval(sourceExpr, σ)
require collection : Collection

for each element in collection:
    evaluate body with binding -> element
```

Kernel 0.1 defines the loop binding as **iteration-local semantic state**. It is not part of the program's declared observable state after the loop unless explicitly copied into another binding.

Target languages may have different incidental scope behavior. Such differences must not be silently adopted as kernel semantics.

### Assert

```text
condition := eval(conditionExpr, σ)
require condition : Bool

if condition == true:
    continue
else:
    AssertionFailure
```

An assertion failure is a valid program execution result, not a kernel-admission failure.

### Observe

```text
value := eval(valueExpr, σ)
ω' := ω ++ [(label, value)]
```

Observations define the initial external comparison surface for differential execution.

## Kernel admission

A candidate program is admitted only when all constructs belong to the declared kernel version and all statically decidable obligations pass.

Kernel 0.1 rejects, rather than guesses about:

- undeclared operations;
- unknown node kinds;
- malformed references;
- unsupported value kinds;
- target-language constructs with no admitted reverse interpretation.

An LLM cannot expand this set by emitting a plausible node name.

## Equivalence levels

Do not collapse distinct claims into a single word such as "verified".

### Structural equivalence

```text
normalize(IR-A) == normalize(IR-B)
```

Kernel 0.1 uses this as the primary projection-equivalence gate.

### Semantic equivalence

Two admitted programs produce equivalent kernel behavior for the states covered by the semantic claim.

General program equivalence is outside POC 0.1.

### Observational equivalence

Reference execution and target execution agree over declared observations and declared externally relevant state.

Internal target-language artifacts, such as Python loop-variable leakage, are not automatically part of the kernel's observations.

## Standing model

The experimental pipeline uses earned standing:

```text
S0 SURFACE VALID
   A deterministic surface parser/elaborator produced candidate IR.

S1 KERNEL ADMITTED
   Candidate IR is valid under the declared kernel version.

S2 TARGET VALID
   The real target-language parser accepts the generated/edited target source.

S3 SEMANTICALLY RECONSTRUCTED
   An independent target reader reconstructs a normalized semantic IR equivalent to the admitted source IR.

S4 OBSERVATION AGREEMENT
   Reference-kernel execution and target execution agree over declared observations.
```

A false assertion can therefore pass S0-S3 and fail S4. Unsupported semantics should fail S1. Broken Python syntax should fail S2. A valid Python mutation from `+=` to `*=` should pass S2 and fail S3.

## Trusted and untrusted boundaries

### Trusted Kernel 0.1

- canonical IR definitions;
- well-formedness/type checks;
- evaluation rules;
- failure semantics;
- normalization rules;
- certificate/equivalence checker.

### Untrusted producers

- LLMs;
- personal grammars/codebooks;
- parsers outside the kernel;
- target emitters;
- pretty-printers;
- scramblers;
- documentation/explanations;
- UI.

"Untrusted" means a bug in the component must not be sufficient to redefine admitted semantic truth.

## Kernel evolution

Kernel expressive power grows independently from experimental maturity.

```text
K0.1 Accumulate
  -> K0.2 Branch
  -> K0.3 Functions and lexical scope
  -> K0.4 Records/product types
  -> K0.5 Effect boundaries
  -> K0.6 Tensor/reduction/neural primitives
```

Every kernel extension must define:

1. canonical syntax/IR nodes;
2. types and well-formedness obligations;
3. operational meaning;
4. failure behavior;
5. normal forms/equivalence rules where needed;
6. target-adapter obligations;
7. positive and negative tests;
8. kernel version change.

Prefer projection or normalization extensions over kernel extensions whenever the requested concept can already be represented compositionally.

## Kernel 0.1 reference program

```text
let total = 0
let values = [1, 3, 4, 5]

each x from values
    gather x into total

require total == 13
expose "Result" total
```

Canonical meaning:

```text
Program
├── Bind(total, Lit(0))
├── Bind(values, Lit([1,3,4,5]))
├── Iterate(x, Ref(values))
│   └── AddUpdate(total, Ref(x))
├── Assert(Eq(Ref(total), Lit(13)))
└── Observe("Result", Ref(total))
```

This single program is sufficient for POC 0.1. Do not expand the kernel merely to make the demonstration look more impressive.