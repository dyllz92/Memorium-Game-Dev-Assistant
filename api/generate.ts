import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";

/**
 * CONFIGURATION: NODE RUNTIME
 * Uses Node.js request/response objects in the Vercel serverless environment.
 */
export const config = {
  runtime: 'nodejs',
};

/**
 * SECURITY BOUNDARY: SERVER-SIDE ONLY
 * This file runs in a secure serverless environment.
 * Secrets like GEMINI_API_KEY are safe here via process.env.
 */

// Security Constants
const MAX_PROMPT_LENGTH = 2000;

// Initialize AI Client
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("Security Warning: GEMINI_API_KEY is not set in the environment variables.");
}
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// --- Tool Definitions ---

const generateImageTool: FunctionDeclaration = {
  name: 'generate_image',
  description: 'Generates a visual concept, memory shard, or card art based on a prompt.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: { type: Type.STRING, description: 'Visual description.' },
      aspectRatio: { type: Type.STRING, enum: ["1:1", "3:4", "4:3", "16:9", "9:16"] }
    },
    required: ['prompt'],
  },
};

const addTaskTool: FunctionDeclaration = {
  name: 'add_task',
  description: 'Adds a new task to the project management board.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      status: { type: Type.STRING, enum: ['TODO', 'IN_PROGRESS', 'DONE'] }
    },
    required: ['title', 'status']
  }
};

const addStoryNoteTool: FunctionDeclaration = {
  name: 'add_story_note',
  description: 'Saves a piece of story or memory.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      content: { type: Type.STRING },
      tags: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ['title', 'content']
  }
};

const addCharacterTool: FunctionDeclaration = {
  name: 'add_character',
  description: 'Creates a new character profile.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      role: { type: Type.STRING },
      occupation: { type: Type.STRING },
      maritalStatus: { type: Type.STRING },
      description: { type: Type.STRING },
      backstory: { type: Type.STRING },
      personalityTraits: { type: Type.ARRAY, items: { type: Type.STRING } },
      abilities: { type: Type.ARRAY, items: { type: Type.STRING } },
      motivations: { type: Type.STRING },
      fears: { type: Type.STRING },
      relationships: { type: Type.STRING }
    },
    required: ['name', 'role', 'description', 'backstory', 'occupation', 'maritalStatus', 'personalityTraits', 'motivations', 'fears', 'relationships']
  }
};

const tools: Tool[] = [{
  functionDeclarations: [generateImageTool, addTaskTool, addStoryNoteTool, addCharacterTool]
}];

/**
 * Validates input text content for security and length constraints.
 */
function validateInput(text: unknown, fieldName: string = 'Input'): string {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error(`Invalid input: ${fieldName} is missing or empty.`);
  }
  if (text.length > MAX_PROMPT_LENGTH) {
    throw new Error(`Invalid input: ${fieldName} exceeds ${MAX_PROMPT_LENGTH} characters.`);
  }
  return text.trim();
}

type NodeRequest = {
  method?: string;
  body?: unknown;
  on?: (event: string, listener: (chunk: Buffer) => void) => void;
};

type NodeResponse = {
  status: (code: number) => NodeResponse;
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
};

async function readJsonBody(req: NodeRequest): Promise<any> {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      return JSON.parse(req.body);
    }
    return req.body;
  }

  if (!req.on) {
    return {};
  }

  return new Promise((resolve, reject) => {
    let data = '';
    req.on?.('data', (chunk: Buffer) => {
      data += chunk.toString();
    });
    req.on?.('end', () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });
    req.on?.('error', reject);
  });
}

function sendJson(res: NodeResponse, status: number, payload: any) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

/**
 * Main Request Handler (Node.js)
 */
export default async function handler(req: NodeRequest, res: NodeResponse) {
  // 1. HTTP Method Validation
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  // 2. Environment Validation
  if (!ai) {
    console.error("Server Error: GEMINI_API_KEY is not configured.");
    sendJson(res, 503, { error: 'Service unavailable' });
    return;
  }

  try {
    // 3. Payload Validation
    const body = await readJsonBody(req);
    const { action, payload } = body;

    if (!payload) {
       throw new Error("Missing payload");
    }

    // --- Action Handlers ---

    // Handler: Image Generation
    if (action === 'generate_image') {
      const validPrompt = validateInput(payload.prompt, 'Prompt');
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: validPrompt }] },
        config: { imageConfig: { aspectRatio: payload.aspectRatio as any } }
      });
      
      let imageUri = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUri = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      sendJson(res, 200, { 
        result: "Image generated successfully",
        imageUri 
      });
      return;
    }

    // Handler: Game Bones (Codex Synthesis)
    if (action === 'compile_bones') {
      const brief = payload.brief;
      if (!brief) throw new Error("Missing brief");
      
      // Validate component parts
      const promptText = `
        I am building a psychological card game. Synthesize this brief into a Game Codex JSON:
        TITLE: ${validateInput(brief.title, 'Title')}
        GENRE: ${validateInput(brief.genre, 'Genre')}
        ART: ${validateInput(brief.artStyle, 'Art Style')}
        SETTING: ${validateInput(brief.worldSetting, 'Setting')}
        MECHANICS: ${validateInput(brief.coreMechanicVisuals, 'Mechanics')}
        CHARACTERS: ${validateInput(brief.keyCharacters, 'Characters')}
        
        Return JSON array of GameElements.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: promptText,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              elements: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    category: { type: Type.STRING, enum: ['premise', 'mechanic', 'story', 'visual', 'character_arc'] },
                    title: { type: Type.STRING },
                    content: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });
      
      // The response.text is already a JSON string. We parse it to wrap it in our result structure.
      const data = JSON.parse(response.text || "{}");
      sendJson(res, 200, {
        result: "Codex compiled successfully",
        elements: data.elements || []
      });
      return;
    }

    // Handler: Apply Iteration
    if (action === 'apply_iteration') {
      const validChange = validateInput(payload.changeRequest, 'Change Request');
      
      const prompt = `
        Update this Game Codex based on the user request.
        CURRENT CODEX: ${JSON.stringify(payload.codex.elements)}
        REQUEST: "${validChange}"
        Return JSON object with "elements" array.
      `;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              elements: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    category: { type: Type.STRING, enum: ['premise', 'mechanic', 'story', 'visual', 'character_arc'] },
                    title: { type: Type.STRING },
                    content: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      sendJson(res, 200, {
        result: "Iteration applied successfully",
        elements: data.elements || []
      });
      return;
    }

    // Handler: Chat (Default)
    if (action === 'chat') {
      const validMessage = validateInput(payload.message, 'Message');
      
      const codexSummary = payload.contextData?.codex?.elements
        ? payload.contextData.codex.elements.map((e: any) => `[${e.category.toUpperCase()}] ${e.title}: ${e.content.substring(0, 100)}...`).join('\n')
        : '';
        
      const charSummary = payload.contextData?.characters
        ? payload.contextData.characters.map((c: any) => `- ${c.name} (${c.role}): ${c.motivations}`).join('\n')
        : '';

      const systemInstruction = `
        You are Memorium, a specialist in Psychological Game Design.
        CONTEXT: ${codexSummary}
        CHARACTERS: ${charSummary}
        Prioritize emotional resonance.
      `;

      // Validate history length to prevent context flooding
      const history = Array.isArray(payload.history) ? payload.history.slice(-10) : [];

      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: { systemInstruction, tools },
        history: history.map((h: any) => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: validateInput(h.content, 'History Content') }] // Recursively validate history
        }))
      });

      const result = await chat.sendMessage({ message: validMessage });
      const functionCalls = result.functionCalls;
      
      let responseText = result.text || "";
      const pendingToolCalls = [];

      if (functionCalls && functionCalls.length > 0) {
        const parts: any[] = [];
        for (const call of functionCalls) {
          pendingToolCalls.push({ name: call.name, args: call.args });
          parts.push({
            functionResponse: {
              name: call.name,
              response: { result: { status: 'success', message: 'Action scheduled for client execution.' } }
            }
          });
        }
        
        const finalResponse = await chat.sendMessage({ message: parts });
        responseText = finalResponse.text || "I've scheduled that action for you.";
      }

      // Return strictly structured response
      sendJson(res, 200, { 
        result: responseText, // Primary result string
        text: responseText,   // Backward compatibility
        toolCalls: pendingToolCalls 
      });
      return;
    }

    throw new Error("Unknown action requested");

  } catch (error: any) {
    // 4. Secure Error Handling (No stack traces)
    console.error("API Error:", error.message);
    
    // Distinguish between validation errors (400) and server errors (500)
    const status = error.message.includes('Invalid input') || error.message.includes('Missing') ? 400 : 500;
    
    sendJson(res, status, { 
      error: 'Request could not be processed.',
      details: status === 400 ? error.message : undefined 
    });
    return;
  }
}
