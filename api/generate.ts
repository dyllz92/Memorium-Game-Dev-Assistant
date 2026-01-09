// /api/generate.ts
//
// Vercel Serverless Function (Request/Response Web API style)
// Handles the client-side contract used by services/geminiService.ts:
//
// POST /api/generate
// body: { action: string, payload: any }
//
// actions supported:
// - chat
// - compile_bones
// - apply_iteration
// - generate_image
//
// SECURITY: This file runs server-side only. API keys must come from env vars.
// Required env var: OPENAI_API_KEY

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type Action = "chat" | "compile_bones" | "apply_iteration" | "generate_image";

type ReqBody = {
  action?: unknown;
  payload?: unknown;
};

type ToolCall = {
  name: string;
  args: Record<string, unknown>;
};

const HEADERS_JSON = { "Content-Type": "application/json" };

// Keep these conservative for free-tier friendliness and abuse resistance
const MAX_MESSAGE_CHARS = 6000;
const MAX_HISTORY_ITEMS = 40;
const MAX_CONTEXT_CHARS = 20000;
const MAX_CHANGE_REQUEST_CHARS = 4000;
const MAX_BRIEF_JSON_CHARS = 20000;
const MAX_CODEX_JSON_CHARS = 40000;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: HEADERS_JSON });
}

function ok(body: unknown) {
  return json(200, body);
}

function badRequest(error: string, details?: string) {
  return json(400, details ? { error, details } : { error });
}

function serverError(error: string, details?: string) {
  return json(500, details ? { error, details } : { error });
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function clampString(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) : s;
}

function safeJsonStringify(value: unknown, maxChars: number, label: string): string {
  let str: string;
  try {
    str = JSON.stringify(value ?? null);
  } catch {
    // If circular or invalid, fall back to a minimal representation
    str = `"${label}: [unserialisable]"`;
  }
  if (str.length > maxChars) {
    return str.slice(0, maxChars) + `... ("${label}" truncated)`;
  }
  return str;
}

function extractJsonObject(text: string): string | null {
  // Tries to find the first top-level JSON object in the text.
  // This is a pragmatic fallback when the model returns extra text.
  const firstBrace = text.indexOf("{");
  if (firstBrace === -1) return null;

  let depth = 0;
  for (let i = firstBrace; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;

    if (depth === 0) {
      return text.slice(firstBrace, i + 1);
    }
  }
  return null;
}

function normaliseAspectRatio(ratio: string | null): "1:1" | "3:4" | "4:3" {
  if (!ratio) return "3:4";
  const r = ratio.trim();
  if (r === "1:1" || r === "3:4" || r === "4:3") return r;
  return "3:4";
}

function aspectRatioToSize(
  ratio: "1:1" | "3:4" | "4:3"
): { width: number; height: number } {
  // Common image sizes supported by OpenAI image generation.
  // If you later want different sizes, change these mappings.
  switch (ratio) {
    case "1:1":
      return { width: 1024, height: 1024 };
    case "4:3":
      return { width: 1536, height: 1024 };
    case "3:4":
    default:
      return { width: 1024, height: 1536 };
  }
}

async function parseBody(req: Request): Promise<ReqBody | null> {
  try {
    return (await req.json()) as ReqBody;
  } catch {
    return null;
  }
}

function validateEnv(): string | null {
  if (!process.env.OPENAI_API_KEY) return "OPENAI_API_KEY is not set";
  return null;
}

function sanitiseToolCalls(toolCalls: unknown): ToolCall[] {
  if (!Array.isArray(toolCalls)) return [];
  const clean: ToolCall[] = [];

  for (const t of toolCalls) {
    if (!isRecord(t)) continue;
    const name = asString(t.name);
    const args = t.args;

    if (!name) continue;
    if (!isRecord(args)) continue;

    // Only allow simple serialisable args
    clean.push({ name, args });
  }

  return clean;
}

export default async function handler(req: Request): Promise<Response> {
  const envErr = validateEnv();
  if (envErr) return serverError("Server misconfigured", envErr);

  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const body = await parseBody(req);
  if (!body) return badRequest("Invalid JSON body");

  const { action, payload } = body;

  if (typeof action !== "string") {
    return badRequest("Missing or invalid action");
  }

  const allowedActions: Action[] = ["chat", "compile_bones", "apply_iteration", "generate_image"];
  if (!allowedActions.includes(action as Action)) {
    return badRequest("Unsupported action", `Supported actions: ${allowedActions.join(", ")}`);
  }

  // -------------------------
  // ACTION: generate_image
  // Request: { action:"generate_image", payload:{ prompt:string, aspectRatio?:string } }
  // Response: { imageUri: "data:image/png;base64,..." }
  // -------------------------
  if (action === "generate_image") {
    if (!isRecord(payload)) return badRequest("Invalid payload");

    const prompt = asString(payload.prompt);
    const aspectRatio = normaliseAspectRatio(asString(payload.aspectRatio));

    if (!prompt || prompt.trim().length === 0) {
      return badRequest("prompt must be a non-empty string");
    }

    const clippedPrompt = clampString(prompt.trim(), MAX_MESSAGE_CHARS);
    const { width, height } = aspectRatioToSize(aspectRatio);

    try {
      // Note: If you prefer not to support images yet, you can return:
      // return ok({ imageUri: null });
      //
      // This implementation attempts to generate a PNG and returns a data URI.
      const img = await openai.images.generate({
        // Model name may change over time; this is a common default.
        model: "gpt-image-1",
        prompt: clippedPrompt,
        size: `${width}x${height}`,
      });

      const b64 = img.data?.[0]?.b64_json;
      if (!b64) {
        return serverError("Image generation failed", "No image data returned");
      }

      return ok({ imageUri: `data:image/png;base64,${b64}` });
    } catch (e) {
      console.error("OpenAI image error:", e);
      // Your UI treats image generation as optional and will fail silently.
      return serverError("Image generation failed");
    }
  }

  // -------------------------
  // ACTION: compile_bones
  // Request: { action:"compile_bones", payload:{ brief: ProjectBrief } }
  // Response: { elements: [...] }
  // -------------------------
  if (action === "compile_bones") {
    if (!isRecord(payload)) return badRequest("Invalid payload");

    const brief = payload.brief;

    const briefJson = safeJsonStringify(brief, MAX_BRIEF_JSON_CHARS, "brief");
    if (briefJson.length === 0) return badRequest("brief is required");

    const system = [
      "You are a game development assistant.",
      "You help transform a project brief into a structured game codex.",
      "Return STRICTLY valid JSON only.",
      "Do not include markdown fences.",
      'Return exactly: {"elements": <array>}.',
      "The elements array should be stable, well-structured, and suitable for rendering in a UI.",
      "Do not invent personal data. Keep it practical and implementation-ready.",
    ].join(" ");

    const user = [
      "Create a structured game codex from this project brief.",
      "Brief JSON:",
      briefJson,
      "",
      "Return JSON only:",
      '{"elements":[...]}',
    ].join("\n");

    try {
      const resp = await openai.responses.create({
        model: "gpt-5-nano",
        input: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });

      const text = (resp.output_text ?? "").trim();
      const jsonText = extractJsonObject(text) ?? text;

      try {
        const parsed = JSON.parse(jsonText);
        if (!isRecord(parsed) || !("elements" in parsed)) {
          return serverError("Model returned invalid structure", "Missing elements");
        }
        return ok({ elements: (parsed as any).elements });
      } catch {
        return serverError("Model did not return valid JSON");
      }
    } catch (e) {
      console.error("OpenAI compile_bones error:", e);
      return serverError("AI generation failed");
    }
  }

  // -------------------------
  // ACTION: apply_iteration
  // Request: { action:"apply_iteration", payload:{ codex: GameCodex, changeRequest: string } }
  // Response: { elements: [...] }
  // -------------------------
  if (action === "apply_iteration") {
    if (!isRecord(payload)) return badRequest("Invalid payload");

    const codex = payload.codex;
    const changeRequest = asString(payload.changeRequest);

    if (!changeRequest || changeRequest.trim().length === 0) {
      return badRequest("changeRequest must be a non-empty string");
    }
    if (changeRequest.length > MAX_CHANGE_REQUEST_CHARS) {
      return badRequest("changeRequest too long");
    }

    const codexJson = safeJsonStringify(codex, MAX_CODEX_JSON_CHARS, "codex");

    const system = [
      "You are a game development assistant.",
      "You update an existing game codex based on a change request.",
      "Return STRICTLY valid JSON only.",
      "Do not include markdown fences.",
      'Return exactly: {"elements": <array>}.',
      "Preserve structure unless the change request requires edits.",
      "Be precise and avoid unnecessary churn.",
    ].join(" ");

    const user = [
      "Update the game codex elements to satisfy the change request.",
      "Current codex JSON:",
      codexJson,
      "",
      "Change request:",
      clampString(changeRequest.trim(), MAX_CHANGE_REQUEST_CHARS),
      "",
      "Return JSON only:",
      '{"elements":[...]}',
    ].join("\n");

    try {
      const resp = await openai.responses.create({
        model: "gpt-5-nano",
        input: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });

      const text = (resp.output_text ?? "").trim();
      const jsonText = extractJsonObject(text) ?? text;

      try {
        const parsed = JSON.parse(jsonText);
        if (!isRecord(parsed) || !("elements" in parsed)) {
          return serverError("Model returned invalid structure", "Missing elements");
        }
        return ok({ elements: (parsed as any).elements });
      } catch {
        return serverError("Model did not return valid JSON");
      }
    } catch (e) {
      console.error("OpenAI apply_iteration error:", e);
      return serverError("AI generation failed");
    }
  }

  // -------------------------
  // ACTION: chat
  // Request: { action:"chat", payload:{ history:any[], message:string, contextData:{...} } }
  // Response: { text:string, toolCalls: ToolCall[] }
  //
  // The model must return JSON:
  // {"text":"...", "toolCalls":[{"name":"...", "args":{...}}]}
  // -------------------------
  if (action === "chat") {
    if (!isRecord(payload)) return badRequest("Invalid payload");

    const history = payload.history;
    const message = asString(payload.message);
    const contextData = payload.contextData;

    if (!message || message.trim().length === 0) {
      return badRequest("message must be a non-empty string");
    }
    if (message.length > MAX_MESSAGE_CHARS) {
      return badRequest("message too long");
    }

    const historyArr = Array.isArray(history) ? history.slice(-MAX_HISTORY_ITEMS) : [];
    const contextJson = safeJsonStringify(contextData, MAX_CONTEXT_CHARS, "contextData");

    const system = [
      "You are Memorium, a game development assistant.",
      "You must follow these rules:",
      "1) Return STRICTLY valid JSON only (no markdown, no extra text).",
      '2) Return exactly: {"text": string, "toolCalls": array}.',
      "3) toolCalls are OPTIONAL. Use them only when a client-side state update is required.",
      "4) If you include toolCalls, keep args minimal and serialisable.",
      "5) Never claim you executed tools; the client will execute them.",
      "",
      "toolCalls format:",
      '[{"name":"<toolName>", "args":{...}}]',
      "",
      "If no tools are needed, return toolCalls as an empty array.",
    ].join("\n");

    // We keep history as data for context; we don't assume a strict schema.
    const user = [
      "CONTEXT (JSON):",
      contextJson,
      "",
      "HISTORY (most recent last, JSON):",
      safeJsonStringify(historyArr, MAX_CONTEXT_CHARS, "history"),
      "",
      "USER MESSAGE:",
      clampString(message.trim(), MAX_MESSAGE_CHARS),
      "",
      "Return JSON only.",
    ].join("\n");

    try {
      const resp = await openai.responses.create({
        model: "gpt-5-nano",
        input: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });

      const raw = (resp.output_text ?? "").trim();
      const jsonText = extractJsonObject(raw) ?? raw;

      // Parse expected JSON; if it fails, fall back to plain text (no tools)
      try {
        const parsed = JSON.parse(jsonText);
        if (!isRecord(parsed)) {
          return ok({ text: raw, toolCalls: [] });
        }

        const text = typeof parsed.text === "string" ? parsed.text : raw;
        const toolCalls = sanitiseToolCalls(parsed.toolCalls);

        return ok({ text, toolCalls });
      } catch {
        // Fallback: treat model output as plain text so the UI still works
        return ok({ text: raw, toolCalls: [] });
      }
    } catch (e) {
      console.error("OpenAI chat error:", e);
      return serverError("AI generation failed");
    }
  }

  return badRequest("Unhandled action");
}
