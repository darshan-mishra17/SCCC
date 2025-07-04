
const axios = require('axios');

// Set your Groq API endpoint and key here
const GROQ_API_URL = process.env.GROQ_API_URL || 'https://api.groq.com/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = 'qwen/qwen3-32b'; // or 'llama3'

/**
 * Sends user input to Groq LLM to extract the value for the current field.
 * @param {string} userInput
 * @param {string} currentField
 * @returns {Promise<string>} Extracted value
 */
async function extractFieldValue(userInput, currentField) {
  const systemPrompt = `You are an AI assistant helping users configure cloud services. Extract only the value for the field: ${currentField}`;
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userInput }
  ];
  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: MODEL,
        messages,
        max_tokens: 20,
        temperature: 0
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    // Return only the model's reply (should be the value)
    return response.data.choices[0].message.content.trim();
  } catch (err) {
    console.error('Groq extractFieldValue error:', err.response?.data || err.message);
    throw new Error('Failed to extract field value from Groq');
  }
}

module.exports = { extractFieldValue };
