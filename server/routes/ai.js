const express = require('express');
const router = express.Router();
const { generateConfig } = require('../logic/ai');

// POST /api/ai
router.post('/', async (req, res) => {
  const { promptType, inputContext } = req.body;
  try {
    // Call Qwen API or mock logic
    const config = await generateConfig(promptType, inputContext);
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'AI config generation failed', details: err.message });
  }
});

module.exports = router;
