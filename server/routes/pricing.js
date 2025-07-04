const express = require('express');
const router = express.Router();
const { calculatePricing } = require('../logic/pricing');

// POST /api/pricing
router.post('/', async (req, res) => {
  try {
    const pricing = await calculatePricing(req.body);
    res.json(pricing);
  } catch (err) {
    res.status(500).json({ error: 'Pricing calculation failed', details: err.message });
  }
});

module.exports = router;