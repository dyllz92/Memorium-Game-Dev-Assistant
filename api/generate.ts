// /api/generate.ts
export const config = { runtime: "edge" };
import OpenAI from "openai";

// Use Vercel AI Gateway with request-scoped BYOK (Bring Your Own Key)
// The gateway routes requests to multiple providers and supports your own OpenAI key
const clientOptions: any = {
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL || "https://ai-gateway.vercel.sh/v1",
};
if (process.env.OPENAI_ORG_ID) clientOptions.organization = process.env.OPENAI_ORG_ID;
const openai = new OpenAI(clientOptions);
const CHAT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

type Action = "chat" | "compile_bones" | "apply_iteration" | "generate_image";
type ReqBody = { action?: unknown; payload?: unknown };
type ToolCall = { name: string; args: Record<string, unknown> };

const HEADERS = { "Content-Type": "application/json" };

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: HEADERS });
}

function describeError(e: unknown): string {
  try {
    if (e && typeof e === "object") {
      const err: any = e;
      const msg = typeof err.message === "string" ? err.message : null;
      const status = typeof err.status === "number" ? err.status : null;
      const dataMsg = typeof err.response?.data?.error?.message === "string" ? err.response.data.error.message : null;
      const nested = typeof err.error?.message === "string" ? err.error.message : null;
      const m = dataMsg || nested || msg;
      if (m && status) return `status ${status}: ${m}`;
      if (m) return m;
      return JSON.stringify(err).slice(0, 300);
    }
    return String(e);
  } catch {
    return "Unknown error";
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    if (ch === "}") depth--;
    if (depth === 0) return text.slice(start, i + 1);
  }
  return null;
}

function sanitiseToolCalls(toolCalls: unknown): ToolCall[] {
  if (!Array.isArray(toolCalls)) return [];
  const out: ToolCall[] = [];

  for (const t of toolCalls) {
    if (!isRecord(t)) continue;
    const name = asString(t.name);
    const args = t.args;
    if (!name) continue;
    if (!isRecord(args)) continue;
    out.push({ name, args });
  }

  return out;
}

function normaliseAspectRatio(ratio: string | null): "1:1" | "3:4" | "4:3" {
  if (!ratio) return "3:4";
  const r = ratio.trim();
  if (r === "1:1" || r === "3:4" || r === "4:3") return r;
  return "3:4";
}

function aspectRatioToSize(r: "1:1" | "3:4" | "4:3"): { width: 1024 | 1792; height: 1024 | 1792 } {
  if (r === "1:1") return { width: 1024, height: 1024 };
  if (r === "4:3") return { width: 1792, height: 1024 }; // DALL-E 3 landscape
  return { width: 1024, height: 1792 }; // DALL-E 3 portrait (3:4)
}

const MAX_MESSAGE_CHARS = 6000;
const MAX_HISTORY_ITEMS = 40;
const MAX_BRIEF_JSON_CHARS = 20000;
const MAX_CODEX_JSON_CHARS = 40000;
const MAX_CONTEXT_JSON_CHARS = 20000;
const MAX_CHANGE_REQUEST_CHARS = 4000;

export default async function handler(req: Request): Promise<Response> {
  if (!process.env.OPENAI_API_KEY) {
    return json(500, { error: "Server misconfigured", details: "OPENAI_API_KEY is not set" });
  }

  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const action = body.action;
  const payload = body.payload;

  if (typeof action !== "string") {
    return json(400, { error: "Missing or invalid action" });
  }

  const allowed: Action[] = ["chat", "compile_bones", "apply_iteration", "generate_image"];
  if (!allowed.includes(action as Action)) {
    return json(400, { error: "Unsupported action", details: `Supported: ${allowed.join(", ")}` });
  }

  // -------------------------
  // generate_image
  // payload: { prompt: string, aspectRatio?: string }
  // returns: { imageUri: string }
  // -------------------------
  if (action === "generate_image") {
    if (!isRecord(payload)) return json(400, { error: "Invalid payload" });

    const prompt = asString(payload.prompt);
    const aspectRatio = normaliseAspectRatio(asString(payload.aspectRatio));

    if (!prompt || prompt.trim().length === 0) {
      return json(400, { error: "prompt must be a non-empty string" });
    }
    if (prompt.length > MAX_MESSAGE_CHARS) {
      return json(400, { error: "prompt too long" });
    }

    const { width, height } = aspectRatioToSize(aspectRatio);

    try {
      const img = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt.trim(),
        size: `${width}x${height}` as "1024x1024" | "1024x1792" | "1792x1024",
        response_format: "b64_json",
      });

      const b64 = img.data?.[0]?.b64_json;
      if (!b64) return json(500, { error: "Image generation failed", details: "No image data returned" });

      return json(200, { imageUri: `data:image/png;base64,${b64}` });
    } catch (e) {
      console.error("Image error:", e);
      return json(500, { error: "Image generation failed", details: describeError(e) });
    }
  }

  // -------------------------
  // compile_bones
  // payload: { brief: ProjectBrief }
  // returns: { elements: any }
  // -------------------------
  if (action === "compile_bones") {
    if (!isRecord(payload)) return json(400, { error: "Invalid payload" });

    const briefJson = JSON.stringify(payload.brief ?? null);
    if (briefJson.length === 0) return json(400, { error: "brief is required" });
    if (briefJson.length > MAX_BRIEF_JSON_CHARS) return json(400, { error: "brief too large" });

    const system =
      'Return STRICT JSON only. No markdown. Output exactly {"elements": <array>}.';
    const user = `Create game codex elements from this brief JSON:\n${briefJson}\n\nReturn JSON only.`;

    try {
      const resp = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
          { role: "system" as const, content: system },
          { role: "user" as const, content: user },
        ],
        response_format: { type: "json_object" },
      });

      const raw = (resp.choices[0]?.message?.content ?? "").trim();
      const jsonText = extractFirstJsonObject(raw) ?? raw;

      const parsed = JSON.parse(jsonText);
      if (!isRecord(parsed) || !("elements" in parsed)) {
        return json(500, { error: "Model returned invalid structure" });
      }

      return json(200, { elements: (parsed as any).elements });
    } catch (e) {
      console.error("compile_bones error:", e);
      return json(500, { error: "AI generation failed", details: describeError(e) });
    }
  }

  // -------------------------
  // apply_iteration
  // payload: { codex: GameCodex, changeRequest: string }
  // returns: { elements: any }
  // -------------------------
  if (action === "apply_iteration") {
    if (!isRecord(payload)) return json(400, { error: "Invalid payload" });

    const changeRequest = asString(payload.changeRequest);
    if (!changeRequest || changeRequest.trim().length === 0) {
      return json(400, { error: "changeRequest must be a non-empty string" });
    }
    if (changeRequest.length > MAX_CHANGE_REQUEST_CHARS) {
      return json(400, { error: "changeRequest too long" });
    }

    const codexJson = JSON.stringify(payload.codex ?? null);
    if (codexJson.length > MAX_CODEX_JSON_CHARS) return json(400, { error: "codex too large" });

    const system =
      'Return STRICT JSON only. No markdown. Output exactly {"elements": <array>}. Preserve structure where possible.';
    const user = `Update codex elements based on the change request.

Current codex JSON:
${codexJson}

Change request:
${changeRequest.trim()}

Return JSON only.`;

    try {
      const resp = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
          { role: "system" as const, content: system },
          { role: "user" as const, content: user },
        ],
        response_format: { type: "json_object" },
      });

      const raw = (resp.choices[0]?.message?.content ?? "").trim();
      const jsonText = extractFirstJsonObject(raw) ?? raw;

      const parsed = JSON.parse(jsonText);
      if (!isRecord(parsed) || !("elements" in parsed)) {
        return json(500, { error: "Model returned invalid structure" });
      }

      return json(200, { elements: (parsed as any).elements });
    } catch (e) {
      console.error("apply_iteration error:", e);
      return json(500, { error: "AI generation failed", details: describeError(e) });
    }
  }

  // -------------------------
  // chat
  // payload: { history: any[], message: string, contextData: any }
  // returns: { text: string, toolCalls: ToolCall[] }
  // -------------------------
  if (action === "chat") {
    if (!isRecord(payload)) return json(400, { error: "Invalid payload" });

    const message = asString(payload.message);
    if (!message || message.trim().length === 0) {
      return json(400, { error: "message must be a non-empty string" });
    }
    if (message.length > MAX_MESSAGE_CHARS) {
      return json(400, { error: "message too long" });
    }

    const history = Array.isArray(payload.history) ? payload.history.slice(-MAX_HISTORY_ITEMS) : [];
    const contextJson = JSON.stringify(payload.contextData ?? null);
    const safeContext = contextJson.length > MAX_CONTEXT_JSON_CHARS
      ? contextJson.slice(0, MAX_CONTEXT_JSON_CHARS) + "...(truncated)"
      : contextJson;

    const system = `You are Memorium, a game dev assistant.

Return STRICT JSON only. No markdown. No extra text.
Format MUST be:
{"text": string, "toolCalls": array}

toolCalls format:
[{"name":"<toolName>","args":{...}}]

If no tools needed, toolCalls must be [].
Never claim you executed tools; the client will execute them.`;

    const user = `CONTEXT JSON:
${safeContext}

HISTORY JSON (most recent last):
${JSON.stringify(history)}

USER MESSAGE:
${message.trim()}

Return JSON only.`;

    try {
      const resp = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
          { role: "system" as const, content: system },
          { role: "user" as const, content: user },
        ],
        response_format: { type: "json_object" },
      });

      const raw = (resp.choices[0]?.message?.content ?? "").trim();
      const jsonText = extractFirstJsonObject(raw) ?? raw;

      try {
        const parsed = JSON.parse(jsonText);
        if (!isRecord(parsed)) return json(200, { text: raw, toolCalls: [] });

        const text = typeof parsed.text === "string" ? parsed.text : raw;
        const toolCalls = sanitiseToolCalls(parsed.toolCalls);

        return json(200, { text, toolCalls });
      } catch {
        // fallback: keep UI alive
        return json(200, { text: raw, toolCalls: [] });
      }
    } catch (e) {
      console.error("chat error:", e);
      return json(500, { error: "AI generation failed", details: describeError(e) });
    }
  }

  return json(400, { error: "Unhandled action" });
}
