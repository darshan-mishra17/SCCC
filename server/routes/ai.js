import express from 'express';
import { getGroqAIResponse } from '../logic/groq.js';
import { initializeState, getSessionState, setSessionState, getRequiredFields, getNextMissingField, updateFields, isFieldsComplete } from '../logic/stateManager.js';
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
      // Detect multiple services in user message
      let serviceNames = [];
      if (/ecs|virtual machine|vm/i.test(userMessage)) serviceNames.push('ecs');
      if (/oss|object storage/i.test(userMessage)) serviceNames.push('oss');
      if (/tdsql|database|mysql|rds/i.test(userMessage)) serviceNames.push('tdsql');
      if (serviceNames.length === 0) {
        return res.json({ message: 'Which service(s) would you like to configure? (ECS, OSS, TDSQL) You can mention more than one.' });
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
    const nextFieldObj = getNextMissingField(currentService.fields, requiredFields);

    // If all fields for current service collected, move to next service or finish
    if (!nextFieldObj) {
      services[currentServiceIdx].complete = true;
      // If more services to configure
      if (currentServiceIdx < services.length - 1) {
        state.currentServiceIdx++;
        setSessionState(sessionId, state);
        const nextService = services[state.currentServiceIdx].name.toUpperCase();
        return res.json({ message: `Now let's configure your ${nextService} service.` });
      } else {
        // All services complete, show summary and pricing
        const pricingInput = {};
        services.forEach(s => { pricingInput[s.name] = s.fields; });
        const pricing = calculatePricing(pricingInput);
        setSessionState(sessionId, null); // End session
        // Build services array for UI cards
        const servicesArr = services.map(s => {
          // Calculate monthly cost for each service
          let monthlyCost = 0;
          try {
            const singlePricing = calculatePricing({ [s.name]: s.fields });
            monthlyCost = singlePricing.totalMonthlySAR || 0;
          } catch (e) { monthlyCost = 0; }
          return {
            name: s.name,
            config: s.fields,
            monthlyCost
          };
        });
        return res.json({
          services: servicesArr,
          pricing
        });
      }
    }

    // Use AI to extract the value for the next field from user input
    const aiExtractPrompt = `Extract the value for the field "${nextFieldObj.label || nextFieldObj.key}" from this user message: "${userMessage}". If not present, respond with null. Respond in JSON: { "${nextFieldObj.key}": value }`;
    let aiExtracted = null;
    try {
      aiExtracted = await getGroqAIResponse('default', { prompt: aiExtractPrompt });
    } catch (e) {
      console.error('[AI ROUTE] AI extraction error:', e);
      aiExtracted = { [nextFieldObj.key]: null };
    }
    const value = aiExtracted[nextFieldObj.key];
    // DEBUG: Log state and required fields after extraction
    console.log('[DEBUG] Session state:', JSON.stringify(state, null, 2));
    console.log('[DEBUG] Required fields:', requiredFields);
    if (value !== null && value !== undefined && value !== '') {
      updateFields(currentService.fields, nextFieldObj, value);
      setSessionState(sessionId, state);
      // After update, check if more fields needed for this service
      const nextMissing = getNextMissingField(currentService.fields, requiredFields);
      // DEBUG: Log fields after update
      console.log('[DEBUG] Fields after update:', currentService.fields);
      if (!nextMissing) {
        services[currentServiceIdx].complete = true;
        if (currentServiceIdx < services.length - 1) {
          state.currentServiceIdx++;
          setSessionState(sessionId, state);
          const nextService = services[state.currentServiceIdx].name.toUpperCase();
          return res.json({ message: `Now let's configure your ${nextService} service.` });
        } else {
          // All services complete, show summary and pricing (structured data only)
          const pricingInput = {};
          services.forEach(s => { pricingInput[s.name] = s.fields; });
          const pricing = calculatePricing(pricingInput);
          setSessionState(sessionId, null); // End session
          // Build services array for UI cards
          const servicesArr = services.map(s => {
            // Calculate monthly cost for each service
            let monthlyCost = 0;
            try {
              const singlePricing = calculatePricing({ [s.name]: s.fields });
              monthlyCost = singlePricing.totalMonthlySAR || 0;
            } catch (e) { monthlyCost = 0; }
            return {
              name: s.name,
              config: s.fields,
              monthlyCost
            };
          });
          // DEBUG: Log final services and pricing
          console.log('[DEBUG] Returning servicesArr:', servicesArr);
          console.log('[DEBUG] Returning pricing:', pricing);
          return res.json({
            services: servicesArr,
            pricing
          });
        }
      } else {
        return res.json({ message: buildPromptForField(nextMissing) });
      }
    } else {
      // If value not found, ask the prompt for this field
      return res.json({ message: buildPromptForField(nextFieldObj) });
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
