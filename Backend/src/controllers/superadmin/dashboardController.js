// Super Admin Dashboard Controller
// This file structure created as per requested organization
import Restaurant from '../../models/Restaurant.js';
import RestaurantUser from '../../models/RestaurantUser.js';
import RestaurantStatus from '../../models/RestaurantStatus.js';
import Order from '../../models/Order.js';
import Customer from '../../models/Customer.js';
import DailySales from '../../models/Analytics/DailySales.js';

// @desc    Get dashboard overview
// @route   GET /api/superadmin/dashboard
// @access  Private (Super Admin)
export const getDashboardOverview = async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get counts
    const [
      totalRestaurants,
      activeRestaurants,
      totalCustomers,
      totalOrders,
      todayOrders,
      monthlyOrders
    ] = await Promise.all([
      RestaurantUser.countDocuments({ isDeleted: { $ne: true } }),
      RestaurantUser.countDocuments({ isActive: true, isDeleted: { $ne: true } }),
      Customer.countDocuments({ isDeleted: { $ne: true } }),
      Order.countDocuments({}),
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } })
    ]);

    // Get restaurant status statistics from RestaurantStatus collection
    const statusStats = await RestaurantStatus.getStatusStats();
    const openRestaurants = statusStats.open || 0;
    const closedRestaurants = statusStats.closed || 0;

    // Get revenue data
    const revenueData = await DailySales.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalRevenue' },
          totalCommission: { $sum: '$commission' }
        }
      }
    ]);

    const revenue = revenueData[0] || { totalRevenue: 0, totalCommission: 0 };

    // Get top restaurants
    const topRestaurants = await DailySales.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: '$restaurant',
          totalRevenue: { $sum: '$totalRevenue' },
          totalOrders: { $sum: '$totalOrders' }
        }
      },
      {
        $lookup: {
          from: 'restaurants',
          localField: '_id',
          foreignField: '_id',
          as: 'restaurantInfo'
        }
      },
      {
        $unwind: '$restaurantInfo'
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: 5
      },
      {
        $project: {
          name: '$restaurantInfo.name',
          totalRevenue: 1,
          totalOrders: 1
        }
      }
    ]);

    // Get recent orders
    const recentOrders = await Order.find({})
      .populate('customer', 'name email')
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderNumber customer restaurant status totalAmount createdAt');

    const dashboardData = {
      stats: {
        totalRestaurants,
        activeRestaurants,
        openRestaurants,
        closedRestaurants,
        totalCustomers,
        totalOrders,
        todayOrders,
        monthlyOrders,
        monthlyRevenue: revenue.totalRevenue,
        monthlyCommission: revenue.totalCommission
      },
      topRestaurants,
      recentOrders,
      performanceMetrics: {
        restaurantGrowth: await calculateGrowthRate('restaurants', startOfMonth),
        customerGrowth: await calculateGrowthRate('customers', startOfMonth),
        orderGrowth: await calculateGrowthRate('orders', startOfMonth)
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
};

// Helper function to calculate growth rate
const calculateGrowthRate = async (type, currentPeriodStart) => {
  const previousPeriodStart = new Date(currentPeriodStart);
  previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);

  let Model;
  switch (type) {
    case 'restaurants':
      Model = Restaurant;
      break;
    case 'customers':
      Model = Customer;
      break;
    case 'orders':
      Model = Order;
      break;
    default:
      return 0;
  }

  const [currentCount, previousCount] = await Promise.all([
    Model.countDocuments({ 
      createdAt: { $gte: currentPeriodStart }
    }),
    Model.countDocuments({ 
      createdAt: { 
        $gte: previousPeriodStart,
        $lt: currentPeriodStart
      }
    })
  ]);

  if (previousCount === 0) return currentCount > 0 ? 100 : 0;
  return ((currentCount - previousCount) / previousCount) * 100;
};

export default {
  getDashboardOverview
};
