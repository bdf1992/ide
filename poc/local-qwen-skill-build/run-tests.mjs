import assert from "node:assert/strict";
import { applyBuildProposal, buildAdvisorMessages, scenarioState } from "./advisor.mjs";
import { discoverLocalOpenAI, extractFirstJsonObject, requestBuildProposal } from "./client.mjs";

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

// JSON extraction tolerates Qwen thinking/prose and fenced JSON.
{
  const parsed = extractFirstJsonObject('<think>compare skills</think>\n```json\n{"protocol":"BUILD_PROPOSAL/1","selected":["read-values"]}\n```');
  assert.equal(parsed.protocol, "BUILD_PROPOSAL/1");
}

// The Qwen local workbench llama.cpp endpoint is preferred when available.
{
  const fetchImpl = async (url) => {
    if (String(url) === "http://127.0.0.1:10000/v1/models") return jsonResponse({ data: [{ id: "qwen38-27b-local" }] });
    throw new Error(`unexpected URL ${url}`);
  };
  const found = await discoverLocalOpenAI({ fetchImpl, timeoutMs: 50 });
  assert.equal(found.baseUrl, "http://127.0.0.1:10000/v1");
  assert.equal(found.model, "qwen38-27b-local");
}

// Discovery falls through workbench llama.cpp, conventional llama.cpp, then Ollama.
{
  const fetchImpl = async (url) => {
    if (String(url).startsWith("http://127.0.0.1:10000")) throw new Error("workbench offline");
    if (String(url).startsWith("http://127.0.0.1:8080")) throw new Error("llama.cpp offline");
    if (String(url) === "http://127.0.0.1:11434/v1/models") return jsonResponse({ data: [{ id: "qwen-local" }] });
    throw new Error(`unexpected URL ${url}`);
  };
  const found = await discoverLocalOpenAI({ fetchImpl, timeoutMs: 50 });
  assert.equal(found.baseUrl, "http://127.0.0.1:11434/v1");
  assert.equal(found.model, "qwen-local");
}

// A mocked local Qwen proposal can be parsed and admitted by the deterministic kernel.
{
  const state = scenarioState("trace");
  const messages = buildAdvisorMessages(state);
  const fetchImpl = async (url, options) => {
    assert.equal(String(url), "http://127.0.0.1:10000/v1/chat/completions");
    assert.equal(options.method, "POST");
    return jsonResponse({
      choices: [{ message: { content: '<think>trace is earned</think>\n{"protocol":"BUILD_PROPOSAL/1","selected":["read-values","trace-loop"],"reason":"trace evidence is present"}' } }],
    });
  };
  const { proposal } = await requestBuildProposal({
    baseUrl: "http://127.0.0.1:10000/v1",
    model: "qwen38-27b-local",
    messages,
    fetchImpl,
    timeoutMs: 50,
  });
  const result = applyBuildProposal(state, proposal);
  assert.equal(result.accepted, true);
  assert.deepEqual(result.resolution.active, ["read-values", "trace-loop"]);
}

// The model cannot bypass prerequisites/evidence: bad proposals are refused, not repaired.
{
  const state = scenarioState("trace");
  const result = applyBuildProposal(state, {
    protocol: "BUILD_PROPOSAL/1",
    selected: ["build-accumulator"],
    reason: "try to skip ahead",
  });
  assert.equal(result.accepted, false);
  const codes = new Set(result.errors.map((error) => error.code));
  assert(codes.has("SKILL_PREREQUISITE_REQUIRED"));
  assert(codes.has("SKILL_EVIDENCE_REQUIRED"));
}

console.log("local-qwen-skill-build: all tests passed");
