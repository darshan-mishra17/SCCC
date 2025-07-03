const express = require('express');
const router = express.Router();
const { generateConfig } = require('../logic/ai');

// POST /api/ai

router.post('/', async (req, res) => {
  const { promptType, inputContext } = req.body;
  console.log('[AI ROUTE] Received /api/ai POST:', { promptType, inputContext });
  try {
    const config = await generateConfig(promptType, inputContext);
    console.log('[AI ROUTE] AI config generated:', config);
    // Convert config object to array for frontend
    const serviceMap = {
      ecs: {
        name: 'Elastic Compute Service (ECS)',
        getConfig: (c) => `${c.instanceType || ''}${c.count ? ', Count: ' + c.count : ''}`,
      },
      oss: {
        name: 'Object Storage Service (OSS)',
        getConfig: (c) => `Storage: ${c.storageGB || 0} GB`,
      },
      tdsql: {
        name: 'TDSQL',
        getConfig: (c) => `Nodes: ${c.nodes || 1}, Engine: ${c.engine || ''}`,
      },
    };
    // If config is already an array, just return it (for future-proofing)
    if (Array.isArray(config)) {
      res.json(config);
      return;
    }
    // If config is an object, convert to array for frontend
    let arr = [];
    if (config && typeof config === 'object') {
      arr = Object.entries(config)
        .filter(([k, v]) => serviceMap[k] && typeof v === 'object')
        .map(([k, v]) => ({
          name: serviceMap[k].name,
          config: serviceMap[k].getConfig(v),
          monthlyCost: v.monthlyCost || undefined,
        }));
    }
    // Log for debugging
    console.log('[AI ROUTE] Returning array to frontend:', arr);
    // If nothing matched, send a fallback demo array
    if (!arr || arr.length === 0) {
      arr = [
        { name: 'Elastic Compute Service (ECS)', config: 'ecs.g6.large, Count: 2', monthlyCost: 150 },
        { name: 'Object Storage Service (OSS)', config: 'Storage: 100 GB', monthlyCost: 30 },
        { name: 'TDSQL', config: 'Nodes: 1, Engine: MySQL', monthlyCost: 120 },
      ];
    }
    res.json(arr);
  } catch (err) {
    console.error('[AI ROUTE] Error generating AI config:', err);
    res.status(500).json({ error: 'AI config generation failed', details: err.message });
  }
});

module.exports = router;
