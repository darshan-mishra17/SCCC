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
    res.json(config);
  } catch (err) {
    console.error('[AI ROUTE] Error generating AI config:', err);
    res.status(500).json({ error: 'AI config generation failed', details: err.message });
  }
});

module.exports = router;
