export const DEFAULT_BASE_URLS = [
  "http://127.0.0.1:8080/v1",
  "http://127.0.0.1:11434/v1",
];

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "");
}

async function fetchWithTimeout(fetchImpl, url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function discoverLocalOpenAI({
  baseUrl = null,
  model = null,
  fetchImpl = globalThis.fetch,
  timeoutMs = 1500,
} = {}) {
  if (typeof fetchImpl !== "function") throw new Error("fetch is unavailable; use Node 18+ or supply fetchImpl");

  const candidates = baseUrl ? [normalizeBaseUrl(baseUrl)] : DEFAULT_BASE_URLS;
  const attempts = [];

  for (const candidate of candidates) {
    try {
      const response = await fetchWithTimeout(fetchImpl, `${candidate}/models`, { method: "GET" }, timeoutMs);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = await response.json();
      const models = Array.isArray(body?.data) ? body.data.map((item) => item?.id).filter(Boolean) : [];
      const chosen = model ?? models[0];
      if (!chosen) throw new Error("endpoint returned no model id; pass --model explicitly");
      return { baseUrl: candidate, model: chosen, models };
    } catch (error) {
      attempts.push({ baseUrl: candidate, error: error instanceof Error ? error.message : String(error) });
    }
  }

  const detail = attempts.map((attempt) => `${attempt.baseUrl}: ${attempt.error}`).join("\n");
  throw new Error(`No compatible local OpenAI endpoint found.\n${detail}`);
}

function contentText(message) {
  if (typeof message?.content === "string") return message.content;
  if (Array.isArray(message?.content)) {
    return message.content
      .map((part) => (typeof part === "string" ? part : typeof part?.text === "string" ? part.text : ""))
      .join("");
  }
  return "";
}

export function extractFirstJsonObject(text) {
  if (typeof text !== "string") throw new Error("model response content must be text");

  for (let start = text.indexOf("{"); start !== -1; start = text.indexOf("{", start + 1)) {
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < text.length; index += 1) {
      const char = text[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"') inString = false;
        continue;
      }

      if (char === '"') inString = true;
      else if (char === "{") depth += 1;
      else if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          const candidate = text.slice(start, index + 1);
          try {
            return JSON.parse(candidate);
          } catch {
            break;
          }
        }
      }
    }
  }

  throw new Error("model response did not contain a valid JSON object");
}

export function parseBuildProposal(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("proposal must be a JSON object");
  if (value.protocol !== "BUILD_PROPOSAL/1") throw new Error("proposal.protocol must be BUILD_PROPOSAL/1");
  if (!Array.isArray(value.selected) || !value.selected.every((id) => typeof id === "string" && id.length > 0)) {
    throw new Error("proposal.selected must be an array of skill ids");
  }
  if (value.reason !== undefined && typeof value.reason !== "string") throw new Error("proposal.reason must be text when present");
  return { protocol: value.protocol, selected: [...value.selected], reason: value.reason ?? "" };
}

export async function requestBuildProposal({
  baseUrl,
  model,
  messages,
  fetchImpl = globalThis.fetch,
  timeoutMs = 120000,
}) {
  const response = await fetchWithTimeout(
    fetchImpl,
    `${normalizeBaseUrl(baseUrl)}/chat/completions`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.1,
        max_tokens: 500,
        stream: false,
      }),
    },
    timeoutMs,
  );

  if (!response.ok) {
    const body = typeof response.text === "function" ? await response.text() : "";
    throw new Error(`chat completion failed: HTTP ${response.status}${body ? ` ${body}` : ""}`);
  }

  const body = await response.json();
  const message = body?.choices?.[0]?.message;
  const raw = contentText(message);
  if (!raw) throw new Error("chat completion returned no message content");
  const proposal = parseBuildProposal(extractFirstJsonObject(raw));
  return { proposal, raw, reasoning: message?.reasoning_content ?? null };
}
