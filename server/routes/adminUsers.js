import express from 'express';
import User from '../models/User.js';
import ChatSession from '../models/ChatSession.js';
import { adminAuth, checkPermission } from '../middleware/adminAuth.js';

const router = express.Router();

// Get all users with pagination and filtering
router.get('/', adminAuth, checkPermission('users:read'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter query
    let filter = {};
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status !== 'all') {
      filter.status = status;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get users with session counts
    const users = await User.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'chatsessions',
          localField: '_id',
          foreignField: 'userId',
          as: 'sessions'
        }
      },
      {
        $addFields: {
          sessionCount: { $size: '$sessions' },
          name: { $concat: ['$firstName', ' ', '$lastName'] }
        }
      },
      {
        $project: {
          password: 0,
          sessions: 0
        }
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / parseInt(limit));

    res.json({
      success: true,
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        company: user.company || 'N/A',
        sessions: user.sessionCount,
        lastLogin: user.lastLogin || user.createdAt,
        status: user.status || 'active',
        plan: user.plan || 'Basic',
        createdAt: user.createdAt
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Get single user details
router.get('/:userId', adminAuth, checkPermission('users:read'), async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's sessions
    const sessions = await ChatSession.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get session stats
    const sessionStats = await ChatSession.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          completedSessions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    const stats = sessionStats[0] || {
      totalSessions: 0,
      completedSessions: 0,
      avgDuration: 0
    };

    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        company: user.company,
        status: user.status || 'active',
        plan: user.plan || 'Basic',
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      sessions: sessions.map(session => ({
        id: session._id,
        title: session.title || 'Untitled Session',
        status: session.status,
        createdAt: session.createdAt,
        messageCount: session.messages?.length || 0,
        services: session.services?.length || 0
      })),
      stats
    });

  } catch (error) {
    console.error('Admin get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details'
    });
  }
});

// Update user status
router.patch('/:userId/status', adminAuth, checkPermission('users:write'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, inactive, or suspended'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status, updatedAt: new Date() },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Admin update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
});

// Update user plan
router.patch('/:userId/plan', adminAuth, checkPermission('users:write'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { plan } = req.body;

    if (!['Basic', 'Professional', 'Enterprise'].includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan. Must be Basic, Professional, or Enterprise'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { plan, updatedAt: new Date() },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User plan updated to ${plan}`,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        plan: user.plan
      }
    });

  } catch (error) {
    console.error('Admin update user plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user plan'
    });
  }
});

// Delete user (soft delete)
router.delete('/:userId', adminAuth, checkPermission('users:write'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { permanent = false } = req.query;

    if (permanent === 'true') {
      // Permanent deletion - also delete all user's sessions
      await ChatSession.deleteMany({ userId });
      await User.findByIdAndDelete(userId);
      
      res.json({
        success: true,
        message: 'User permanently deleted'
      });
    } else {
      // Soft delete - just update status
      const user = await User.findByIdAndUpdate(
        userId,
        { 
          status: 'deleted',
          deletedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User deleted (can be restored)',
        user: {
          id: user._id,
          email: user.email,
          status: user.status
        }
      });
    }

  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// Get user sessions
router.get('/:userId/sessions', adminAuth, checkPermission('users:read'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const sessions = await ChatSession.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalSessions = await ChatSession.countDocuments({ userId });
    const totalPages = Math.ceil(totalSessions / parseInt(limit));

    res.json({
      success: true,
      sessions: sessions.map(session => ({
        id: session._id,
        title: session.title || 'Untitled Session',
        status: session.status,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        messageCount: session.messages?.length || 0,
        services: session.services || [],
        pricing: session.pricing
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalSessions,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Admin get user sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user sessions'
    });
  }
});

export default router;
