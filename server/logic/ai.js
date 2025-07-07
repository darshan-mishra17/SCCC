// logic/ai.js (ESM)
// Mock Groq API integration and config validation

import { getGroqAIResponse } from './groq.js';

export async function generateConfig(promptType, inputContext) {
  // Use Groq API for real config
  try {
    return await getGroqAIResponse(promptType, inputContext);
  } catch (e) {
    // fallback to mock config if Groq fails
    return {
      ecs: { instanceType: 'ecs.g6.large', count: 2 },
      oss: { storageGB: 100 },
      tdsql: { nodes: 1, engine: 'MySQL' },
      _error: e.message,
    };
  }
}
