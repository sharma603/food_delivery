import Order from '../../models/Order.js';
import Restaurant from '../../models/Restaurant.js';
import Customer from '../../models/Customer.js';
import { asyncHandler } from '../../utils/helpers.js';

// @desc    Get dashboard analytics
// @route   GET /api/v1/superadmin/analytics/dashboard
// @access  Private/SuperAdmin
export const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const [
    totalOrders,
    totalRestaurants,
    totalCustomers,
    totalRevenue
  ] = await Promise.all([
    Order.countDocuments(),
    Restaurant.countDocuments({ isActive: true }),
    Customer.countDocuments({ isActive: true }),
    Order.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ])
  ]);

  const todayStats = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    },
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
        revenue: { $sum: '$totalAmount' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      totalOrders,
      totalRestaurants,
      totalCustomers,
      totalRevenue: totalRevenue[0]?.total || 0,
      today: todayStats[0] || { orders: 0, revenue: 0 }
    }
  });
});

// @desc    Get revenue analytics
// @route   GET /api/v1/superadmin/analytics/revenue
// @access  Private/SuperAdmin
export const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;
  
  let startDate;
  const endDate = new Date();
  
  switch (period) {
    case '7d':
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const revenueData = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  res.json({
    success: true,
    data: {
      revenueData,
      period: { startDate, endDate }
    }
  });
});

// @desc    Get order analytics
// @route   GET /api/v1/superadmin/analytics/orders
// @access  Private/SuperAdmin
export const getOrderAnalytics = asyncHandler(async (req, res) => {
  const orderStats = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const hourlyStats = await Order.aggregate([
    {
      $group: {
        _id: { $hour: '$createdAt' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  res.json({
    success: true,
    data: {
      statusDistribution: orderStats,
      hourlyDistribution: hourlyStats
    }
  });
});

// @desc    Get restaurant analytics
// @route   GET /api/v1/superadmin/analytics/restaurants
// @access  Private/SuperAdmin
export const getRestaurantAnalytics = asyncHandler(async (req, res) => {
  const restaurantStats = await Order.aggregate([
    {
      $lookup: {
        from: 'restaurants',
        localField: 'restaurant',
        foreignField: '_id',
        as: 'restaurantInfo'
      }
    },
    {
      $unwind: '$restaurantInfo'
    },
    {
      $group: {
        _id: '$restaurant',
        restaurantName: { $first: '$restaurantInfo.name' },
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' }
      }
    },
    {
      $sort: { totalRevenue: -1 }
    },
    {
      $limit: 10
    }
  ]);

  res.json({
    success: true,
    data: restaurantStats
  });
});

// @desc    Get customer analytics
// @route   GET /api/v1/superadmin/analytics/customers
// @access  Private/SuperAdmin
export const getCustomerAnalytics = asyncHandler(async (req, res) => {
  const customerStats = await Order.aggregate([
    {
      $group: {
        _id: '$customer',
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$totalAmount' }
      }
    },
    {
      $sort: { totalSpent: -1 }
    },
    {
      $limit: 10
    }
  ]);

  res.json({
    success: true,
    data: customerStats
  });
});

// @desc    Get system analytics
// @route   GET /api/v1/superadmin/analytics/system
// @access  Private/SuperAdmin
export const getSystemAnalytics = asyncHandler(async (req, res) => {
  const systemStats = {
    totalOrders: await Order.countDocuments(),
    totalRestaurants: await Restaurant.countDocuments(),
    totalCustomers: await Customer.countDocuments(),
    activeRestaurants: await Restaurant.countDocuments({ isActive: true }),
    activeCustomers: await Customer.countDocuments({ isActive: true })
  };

  res.json({
    success: true,
    data: systemStats
  });
});

// @desc    Get real-time metrics
// @route   GET /api/v1/superadmin/analytics/realtime
// @access  Private/SuperAdmin
export const getRealTimeMetrics = asyncHandler(async (req, res) => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const recentOrders = await Order.countDocuments({
    createdAt: { $gte: oneHourAgo }
  });

  const activeOrders = await Order.countDocuments({
    status: { $in: ['confirmed', 'preparing', 'ready', 'out_for_delivery'] }
  });

  res.json({
    success: true,
    data: {
      recentOrders,
      activeOrders,
      timestamp: now
    }
  });
});

// @desc    Export analytics
// @route   POST /api/v1/superadmin/analytics/export
// @access  Private/SuperAdmin
export const exportAnalytics = asyncHandler(async (req, res) => {
  const { type, filters = {} } = req.body;
  
  // In a real implementation, you would generate and return the export file
  res.json({
    success: true,
    message: 'Analytics exported successfully',
    data: { type, filters }
  });
});
