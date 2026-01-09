export const config = { runtime: "edge" };
import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is not set. Requests will fail.");
}

// Use Vercel AI Gateway with request-scoped BYOK (Bring Your Own Key)
const clientOptions: any = {
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL || "https://ai-gateway.vercel.sh/v1",
};
if (process.env.OPENAI_ORG_ID) clientOptions.organization = process.env.OPENAI_ORG_ID;

const openai = new OpenAI(clientOptions);
const CHAT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export default async function handler(req: Request): Promise<Response> {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "Server misconfigured", details: "OPENAI_API_KEY is not set" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { prompt?: unknown };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { prompt } = body;

  if (typeof prompt !== "string") {
    return new Response(JSON.stringify({ error: "Prompt must be a string" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (prompt.length === 0 || prompt.length > 2000) {
    return new Response(JSON.stringify({ error: "Prompt length invalid" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "user" as const, content: prompt }
      ]
    });

    const text = response.choices[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ result: text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("OpenAI error:", error);
    const details = typeof error?.error?.message === "string" ? error.error.message
      : typeof error?.message === "string" ? error.message
      : "Unknown error";
    return new Response(JSON.stringify({ error: "AI generation failed", details }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
