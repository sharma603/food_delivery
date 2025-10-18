// Restaurant Dashboard Controller
// This file structure created as per requested organization
import Order from '../../models/Order.js';
import MenuItem from '../../models/Menu/MenuItem.js';
import Review from '../../models/Review.js';
import RestaurantStats from '../../models/Analytics/RestaurantStats.js';

// @desc    Get restaurant dashboard data
// @route   GET /api/restaurant/dashboard
// @access  Private (Restaurant)
export const getRestaurantDashboard = async (req, res) => {
  try {
    const restaurantId = req.user._id;
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Get today's stats
    const todayStats = await Order.aggregate([
      {
        $match: {
          restaurant: restaurantId,
          createdAt: { $gte: startOfToday }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.total' },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          pendingOrders: {
            $sum: { $cond: [{ $in: ['$status', ['pending', 'confirmed', 'preparing']] }, 1, 0] }
          }
        }
      }
    ]);

    const stats = todayStats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      completedOrders: 0,
      pendingOrders: 0
    };

    // Get recent orders with proper customer population
    const recentOrders = await Order.find({
      restaurant: restaurantId
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('orderNumber customer status pricing.total items createdAt estimatedDeliveryTime');

    // Populate customer information from Customer collection
    const Customer = (await import('../../models/Customer.js')).default;
    for (let order of recentOrders) {
      if (order.customer) {
        try {
          const customer = await Customer.findById(order.customer);
          if (customer) {
            order.customer = {
              _id: customer._id,
              name: customer.name,
              email: customer.email,
              phone: customer.phone
            };
          }
        } catch (error) {
          console.log('Error populating customer:', error.message);
        }
      }
    }

    // Get popular menu items
    const popularItems = await MenuItem.find({
      restaurant: restaurantId,
      isActive: true
    })
    .sort({ orderCount: -1 })
    .limit(5)
    .select('name price orderCount rating');

    // Get average rating
    const ratingData = await Review.aggregate([
      {
        $match: { restaurant: restaurantId }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const rating = ratingData[0] || { averageRating: 0, totalReviews: 0 };

    const dashboardData = {
      todayStats: {
        ...stats,
        averageOrderValue: stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0
      },
      recentOrders,
      popularItems,
      rating: {
        average: Math.round(rating.averageRating * 10) / 10,
        count: rating.totalReviews
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Restaurant dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
};

export default {
  getRestaurantDashboard
};
