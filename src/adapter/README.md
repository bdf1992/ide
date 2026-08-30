# Adapter Boundary — STUB

Owns bindings between host/transport surfaces and transport-neutral capabilities.

An adapter makes a capability reachable. It is distinct from a provider, which fulfills an accepted capability against concrete IDE/runtime machinery.

## Expected adapter shapes

- ChatGPT state-packet / patch adapter;
- browser host adapter where an explicit crossing is useful;
- future local MCP-style adapter;
- future local-model/BYOM adapter.

## Owns

- serialization/transport binding;
- host-specific invocation/forwarding;
- conversion between host events and capability requests;
- host/transport availability and error reporting.

## Does not own

- capability meaning;
- provider implementation semantics;
- workspace custody rules;
- semantic admission;
- kernel semantics;
- proof/standing inflation.

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

## Current implementation

`IDE_STATE_PACKET/1` / `IDE_PATCH/1` in `index.html` are the existing lightweight chat adapter seam. There is no shared adapter framework and no native MCP server in the browser product.

## Promotion trigger

Extract an adapter boundary when the same capability contract needs more than one host/transport binding. Avoid a framework until multiple real bindings justify it.
