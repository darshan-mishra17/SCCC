import express from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { saveServiceConfiguration } from '../middleware/chatSession.js';

const router = express.Router();

// Store quotations (in a real app, this would be in a database)
const quotations = [];

// Save a new quotation
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { services, pricing, timestamp, sessionId } = req.body;
    
    // Validate required fields
    if (!services || !pricing || !timestamp) {
      return res.status(400).json({ 
        error: 'Missing required fields: services, pricing, timestamp' 
      });
    }

    // Create quotation object
    const quotation = {
      id: Date.now().toString(), // Simple ID generation
      services,
      pricing,
      timestamp,
      sessionId,
      userId: req.user?._id,
      createdAt: new Date().toISOString()
    };

    // Save quotation (in memory for now)
    quotations.push(quotation);

    // Save to chat session if user is authenticated and sessionId provided
    if (req.user && sessionId) {
      await saveServiceConfiguration(sessionId, req.user._id, services, pricing);
    }

    console.log('💾 Quotation saved:', {
      id: quotation.id,
      servicesCount: services.length,
      total: pricing.total,
      timestamp,
      sessionId,
      userId: req.user?._id
    });

    res.status(201).json({
      success: true,
      message: 'Quotation saved successfully',
      quotationId: quotation.id
    });

  } catch (error) {
    console.error('❌ Error saving quotation:', error);
    res.status(500).json({ 
      error: 'Failed to save quotation',
      details: error.message 
    });
  }
});

// Get all quotations
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      quotations: quotations.map(q => ({
        id: q.id,
        servicesCount: q.services.length,
        total: q.pricing.total,
        timestamp: q.timestamp,
        createdAt: q.createdAt
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching quotations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch quotations',
      details: error.message 
    });
  }
});

// Get a specific quotation by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = quotations.find(q => q.id === id);
    
    if (!quotation) {
      return res.status(404).json({ 
        error: 'Quotation not found' 
      });
    }

    res.json({
      success: true,
      quotation
    });
  } catch (error) {
    console.error('❌ Error fetching quotation:', error);
    res.status(500).json({ 
      error: 'Failed to fetch quotation',
      details: error.message 
    });
  }
});

export default router;
