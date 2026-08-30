# Local Qwen Skill-Build Advisor POC

This POC connects the deterministic skill-build kernel to a local Qwen model without making the model a validator or authority.

```text
owned wiki + skills + evidence + current build
                  |
                  v
             local Qwen
                  |
            BUILD_PROPOSAL/1
                  |
                  v
       deterministic build kernel
             /           \
         ACCEPT          REFUSE
```

Qwen may recommend which already-earned skills to select. It cannot invent evidence, bypass prerequisites, overspend points, grant workspace permission, or change Semantic Kernel 0.1.

## Works with the Qwen local workbench

The client auto-detects these OpenAI-compatible local endpoints in order:

```text
Qwen workbench llama.cpp  http://127.0.0.1:10000/v1
common llama.cpp          http://127.0.0.1:8080/v1
Ollama                    http://127.0.0.1:11434/v1
```

For `qwen38-local-workbench-0.3.0`, the shortest first test is:

1. Choose **1** for the recommended one-click llama.cpp + Qwen setup, or choose **2** for Ollama.
2. If you start llama.cpp manually, **7 SAFE 16K** is enough for this tiny POC; move to 32K later if desired.
3. Option **10** can confirm the llama.cpp endpoint before running the IDE POC.
4. Clone/pull `bdf1992/ide` and run the commands below.

The model context required by this example is tiny; a large context window is not needed to prove the integration.

## Run the deterministic tests first

From the IDE repository root:

```powershell
node poc/local-qwen-skill-build/run-tests.mjs
```

Expected:

```text
local-qwen-skill-build: all tests passed
```

## Run against Qwen

```powershell
node poc/local-qwen-skill-build/run-local.mjs --scenario trace
```

Or on Windows, double-click:

```text
poc\local-qwen-skill-build\RUN-QWEN.cmd
```

`trace` supplies passing evidence for `Trace a loop`, so a useful model should normally propose:

```json
{
  "protocol": "BUILD_PROPOSAL/1",
  "selected": ["read-values", "trace-loop"],
  "reason": "..."
}
```

The reason is advisory text. Only `selected` is applied to a cloned candidate build, and the deterministic kernel checks it before anything becomes active.

## Scenarios

```powershell
node poc/local-qwen-skill-build/run-local.mjs --scenario base
node poc/local-qwen-skill-build/run-local.mjs --scenario trace
node poc/local-qwen-skill-build/run-local.mjs --scenario full
```

- `base` — only the root skill can be active.
- `trace` — trace-loop evidence exists, so `trace-loop` can be selected with its prerequisite.
- `full` — both challenge evidence records exist, so the complete three-point build can be proposed.

A bad model proposal is **refused rather than silently repaired**.

## Endpoint/model overrides

Auto-detection normally discovers the model through `/v1/models`. Override either field when needed:

```powershell
node poc/local-qwen-skill-build/run-local.mjs ^
  --base-url http://127.0.0.1:10000/v1 ^
  --model YOUR_MODEL_ID ^
  --scenario trace
```

Environment variables also work:

```powershell
$env:QWEN_BASE_URL = "http://127.0.0.1:10000/v1"
$env:QWEN_MODEL = "YOUR_MODEL_ID"
node poc/local-qwen-skill-build/run-local.mjs --scenario trace
```

Use `--show-prompt` to inspect the exact state sent to the model.

## What this proves

This is intentionally a small local adapter experiment:

```text
model = proposal/explanation
kernel = build legality
```

It proves that a local Qwen model can participate in the owned-wiki / skill-tree / build loop while remaining outside the deterministic gate.

It does **not** yet prove:

- autonomous WikiSkill-style wiki maintenance;
- skill creation/admission;
- real programming challenge execution as the evidence producer;
- stable browser/side-panel model integration;
- automatic IDE capability provisioning;
- authenticated evidence custody.

The next useful step after this works on the user's machine is to replace fixture evidence with observations produced by the existing accumulator semantic/Python execution path.
