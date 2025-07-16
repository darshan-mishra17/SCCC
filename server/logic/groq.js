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
  // Check if GROQ API key is valid format
  if (!GROQ_API_KEY || !GROQ_API_KEY.startsWith('gsk_') || GROQ_API_KEY.length < 50) {
    console.log('[DEBUG] Invalid GROQ API key detected, using local AI fallback');
    if (promptType === 'ai_suggestion') {
      return await getLocalAISuggestionFallback(context);
    }
    // For other prompt types, return a basic fallback
    return { error: 'API not available', fallback: true };
  }

  // Use improved prompt builder (now async)
  const prompt = await buildPrompt(promptType, context);
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
    
    // Special handling for AI suggestion fallback
    if (promptType === 'ai_suggestion') {
      return await getLocalAISuggestionFallback(context);
    }
    
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
  
  // Handle AI suggestion requests
  if (prompt.includes('wants AI suggestions') || prompt.includes('describe their application')) {
    return `Great! I'd be happy to suggest the perfect cloud configuration for your needs. 

Please describe your application requirements in detail. For example:
- "A web application with database for 1000 users"
- "E-commerce platform with file storage for 5000 customers"  
- "API backend with analytics for mobile app"

The more details you provide about your expected users, features, and performance needs, the better I can tailor the recommendations!`;
  }
  
  // Handle option selection
  if (prompt.includes('option 2') || prompt.includes('choice 2') || prompt.includes('AI suggestion')) {
    return `Perfect! I'll help you design the ideal cloud architecture based on your specific requirements.

Please describe your application in detail. For example:
- "Live streaming platform with 100 concurrent users per hour"
- "Web application with database for 1000 users"  
- "E-commerce site with file storage needs"

What type of application are you building and what are your expected usage patterns?`;
  }
  
  // Handle greeting and service selection  
  if (prompt.includes('Greet them warmly') || prompt.includes('which cloud service')) {
    return `Hi! Welcome to SCCC AI-Powered Cloud Advisor! 🚀

I can help you configure the perfect cloud solution. You have two options:

**Option 1: Manual Configuration**
Tell me which services you'd like to configure:
• ECS (Elastic Compute Service) - Virtual machines and compute power
• OSS (Object Storage Service) - File storage and backup
• TDSQL (Database Service) - Managed database solutions

**Option 2: AI Suggestion**
Describe your application requirements (e.g., "A web application with database for 1000 users") and I'll suggest the best service combination and configuration for you.

Which approach would you prefer?`;
  }
  
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

// Intelligent AI suggestion fallback that analyzes user requirements dynamically
async function getLocalAISuggestionFallback(userRequirements) {
  console.log('[DEBUG] Using local AI fallback with database services');
  
  try {
    // Import Service model dynamically to avoid circular dependency
    const { default: Service } = await import('../models/Service.js');
    const availableServices = await Service.find({});
    
    if (availableServices.length === 0) {
      console.log('[WARNING] No services found in database, using hardcoded fallback');
      return getHardcodedFallback(userRequirements);
    }
    
    // Analyze requirements and select appropriate services
    const analysis = analyzeUserRequirements(userRequirements);
    const selectedServices = selectServicesFromDatabase(availableServices, analysis);
    
    return {
      analysis: `Based on your requirements: "${userRequirements}", I recommend a scalable cloud setup using our available services.`,
      recommendedServices: selectedServices,
      estimatedCapacity: analysis.capacity || "Suitable for medium-scale applications",
      performanceExpectations: analysis.performance || "Good response times and reliability",
      monthlyCost: analysis.estimatedCost || "Cost-effective solution",
      scalabilityNotes: analysis.scalability || "Can scale with your business growth",
      nextSteps: "Please confirm if this configuration meets your needs, or let me know if you'd like to adjust anything."
    };
  } catch (error) {
    console.error('[ERROR] Database fallback failed:', error);
    return getHardcodedFallback(userRequirements);
  }
}

// Select services from database based on requirements
function selectServicesFromDatabase(availableServices, analysis) {
  const selectedServices = [];
  
  // Use the services from the detailed analysis instead of hardcoded logic
  if (analysis.services && analysis.services.length > 0) {
    analysis.services.forEach(serviceAnalysis => {
      const dbService = availableServices.find(s => s.name.toLowerCase() === serviceAnalysis.name.toLowerCase());
      if (dbService) {
        selectedServices.push({
          name: dbService.name,
          reason: serviceAnalysis.reason,
          config: dbService.exampleConfig || serviceAnalysis.config || {}
        });
      }
    });
  }
  
  // Fallback: if analysis didn't provide services, use the old logic
  if (selectedServices.length === 0) {
    // Always try to include compute service (ECS or similar)
    const computeService = availableServices.find(s => s.name.toLowerCase().includes('ecs') || s.description.toLowerCase().includes('compute'));
    if (computeService) {
      selectedServices.push({
        name: computeService.name,
        reason: `${computeService.displayName} for hosting your application with scalable compute power`,
        config: computeService.exampleConfig || {}
      });
    }
    
    // Include database service if requirements suggest it
    if (analysis.needsDatabase) {
      const dbService = availableServices.find(s => s.name.toLowerCase().includes('tdsql') || s.name.toLowerCase().includes('db') || s.description.toLowerCase().includes('database'));
      if (dbService) {
        selectedServices.push({
          name: dbService.name,
          reason: `${dbService.displayName} for reliable data storage and management`,
          config: dbService.exampleConfig || {}
        });
      }
    }
    
    // Include storage service
    const storageService = availableServices.find(s => s.name.toLowerCase().includes('oss') || s.name.toLowerCase().includes('storage'));
    if (storageService && selectedServices.length < 3) {
      selectedServices.push({
        name: storageService.name,
        reason: `${storageService.displayName} for file storage and static assets`,
        config: storageService.exampleConfig || {}
      });
    }
    
    // If still no services, use first available services
    if (selectedServices.length === 0) {
      availableServices.slice(0, 2).forEach(service => {
        selectedServices.push({
          name: service.name,
          reason: `${service.displayName} - ${service.description}`,
          config: service.exampleConfig || {}
        });
      });
    }
  }
  
  return selectedServices;
}

// Hardcoded fallback as last resort
function getHardcodedFallback(userRequirements) {
  console.log('[DEBUG] Analyzing user requirements:', userRequirements);
  
  // Analyze the user's requirements to determine services and configurations
  const analysis = analyzeUserRequirements(userRequirements);
  
  return {
    analysis: analysis.summary,
    recommendedServices: analysis.services,
    estimatedCapacity: analysis.capacity,
    performanceExpectations: analysis.performance,
    monthlyCost: analysis.estimatedCost,
    scalabilityNotes: analysis.scalability,
    nextSteps: "Please confirm if this configuration meets your needs, or let me know if you'd like to adjust anything."
  };
}

// Advanced requirement analysis function
function analyzeUserRequirements(requirements) {
  const req = requirements.toLowerCase();
  
  // Extract key metrics
  const userCount = extractUserCount(req);
  const appType = detectApplicationType(req);
  const complexity = assessComplexity(req);
  
  const services = [];
  let totalCost = 0;
  
  // Determine ECS requirements
  const ecsConfig = determineECSConfig(userCount, appType, complexity);
  if (ecsConfig) {
    services.push({
      name: 'ecs',
      reason: ecsConfig.reason,
      config: ecsConfig.config
    });
    totalCost += ecsConfig.cost;
  }
  
  // Determine database requirements
  if (requiresDatabase(req)) {
    const dbConfig = determineDatabaseConfig(userCount, appType, complexity);
    services.push({
      name: 'tdsql',
      reason: dbConfig.reason,
      config: dbConfig.config
    });
    totalCost += dbConfig.cost;
  }
  
  // Determine storage requirements
  if (requiresStorage(req)) {
    const storageConfig = determineStorageConfig(userCount, appType, complexity);
    services.push({
      name: 'oss',
      reason: storageConfig.reason,
      config: storageConfig.config
    });
    totalCost += storageConfig.cost;
  }
  
  // Determine CDN requirements
  if (requiresCDN(req)) {
    const cdnConfig = determineCDNConfig(userCount, appType, complexity);
    services.push({
      name: 'cdn',
      reason: cdnConfig.reason,
      config: cdnConfig.config
    });
    totalCost += cdnConfig.cost;
  }
  
  return {
    summary: generateAnalysisSummary(userCount, appType, complexity),
    services: services,
    capacity: generateCapacityEstimate(userCount, complexity),
    performance: generatePerformanceExpectation(appType, complexity),
    estimatedCost: `~${Math.round(totalCost)} SAR/month`,
    scalability: generateScalabilityNotes(services)
  };
}

// Helper functions for requirement analysis
function extractUserCount(req) {
  const matches = req.match(/(\d+(?:,\d+)*)\s*(?:users?|customers?|visitors?|people)/i);
  if (matches) {
    return parseInt(matches[1].replace(/,/g, ''));
  }
  
  // Look for descriptive terms
  if (req.includes('small') || req.includes('startup')) return 100;
  if (req.includes('medium') || req.includes('growing')) return 1000;
  if (req.includes('large') || req.includes('enterprise')) return 10000;
  if (req.includes('massive') || req.includes('scale')) return 100000;
  
  return 1000; // Default assumption
}

function detectApplicationType(req) {
  if (req.includes('web app') || req.includes('website')) return 'web_application';
  if (req.includes('mobile') || req.includes('app')) return 'mobile_backend';
  if (req.includes('api') || req.includes('backend')) return 'api_service';
  if (req.includes('ecommerce') || req.includes('store') || req.includes('shop')) return 'ecommerce';
  if (req.includes('blog') || req.includes('cms')) return 'content_management';
  if (req.includes('analytics') || req.includes('dashboard')) return 'analytics_platform';
  if (req.includes('iot') || req.includes('sensor')) return 'iot_platform';
  
  return 'web_application'; // Default
}

function assessComplexity(req) {
  let score = 0;
  
  // Add complexity points
  if (req.includes('real-time') || req.includes('live')) score += 2;
  if (req.includes('analytics') || req.includes('reporting')) score += 2;
  if (req.includes('file upload') || req.includes('media')) score += 1;
  if (req.includes('authentication') || req.includes('login')) score += 1;
  if (req.includes('payment') || req.includes('transaction')) score += 2;
  if (req.includes('search') || req.includes('recommendation')) score += 2;
  if (req.includes('microservices') || req.includes('distributed')) score += 3;
  if (req.includes('machine learning') || req.includes('ai')) score += 3;
  
  if (score >= 6) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

function determineECSConfig(userCount, appType, complexity) {
  let instanceType, instanceCount, reason;
  let cost = 0;
  
  if (userCount <= 500 && complexity === 'low') {
    instanceType = 'ecs.t6.medium';
    instanceCount = 1;
    cost = 200;
    reason = 'Single lightweight instance perfect for small applications with moderate traffic';
  } else if (userCount <= 2000 && complexity === 'medium') {
    instanceType = 'ecs.g6.large';
    instanceCount = 2;
    cost = 450;
    reason = 'Load-balanced setup with redundancy for reliable performance under normal loads';
  } else if (userCount <= 10000 || complexity === 'high') {
    instanceType = 'ecs.g6.xlarge';
    instanceCount = 3;
    cost = 750;
    reason = 'High-performance cluster capable of handling significant traffic and complex operations';
  } else {
    instanceType = 'ecs.c6.2xlarge';
    instanceCount = 4;
    cost = 1200;
    reason = 'Enterprise-grade compute cluster for high-scale applications with demanding requirements';
  }
  
  return {
    config: {
      instanceType,
      instanceCount,
      region: 'riyadh',
      osType: 'Linux'
    },
    reason,
    cost
  };
}

function requiresDatabase(req) {
  return req.includes('database') || req.includes('data') || req.includes('store') || 
         req.includes('user') || req.includes('content') || req.includes('sql') ||
         !req.includes('static');
}

function determineDatabaseConfig(userCount, appType, complexity) {
  let engine, instanceSize, storageSize, reason;
  let cost = 0;
  
  if (userCount <= 1000 && complexity === 'low') {
    engine = 'MySQL 5.7';
    instanceSize = 'small';
    storageSize = '100';
    cost = 300;
    reason = 'Lightweight MySQL database suitable for small applications with basic data needs';
  } else if (userCount <= 5000 && complexity === 'medium') {
    engine = 'MySQL 8.0';
    instanceSize = 'medium';
    storageSize = '500';
    cost = 500;
    reason = 'Robust MySQL setup with enhanced performance for growing applications';
  } else {
    engine = 'MySQL 8.0';
    instanceSize = 'large';
    storageSize = '1000';
    cost = 800;
    reason = 'High-performance database configuration for large-scale applications with complex queries';
  }
  
  return {
    config: {
      engine,
      instanceSize,
      storageSize,
      backupRetention: '7 days'
    },
    reason,
    cost
  };
}

function requiresStorage(req) {
  return req.includes('file') || req.includes('upload') || req.includes('media') || 
         req.includes('image') || req.includes('document') || req.includes('backup') ||
         req.includes('storage') || req.includes('assets');
}

function determineStorageConfig(userCount, appType, complexity) {
  let storageGB, redundancy, reason;
  let cost = 0;
  
  if (userCount <= 1000) {
    storageGB = 100;
    cost = 50;
    reason = 'Basic file storage for user uploads and application assets';
  } else if (userCount <= 5000) {
    storageGB = 500;
    cost = 150;
    reason = 'Scalable storage solution for growing file and media requirements';
  } else {
    storageGB = 2000;
    cost = 400;
    reason = 'Enterprise storage with high capacity for large-scale file management';
  }
  
  redundancy = complexity === 'high' ? 'IA' : 'Standard';
  
  return {
    config: {
      storageGB,
      redundancy,
      accessTier: 'Hot'
    },
    reason,
    cost
  };
}

function requiresCDN(req) {
  return req.includes('cdn') || req.includes('content delivery') || req.includes('static files') || 
         req.includes('global') || req.includes('worldwide') || req.includes('fast') || 
         req.includes('streaming') || req.includes('media') || req.includes('performance') ||
         req.includes('speed') || req.includes('cache') || req.includes('distribute');
}

function determineCDNConfig(userCount, appType, complexity) {
  let bandwidth, regions, cacheSize, reason;
  let cost = 0;
  
  if (userCount <= 1000) {
    bandwidth = 50;
    regions = 2;
    cacheSize = 25;
    cost = 100;
    reason = 'Basic CDN for faster content delivery to local and regional users';
  } else if (userCount <= 5000) {
    bandwidth = 100;
    regions = 3;
    cacheSize = 50;
    cost = 200;
    reason = 'Multi-region CDN for improved global content delivery and user experience';
  } else {
    bandwidth = 200;
    regions = 5;
    cacheSize = 100;
    cost = 400;
    reason = 'High-performance global CDN for fast content distribution worldwide';
  }
  
  return {
    config: {
      bandwidth,
      regions,
      cacheSize
    },
    reason,
    cost
  };
}

function generateAnalysisSummary(userCount, appType, complexity) {
  return `Based on your ${appType.replace('_', ' ')} requirements for ${userCount.toLocaleString()} users with ${complexity} complexity, I recommend a balanced cloud architecture optimized for performance, reliability, and cost-effectiveness.`;
}

function generateCapacityEstimate(userCount, complexity) {
  const multiplier = complexity === 'high' ? 2 : complexity === 'medium' ? 1.5 : 1;
  const concurrent = Math.round((userCount * 0.1) * multiplier);
  return `${concurrent.toLocaleString()} concurrent users with room for ${Math.round(concurrent * 1.5).toLocaleString()} peak traffic`;
}

function generatePerformanceExpectation(appType, complexity) {
  if (complexity === 'high') {
    return 'Sub-200ms response times, 99.9% uptime, high throughput for complex operations';
  } else if (complexity === 'medium') {
    return 'Sub-500ms response times, 99.5% uptime, good performance for typical workloads';
  } else {
    return 'Sub-1s response times, 99% uptime, reliable performance for standard operations';
  }
}

function generateScalabilityNotes(services) {
  const hasMultipleECS = services.find(s => s.name === 'ecs')?.config?.instanceCount > 1;
  const hasStorage = services.some(s => s.name === 'oss');
  
  let notes = 'This configuration can scale ';
  
  if (hasMultipleECS) {
    notes += 'horizontally by adding more ECS instances';
  } else {
    notes += 'vertically by upgrading instance types';
  }
  
  if (hasStorage) {
    notes += ' and storage can be increased dynamically based on usage';
  }
  
  notes += '. Auto-scaling policies can be configured for traffic spikes.';
  
  return notes;
}

export { getGroqAIResponse, getGroqConversationalResponse, getGroqNumericExtraction, getGroqExplanation };
