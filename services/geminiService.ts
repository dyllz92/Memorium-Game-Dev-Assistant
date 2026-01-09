import { Task, StoryNote, Character, ProjectBrief, GameCodex } from '../types';

/**
 * SECURITY BOUNDARY: CLIENT-SIDE
 * This file runs in the user's browser.
 * DO NOT add any API keys or secrets here.
 * All AI logic is delegated to the /api/generate endpoint (server-side).
 */

const API_ENDPOINT = '/api/generate';

/**
 * Generic fetch wrapper for error handling
 */
async function callApi(action: string, payload: any) {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const details = errorData.details ? ` (${errorData.details})` : '';
      throw new Error(errorData.error ? `${errorData.error}${details}` : `Server error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Call Failed [${action}]:`, error);
    throw error;
  }
}

export const generateImage = async (prompt: string, aspectRatio: string = "3:4"): Promise<string | null> => {
  try {
    const data = await callApi('generate_image', { prompt, aspectRatio });
    return data.imageUri;
  } catch (error) {
    console.warn("Image generation failed silently to prevent UI disruption:", error);
    return null;
  }
};

export const compileGameBones = async (brief: ProjectBrief): Promise<GameCodex> => {
  const data = await callApi('compile_bones', { brief });
  return {
    elements: data.elements || [],
    lastUpdated: Date.now()
  };
};

export const applyIterationChanges = async (currentCodex: GameCodex, changeRequest: string): Promise<GameCodex> => {
  const data = await callApi('apply_iteration', { codex: currentCodex, changeRequest });
  return {
    elements: data.elements || [],
    lastUpdated: Date.now()
  };
};

export const sendMessageToGemini = async (
  history: any[],
  message: string,
  contextData: { tasks: Task[], notes: StoryNote[], characters: Character[], brief: ProjectBrief, codex: GameCodex },
  onToolCall: (toolName: string, args: any) => Promise<any>
) => {
  try {
    // Send message to server
    const data = await callApi('chat', { history, message, contextData });
    
    // Server returns the text response AND any tools it wants us to run locally
    const { text, toolCalls } = data;

    // Execute tools locally to update React State
    if (toolCalls && toolCalls.length > 0) {
      for (const tool of toolCalls) {
        // We await the tool call to update state.
        // The server response assumes success to generate the text.
        await onToolCall(tool.name, tool.args);
      }
      return { text, toolExecuted: true };
    }

    return { text, toolExecuted: false };
  } catch (error) {
    console.error("Chat error:", error);
    // Return a safe fallback message so the chat UI doesn't crash
    return { 
      text: "I'm having trouble reaching the creative core right now. Please try again in a moment.", 
      toolExecuted: false 
    };
  }
};
