// const express = require('express');
// const router = express.Router();
// const { generateConfig } = require('../logic/ai');

// // POST /api/ai

// router.post('/', async (req, res) => {
//   const { promptType, inputContext } = req.body;
//   console.log('[AI ROUTE] Received /api/ai POST:', { promptType, inputContext });
//   try {
//     const config = await generateConfig(promptType, inputContext);
//     console.log('[AI ROUTE] AI config generated:', config);
//     // Convert config object to array for frontend
//     const serviceMap = {
//       ecs: {
//         name: 'Elastic Compute Service (ECS)',
//         getConfig: (c) => `${c.instanceType || ''}${c.count ? ', Count: ' + c.count : ''}`,
//       },
//       oss: {
//         name: 'Object Storage Service (OSS)',
//         getConfig: (c) => `Storage: ${c.storageGB || 0} GB`,
//       },
//       tdsql: {
//         name: 'TDSQL',
//         getConfig: (c) => `Nodes: ${c.nodes || 1}, Engine: ${c.engine || ''}`,
//       },
//     };
//     // If config is already an array, return as { solution: [...] }
//     if (Array.isArray(config)) {
//       res.json({
//         message: 'Here is the recommended configuration:',
//         solution: config
//       });
//       return;
//     }
//     // If config is an object, convert to array for frontend and calculate monthlyCost
//     let arr = [];
//     if (config && typeof config === 'object') {
//       // Import pricing logic here to avoid circular dependency at top
//       const { calculatePricing } = require('../logic/pricing');
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

const express = require('express');
const router = express.Router();
const { extractFieldValue } = require('../services/groqService');
const { initializeState, updateState, getNextMissingField, isStateComplete } = require('../services/StateManager');
const { buildPromptForField } = require('../services/PromptBuilder');
// For demo: use in-memory state. Replace with DB for production.
const sessionStates = {};

// POST /api/ai/message
router.post('/message', async (req, res) => {
  const { sessionId, userMessage } = req.body;
  if (!sessionId || !userMessage) {
    return res.status(400).json({ error: 'Missing sessionId or userMessage' });
  }

  // Load or create state
  let state = sessionStates[sessionId];
  if (!state) {
    // Try to detect service from userMessage (simple keyword match)
    let service = null;
    if (/ecs/i.test(userMessage)) service = 'ECS';
    else if (/oss/i.test(userMessage)) service = 'OSS';
    else if (/tdsql/i.test(userMessage)) service = 'TDSQL';
    if (!service) {
      return res.json({ message: 'Which service would you like to configure? (ECS, OSS, TDSQL)' });
    }
    state = initializeState(service);
    sessionStates[sessionId] = state;
  }

  // If state is already complete, just return summary
  if (isStateComplete(state)) {
    return respondWithSummary(state, res);
  }

  // Find next missing field
  const nextField = getNextMissingField(state);
  if (!nextField) {
    return respondWithSummary(state, res);
  }

  // Use Groq to extract value for the next field
  let extractedValue = null;
  try {
    extractedValue = await extractFieldValue(userMessage, nextField);
    if (extractedValue) {
      state[nextField] = extractedValue;
      state.isComplete = isStateComplete(state);
    }
  } catch (e) {
    return res.status(500).json({ error: 'AI extraction failed', details: e.message });
  }

  // If still incomplete, ask next question
  if (!state.isComplete) {
    const nextMissing = getNextMissingField(state);
    const prompt = buildPromptForField(nextMissing, state);
    return res.json({ message: prompt, state });
  }

  // If complete, return summary
  return respondWithSummary(state, res);
});


// Helper: respond with config and price summary (uses real pricingEngine)
function respondWithSummary(state, res) {
  try {
    const { calculatePrice } = require('../services/pricingEngine');
    const price = calculatePrice(state);
    return res.json({
      message: `Configuration complete for ${state.service}. Monthly cost: SAR ${price.totalMonthlySAR}`,
      config: state,
      price
    });
  } catch (e) {
    return res.status(500).json({ error: 'Pricing calculation failed', details: e.message });
  }
}

module.exports = router;
