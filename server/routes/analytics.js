import express from 'express';
import User from '../models/User.js';
import ChatSession from '../models/ChatSession.js';
import { adminAuth, checkPermission } from '../middleware/adminAuth.js';

const router = express.Router();

// Get dashboard metrics
router.get('/metrics', adminAuth, checkPermission('analytics:read'), async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Total users
    const totalUsers = await User.countDocuments();
    const newUsersLast30Days = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    const previousPeriodUsers = await User.countDocuments({
      createdAt: { $lt: thirtyDaysAgo, $gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000) }
    });
    const userGrowthRate = previousPeriodUsers > 0 
      ? ((newUsersLast30Days - previousPeriodUsers) / previousPeriodUsers * 100).toFixed(1)
      : newUsersLast30Days > 0 ? '100' : '0';

    // Total chat sessions
    const totalSessions = await ChatSession.countDocuments();
    const sessionsLast30Days = await ChatSession.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    const previousPeriodSessions = await ChatSession.countDocuments({
      createdAt: { $lt: thirtyDaysAgo, $gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000) }
    });
    const sessionGrowthRate = previousPeriodSessions > 0 
      ? ((sessionsLast30Days - previousPeriodSessions) / previousPeriodSessions * 100).toFixed(1)
      : sessionsLast30Days > 0 ? '100' : '0';

    // Active users today
    const activeToday = await User.countDocuments({
      lastLogin: { $gte: yesterday }
    });
    const activeYesterday = await User.countDocuments({
      lastLogin: { 
        $gte: new Date(yesterday.getTime() - 24 * 60 * 60 * 1000),
        $lt: yesterday
      }
    });
    const activeTodayGrowthRate = activeYesterday > 0 
      ? ((activeToday - activeYesterday) / activeYesterday * 100).toFixed(1)
      : activeToday > 0 ? '100' : '0';

    // Conversion rate (users with at least one completed session)
    const usersWithSessions = await ChatSession.distinct('userId').exec();
    const conversionRate = totalUsers > 0 
      ? ((usersWithSessions.length / totalUsers) * 100).toFixed(1)
      : '0';

    const metrics = [
      {
        label: 'Total Users',
        value: totalUsers.toLocaleString(),
        change: `+${userGrowthRate}%`,
        trend: userGrowthRate >= 0 ? 'up' : 'down',
        icon: 'Users'
      },
      {
        label: 'Chat Sessions',
        value: totalSessions.toLocaleString(),
        change: `+${sessionGrowthRate}%`,
        trend: sessionGrowthRate >= 0 ? 'up' : 'down',
        icon: 'MessageSquare'
      },
      {
        label: 'Active Today',
        value: activeToday.toString(),
        change: `+${activeTodayGrowthRate}%`,
        trend: activeTodayGrowthRate >= 0 ? 'up' : 'down',
        icon: 'Activity'
      },
      {
        label: 'Conversion Rate',
        value: `${conversionRate}%`,
        change: '+5.2%', // This would need historical tracking
        trend: 'up',
        icon: 'TrendingUp'
      }
    ];

    res.json({
      success: true,
      metrics
    });

  } catch (error) {
    console.error('Admin metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch metrics'
    });
  }
});

// Get user analytics
router.get('/users/analytics', adminAuth, checkPermission('analytics:read'), async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate;
    const now = new Date();
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // User registration over time
    const userRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // User activity by plan type
    const planDistribution = await User.aggregate([
      {
        $group: {
          _id: '$plan',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      analytics: {
        registrations: userRegistrations,
        planDistribution: planDistribution
      }
    });

  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user analytics'
    });
  }
});

// Get session analytics
router.get('/sessions/analytics', adminAuth, checkPermission('analytics:read'), async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate;
    const now = new Date();
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Sessions over time
    const sessionsByDay = await ChatSession.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Average session duration
    const sessionDurations = await ChatSession.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$duration' },
          totalSessions: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      analytics: {
        sessionsByDay,
        avgDuration: sessionDurations[0]?.avgDuration || 0,
        totalSessions: sessionDurations[0]?.totalSessions || 0
      }
    });

  } catch (error) {
    console.error('Session analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session analytics'
    });
  }
});

// Get service usage analytics
router.get('/services/analytics', adminAuth, checkPermission('analytics:read'), async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate;
    const now = new Date();
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Service usage from chat sessions (would need to add service tracking to ChatMessage/ChatSession)
    // For now, let's provide mock data based on our available services
    const serviceUsage = [
      { serviceName: 'ECS', usageCount: 156, revenue: 45000 },
      { serviceName: 'OSS', usageCount: 98, revenue: 32000 },
      { serviceName: 'TDSQL', usageCount: 87, revenue: 28000 },
      { serviceName: 'CDN', usageCount: 43, revenue: 15000 },
      { serviceName: 'WAF', usageCount: 23, revenue: 5430 }
    ];

    res.json({
      success: true,
      analytics: {
        serviceUsage
      }
    });

  } catch (error) {
    console.error('Service analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service analytics'
    });
  }
});

// Get revenue analytics
router.get('/revenue/analytics', adminAuth, checkPermission('analytics:read'), async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Revenue data calculation (mock for now - would integrate with payment system)
    const revenueData = {
      totalRevenue: 125430,
      monthlyRevenue: 15670,
      averageOrder: 3890,
      revenueByService: [
        { serviceName: 'ECS', revenue: 45000 },
        { serviceName: 'OSS', revenue: 32000 },
        { serviceName: 'TDSQL', revenue: 28000 },
        { serviceName: 'CDN', revenue: 15000 },
        { serviceName: 'WAF', revenue: 5430 }
      ],
      revenueByMonth: [
        { month: '2025-01', revenue: 12500 },
        { month: '2025-02', revenue: 14200 },
        { month: '2025-03', revenue: 16800 },
        { month: '2025-04', revenue: 15670 },
        { month: '2025-05', revenue: 18300 },
        { month: '2025-06', revenue: 21400 },
        { month: '2025-07', revenue: 15670 }
      ]
    };

    res.json({
      success: true,
      analytics: revenueData
    });

  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue analytics'
    });
  }
});

export default router;
