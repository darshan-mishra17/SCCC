import express from 'express';
import { calculatePricing } from '../logic/pricing.js';

const router = express.Router();

// POST /api/pricing
router.post('/', async (req, res) => {
  try {
    const pricing = await calculatePricing(req.body);
    res.json(pricing);
  } catch (err) {
    res.status(500).json({ error: 'Pricing calculation failed', details: err.message });
  }
});

export default router;