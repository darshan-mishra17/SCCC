// routes/services.js (ESM)
import express from 'express';
import { getAllServices, addService } from '../controllers/serviceController.js';

const router = express.Router();
router.get('/', getAllServices);
router.post('/', addService);

export default router;
