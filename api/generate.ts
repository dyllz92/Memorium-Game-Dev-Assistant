import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type Action = "chat" | "compile_bones" | "apply_iteration" | "generate_image";

type ReqBody = {
  action?: unknown;
  payload?: unknown;
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

const MAX_PROMPT_CHARS = 6000;
const MAX_NOTES_CHARS = 12000;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const { action, payload } = body;

  if (typeof action !== "string") {
    return json(400, { error: "Missing or invalid action" });
  }

  if (
    action !== "chat" &&
    action !== "compile_bones" &&
    action !== "apply_iteration" &&
    action !== "generate_image"
  ) {
    return json(400, { error: "Unsupported action" });
  }

  // ACTION: chat
  // Expects payload: { prompt: string, system?: string }
  // Returns: { text: string }
  if (action === "chat") {
    if (!isRecord(payload)) return json(400, { error: "Invalid payload" });

    const prompt = payload.prompt;
    const system = payload.system;

    if (typeof prompt !== "string" || prompt.length === 0) {
      return json(400, { error: "prompt must be a non-empty string" });
    }
    if (prompt.length > MAX_PROMPT_CHARS) {
      return json(400, { error: "prompt too long" });
    }
    if (system != null && typeof system !== "string") {
      return json(400, { error: "system must be a string if provided" });
    }

    try {
      const response = await openai.responses.create({
        model: "gpt-5-nano",
        input: [
          ...(system ? [{ role: "system" as const, content: system }] : []),
          { role: "user" as const, content: prompt },
        ],
      });

      return json(200, { text: response.output_text ?? "" });
    } catch (e) {
      console.error("OpenAI chat error:", e);
      return json(500, { error: "AI generation failed" });
    }
  }

  // ACTION: compile_bones / apply_iteration
  // Expects payload: { notes: string, instructions?: string }
  // Returns: { elements: unknown }
  if (action === "compile_bones" || action === "apply_iteration") {
    if (!isRecord(payload)) return json(400, { error: "Invalid payload" });

    const notes = payload.notes;
    const instructions = payload.instructions;

    if (typeof notes !== "string" || notes.length === 0) {
      return json(400, { error: "notes must be a non-empty string" });
    }
    if (notes.length > MAX_NOTES_CHARS) {
      return json(400, { error: "notes too long" });
    }
    if (instructions != null && typeof instructions !== "string") {
      return json(400, { error: "instructions must be a string if provided" });
    }

    const system = [
      "You are a game dev assistant.",
      "Return strictly valid JSON only.",
      "Do not include markdown fences.",
      'Return a single JSON object with an "elements" property.',
    ].join(" ");

    const user = `TASK: ${action}
NOTES:
${notes}

${instructions ? `INSTRUCTIONS:\n${instructions}\n` : ""}

Return JSON like:
{"elements":[...]} or {"elements":{...}}`;

    try {
      const response = await openai.responses.create({
        model: "gpt-5-nano",
        input: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });

      const text = response.output_text ?? "";

      try {
        const parsed = JSON.parse(text);
        if (!isRecord(parsed) || !("elements" in parsed)) {
          return json(500, { error: "Model returned invalid structure" });
        }
        return json(200, { elements: (parsed as any).elements });
      } catch {
        return json(500, { error: "Model did not return valid JSON" });
      }
    } catch (e) {
      console.error("OpenAI structured error:", e);
      return json(500, { error: "AI generation failed" });
    }
  }

  // ACTION: generate_image
  // Not implemented until you confirm what the frontend expects (data URL vs hosted URL)
  if (action === "generate_image") {
    return json(400, {
      error:
        "generate_image not implemented yet. Tell me what image format your frontend expects (data URL vs hosted URL).",
    });
  }

  return json(500, { error: "Unhandled action" });
}
