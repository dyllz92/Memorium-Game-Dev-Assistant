import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export default async function handler(req: Request): Promise<Response> {
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
    const response = await openai.responses.create({
      model: "gpt-5-nano",
      input: prompt
      // If you later want storage, add store: true
    });

    return new Response(JSON.stringify({ result: response.output_text ?? "" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("OpenAI error:", error);
    return new Response(JSON.stringify({ error: "AI generation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
