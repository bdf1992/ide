# Agent Boundary — STUB

Owns optional AI-assisted interpretation and proposal behavior outside trusted semantics.

## Owns

- semantic candidate proposals;
- projection/codebook suggestions;
- explanations and comparisons;
- ambiguity surfacing;
- future orchestration of explicit capabilities.

## Does not own

- semantic admission by confidence;
- kernel mutation;
- direct workspace overwrite;
- execution standing;
- hidden live editor state.

## Current implementation

The active agent behavior is primarily the ChatGPT conversation plus `IDE-SKILL.md` and explicit `IDE_STATE_PACKET/1` / `IDE_PATCH/1` exchange.

POC 0.1 deliberately excludes LLM elaboration from the trusted loop. Neural elaboration begins at POC 0.2.

## Promotion trigger

Add shared code here only when a deterministic/local agent adapter needs reusable proposal logic or typed candidate formats. Keep all results proposal-shaped until an explicit gate admits them.
