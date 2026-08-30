# Architecture Map

This directory describes the intended shape of Open Chat IDE without claiming that every described component exists yet.

Architecture documents are contracts and maps. Implementation standing lives in `STATUS.md` and executable evidence.

## Read order

1. [`TYPOLOGY.md`](./TYPOLOGY.md) — what kinds of things exist and what authority each kind carries.
2. [`TOPOLOGY.md`](./TOPOLOGY.md) — how those things may connect and cross boundaries.
3. [`PROVIDERS.md`](./PROVIDERS.md) — how accepted capabilities bind to proven implementation substrates.
4. [`AI-NATIVE.md`](./AI-NATIVE.md) — what "AI-native" means in this repository.
5. [`../PARITY.md`](../PARITY.md) — how research and the stable IDE remain one product line.
6. [`../STATUS.md`](../STATUS.md) — what is implemented, experimental, stubbed, or future.

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
       adapter / direct UI call
               |
               v
+------------------------------+
| Capability contracts + gates |
+--------------+---------------+
               |
        provider resolution
               |
      +--------+--------+----------------+
      |        |        |                |
      v        v        v                v
    LSP     syntax     VCS            runtime
 provider  provider  provider         provider
      |        |        |                |
 Pyright* Tree-sitter isomorphic-git   Pyodide
      \        |        /                /
       +-------+-------+----------------+
                       |
                       v
                evidence surfaces
          terminal / diagnostics / tests
```

`Pyright*` is an example local/server language provider, not a claim that the official Pyright language server runs directly in every browser sandbox.

## Dependency direction

The intended dependency direction is inward toward smaller, more explicit contracts:

```text
UI / agent / projections / adapters
                |
                v
        capability contracts
                ^
                |
             providers
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

Adapters vary by host/transport. Providers vary by implementation substrate. Neither may silently redefine a capability or inner authority boundary.

## Stub rule

A directory or README stub means only:

> this concern has a named boundary and an intended responsibility.

It does not mean the module is implemented, integrated, validated, or stable.
