import express from 'express';
import ChatSession from '../models/ChatSession.js';
import ChatMessage from '../models/ChatMessage.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// @route GET /api/chat/sessions
// @desc Get all chat sessions for authenticated user
// @access Private
router.get('/sessions', async (req, res) => {
  try {
    const { status, limit = 20, page = 1, search } = req.query;
    
    // Build query
    const query = { 
      userId: req.user._id,
      isActive: true
    };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'services.name': { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const sessions = await ChatSession.find(query)
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select('-__v');
    
    const total = await ChatSession.countDocuments(query);
    
    // Transform for frontend
    const transformedSessions = sessions.map(session => ({
      sessionId: session.sessionId,
      title: session.title,
      services: session.services,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      pricing: session.pricing,
      estimatedCost: session.estimatedCost,
      status: session.status,
      lastMessage: session.lastMessage || 'No messages yet',
      messageCount: session.messageCount
    }));
    
    res.json({
      success: true,
      sessions: transformedSessions,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: sessions.length,
        totalSessions: total
      }
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving chat sessions'
    });
  }
});

// @route POST /api/chat/sessions
// @desc Create a new chat session
// @access Private
router.post('/sessions', async (req, res) => {
  try {
    const { title, tags } = req.body;
    
    const session = new ChatSession({
      userId: req.user._id,
      title: title || 'New Consultation',
      tags: tags || [],
      status: 'draft'
    });
    
    await session.save();
    
    res.status(201).json({
      success: true,
      message: 'Chat session created successfully',
      session: {
        sessionId: session.sessionId,
        title: session.title,
        status: session.status,
        createdAt: session.createdAt
      }
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating chat session'
    });
  }
});

// @route GET /api/chat/sessions/:sessionId
// @desc Get specific chat session with messages
// @access Private
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Get session
    const session = await ChatSession.findOne({
      sessionId,
      userId: req.user._id,
      isActive: true
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }
    
    // Get messages
    const messages = await ChatMessage.find({
      sessionId,
      userId: req.user._id,
      isDeleted: false
    }).sort({ sequenceNumber: 1 });
    
    res.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        title: session.title,
        status: session.status,
        services: session.services,
        pricing: session.pricing,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      },
      messages: messages.map(msg => ({
        id: msg._id,
        messageType: msg.messageType,
        content: msg.content,
        metadata: msg.metadata,
        sequenceNumber: msg.sequenceNumber,
        createdAt: msg.createdAt,
        isEdited: msg.isEdited
      }))
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving chat session'
    });
  }
});

// @route PUT /api/chat/sessions/:sessionId
// @desc Update chat session (title, status, services, pricing)
// @access Private
router.put('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title, status, services, pricing, lastMessage } = req.body;
    
    const session = await ChatSession.findOne({
      sessionId,
      userId: req.user._id,
      isActive: true
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }
    
    // Update fields
    if (title) session.title = title;
    if (status) session.status = status;
    if (services) session.services = services;
    if (pricing) session.pricing = pricing;
    if (lastMessage) session.lastMessage = lastMessage;
    
    // Mark as completed if status is completed
    if (status === 'completed' && !session.completedAt) {
      session.completedAt = new Date();
    }
    
    await session.save();
    
    res.json({
      success: true,
      message: 'Chat session updated successfully',
      session: {
        sessionId: session.sessionId,
        title: session.title,
        status: session.status,
        updatedAt: session.updatedAt
      }
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating chat session'
    });
  }
});

// @route POST /api/chat/sessions/:sessionId/messages
// @desc Add message to chat session
// @access Private
router.post('/sessions/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { messageType, content, metadata } = req.body;
    
    // Verify session exists and belongs to user
    const session = await ChatSession.findOne({
      sessionId,
      userId: req.user._id,
      isActive: true
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }
    
    // Create message
    const message = new ChatMessage({
      sessionId,
      userId: req.user._id,
      messageType,
      content,
      metadata: metadata || {}
    });
    
    await message.save();
    
    // Update session message count and last message
    session.messageCount += 1;
    session.lastMessage = content.length > 100 ? content.substring(0, 100) + '...' : content;
    session.status = 'in-progress'; // Update status when messages are added
    await session.save();
    
    res.status(201).json({
      success: true,
      message: 'Message added successfully',
      chatMessage: {
        id: message._id,
        messageType: message.messageType,
        content: message.content,
        sequenceNumber: message.sequenceNumber,
        createdAt: message.createdAt
      }
    });
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding message to chat'
    });
  }
});

// @route DELETE /api/chat/sessions/:sessionId
// @desc Soft delete chat session
// @access Private
router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await ChatSession.findOne({
      sessionId,
      userId: req.user._id,
      isActive: true
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }
    
    session.isActive = false;
    await session.save();
    
    res.json({
      success: true,
      message: 'Chat session deleted successfully'
    });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting chat session'
    });
  }
});

// @route GET /api/chat/stats
// @desc Get chat statistics for user
// @access Private
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;
    
    const stats = await ChatSession.aggregate([
      {
        $match: { userId, isActive: true }
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          completedSessions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalEstimatedCost: { $sum: '$pricing.total' },
          averageCost: { $avg: '$pricing.total' }
        }
      }
    ]);
    
    const result = stats[0] || {
      totalSessions: 0,
      completedSessions: 0,
      totalEstimatedCost: 0,
      averageCost: 0
    };
    
    res.json({
      success: true,
      stats: {
        totalSessions: result.totalSessions,
        completedSessions: result.completedSessions,
        inProgressSessions: result.totalSessions - result.completedSessions,
        totalEstimatedCost: result.totalEstimatedCost,
        averageCost: result.averageCost,
        formattedTotalCost: `SAR ${result.totalEstimatedCost.toFixed(2)}`,
        formattedAverageCost: `SAR ${result.averageCost.toFixed(2)}`
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving chat statistics'
    });
  }
});

export default router;
