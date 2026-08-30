import { applyBuildProposal, buildAdvisorMessages, scenarioState } from "./advisor.mjs";
import { discoverLocalOpenAI, requestBuildProposal } from "./client.mjs";

function usage() {
  console.log(`Local Qwen skill-build advisor\n\nUsage:\n  node poc/local-qwen-skill-build/run-local.mjs [options]\n\nOptions:\n  --scenario base|trace|full   Evidence state to show Qwen (default: trace)\n  --goal TEXT                  Learning/build goal\n  --base-url URL               OpenAI-compatible /v1 base URL\n  --model ID                   Explicit local model id\n  --show-prompt                Print the messages sent to Qwen\n  --help                       Show this help\n\nDefaults auto-detect:\n  http://127.0.0.1:8080/v1   llama.cpp\n  http://127.0.0.1:11434/v1  Ollama\n`);
}

function parseArgs(argv) {
  const args = {
    scenario: "trace",
    goal: "Choose the strongest legal learning build available now.",
    baseUrl: process.env.QWEN_BASE_URL ?? null,
    model: process.env.QWEN_MODEL ?? null,
    showPrompt: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help") return { ...args, help: true };
    if (arg === "--show-prompt") args.showPrompt = true;
    else if (arg === "--scenario") args.scenario = argv[++index];
    else if (arg === "--goal") args.goal = argv[++index];
    else if (arg === "--base-url") args.baseUrl = argv[++index];
    else if (arg === "--model") args.model = argv[++index];
    else throw new Error(`unknown argument: ${arg}`);
  }
  return args;
}

function printResolution(label, resolution) {
  console.log(`\n${label}`);
  if (!resolution.valid) {
    for (const error of resolution.errors) console.log(`  ${error.code}: ${error.message}`);
    return;
  }
  console.log(`  budget: ${resolution.budget.spent}/${resolution.budget.available} (${resolution.budget.remaining} free)`);
  console.log(`  active: ${resolution.active.join(", ") || "(none)"}`);
  console.log(`  available: ${resolution.available.join(", ") || "(none)"}`);
  for (const item of resolution.locked) {
    console.log(`  locked: ${item.id} <- ${item.reasons.map((reason) => `${reason.code}:${reason.detail}`).join(", ")}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return usage();

  const state = scenarioState(args.scenario);
  const messages = buildAdvisorMessages(state, args.goal);
  if (args.showPrompt) console.log(JSON.stringify(messages, null, 2));

  let endpoint;
  try {
    endpoint = await discoverLocalOpenAI({ baseUrl: args.baseUrl, model: args.model });
  } catch (error) {
    console.error(String(error.message ?? error));
    console.error("\nStart llama.cpp with workbench option 7, 8, or 9; or start Ollama/Qwen with option 2. Then rerun this command.");
    process.exitCode = 1;
    return;
  }

  console.log(`endpoint: ${endpoint.baseUrl}`);
  console.log(`model:    ${endpoint.model}`);
  console.log(`scenario: ${args.scenario}`);

  const { proposal, reasoning } = await requestBuildProposal({
    baseUrl: endpoint.baseUrl,
    model: endpoint.model,
    messages,
  });

  if (reasoning) console.log("reasoning: returned separately by provider (not used for validation)");
  console.log(`proposal: ${JSON.stringify(proposal)}`);

  const result = applyBuildProposal(state, proposal);
  if (!result.accepted) {
    console.log("\nREFUSED by deterministic skill-build kernel");
    for (const error of result.errors) console.log(`  ${error.code} ${error.path}: ${error.message}`);
    process.exitCode = 2;
    return;
  }

  console.log("\nACCEPTED by deterministic skill-build kernel");
  printResolution("Resolved build", result.resolution);
}

main().catch((error) => {
  console.error(error?.stack ?? String(error));
  process.exitCode = 1;
});
