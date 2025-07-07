// backend/services/groqService.js

import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export async function extractFieldValue(userMessage, fieldName) {
  const systemPrompt = `
You are a helpful AI assistant. Your task is to extract ONLY the value for the field: "${fieldName}" from the user message.

Examples:
- If the field is "operatingSystem", expected answers are "Linux", "Windows".
- If the field is "systemDiskGB", reply only with the number of GB.
- If the field is "engine", respond with values like "MySQL", "PostgreSQL".

Do not explain, just output the value directly.
`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage }
  ];

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: "qwen/qwen3-32b",
        messages,
        temperature: 0.2
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content.trim();
    return content;
  } catch (error) {
    console.error("Groq API Error:", error.message);
    return null;
  }
}
