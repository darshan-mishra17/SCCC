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
const { analyzeServices } = require('../controllers/aiController');

// POST /api/ai/analyze
router.post('/analyze', analyzeServices);

module.exports = router;
