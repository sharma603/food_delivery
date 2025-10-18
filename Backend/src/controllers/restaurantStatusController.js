import RestaurantStatus from '../models/RestaurantStatus.js';
import RestaurantUser from '../models/RestaurantUser.js';
import { asyncHandler } from '../utils/helpers.js';

// @desc    Get restaurant status history
// @route   GET /api/restaurant/status/history
// @access  Private (Restaurant)
export const getRestaurantStatusHistory = asyncHandler(async (req, res) => {
  const { limit = 50, page = 1 } = req.query;
  const restaurantId = req.user._id;

  const statusHistory = await RestaurantStatus.find({
    restaurant: restaurantId,
    isActive: true
  })
  .populate('changedBy', 'restaurantName email')
  .sort({ createdAt: -1 })
  .limit(limit * 1)
  .skip((page - 1) * limit);

  const total = await RestaurantStatus.countDocuments({
    restaurant: restaurantId,
    isActive: true
  });

  res.json({
    success: true,
    data: statusHistory,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total
    }
  });
});

// @desc    Get current restaurant status
// @route   GET /api/restaurant/status/current
// @access  Private (Restaurant)
export const getCurrentRestaurantStatus = asyncHandler(async (req, res) => {
  const restaurantId = req.user._id;
  
  const currentStatus = await RestaurantStatus.getCurrentStatus(restaurantId);
  const restaurant = await RestaurantUser.findById(restaurantId).select('isOpen restaurantName');

  res.json({
    success: true,
    data: {
      status: currentStatus,
      isOpen: restaurant.isOpen,
      restaurantName: restaurant.restaurantName,
      lastUpdated: new Date()
    }
  });
});

// @desc    Get all restaurants status (Super Admin)
// @route   GET /api/superadmin/restaurants/status
// @access  Private (Super Admin)
export const getAllRestaurantsStatus = asyncHandler(async (req, res) => {
  const { status, limit = 50, page = 1 } = req.query;

  // Build query
  const query = { isActive: true };
  if (status && status !== 'all') {
    query.status = status;
  }

  const statusHistory = await RestaurantStatus.find(query)
    .populate('restaurant', 'restaurantName email phone')
    .populate('changedBy', 'restaurantName email')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await RestaurantStatus.countDocuments(query);

  res.json({
    success: true,
    data: statusHistory,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total
    }
  });
});

// @desc    Get restaurant status statistics (Super Admin)
// @route   GET /api/superadmin/restaurants/status/stats
// @access  Private (Super Admin)
export const getRestaurantStatusStats = asyncHandler(async (req, res) => {
  const stats = await RestaurantStatus.getStatusStats();
  
  // Get additional statistics
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    todayChanges,
    weekChanges,
    monthChanges,
    recentChanges
  ] = await Promise.all([
    RestaurantStatus.countDocuments({
      createdAt: { $gte: startOfToday },
      isActive: true
    }),
    RestaurantStatus.countDocuments({
      createdAt: { $gte: startOfWeek },
      isActive: true
    }),
    RestaurantStatus.countDocuments({
      createdAt: { $gte: startOfMonth },
      isActive: true
    }),
    RestaurantStatus.find({ isActive: true })
      .populate('restaurant', 'restaurantName')
      .populate('changedBy', 'restaurantName')
      .sort({ createdAt: -1 })
      .limit(10)
  ]);

  res.json({
    success: true,
    data: {
      ...stats,
      todayChanges,
      weekChanges,
      monthChanges,
      recentChanges
    }
  });
});

// @desc    Get restaurant status by restaurant ID (Super Admin)
// @route   GET /api/superadmin/restaurants/:id/status
// @access  Private (Super Admin)
export const getRestaurantStatusById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 50 } = req.query;

  const restaurant = await RestaurantUser.findById(id);
  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  const currentStatus = await RestaurantStatus.getCurrentStatus(id);
  const statusHistory = await RestaurantStatus.getStatusHistory(id, limit);

  res.json({
    success: true,
    data: {
      restaurant: {
        _id: restaurant._id,
        restaurantName: restaurant.restaurantName,
        email: restaurant.email,
        phone: restaurant.phone,
        isOpen: restaurant.isOpen
      },
      currentStatus,
      statusHistory
    }
  });
});
