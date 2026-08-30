# Adapter Boundary — STUB

Owns bindings between transport/runtime surfaces and transport-neutral capabilities.

## Expected adapter shapes

- ChatGPT state-packet / patch adapter;
- browser IDE adapter;
- future local MCP-style adapter;
- future local-model/BYOM adapter.

## Owns

- serialization/transport binding;
- environment-specific invocation;
- conversion between host events and capability requests;
- environment availability/error reporting.

## Does not own

- capability meaning;
- workspace custody rules;
- semantic admission;
- kernel semantics;
- proof/standing inflation.

## AI-native rule

Adapters may make capabilities reachable. They may not widen what those capabilities mean or who is allowed to exercise them.

## Current implementation

`IDE_STATE_PACKET/1` / `IDE_PATCH/1` in `index.html` are the existing lightweight chat adapter seam. There is no shared adapter framework and no native MCP server in the browser product.

## Promotion trigger

Extract an adapter boundary when the same capability contract needs more than one transport/runtime binding. Avoid a framework until multiple real bindings justify it.
