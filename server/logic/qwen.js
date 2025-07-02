// logic/qwen.js (now uses Groq API)
const { buildPrompt } = require('./promptBuilder');
const axios = require('axios');
require('dotenv').config();

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function getAIResponse(promptType, context) {
  // Use improved prompt builder for more accurate, structured output
  const prompt = buildPrompt(promptType, context);
  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'llama3-70b-8192',
        messages: [
          { role: 'system', content: 'You are an expert cloud solution advisor. Always respond in JSON. Only output the JSON, no explanation.' },
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
    // Expect response.data.choices[0].message.content as JSON
    let data = response.data?.choices?.[0]?.message?.content;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch { throw new Error('Malformed JSON from Groq'); }
    }
    if (!data || typeof data !== 'object') throw new Error('No valid config in Groq response');
    return data;
  } catch (err) {
    // Retry once if malformed
    if (!err._retried) {
      err._retried = true;
      return getAIResponse(promptType, context);
    }
    throw new Error('Groq API error: ' + err.message);
  }
}

module.exports = { getAIResponse };
