// Restaurant Analytics Controller
import Order from '../../models/Order.js';
import RestaurantStats from '../../models/Analytics/RestaurantStats.js';
import DailySales from '../../models/Analytics/DailySales.js';
import Customer from '../../models/Customer.js';

// @desc    Get comprehensive restaurant analytics dashboard
// @route   GET /api/v1/restaurant/analytics/dashboard
// @access  Private (Restaurant, SuperAdmin)
export const getDashboardAnalytics = async (req, res) => {
  try {
    // SuperAdmin can view analytics for any restaurant by passing restaurantId
    const restaurantId = req.query.restaurantId || req.user._id;
    const { period = 'daily', startDate, endDate } = req.query;

    // Calculate date range
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // Default 30 days

    // Get overall statistics
    const totalOrders = await Order.countDocuments({ 
      restaurant: restaurantId,
      createdAt: { $gte: start, $lte: end }
    });

    const completedOrders = await Order.countDocuments({ 
      restaurant: restaurantId,
      status: 'delivered',
      createdAt: { $gte: start, $lte: end }
    });

    const cancelledOrders = await Order.countDocuments({ 
      restaurant: restaurantId,
      status: 'cancelled',
      createdAt: { $gte: start, $lte: end }
    });

    // Revenue calculation
    const revenueData = await Order.aggregate([
      {
        $match: {
          restaurant: restaurantId,
          status: 'delivered',
          paymentStatus: 'paid',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.total' },
          totalSubtotal: { $sum: '$pricing.subtotal' },
          totalDeliveryFees: { $sum: '$pricing.deliveryFee' },
          totalTax: { $sum: '$pricing.tax' },
          totalDiscount: { $sum: '$pricing.discount' },
          avgOrderValue: { $avg: '$pricing.total' }
        }
      }
    ]);

    const revenue = revenueData[0] || {
      totalRevenue: 0,
      totalSubtotal: 0,
      totalDeliveryFees: 0,
      totalTax: 0,
      totalDiscount: 0,
      avgOrderValue: 0
    };

    // Previous period comparison
    const previousStart = new Date(start.getTime() - (end - start));
    const previousEnd = new Date(start);

    const previousRevenue = await Order.aggregate([
      {
        $match: {
          restaurant: restaurantId,
          status: 'delivered',
          paymentStatus: 'paid',
          createdAt: { $gte: previousStart, $lte: previousEnd }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$pricing.total' }
        }
      }
    ]);

    const previousTotal = previousRevenue[0]?.total || 0;
    const revenueGrowth = previousTotal > 0 
      ? ((revenue.totalRevenue - previousTotal) / previousTotal * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalOrders,
          completedOrders,
          cancelledOrders,
          completionRate: totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(2) : 0,
          cancellationRate: totalOrders > 0 ? ((cancelledOrders / totalOrders) * 100).toFixed(2) : 0
        },
        revenue: {
          total: revenue.totalRevenue.toFixed(2),
          subtotal: revenue.totalSubtotal.toFixed(2),
          deliveryFees: revenue.totalDeliveryFees.toFixed(2),
          tax: revenue.totalTax.toFixed(2),
          discount: revenue.totalDiscount.toFixed(2),
          averageOrderValue: revenue.avgOrderValue.toFixed(2),
          growth: revenueGrowth
        },
        period: {
          start,
          end,
          type: period
        }
      }
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard analytics'
    });
  }
};

// @desc    Get sales analytics with trends
// @route   GET /api/v1/restaurant/analytics/sales
// @access  Private (Restaurant, SuperAdmin)
export const getSalesAnalytics = async (req, res) => {
  try {
    const restaurantId = req.query.restaurantId || req.user._id;
    const { period = 'daily', startDate, endDate, groupBy = 'day' } = req.query;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Group format based on period
    let dateGroupFormat;
    switch (groupBy) {
      case 'hour':
        dateGroupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          hour: { $hour: '$createdAt' }
        };
        break;
      case 'day':
        dateGroupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'week':
        dateGroupFormat = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'month':
        dateGroupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      default:
        dateGroupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }

    const salesTrend = await Order.aggregate([
      {
        $match: {
          restaurant: restaurantId,
          status: 'delivered',
          paymentStatus: 'paid',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: dateGroupFormat,
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 },
          avgOrderValue: { $avg: '$pricing.total' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 }
      }
    ]);

    // Peak hours analysis
    const peakHours = await Order.aggregate([
      {
        $match: {
          restaurant: restaurantId,
          status: 'delivered',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          orderCount: { $sum: 1 },
          revenue: { $sum: '$pricing.total' }
        }
      },
      {
        $sort: { orderCount: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Sales by time of day (breakfast, lunch, dinner)
    const salesByMealTime = await Order.aggregate([
      {
        $match: {
          restaurant: restaurantId,
          status: 'delivered',
          paymentStatus: 'paid',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $addFields: {
          hour: { $hour: '$createdAt' },
          mealTime: {
            $switch: {
              branches: [
                { case: { $and: [{ $gte: ['$hour', 6] }, { $lt: ['$hour', 11] }] }, then: 'breakfast' },
                { case: { $and: [{ $gte: ['$hour', 11] }, { $lt: ['$hour', 16] }] }, then: 'lunch' },
                { case: { $and: [{ $gte: ['$hour', 16] }, { $lt: ['$hour', 22] }] }, then: 'dinner' },
              ],
              default: 'late_night'
            }
          }
        }
      },
      {
        $group: {
          _id: '$mealTime',
          orders: { $sum: 1 },
          revenue: { $sum: '$pricing.total' },
          avgOrderValue: { $avg: '$pricing.total' }
        }
      }
    ]);

    // Payment method distribution
    const paymentMethods = await Order.aggregate([
      {
        $match: {
          restaurant: restaurantId,
          status: 'delivered',
          paymentStatus: 'paid',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          amount: { $sum: '$pricing.total' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        salesTrend,
        peakHours,
        salesByMealTime,
        paymentMethods,
        period: { start, end, groupBy }
      }
    });

  } catch (error) {
    console.error('Sales analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales analytics'
    });
  }
};

// @desc    Get menu performance analytics
// @route   GET /api/v1/restaurant/analytics/menu
// @access  Private (Restaurant, SuperAdmin)
export const getMenuPerformance = async (req, res) => {
  try {
    const restaurantId = req.query.restaurantId || req.user._id;
    const { startDate, endDate, category } = req.query;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get best-selling items
    const topItems = await Order.aggregate([
      {
        $match: {
          restaurant: restaurantId,
          status: 'delivered',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.menuItem.name',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
          avgPrice: { $avg: '$items.menuItem.price' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get slow-moving items
    const slowMovingItems = await Order.aggregate([
      {
        $match: {
          restaurant: restaurantId,
          status: 'delivered',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.menuItem.name',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalQuantity: 1 }
      },
      {
        $limit: 10
      }
    ]);

    // Revenue by category (if menu has category info)
    const menu = await Menu.findOne({ restaurant: restaurantId });
    
    const categoryPerformance = [];
    if (menu && menu.categories) {
      for (const category of menu.categories) {
        const categoryItems = category.items.map(item => item.name);
        
        const categoryStats = await Order.aggregate([
          {
            $match: {
              restaurant: restaurantId,
              status: 'delivered',
              createdAt: { $gte: start, $lte: end }
            }
          },
          {
            $unwind: '$items'
          },
          {
            $match: {
              'items.menuItem.name': { $in: categoryItems }
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$items.subtotal' },
              totalQuantity: { $sum: '$items.quantity' },
              itemCount: { $sum: 1 }
            }
          }
        ]);

        if (categoryStats.length > 0) {
          categoryPerformance.push({
            category: category.name,
            ...categoryStats[0]
          });
        }
      }
    }

    // Item profitability (assuming 30% cost margin for demo)
    const itemProfitability = topItems.map(item => ({
      ...item,
      estimatedCost: (item.totalRevenue * 0.3).toFixed(2),
      estimatedProfit: (item.totalRevenue * 0.7).toFixed(2),
      profitMargin: '70.00'
    }));

    res.json({
      success: true,
      data: {
        topSellingItems: topItems,
        slowMovingItems,
        categoryPerformance,
        itemProfitability,
        period: { start, end }
      }
    });

  } catch (error) {
    console.error('Menu performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching menu performance'
    });
  }
};

// @desc    Get customer analytics
// @route   GET /api/v1/restaurant/analytics/customers
// @access  Private (Restaurant, SuperAdmin)
export const getCustomerAnalytics = async (req, res) => {
  try {
    const restaurantId = req.query.restaurantId || req.user._id;
    const { startDate, endDate } = req.query;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get unique customers
    const uniqueCustomers = await Order.distinct('customer', {
      restaurant: restaurantId,
      createdAt: { $gte: start, $lte: end }
    });

    // Customer frequency analysis
    const customerFrequency = await Order.aggregate([
      {
        $match: {
          restaurant: restaurantId,
          status: 'delivered',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$customer',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$pricing.total' },
          avgOrderValue: { $avg: '$pricing.total' },
          lastOrderDate: { $max: '$createdAt' }
        }
      },
      {
        $sort: { orderCount: -1 }
      }
    ]);

    // New vs returning customers
    const newCustomers = [];
    const returningCustomers = [];

    for (const customer of customerFrequency) {
      const firstOrder = await Order.findOne({ 
        customer: customer._id, 
        restaurant: restaurantId 
      }).sort({ createdAt: 1 });

      if (firstOrder && firstOrder.createdAt >= start) {
        newCustomers.push(customer);
      } else {
        returningCustomers.push(customer);
      }
    }

    // Top customers
    const topCustomers = customerFrequency.slice(0, 10);

    // Average check size
    const avgCheckSize = customerFrequency.length > 0
      ? customerFrequency.reduce((sum, c) => sum + c.avgOrderValue, 0) / customerFrequency.length
      : 0;

    // Customer retention rate
    const retentionRate = uniqueCustomers.length > 0
      ? ((returningCustomers.length / uniqueCustomers.length) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalCustomers: uniqueCustomers.length,
          newCustomers: newCustomers.length,
          returningCustomers: returningCustomers.length,
          retentionRate,
          avgCheckSize: avgCheckSize.toFixed(2)
        },
        topCustomers,
        customerFrequency: customerFrequency.slice(0, 20),
        period: { start, end }
      }
    });

  } catch (error) {
    console.error('Customer analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer analytics'
    });
  }
};

// @desc    Get operational metrics
// @route   GET /api/v1/restaurant/analytics/operations
// @access  Private (Restaurant, SuperAdmin)
export const getOperationalMetrics = async (req, res) => {
  try {
    const restaurantId = req.query.restaurantId || req.user._id;
    const { startDate, endDate } = req.query;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Delivery time analysis
    const deliveryMetrics = await Order.aggregate([
      {
        $match: {
          restaurant: restaurantId,
          status: 'delivered',
          actualDeliveryTime: { $exists: true },
          estimatedDeliveryTime: { $exists: true },
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $addFields: {
          deliveryTimeDiff: {
            $subtract: ['$actualDeliveryTime', '$estimatedDeliveryTime']
          },
          totalDeliveryTime: {
            $subtract: ['$actualDeliveryTime', '$createdAt']
          }
        }
      },
      {
        $group: {
          _id: null,
          avgDeliveryTime: { $avg: '$totalDeliveryTime' },
          onTimeDeliveries: {
            $sum: {
              $cond: [{ $lte: ['$deliveryTimeDiff', 0] }, 1, 0]
            }
          },
          lateDeliveries: {
            $sum: {
              $cond: [{ $gt: ['$deliveryTimeDiff', 0] }, 1, 0]
            }
          },
          totalDeliveries: { $sum: 1 }
        }
      }
    ]);

    const delivery = deliveryMetrics[0] || {
      avgDeliveryTime: 0,
      onTimeDeliveries: 0,
      lateDeliveries: 0,
      totalDeliveries: 0
    };

    const onTimeRate = delivery.totalDeliveries > 0
      ? ((delivery.onTimeDeliveries / delivery.totalDeliveries) * 100).toFixed(2)
      : 0;

    // Order fulfillment metrics
    const orderMetrics = await Order.aggregate([
      {
        $match: {
          restaurant: restaurantId,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate average preparation time (from order to ready)
    const preparationTimes = await Order.aggregate([
      {
        $match: {
          restaurant: restaurantId,
          status: { $in: ['ready', 'picked_up', 'delivered'] },
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $addFields: {
          prepTime: {
            $subtract: ['$estimatedDeliveryTime', '$createdAt']
          }
        }
      },
      {
        $group: {
          _id: null,
          avgPrepTime: { $avg: '$prepTime' }
        }
      }
    ]);

    const avgPreparationTime = preparationTimes[0]?.avgPrepTime || 0;

    // Calculate basic cost metrics (placeholder - would need actual cost data)
    const revenueData = await Order.aggregate([
      {
        $match: {
          restaurant: restaurantId,
          status: 'delivered',
          paymentStatus: 'paid',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.total' }
        }
      }
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;
    
    // Estimated costs (placeholder - 30% food cost, 15% labor cost)
    const estimatedFoodCost = totalRevenue * 0.30;
    const estimatedLaborCost = totalRevenue * 0.15;

    res.json({
      success: true,
      data: {
        delivery: {
          avgDeliveryTimeMinutes: (delivery.avgDeliveryTime / (1000 * 60)).toFixed(2),
          onTimeDeliveries: delivery.onTimeDeliveries,
          lateDeliveries: delivery.lateDeliveries,
          totalDeliveries: delivery.totalDeliveries,
          onTimeRate
        },
        preparation: {
          avgPreparationTimeMinutes: (avgPreparationTime / (1000 * 60)).toFixed(2)
        },
        orderStatus: orderMetrics,
        costs: {
          totalRevenue: totalRevenue.toFixed(2),
          estimatedFoodCost: estimatedFoodCost.toFixed(2),
          estimatedLaborCost: estimatedLaborCost.toFixed(2),
          foodCostPercentage: '30.00',
          laborCostPercentage: '15.00',
          note: 'Cost data is estimated. Configure actual costs for accurate metrics.'
        },
        period: { start, end }
      }
    });

  } catch (error) {
    console.error('Operational metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching operational metrics'
    });
  }
};

// @desc    Export analytics data to CSV
// @route   GET /api/v1/restaurant/analytics/export
// @access  Private (Restaurant, SuperAdmin)
export const exportAnalytics = async (req, res) => {
  try {
    const restaurantId = req.query.restaurantId || req.user._id;
    const { type = 'sales', startDate, endDate } = req.query;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    let data = [];
    let headers = [];

    switch (type) {
      case 'sales':
        const orders = await Order.find({
          restaurant: restaurantId,
          status: 'delivered',
          paymentStatus: 'paid',
          createdAt: { $gte: start, $lte: end }
        }).select('orderNumber createdAt pricing.total pricing.subtotal pricing.deliveryFee pricing.tax pricing.discount paymentMethod');
        
        headers = ['Order Number', 'Date', 'Total', 'Subtotal', 'Delivery Fee', 'Tax', 'Discount', 'Payment Method'];
        data = orders.map(order => [
          order.orderNumber,
          order.createdAt.toISOString(),
          order.pricing.total,
          order.pricing.subtotal,
          order.pricing.deliveryFee,
          order.pricing.tax,
          order.pricing.discount,
          order.paymentMethod
        ]);
        break;

      case 'menu':
        const menuItems = await Order.aggregate([
          {
            $match: {
              restaurant: restaurantId,
              status: 'delivered',
              createdAt: { $gte: start, $lte: end }
            }
          },
          {
            $unwind: '$items'
          },
          {
            $group: {
              _id: '$items.menuItem.name',
              totalQuantity: { $sum: '$items.quantity' },
              totalRevenue: { $sum: '$items.subtotal' },
              avgPrice: { $avg: '$items.menuItem.price' }
            }
          },
          {
            $sort: { totalRevenue: -1 }
          }
        ]);
        
        headers = ['Item Name', 'Total Quantity Sold', 'Total Revenue', 'Average Price'];
        data = menuItems.map(item => [
          item._id,
          item.totalQuantity,
          item.totalRevenue.toFixed(2),
          item.avgPrice.toFixed(2)
        ]);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type'
        });
    }

    // Convert to CSV
    const csvRows = [];
    csvRows.push(headers.join(','));
    for (const row of data) {
      csvRows.push(row.join(','));
    }
    const csvContent = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-${type}-${Date.now()}.csv`);
    res.send(csvContent);

  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting analytics'
    });
  }
};

export default {
  getDashboardAnalytics,
  getSalesAnalytics,
  getMenuPerformance,
  getCustomerAnalytics,
  getOperationalMetrics,
  exportAnalytics
};

