import express from 'express';
import { getGroqAIResponse } from '../logic/groq.js';
import { initializeState, getSessionState, setSessionState, getRequiredFields, getNextMissingField, updateState, isStateComplete } from '../logic/stateManager.js';
import { buildPromptForField } from '../services/promptBuilder.js';
import { calculatePricing } from '../logic/pricing.js';

const router = express.Router();

// POST /api/ai/message
// AI-powered, catalog-driven, dynamic field extraction
router.post('/message', async (req, res) => {
  try {
    const { sessionId, userMessage } = req.body;
    if (!sessionId || !userMessage) {
      return res.status(400).json({ error: 'Missing sessionId or userMessage' });
    }

    let state = getSessionState(sessionId);
    // Step 1: Service selection if not started
    if (!state) {
      let serviceName = null;
      if (/ecs|virtual machine|vm/i.test(userMessage)) serviceName = 'ecs';
      else if (/oss|object storage/i.test(userMessage)) serviceName = 'oss';
      else if (/tdsql|database|mysql|rds/i.test(userMessage)) serviceName = 'tdsql';
      if (!serviceName) {
        return res.json({ message: 'Which service would you like to configure? (ECS, OSS, TDSQL)' });
      }
      state = initializeState(serviceName);
      setSessionState(sessionId, state);
    }

    // Step 2: Get required fields for the selected service
    let requiredFields;
    try {
      requiredFields = await getRequiredFields(state.service);
      if (!requiredFields || !Array.isArray(requiredFields) || requiredFields.length === 0) {
        throw new Error('No required fields found for service: ' + state.service);
      }
    } catch (err) {
      console.error('[AI ROUTE] Error fetching required fields:', err);
      return res.status(500).json({ error: 'Failed to fetch required fields for service: ' + state.service });
    }

    // Step 3: Find next missing field
    const nextField = getNextMissingField(state, requiredFields);

    // Step 4: If all fields collected, show summary and pricing
    if (!nextField) {
      const pricing = calculatePricing({ [state.service]: state.fields });
      setSessionState(sessionId, null); // End session
      return res.json({
        message: `Here is your configuration for ${state.service.toUpperCase()}:\n${Object.entries(state.fields).map(([k,v]) => `- ${k}: ${v}`).join('\n')}\nTotal Monthly Cost: SAR ${pricing.totalMonthlySAR}`
      });
    }

    // Step 5: Use AI to extract the value for the next field from user input
    const aiExtractPrompt = `Extract the value for the field "${nextField}" from this user message: "${userMessage}". If not present, respond with null. Respond in JSON: { "${nextField}": value }`;
    let aiExtracted = null;
    try {
      aiExtracted = await getGroqAIResponse('default', { prompt: aiExtractPrompt });
    } catch (e) {
      console.error('[AI ROUTE] AI extraction error:', e);
      aiExtracted = { [nextField]: null };
    }
    const value = aiExtracted[nextField];

    if (value !== null && value !== undefined && value !== '') {
      updateState(state, nextField, value);
      setSessionState(sessionId, state);
      // After update, check if more fields needed
      const nextMissing = getNextMissingField(state, requiredFields);
      if (!nextMissing) {
        const pricing = calculatePricing({ [state.service]: state.fields });
        setSessionState(sessionId, null);
        return res.json({
          message: `Here is your configuration for ${state.service.toUpperCase()}:\n${Object.entries(state.fields).map(([k,v]) => `- ${k}: ${v}`).join('\n')}\nTotal Monthly Cost: SAR ${pricing.totalMonthlySAR}`
        });
      } else {
        return res.json({ message: buildPromptForField(nextMissing) });
      }
    } else {
      // If value not found, ask the prompt for this field
      return res.json({ message: buildPromptForField(nextField) });
    }
  } catch (err) {
    console.error('[AI ROUTE] Unexpected error:', err);
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
