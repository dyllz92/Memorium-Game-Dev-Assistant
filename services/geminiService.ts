
import { GoogleGenAI, FunctionDeclaration, Type, Tool, Modality } from "@google/genai";
import { Task, StoryNote, Character, TaskStatus, ProjectBrief, GameCodex, GameElement } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Tool Definitions ---

const generateImageTool: FunctionDeclaration = {
  name: 'generate_image',
  description: 'Generates a visual concept, memory shard, or card art based on a prompt.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: {
        type: Type.STRING,
        description: 'A detailed visual description focusing on emotional symbols and the psychological art style.',
      },
      aspectRatio: {
        type: Type.STRING,
        description: 'Aspect ratio.',
        enum: ["1:1", "3:4", "4:3", "16:9", "9:16"]
      }
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
      title: { type: Type.STRING, description: 'Short title of the task' },
      description: { type: Type.STRING, description: 'Detailed description of the task' },
      status: { type: Type.STRING, enum: ['TODO', 'IN_PROGRESS', 'DONE'], description: 'Initial status' }
    },
    required: ['title', 'status']
  }
};

const addStoryNoteTool: FunctionDeclaration = {
  name: 'add_story_note',
  description: 'Saves a piece of story, a specific memory description, or psychological mechanics to the Story Vault.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Title of the memory or story fragment' },
      content: { type: Type.STRING, description: 'The content/body of the story fragment' },
      tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Keywords like "trauma", "joy", "anchor", "mechanic"' }
    },
    required: ['title', 'content']
  }
};

const addCharacterTool: FunctionDeclaration = {
  name: 'add_character',
  description: 'Creates a new character profile. This could be the Patient, a Family Member, or a psychological manifestation within the mind.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'Name of the character' },
      role: { type: Type.STRING, description: 'Their role (e.g., The Patient, The Inner Child, The Grief Shadow)' },
      occupation: { type: Type.STRING, description: 'Their real-world job or their function in the mind' },
      maritalStatus: { type: Type.STRING, description: 'Relationship status to deepen the stakes' },
      description: { type: Type.STRING, description: 'Physical appearance, often symbolic in the coma world' },
      backstory: { type: Type.STRING, description: 'The history that led to these memories' },
      personalityTraits: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Internal traits' },
      abilities: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Mental abilities or card powers' },
      motivations: { type: Type.STRING, description: 'What drives this character or manifestation' },
      fears: { type: Type.STRING, description: 'What this character avoids or is haunted by' },
      relationships: { type: Type.STRING, description: 'Connections to other characters or to the patient' }
    },
    required: ['name', 'role', 'description', 'backstory', 'occupation', 'maritalStatus', 'personalityTraits', 'motivations', 'fears', 'relationships']
  }
};

const tools: Tool[] = [{
  functionDeclarations: [generateImageTool, addTaskTool, addStoryNoteTool, addCharacterTool]
}];

// --- Service Functions ---

export const generateImage = async (prompt: string, aspectRatio: string = "3:4"): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image gen error:", error);
    throw error;
  }
};

/**
 * Synthesizes the Project Brief into a structured GameCodex.
 */
export const compileGameBones = async (brief: ProjectBrief): Promise<GameCodex> => {
  const prompt = `
    I am building a psychological card game about unlocking memories of a person in a coma. 
    Here are the raw 'bones' from my project brief:
    
    TITLE: ${brief.title}
    GENRE/TONE: ${brief.genre}
    ART STYLE: ${brief.artStyle}
    WORLD/SETTING: ${brief.worldSetting}
    MECHANICS: ${brief.coreMechanicVisuals}
    CHARACTERS: ${brief.keyCharacters}
    
    Synthesize, reword, and expand this into a cohesive Game Codex.
    Return the response as a JSON array of GameElement objects:
    { "elements": [ { "id": "uuid", "category": "premise|mechanic|story|visual|character_arc", "title": "...", "content": "..." } ] }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
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

  const parsed = JSON.parse(response.text);
  return {
    elements: parsed.elements,
    lastUpdated: Date.now()
  };
};

/**
 * Applies requested changes to the current GameCodex.
 */
export const applyIterationChanges = async (currentCodex: GameCodex, changeRequest: string): Promise<GameCodex> => {
  const prompt = `
    You are Memorium, a Game Design Evolution Engine.
    
    CURRENT CODEX:
    ${JSON.stringify(currentCodex.elements, null, 2)}
    
    USER CHANGE REQUEST:
    "${changeRequest}"
    
    Update the Codex elements to reflect these changes. You can modify existing elements, delete them, or add new ones. 
    Ensure the narrative remains cohesive and the psychological depth is maintained.
    Return the FULL updated list of GameElement objects as JSON.
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

  const parsed = JSON.parse(response.text);
  return {
    elements: parsed.elements,
    lastUpdated: Date.now()
  };
};

export const sendMessageToGemini = async (
  history: any[],
  message: string,
  contextData: { tasks: Task[], notes: StoryNote[], characters: Character[], brief: ProjectBrief, codex: GameCodex },
  onToolCall: (toolName: string, args: any) => Promise<any>
) => {
  const codexSummary = contextData.codex.elements.map(e => `[${e.category.toUpperCase()}] ${e.title}: ${e.content.substring(0, 100)}...`).join('\n');
  const charSummary = contextData.characters.map(c => `- ${c.name} (${c.role}): Motivations: ${c.motivations}, Fears: ${c.fears}`).join('\n');
  
  const systemInstruction = `
    You are Memorium, a specialist in Psychological Game Design.
    
    CURRENT GAME CODEX:
    ${codexSummary}

    CURRENT CHARACTERS:
    ${charSummary}

    Your goal is to help the user explore the "sad and happy and everything in between" of a person in a coma.
    Always prioritize emotional resonance and psychological depth. 
    Use the characters' motivations, fears, and relationships to generate deeper story details and task suggestions.
  `;

  try {
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction,
        tools: tools,
      },
      history: history.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }] 
      }))
    });

    let response = await chat.sendMessage({ message });
    let textResponse = response.text || "";
    let functionCalls = response.functionCalls;

    if (functionCalls && functionCalls.length > 0) {
      const parts: any[] = [];
      for (const call of functionCalls) {
        const toolResult = await onToolCall(call.name, call.args);
        parts.push({
            functionResponse: {
                name: call.name,
                response: { result: toolResult }
            }
        });
      }
      const finalResponse = await chat.sendMessage({ message: parts });
      return {
        text: finalResponse.text,
        toolExecuted: true
      };
    }

    return { text: textResponse, toolExecuted: false };
  } catch (error) {
    console.error("Chat error:", error);
    return { text: "The mind is too cloudy to respond. Try again.", toolExecuted: false };
  }
};
