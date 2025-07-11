// logic/groq.js
import axios from 'axios';
import dotenv from 'dotenv';
import { buildPrompt } from './promptBuilder.js';
dotenv.config();

const GROQ_API_URL = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function getGroqConversationalResponse(prompt) {
  // Check if GROQ API key is valid format
  if (!GROQ_API_KEY || !GROQ_API_KEY.startsWith('gsk_') || GROQ_API_KEY.length < 50) {
    console.log('[DEBUG] Invalid GROQ API key detected, using local fallback');
    return await getLocalFallbackResponse(prompt);
  }

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
  // Check if GROQ API key is valid format
  if (!GROQ_API_KEY || !GROQ_API_KEY.startsWith('gsk_') || GROQ_API_KEY.length < 50) {
    console.log('[DEBUG] Invalid GROQ API key detected, using numeric extraction fallback');
    return getLocalNumericExtraction(prompt);
  }

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
  // Check if GROQ API key is valid format
  if (!GROQ_API_KEY || !GROQ_API_KEY.startsWith('gsk_') || GROQ_API_KEY.length < 50) {
    console.log('[DEBUG] Invalid GROQ API key detected, using explanation fallback');
    return getLocalExplanationFallback(prompt);
  }

  try {
    console.log('[DEBUG] AI Explanation Prompt:', prompt);
    
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'llama3-70b-8192',
        messages: [
          { 
            role: 'system', 
            content: `You are a helpful SCCC cloud advisor providing detailed, technical explanations. 

CRITICAL RULES:
- Provide comprehensive, detailed explanations (aim for 40-80 words)
- Be specific about technical specifications, performance, and use cases
- Focus on practical benefits, pricing implications, and when to choose each option
- Use technical but accessible language
- Explain performance characteristics, CPU, memory, and ideal workloads
- Include cost-effectiveness guidance
- Don't use thinking tags or internal monologue
- Respond with ONLY the explanation, nothing else
- Make it immediately useful for technical decision-making

EXAMPLES for ECS instances:
- "ecs.g6.large offers 4 vCPUs and 16GB RAM, perfect for medium-scale applications, web servers, and development environments. It provides excellent price-performance balance for general workloads requiring consistent performance without peak demands."
- "ecs.t6.medium provides 2 vCPUs and 8GB RAM with burstable performance, ideal for small websites, blogs, and light applications with variable traffic. Most cost-effective for low-to-moderate usage patterns."
- "ecs.c6.xlarge delivers 8 vCPUs optimized for compute-intensive tasks like data processing, scientific computing, and high-performance web servers. Choose when CPU performance is your primary requirement."

For storage/database options, focus on capacity, performance, durability, and use cases.` 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4, // Lower for more consistent technical details
        max_tokens: 200 // Allow for more detailed explanations
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
        .trim();
      
      console.log('[DEBUG] Cleaned AI explanation:', cleanContent);
      return cleanContent || 'I can help explain that option. Could you please be more specific about what you\'d like to know?';
    } else {
      console.error('[ERROR] Invalid content type from AI explanation:', typeof content, content);
      return 'I can provide more details about that option. What specific information would you like to know?';
    }
  } catch (error) {
    console.error('[ERROR] getGroqExplanation failed:', error.message);
    return 'I can help explain that option, but I\'m having trouble accessing detailed information right now. Please let me know what specific details you need.';
  }
}

// Local fallback function for when GROQ API is not available
async function getLocalFallbackResponse(prompt) {
  console.log('[DEBUG] Using local fallback for prompt:', prompt);
  
  // Parse the prompt to understand what kind of response is needed
  if (prompt.includes('ask for') && prompt.includes('field')) {
    // This is a field prompt request
    if (prompt.includes('Instance Type')) {
      return "What type of instance would work best for you? We have t6.medium, t6.large, g6.large, or g6.xlarge available.";
    } else if (prompt.includes('Number of Instances')) {
      return "How many instances do you need? You can choose anywhere from 1 to 50.";
    } else if (prompt.includes('Operating System')) {
      return "Which operating system would you prefer? We support Ubuntu 20.04, Ubuntu 18.04, CentOS 7, or Windows Server 2019.";
    } else if (prompt.includes('Storage Size')) {
      return "How much storage space do you need? Please specify in GB (minimum 20GB, maximum 16TB).";
    } else if (prompt.includes('Database Engine')) {
      return "What database engine would you prefer? We support MySQL 8.0, MySQL 5.7, PostgreSQL 13, or PostgreSQL 12.";
    } else if (prompt.includes('Storage Type')) {
      return "What type of storage would you like? We offer Standard, Premium SSD, or Ultra SSD.";
    } else if (prompt.includes('Bucket Name')) {
      return "What would you like to name your storage bucket? Please provide a unique name.";
    } else if (prompt.includes('RAM')) {
      return "How much RAM do you need? Please specify in GB (e.g., 4GB, 8GB, 16GB).";
    } else if (prompt.includes('CPU')) {
      return "How many CPU cores do you need? Please specify the number (e.g., 2, 4, 8).";
    }
    return "Please provide the required information for this field.";
  } else if (prompt.includes('explain') || prompt.includes('help')) {
    // This is an explanation request
    if (prompt.includes('ecs.g6.large')) {
      return "The g6.large instance type offers 4 vCPUs and 16GB RAM, ideal for general workloads with moderate compute requirements. Perfect for web applications, databases, and development environments.";
    } else if (prompt.includes('ecs.t6.medium')) {
      return "The t6.medium instance type provides 2 vCPUs and 4GB RAM, suitable for light workloads and applications with variable performance requirements. Cost-effective for small websites and development.";
    } else if (prompt.includes('mysql')) {
      return "MySQL is a popular open-source relational database management system, known for its reliability and ease of use. Great for web applications and data-driven projects.";
    } else if (prompt.includes('postgresql')) {
      return "PostgreSQL is an advanced open-source relational database with excellent support for complex queries and data types. Ideal for applications requiring robust data integrity and advanced features.";
    }
    return "I can provide more information about that option. What specific details would you like to know?";
  }
  
  // Default conversational response
  return "I understand you're configuring your cloud services. How can I help you with the next step?";
}

// Local fallback for numeric extraction
function getLocalNumericExtraction(prompt) {
  console.log('[DEBUG] Using local numeric extraction for:', prompt);
  
  // Extract numbers using regex
  const numberMatch = prompt.match(/\d+(\.\d+)?/);
  if (numberMatch) {
    return numberMatch[0];
  }
  
  return "INVALID";
}

// Local fallback for explanations
function getLocalExplanationFallback(prompt) {
  console.log('[DEBUG] Using local explanation fallback for:', prompt);
  
  const lowerPrompt = prompt.toLowerCase();
  
  // ECS Instance Types
  if (lowerPrompt.includes('ecs.g6.large')) {
    return "The g6.large instance type offers 4 vCPUs and 16GB RAM, optimized for general-purpose workloads. It provides excellent performance for web applications, databases, and development environments. With balanced compute and memory resources, it's cost-effective for medium-scale applications requiring consistent performance.";
  } else if (lowerPrompt.includes('ecs.g6.xlarge')) {
    return "The g6.xlarge instance delivers 8 vCPUs and 32GB RAM for high-performance computing needs. Ideal for resource-intensive applications, large databases, and enterprise workloads. Offers superior processing power and memory capacity for demanding applications requiring substantial computational resources.";
  } else if (lowerPrompt.includes('ecs.t6.medium')) {
    return "The t6.medium instance provides 2 vCPUs and 4GB RAM with burstable performance capabilities. Perfect for light to moderate workloads, development environments, and small web applications. Cost-efficient solution for applications with variable CPU utilization patterns.";
  } else if (lowerPrompt.includes('ecs.t6.large')) {
    return "The t6.large instance offers 4 vCPUs and 8GB RAM with burstable performance features. Suitable for medium workloads, web servers, and development projects. Provides good balance of performance and cost-effectiveness for applications with fluctuating resource demands.";
  }
  
  // Operating Systems
  else if (lowerPrompt.includes('ubuntu 20.04')) {
    return "Ubuntu 20.04 LTS is a stable, secure Linux distribution with long-term support until 2025. Features modern kernel, excellent package management, and strong community support. Ideal for web applications, development environments, and cloud-native applications requiring reliability and security.";
  } else if (lowerPrompt.includes('ubuntu 18.04')) {
    return "Ubuntu 18.04 LTS provides proven stability and compatibility for legacy applications. While approaching end-of-life, it offers excellent compatibility with older software stacks. Recommended for applications requiring specific package versions or legacy system compatibility.";
  } else if (lowerPrompt.includes('centos 7')) {
    return "CentOS 7 is an enterprise-grade Linux distribution based on Red Hat Enterprise Linux. Known for exceptional stability, security, and long-term support. Perfect for production environments, enterprise applications, and systems requiring RHEL compatibility without licensing costs.";
  } else if (lowerPrompt.includes('windows server 2019')) {
    return "Windows Server 2019 provides enterprise-grade Windows hosting with advanced security features, Active Directory integration, and .NET framework support. Ideal for Windows-based applications, ASP.NET websites, and environments requiring Windows-specific technologies and enterprise management tools.";
  }
  
  // Database Engines
  else if (lowerPrompt.includes('mysql 8.0')) {
    return "MySQL 8.0 is the latest version offering improved performance, enhanced security features, and advanced JSON support. Provides better query optimization, stronger data encryption, and improved replication. Ideal for modern web applications requiring high performance and advanced database features.";
  } else if (lowerPrompt.includes('mysql 5.7')) {
    return "MySQL 5.7 is a mature, stable version with proven reliability and broad compatibility. Offers excellent performance for most applications while maintaining compatibility with legacy systems. Recommended for applications requiring established MySQL features without cutting-edge enhancements.";
  } else if (lowerPrompt.includes('postgresql 13')) {
    return "PostgreSQL 13 delivers advanced features including parallel queries, improved indexing, and enhanced JSON processing. Offers superior data integrity, complex query optimization, and extensive data type support. Perfect for applications requiring advanced database features, analytics, and data warehousing.";
  } else if (lowerPrompt.includes('postgresql 12')) {
    return "PostgreSQL 12 provides robust performance with improved query optimization and enhanced partitioning capabilities. Features strong ACID compliance, advanced indexing, and excellent concurrency handling. Ideal for applications requiring complex queries, data integrity, and sophisticated database operations.";
  }
  
  // Storage Types
  else if (lowerPrompt.includes('standard')) {
    return "Standard storage offers cost-effective magnetic disk storage suitable for infrequently accessed data, backups, and archival purposes. Provides reliable storage at lower costs but with moderate performance characteristics. Ideal for applications where cost optimization is prioritized over speed.";
  } else if (lowerPrompt.includes('premium ssd')) {
    return "Premium SSD delivers high-performance solid-state storage with excellent IOPS and low latency. Perfect for production databases, high-traffic applications, and workloads requiring consistent fast storage performance. Offers superior reliability and performance compared to standard storage.";
  } else if (lowerPrompt.includes('ultra ssd')) {
    return "Ultra SSD provides the highest performance storage with exceptional IOPS, minimal latency, and maximum throughput capabilities. Designed for mission-critical applications, high-performance databases, and enterprise workloads demanding ultimate storage performance. Premium pricing for premium performance.";
  }
  
  // Default explanation
  return "I can provide more detailed information about that option. The system is currently running in offline mode, but I'm still here to help guide you through your cloud service configuration. What specific aspect would you like me to explain further?";
}

export { getGroqAIResponse, getGroqConversationalResponse, getGroqNumericExtraction, getGroqExplanation };
