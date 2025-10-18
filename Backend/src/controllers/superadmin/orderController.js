import Order from '../../models/Order.js';
import Restaurant from '../../models/Restaurant.js';
import Customer from '../../models/Customer.js';
import { asyncHandler } from '../../utils/helpers.js';
import { getIO } from '../../config/socket.js';

// @desc    Get all orders
// @route   GET /api/v1/superadmin/orders
// @access  Private/SuperAdmin
export const getAllOrders = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    restaurant,
    customer,
    dateFrom,
    dateTo,
    sort = 'createdAt',
    order = 'desc'
  } = req.query;

  // Build query
  const query = {};
  
  if (status) query.status = status;
  if (restaurant) query.restaurant = restaurant;
  if (customer) query.customer = customer;
  
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  // Execute query - don't populate customer initially since Order references User but we want Customer
  const orders = await Order.find(query)
    .populate({
      path: 'restaurant',
      select: 'name email phone address',
      options: { strictPopulate: false }
    })
    .sort({ [sort]: order === 'desc' ? -1 : 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  // Import Customer and RestaurantUser models for proper population
  const Customer = (await import('../../models/Customer.js')).default;
  const RestaurantUser = (await import('../../models/RestaurantUser.js')).default;
  
  console.log(`Fetched ${orders.length} orders from database`);
  
  // Populate customer and restaurant information from correct collections
  for (let order of orders) {
    console.log(`Processing order ${order.orderNumber} - Customer ID: ${order.customer}, Restaurant ID: ${order.restaurant}`);
    
    // Populate customer from customers collection
    if (order.customer) {
      try {
        const customer = await Customer.findById(order.customer);
        if (customer) {
          console.log(`✅ Found customer: ${customer.name} (${customer.email})`);
          order.customer = customer;
        } else {
          console.log(`❌ Customer not found in customers collection for ID: ${order.customer}`);
        }
      } catch (error) {
        console.log(`❌ Error finding customer: ${error.message}`);
      }
    } else {
      console.log(`❌ No customer ID in order ${order.orderNumber}`);
    }
    
    // Populate restaurant from restaurantusers collection
    if (order.restaurant) {
      try {
        const restaurant = await RestaurantUser.findById(order.restaurant);
        if (restaurant) {
          console.log(`✅ Found restaurant: ${restaurant.restaurantName} (${restaurant.email})`);
          order.restaurant = restaurant;
        } else {
          console.log(`❌ Restaurant not found in restaurantusers collection for ID: ${order.restaurant}`);
        }
      } catch (error) {
        console.log(`❌ Error finding restaurant: ${error.message}`);
      }
    } else {
      console.log(`❌ No restaurant ID in order ${order.orderNumber}`);
    }
  }

  // Log final results with more detailed debugging
  if (orders.length > 0) {
    const sampleOrder = orders[0];
    console.log(`Sample - Order: ${sampleOrder.orderNumber}`);
    console.log(`Customer object:`, JSON.stringify(sampleOrder.customer, null, 2));
    console.log(`Customer type:`, typeof sampleOrder.customer);
    console.log(`Customer name:`, sampleOrder.customer?.name || 'N/A');
    console.log(`Customer email:`, sampleOrder.customer?.email || 'N/A');
  }

  const total = await Order.countDocuments(query);


  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get order by ID
// @route   GET /api/v1/superadmin/orders/:id
// @access  Private/SuperAdmin
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('restaurant', 'name email phone address rating deliveryTime deliveryFee');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Populate customer from customers collection and restaurant from restaurantusers collection
  if (order.customer) {
    try {
      const Customer = (await import('../../models/Customer.js')).default;
      const customer = await Customer.findById(order.customer);
      if (customer) {
        console.log(`Found customer for order ${order.orderNumber}: ${customer.name} (${customer.email})`);
        order.customer = customer;
      } else {
        console.log(`Customer not found in customers collection for ID: ${order.customer}`);
      }
    } catch (error) {
      console.log('Error finding customer:', error.message);
    }
  }

  if (order.restaurant) {
    try {
      const RestaurantUser = (await import('../../models/RestaurantUser.js')).default;
      const restaurant = await RestaurantUser.findById(order.restaurant);
      if (restaurant) {
        console.log(`Found restaurant for order ${order.orderNumber}: ${restaurant.restaurantName} (${restaurant.email})`);
        order.restaurant = restaurant;
      } else {
        console.log(`Restaurant not found in restaurantusers collection for ID: ${order.restaurant}`);
      }
    } catch (error) {
      console.log('Error finding restaurant:', error.message);
    }
  }

  res.json({
    success: true,
    data: order
  });
});

// @desc    Update order status
// @route   PUT /api/v1/superadmin/orders/:id
// @access  Private/SuperAdmin
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const order = await Order.findById(req.params.id)
    .populate('customer', 'name email')
    .populate('restaurant', 'restaurantName');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  const oldStatus = order.status;
  order.status = status;
  order.updatedAt = new Date();
  
  await order.save();

  // Emit real-time events to all superadmins
  try {
    const io = getIO();
    
    // Emit status change event
    io.to('superadmin').emit('orderStatusChange', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      oldStatus,
      newStatus: status,
      timestamp: new Date()
    });

    // Emit general order update event
    io.to('superadmin').emit('orderUpdate', {
      orderId: order._id,
      updates: {
        status,
        updatedAt: order.updatedAt
      }
    });

    console.log(`Order ${order.orderNumber} status changed from ${oldStatus} to ${status}`);
  } catch (error) {
    console.error('Error emitting WebSocket event:', error.message);
  }

  res.json({
    success: true,
    data: order,
    message: 'Order status updated successfully'
  });
});

// @desc    Get order statistics
// @route   GET /api/v1/superadmin/orders/stats
// @access  Private/SuperAdmin
export const getOrderStats = asyncHandler(async (req, res) => {
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
  
  // Get overall stats
  const stats = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        averageOrderValue: { $avg: '$totalAmount' }
      }
    }
  ]);

  // Get status counts
  const statusCounts = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Convert status counts to object
  const statusCountsObj = statusCounts.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  // Get today's stats
  const todayStats = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: todayStart }
      }
    },
    {
      $group: {
        _id: null,
        todayOrders: { $sum: 1 },
        todayRevenue: { $sum: '$totalAmount' }
      }
    }
  ]);

  // Calculate active orders (not delivered or cancelled)
  const activeOrders = await Order.countDocuments({
    status: { $nin: ['delivered', 'cancelled'] }
  });

  // Get orders by specific statuses for monitoring
  const preparingOrders = statusCountsObj.preparing || 0;
  const readyOrders = statusCountsObj.ready || 0;
  const outForDelivery = statusCountsObj.picked_up || 0;
  
  // Get completed orders today
  const completedToday = await Order.countDocuments({
    status: 'delivered',
    updatedAt: { $gte: todayStart }
  });

  // Calculate average delivery time
  const deliveryTimeStats = await Order.aggregate([
    {
      $match: {
        status: 'delivered',
        deliveryTime: { $exists: true }
      }
    },
    {
      $group: {
        _id: null,
        avgDeliveryTime: { $avg: '$deliveryTime' }
      }
    }
  ]);

  // Calculate on-time delivery percentage
  const onTimeDeliveryStats = await Order.aggregate([
    {
      $match: {
        status: 'delivered',
        createdAt: { $gte: todayStart }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        onTime: {
          $sum: {
            $cond: [{ $eq: ['$isLate', false] }, 1, 0]
          }
        }
      }
    }
  ]);

  const onTimePercentage = onTimeDeliveryStats[0]
    ? Math.round((onTimeDeliveryStats[0].onTime / onTimeDeliveryStats[0].total) * 100)
    : 0;

  res.json({
    success: true,
    data: {
      ...stats[0],
      statusCounts: statusCountsObj,
      today: todayStats[0] || { todayOrders: 0, todayRevenue: 0 },
      // Real-time monitoring stats
      activeOrders,
      preparingOrders,
      readyOrders,
      outForDelivery,
      completedToday,
      averageDeliveryTime: Math.round(deliveryTimeStats[0]?.avgDeliveryTime || 0),
      onTimeDelivery: onTimePercentage
    }
  });
});

// @desc    Get order analytics
// @route   GET /api/v1/superadmin/orders/analytics
// @access  Private/SuperAdmin
export const getOrderAnalytics = asyncHandler(async (req, res) => {
  const { dateRange = '7d' } = req.query;
  
  let startDate;
  const endDate = new Date();
  
  switch (dateRange) {
    case '1d':
      startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const analytics = await Order.aggregate([
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
        orders: { $sum: 1 },
        revenue: { $sum: '$totalAmount' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  res.json({
    success: true,
    data: {
      analytics,
      dateRange: { startDate, endDate }
    }
  });
});

// @desc    Export orders
// @route   POST /api/v1/superadmin/orders/export
// @access  Private/SuperAdmin
export const exportOrders = asyncHandler(async (req, res) => {
  const { filters = {} } = req.body;
  
  const orders = await Order.find(filters)
    .populate('restaurant', 'name')
    .populate('customer', 'name email')
    .sort({ createdAt: -1 });

  // In a real implementation, you would generate Excel/CSV file here
  res.json({
    success: true,
    data: orders,
    message: 'Orders exported successfully'
  });
});

// @desc    Get order disputes
// @route   GET /api/v1/superadmin/orders/disputes
// @access  Private/SuperAdmin
export const getOrderDisputes = asyncHandler(async (req, res) => {
  // This would typically come from a disputes collection
  res.json({
    success: true,
    data: [],
    message: 'No disputes found'
  });
});

// @desc    Resolve order dispute
// @route   PUT /api/v1/superadmin/orders/disputes/:id/resolve
// @access  Private/SuperAdmin
export const resolveOrderDispute = asyncHandler(async (req, res) => {
  const { resolution } = req.body;
  
  res.json({
    success: true,
    message: 'Dispute resolved successfully'
  });
});

// @desc    Process refund
// @route   POST /api/v1/superadmin/orders/refunds
// @access  Private/SuperAdmin
export const processRefund = asyncHandler(async (req, res) => {
  const { orderId, amount, reason } = req.body;
  
  const order = await Order.findById(orderId);
  
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // In a real implementation, you would process the refund through payment gateway
  res.json({
    success: true,
    message: 'Refund processed successfully',
    data: {
      orderId,
      amount,
      reason,
      refundId: `REF_${Date.now()}`
    }
  });
});

// @desc    Get refund history
// @route   GET /api/v1/superadmin/orders/refunds
// @access  Private/SuperAdmin
export const getRefundHistory = asyncHandler(async (req, res) => {
  // This would typically come from a refunds collection
  res.json({
    success: true,
    data: [],
    message: 'No refunds found'
  });
});
