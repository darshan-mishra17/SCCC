// logic/groq.js
import axios from 'axios';
import dotenv from 'dotenv';
import { buildPrompt } from './promptBuilder.js';
dotenv.config();

const GROQ_API_URL = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function getGroqAIResponse(promptType, context) {
  // Use improved prompt builder
  const prompt = buildPrompt(promptType, context);
  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'llama3-70b-8192',
        messages: [
          { role: 'system', content: 'You are an expert cloud solution advisor. Always respond in JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    // Log raw response for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log('[GROQ RAW RESPONSE]', JSON.stringify(response.data, null, 2));
    }
    let data = response.data?.choices?.[0]?.message?.content;
    if (typeof data === 'string') {
      // Try to extract JSON if extra text is present
      const jsonMatch = data.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          data = JSON.parse(jsonMatch[0]);
        } catch (e) {
          throw new Error('Malformed JSON from Groq: ' + e.message + '\nRaw: ' + data);
        }
      } else {
        throw new Error('Malformed JSON from Groq: No JSON object found. Raw: ' + data);
      }
    }
    if (!data || typeof data !== 'object') throw new Error('No valid config in Groq response');
    return data;
  } catch (err) {
    // Log full error for debugging
    console.error('[GROQ ERROR]', err && (err.response?.data || err.stack || err));
    // Retry once if malformed
    if (!err._retried) {
      err._retried = true;
      return getGroqAIResponse(promptType, context);
    }
    throw new Error('Groq API error: ' + (err.message || JSON.stringify(err)));
  }
}

export { getGroqAIResponse };
