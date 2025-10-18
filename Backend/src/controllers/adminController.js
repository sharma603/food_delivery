import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Order from '../models/Order.js';

// Dashboard Statistics
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalRestaurants,
      totalOrders,
      activeRestaurants,
      pendingRestaurants,
      todayOrders,
      totalRevenue
    ] = await Promise.all([
      User.countDocuments(),
      Restaurant.countDocuments(),
      Order.countDocuments(),
      Restaurant.countDocuments({ isActive: true, isVerified: true }),
      Restaurant.countDocuments({ isVerified: false }),
      Order.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }),
      Order.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ])
    ]);

    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalRestaurants,
          totalOrders,
          activeRestaurants,
          pendingRestaurants,
          todayOrders,
          totalRevenue: totalRevenue[0]?.total || 0
        },
        usersByRole,
        ordersByStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// User Management
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;
    const query = {};

    if (role && role !== 'all') query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (status === 'verified') query.isVerified = true;
    if (status === 'unverified') query.isVerified = false;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive, isVerified, role } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (isActive !== undefined) user.isActive = isActive;
    if (isVerified !== undefined) user.isVerified = isVerified;
    if (role && ['customer', 'restaurant', 'delivery'].includes(role)) {
      user.role = role;
    }

    await user.save();

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has any active orders or restaurants
    if (user.role === 'restaurant') {
      const hasRestaurants = await Restaurant.countDocuments({ owner: userId });
      if (hasRestaurants > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete user with active restaurants'
        });
      }
    }

    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Restaurant Management
const getAllRestaurants = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, city, cuisine } = req.query;
    const filters = {};

    if (status) filters.status = status;
    if (city) filters.city = city;
    if (cuisine) filters.cuisine = cuisine;

    const restaurants = await Restaurant.getForAdminManagement(filters)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Restaurant.countDocuments();

    res.json({
      success: true,
      data: {
        restaurants,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurants',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const verifyRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const adminId = req.user._id;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    await restaurant.verifyRestaurant(adminId);

    res.json({
      success: true,
      data: restaurant,
      message: 'Restaurant verified successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying restaurant',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const rejectRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    await restaurant.rejectRestaurant(adminId, reason);

    res.json({
      success: true,
      data: restaurant,
      message: 'Restaurant rejected successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting restaurant',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Order Management
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, restaurant } = req.query;
    const query = {};

    if (status) query.status = status;
    if (restaurant) query.restaurant = restaurant;

    const orders = await Order.find(query)
      .populate('customer', 'name email phone')
      .populate('restaurant', 'name')
      .populate('deliveryPerson', 'name phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Analytics
const getAnalytics = async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    let startDate;
    const endDate = new Date();

    switch (period) {
      case '1d':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    const [orderAnalytics, revenueAnalytics, userGrowth] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            orders: { $sum: 1 },
            revenue: { $sum: '$total' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      Order.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            averageOrderValue: { $avg: '$total' },
            totalOrders: { $sum: 1 }
          }
        }
      ]),
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            newUsers: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        orderAnalytics,
        revenueAnalytics: revenueAnalytics[0] || { totalRevenue: 0, averageOrderValue: 0, totalOrders: 0 },
        userGrowth
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export {
  getDashboardStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getAllRestaurants,
  verifyRestaurant,
  rejectRestaurant,
  getAllOrders,
  getAnalytics
};