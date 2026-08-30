# Architecture Map

This directory describes the intended shape of Open Chat IDE without claiming that every described component exists yet.

Architecture documents are contracts and maps. Implementation standing lives in `STATUS.md` and executable evidence.

## Read order

1. [`TYPOLOGY.md`](./TYPOLOGY.md) — what kinds of things exist and what authority each kind carries.
2. [`TOPOLOGY.md`](./TOPOLOGY.md) — how those things may connect and cross boundaries.
3. [`AI-NATIVE.md`](./AI-NATIVE.md) — what "AI-native" means in this repository.
4. [`../PARITY.md`](../PARITY.md) — how research and the stable IDE remain one product line.
5. [`../STATUS.md`](../STATUS.md) — what is implemented, experimental, stubbed, or future.

## System shape

```text
Human + ChatGPT conversation
          |
          | intent / reasoning / proposals
          v
+------------------------------+
| Open Chat IDE shell          |
| files / editor / terminal    |
| workspace custody            |
+--------------+---------------+
               |
               | explicit capabilities
               v
+------------------------------+
| Capability / adapter seam    |
+---------+----------+---------+
          |          |
          |          +------------------+
          v                             v
 ordinary Python lane             semantic lane
 Pyodide / CPython                Semantic Kernel
          |                             |
          v                             v
 runtime observations         projections + receipts
          \                             /
           +------------+--------------+
                        v
                 evidence surfaces
           terminal / diagnostics / tests
```

## Dependency direction

The intended dependency direction is inward toward smaller, more explicit contracts:

```text
UI / agent / projections / adapters
                |
                v
        capability contracts
                |
        +-------+-------+
        |               |
        v               v
 workspace/runtime   semantic kernel
        |               |
        +-------+-------+
                v
             evidence
```

No outer convenience layer may silently redefine an inner authority boundary.

## Stub rule

A directory or README stub means only:

> this concern has a named boundary and an intended responsibility.

It does not mean the module is implemented, integrated, validated, or stable.
