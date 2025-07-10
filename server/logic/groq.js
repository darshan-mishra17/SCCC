// logic/groq.js
import axios from 'axios';
import dotenv from 'dotenv';
import { buildPrompt } from './promptBuilder.js';
dotenv.config();

const GROQ_API_URL = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function getGroqConversationalResponse(prompt) {
  try {
    console.log('[DEBUG] AI Prompt being sent:', prompt);
    
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'llama3-70b-8192', // Using reliable Llama model for conversation
        messages: [
          { 
            role: 'system', 
            content: `You are a friendly SCCC cloud sales advisor. Your job is to have natural conversations with customers to configure their cloud services.

IMPORTANT CONVERSATION RULES:
- Ask ONE specific question at a time
- Be conversational, helpful, and professional
- Keep questions brief and clear (under 25 words)
- If there are specific options, mention them naturally
- If there's a range, mention it helpfully
- Use natural language, not technical jargon
- Never use thinking tags like <think> or internal monologue
- Respond with ONLY the question or response, nothing else
- Make the customer feel comfortable and guided

EXAMPLES:
- "What type of instance would work best for you? We have t6.medium, t6.large, g6.large, or g6.xlarge available."
- "How many instances do you need? You can choose anywhere from 1 to 50."
- "What database engine would you prefer? We support MySQL 8.0, MySQL 5.7, PostgreSQL 13, or PostgreSQL 12."` 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6, // Higher for more natural conversation
        max_tokens: 150
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
    
    const content = response.data?.choices?.[0]?.message?.content;
    if (typeof content === 'string') {
      console.log('[DEBUG] Raw AI response:', content);
      
      // Comprehensive preprocessing to clean the response
      let cleanContent = content
        // Remove <think> tags and ALL content between them (case insensitive, multiline)
        .replace(/<think[\s\S]*?<\/think>/gi, '')
        .replace(/<thinking[\s\S]*?<\/thinking>/gi, '')
        .replace(/\[thinking[\s\S]*?\]/gi, '')
        .replace(/\(thinking[\s\S]*?\)/gi, '')
        // Remove any remaining stray tags
        .replace(/\<\/?think\>/gi, '')
        .replace(/\<\/?thinking\>/gi, '')
        .replace(/\<think[\s\S]*?\>/gi, '')
        // Remove common AI thinking patterns
        .replace(/^(Let me think|I need to|The user|Looking at|Based on|Given that).*?[.!?]/gi, '')
        .replace(/^.*?(should ask|need to ask|will ask|wants me to).*?[.!?]/gi, '')
        // Remove explanatory text before questions
        .replace(/^.*?(Here's|This is|Now I'll).*?[:.]/gi, '')
        // Clean up multiple spaces and newlines
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, ' ')
        // Trim and clean
        .trim();
      
      // If multiple sentences, extract the actual question
      const sentences = cleanContent.split(/[.!?]/).filter(s => s.trim().length > 5);
      if (sentences.length > 1) {
        // Find the sentence with a question mark or the last substantial sentence
        const questionSentence = sentences.find(s => s.includes('?')) || 
                                sentences.find(s => s.trim().length > 10) || 
                                sentences[sentences.length - 1];
        cleanContent = questionSentence.trim();
      }
      
      // Ensure it ends with appropriate punctuation
      if (cleanContent && !cleanContent.match(/[.!?]$/)) {
        if (cleanContent.toLowerCase().includes('what') || 
            cleanContent.toLowerCase().includes('which') || 
            cleanContent.toLowerCase().includes('how') ||
            cleanContent.toLowerCase().includes('where')) {
          cleanContent += '?';
        } else {
          cleanContent += '.';
        }
      }
      
      console.log('[DEBUG] Cleaned AI response:', cleanContent);
      
      // Fallback if content is empty after cleaning
      if (!cleanContent || cleanContent.length < 5) {
        cleanContent = 'Please provide the requested information.';
      }
      
      return cleanContent;
    }
    throw new Error('No valid response from Groq');
  } catch (err) {
    console.error('[GROQ CONVERSATIONAL ERROR]', err && (err.response?.data || err.stack || err));
    // Intelligent fallback based on the prompt
    if (prompt && prompt.includes('options:')) {
      const optionsMatch = prompt.match(/options:\s*([^)]+)/i);
      if (optionsMatch) {
        return `Please choose from: ${optionsMatch[1]}`;
      }
    }
    if (prompt && prompt.includes('range:')) {
      const rangeMatch = prompt.match(/range:\s*([^)]+)/i);
      if (rangeMatch) {
        return `Please enter a value in range: ${rangeMatch[1]}`;
      }
    }
    return 'Could you please provide the requested information?';
  }
}

// New specialized function for extracting numeric values from AI responses
async function getGroqNumericExtraction(prompt) {
  try {
    console.log('[DEBUG] AI Numeric Extraction Prompt:', prompt);
    
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'llama3-70b-8192',
        messages: [
          { 
            role: 'system', 
            content: `You are a number extraction expert. Extract ONLY the numeric value from the user's input. 

RULES:
- Return ONLY the number, nothing else
- No punctuation, no words, no explanations
- Just the raw number (e.g., "2", "10", "5.5")
- If multiple numbers, return the first one
- If no valid number, return "INVALID"`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1, // Very low for precise extraction
        max_tokens: 50
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
    
    const content = response.data?.choices?.[0]?.message?.content;
    if (typeof content === 'string') {
      console.log('[DEBUG] Raw AI numeric extraction:', content);
      
      // Minimal cleaning for numeric extraction - just trim and remove trailing punctuation
      let cleanContent = content.trim();
      
      // Remove trailing punctuation that might interfere with number parsing
      cleanContent = cleanContent.replace(/[.!?;,]+$/, '');
      
      // Extract just the number if there's extra text
      const numberMatch = cleanContent.match(/^(\d+(?:\.\d+)?)/);
      if (numberMatch) {
        cleanContent = numberMatch[1];
      }
      
      console.log('[DEBUG] Cleaned AI numeric extraction:', cleanContent);
      
      return cleanContent;
    }
    throw new Error('No valid response from Groq');
  } catch (err) {
    console.error('[GROQ NUMERIC EXTRACTION ERROR]', err && (err.response?.data || err.stack || err));
    return 'INVALID';
  }
}

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

// New specialized function for generating clear, complete explanations
async function getGroqExplanation(prompt) {
  try {
    console.log('[DEBUG] AI Explanation Prompt:', prompt);
    
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'llama3-70b-8192',
        messages: [
          { 
            role: 'system', 
            content: `You are a helpful cloud advisor providing clear, complete explanations. 

CRITICAL RULES:
- Provide complete, helpful explanations (aim for 25-40 words)
- Be clear, specific, and actionable
- Focus on practical benefits, use cases, and differences
- Use simple, customer-friendly language
- Explain WHY someone would choose each option
- Don't use thinking tags or internal monologue
- Respond with ONLY the explanation, nothing else
- Make it immediately useful for decision-making

EXAMPLES:
- "t6.medium is perfect for small websites and light applications with moderate traffic. g6.xlarge handles heavy workloads, databases, and high-performance applications requiring significant processing power."
- "MySQL 8.0 offers improved performance, better security features, and advanced analytics capabilities. MySQL 5.7 provides proven stability and compatibility with older applications."
- "More instances improve reliability by distributing load and providing redundancy, but increase monthly costs. Consider your traffic patterns and uptime requirements."` 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5, // Balanced for clarity and helpful detail
        max_tokens: 120 // Allow for more complete explanations
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
    
    const content = response.data?.choices?.[0]?.message?.content;
    if (typeof content === 'string') {
      console.log('[DEBUG] Raw AI explanation:', content);
      
      // Clean the response while preserving useful content
      let cleanContent = content
        // Remove thinking patterns and common prefixes
        .replace(/<think[\s\S]*?<\/think>/gi, '')
        .replace(/^(Let me explain|Here's an explanation|This is|Based on|Well,?)[\s:.]*/gi, '')
        .replace(/^(Sure,?|Certainly,?|Of course,?)[\s]*/gi, '')
        // Clean up spacing and formatting
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, ' ')
        .trim();
      
      // Remove redundant introductory phrases
      cleanContent = cleanContent.replace(/^(The key differences? (are|is)|The main differences? (are|is)|Here are the differences?)[\s:]*/gi, '');
      
      // Ensure proper punctuation
      if (cleanContent && !cleanContent.match(/[.!?]$/)) {
        cleanContent += '.';
      }
      
      // Enforce reasonable word limit (40 words max) but don't truncate mid-sentence
      const words = cleanContent.split(/\s+/);
      if (words.length > 40) {
        // Try to find a natural break point (sentence ending)
        let truncateAt = 40;
        for (let i = 35; i < Math.min(40, words.length); i++) {
          if (words[i] && words[i].match(/[.!?]$/)) {
            truncateAt = i + 1;
            break;
          }
        }
        cleanContent = words.slice(0, truncateAt).join(' ');
        if (!cleanContent.match(/[.!?]$/)) {
          cleanContent += '.';
        }
      }
      
      console.log('[DEBUG] Cleaned AI explanation:', cleanContent);
      
      return cleanContent || 'This option helps configure your service for optimal performance and cost-effectiveness.';
    }
    throw new Error('No valid response from Groq');
  } catch (err) {
    console.error('[GROQ EXPLANATION ERROR]', err && (err.response?.data || err.stack || err));
    return 'This field helps configure your service according to your specific requirements and use case.';
  }
}

export { getGroqAIResponse, getGroqConversationalResponse, getGroqNumericExtraction, getGroqExplanation };
