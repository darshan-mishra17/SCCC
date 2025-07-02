import axios from 'axios';

// 1. Send user prompt to /api/ai
export async function sendUserPrompt(promptType, context) {
  const res = await axios.post('/api/ai', {
    promptType,
    inputContext: context,
  });
  return res.data;
}

// 2. Calculate pricing via /api/pricing
export async function calculatePricing(config) {
  const res = await axios.post('/api/pricing', config);
  return res.data;
}
