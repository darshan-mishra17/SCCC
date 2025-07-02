// logic/qwen.js
const axios = require('axios');
require('dotenv').config();

const QWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
const QWEN_API_KEY = process.env.QWEN_API_KEY;

async function getAIResponse(promptType, context) {
  // Build prompt
  const prompt = `Generate a structured JSON config for ${promptType} based on: ${JSON.stringify(context)}`;
  try {
    const response = await axios.post(
      QWEN_API_URL,
      {
        model: 'qwen-turbo',
        input: { prompt },
        parameters: { result_format: 'json' },
      },
      {
        headers: {
          'Authorization': `Bearer ${QWEN_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    // Expect response.data.output.choices[0].data as JSON
    let data = response.data?.output?.choices?.[0]?.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch { throw new Error('Malformed JSON from Qwen'); }
    }
    if (!data || typeof data !== 'object') throw new Error('No valid config in Qwen response');
    return data;
  } catch (err) {
    // Retry once if malformed
    if (!err._retried) {
      err._retried = true;
      return getAIResponse(promptType, context);
    }
    throw new Error('Qwen API error: ' + err.message);
  }
}

module.exports = { getAIResponse };
