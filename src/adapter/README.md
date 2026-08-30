# Adapter Boundary — STUB

Owns bindings between host/transport surfaces and transport-neutral capabilities.

An adapter makes a capability reachable. It is distinct from a provider, which fulfills an accepted capability against concrete IDE/runtime machinery.

## Expected adapter shapes

- Chat profile state-packet / patch adapter;
- browser host adapter where an explicit crossing is useful;
- Work profile host/Cloud Browser adapter where supported;
- future local MCP-style adapter;
- future local-model/BYOM adapter.

Host profiles are described in [`../../architecture/HOST-PROFILES.md`](../../architecture/HOST-PROFILES.md). Chat is the minimum supported product profile; Work may add stronger transports/providers but must not redefine capability meaning or custody.

## Owns

- serialization/transport binding;
- host-specific invocation/forwarding;
- conversion between host events and capability requests;
- host/transport availability and error reporting;
- selection of an available host binding without changing the capability contract.

## Does not own

- capability meaning;
- provider implementation semantics;
- workspace custody rules;
- semantic admission;
- kernel semantics;
- proof/standing inflation;
- host-specific authority expansion.

## AI-native rule

Adapters may make capabilities reachable. They may not widen what those capabilities mean or who is allowed to exercise them.

```text
host event
  -> adapter
  -> capability request
  -> gates
  -> provider
```

A browser UI that already lives inside the trusted product boundary may call a capability directly when no transport translation is required. Do not create an adapter merely to add ceremony.

## Host-profile rule

The same capability may have multiple host bindings:

```text
Chat state packet ----\
                       > capability request -> gates -> provider
Work host bridge -----/
```

Every promoted multi-host adapter path must define:

- the Chat behavior;
- the Work behavior;
- the unavailable/degraded behavior;
- why the host binding does not alter custody or authority.

A Work-only adapter is acceptable for genuinely Work-only transport machinery. It may not become an undeclared dependency of the Chat baseline.

## Current implementation

`IDE_STATE_PACKET/1` / `IDE_PATCH/1` in `index.html` are the existing lightweight Chat adapter seam. There is no shared adapter framework and no native MCP server in the browser product.

The Work profile is currently architecture/SPEC only. No shared Work adapter runtime is claimed.

## Promotion trigger

Extract an adapter boundary when the same capability contract needs more than one real host/transport binding. Avoid a framework until multiple real bindings justify it.
