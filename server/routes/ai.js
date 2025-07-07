import express from 'express';
import { getGroqAIResponse, getGroqConversationalResponse } from '../logic/groq.js';
import { initializeState, getSessionState, setSessionState, getRequiredFields, getNextMissingField, updateFields, isFieldsComplete } from '../logic/stateManager.js';
import { buildPromptForField } from '../services/promptBuilder.js';
import { calculatePricing } from '../logic/pricing.js';

// Helper to ensure messages are always strings
function stringifyMessage(msg) {
  console.log('[DEBUG] stringifyMessage input:', JSON.stringify(msg, null, 2), 'Type:', typeof msg);
  if (typeof msg === 'string') {
    // If it's already the problematic "[object Object]" string, that means something went wrong earlier
    if (msg === '[object Object]') {
      console.error('[ERROR] Received [object Object] string - this should not happen');
      return 'Sorry, there was an error processing the message.';
    }
    return msg;
  }
  if (typeof msg === 'object' && msg !== null) {
    console.log('[DEBUG] Object keys:', Object.keys(msg));
    // Try different possible message properties
    if (msg.message && typeof msg.message === 'string') return msg.message;
    if (msg.response && typeof msg.response === 'string') return msg.response;
    if (msg.question && typeof msg.question === 'string') return msg.question;
    if (msg.text && typeof msg.text === 'string') return msg.text;
    if (msg.content && typeof msg.content === 'string') return msg.content;
    
    // If no string property found, stringify the whole object
    const result = JSON.stringify(msg);
    console.log('[DEBUG] Stringified object result:', result);
    return result;
  }
  const result = String(msg);
  console.log('[DEBUG] String conversion result:', result);
  return result;
}

const router = express.Router();

// Add a simple in-memory chat history per session
const chatHistories = new Map();

// POST /api/ai/message
// AI-powered, catalog-driven, dynamic field extraction
router.post('/message', async (req, res) => {
  try {
    const { sessionId, userMessage } = req.body;
    if (!sessionId || !userMessage) {
      return res.status(400).json({ error: 'Missing sessionId or userMessage' });
    }

    // Track chat history for this session
    if (!chatHistories.has(sessionId)) chatHistories.set(sessionId, []);
    chatHistories.get(sessionId).push({ role: 'user', content: userMessage });

    let state = getSessionState(sessionId);
    // Step 1: Service selection if not started
    if (!state) {
      // Detect multiple services in user message
      let serviceNames = [];
      if (/ecs|virtual machine|vm/i.test(userMessage)) serviceNames.push('ecs');
      if (/oss|object storage/i.test(userMessage)) serviceNames.push('oss');
      if (/tdsql|database|mysql|rds/i.test(userMessage)) serviceNames.push('tdsql');
      if (serviceNames.length === 0) {
        // Let AI handle the greeting and first question
        const aiMsg = await getGroqConversationalResponse(
          `You are an AI sales advisor. Greet the user and ask which service they want to configure (ECS, OSS, TDSQL). Be conversational.`
        );
        const msg = stringifyMessage(aiMsg);
        chatHistories.get(sessionId).push({ role: 'assistant', content: msg });
        return res.json({ message: msg });
      }
      state = initializeState(serviceNames);
      setSessionState(sessionId, state);
    }

    // Multi-service: handle each service in order
    const { services, currentServiceIdx } = state;
    const currentService = services[currentServiceIdx];
    let requiredFields;
    try {
      requiredFields = await getRequiredFields(currentService.name);
      if (!requiredFields || !Array.isArray(requiredFields) || requiredFields.length === 0) {
        throw new Error('No required fields found for service: ' + currentService.name);
      }
    } catch (err) {
      console.error('[AI ROUTE] Error fetching required fields:', err);
      return res.status(500).json({ error: 'Failed to fetch required fields for service: ' + currentService.name });
    }

    // Find next missing field for current service
    let nextFieldObj = getNextMissingField(currentService.fields, requiredFields);
    if (!nextFieldObj) {
      services[currentServiceIdx].complete = true;
      if (currentServiceIdx < services.length - 1) {
        state.currentServiceIdx++;
        setSessionState(sessionId, state);
        // Let AI introduce the next service
        const aiMsg = await getGroqConversationalResponse(
          `You are an AI sales advisor. The user finished configuring ${currentService.name}. Now introduce and start configuring ${services[state.currentServiceIdx].name}. Be conversational.`
        );
        const msg = stringifyMessage(aiMsg);
        chatHistories.get(sessionId).push({ role: 'assistant', content: msg });
        return res.json({ message: msg });
      } else {
        // All services complete, show summary and pricing
        const pricingInput = {};
        services.forEach(s => { pricingInput[s.name] = s.fields; });
        let pricing;
        if (pricingInput.ecs) {
          const { calculatePrice } = await import('../logic/pricing.js');
          pricing = calculatePrice(pricingInput.ecs);
        } else {
          pricing = calculatePricing(pricingInput);
        }
        setSessionState(sessionId, null); // End session
        chatHistories.delete(sessionId);
        const servicesArr = services.map(s => {
          let monthlyCost = 0;
          try {
            if (s.name.toLowerCase() === 'ecs') {
              const { calculatePrice } = require('../logic/pricing.js');
              monthlyCost = calculatePrice(s.fields).totalMonthlySAR || 0;
            } else {
              monthlyCost = calculatePricing({ [s.name]: s.fields }).totalMonthlySAR || 0;
            }
          } catch (e) { monthlyCost = 0; }
          return {
            name: s.name,
            config: s.fields,
            monthlyCost
          };
        });
        return res.json({ services: servicesArr, pricing });
      }
    }

    // Let AI generate the next conversational message
    const history = chatHistories.get(sessionId)
      .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
      .join('\n');
    const aiPrompt = `You are an AI sales advisor helping a user configure ${currentService.name}. Here is the conversation so far:\n${history}\nAsk for the value of: ${nextFieldObj.label || nextFieldObj.key}. Be conversational, confirm previous answers, and only ask one question at a time.`;
    let aiMsg = await getGroqConversationalResponse(aiPrompt);
    
    // Ensure aiMsg is always a string
    const messageText = stringifyMessage(aiMsg);
    chatHistories.get(sessionId).push({ role: 'assistant', content: messageText });

    // Try to extract the value for the next field from the user's last message
    const aiExtractPrompt = `Extract the value for the field \"${nextFieldObj.label || nextFieldObj.key}\" from this user message: \"${userMessage}\". If not present, respond with null. Respond in JSON: { \"${nextFieldObj.key}\": value }`;
    let aiExtracted = null;
    try {
      aiExtracted = await getGroqAIResponse('default', { prompt: aiExtractPrompt });
    } catch (e) {
      aiExtracted = { [nextFieldObj.key]: null };
    }
    const value = aiExtracted[nextFieldObj.key];
    if (value !== null && value !== undefined && value !== '') {
      updateFields(currentService.fields, nextFieldObj, value);
      setSessionState(sessionId, state);
    }
    return res.json({ message: messageText });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

export default router;
//       arr = Object.entries(config)
//         .filter(([k, v]) => serviceMap[k] && typeof v === 'object')
//         .map(([k, v]) => {
//           // Prepare a minimal config for pricing
//           let serviceConfig = {};
//           if (k === 'ecs') {
//             serviceConfig = { service: 'ecs', count: v.count || 1 };
//           } else if (k === 'oss') {
//             serviceConfig = { service: 'oss', storageGB: v.storageGB || 0 };
//           } else if (k === 'tdsql') {
//             serviceConfig = { service: 'tdsql', nodes: v.nodes || 1 };
//           }
//           // Calculate pricing for this service
//           let monthlyCost = 0;
//           try {
//             const pricing = calculatePricing({ services: [serviceConfig] });
//             monthlyCost = pricing && typeof pricing.totalMonthlySAR === 'number' ? pricing.totalMonthlySAR : 0;
//           } catch (e) {
//             console.error(`[AI ROUTE] Pricing error for service ${k}:`, e);
//           }
//           return {
//             name: serviceMap[k].name,
//             config: serviceMap[k].getConfig(v),
//             monthlyCost,
//             raw: v
//           };
//         });
//     }
//     // Log for debugging
//     console.log('[AI ROUTE] Returning array to frontend:', arr);
//     // If nothing matched, send a fallback demo array
//     if (!arr || arr.length === 0) {
//       arr = [
//         { name: 'Elastic Compute Service (ECS)', config: 'ecs.g6.large, Count: 2', monthlyCost: 150 },
//         { name: 'Object Storage Service (OSS)', config: 'Storage: 100 GB', monthlyCost: 30 },
//         { name: 'TDSQL', config: 'Nodes: 1, Engine: MySQL', monthlyCost: 120 },
//       ];
//     }
//     res.json({
//       message: 'Here is the recommended configuration:',
//       solution: arr
//     });
//   } catch (err) {
//     console.error('[AI ROUTE] Error generating AI config:', err);
//     res.status(500).json({ error: 'AI config generation failed', details: err.message });
//   }
// });

// module.exports = router;
// routes/ai.js
// routes/ai.js

// ...existing ESM code at the top of the file remains. Removed all duplicate and CommonJS code below...
