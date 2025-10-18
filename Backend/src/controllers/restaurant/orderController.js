import Order from '../../models/Order.js';
import { asyncHandler } from '../../utils/helpers.js';

// @desc    Get restaurant orders
// @route   GET /api/v1/restaurant/orders
// @access  Private/Restaurant
export const getRestaurantOrders = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    dateFrom,
    dateTo
  } = req.query;

  // Build query
  const query = { restaurant: req.user._id };
  
  
  if (status) query.status = status;
  
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  const orders = await Order.find(query)
    .populate('customer', 'name email phone')
    .populate('restaurant', 'restaurantName email phone address')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  console.log(`Fetched ${orders.length} orders for restaurant ${req.user._id}`);
  
  // Log customer data for debugging
  orders.forEach((order, index) => {
    console.log(`Order ${index + 1}: ${order.orderNumber || order._id}`);
    console.log(`  Customer ID: ${order.customer}`);
    console.log(`  Customer object:`, order.customer);
    console.log(`  Customer name: ${order.customer?.name || 'N/A'}`);
    console.log(`  Customer email: ${order.customer?.email || 'N/A'}`);
    console.log(`  Customer phone: ${order.customer?.phone || 'N/A'}`);
  });

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
// @route   GET /api/v1/restaurant/orders/:id
// @access  Private/Restaurant
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    restaurant: req.user._id
  })
  .populate('customer', 'name email phone')
  .populate('restaurant', 'restaurantName email phone address');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  res.json({
    success: true,
    data: order
  });
});

// @desc    Update order status
// @route   PUT /api/v1/restaurant/orders/:id
// @access  Private/Restaurant
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const order = await Order.findOne({
    _id: req.params.id,
    restaurant: req.user._id
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  order.status = status;
  order.updatedAt = new Date();
  
  await order.save();

  res.json({
    success: true,
    data: order,
    message: 'Order status updated successfully'
  });
});

// @desc    Get order statistics
// @route   GET /api/v1/restaurant/orders/stats
// @access  Private/Restaurant
export const getOrderStats = asyncHandler(async (req, res) => {
  const restaurantId = req.user._id;

  const stats = await Order.aggregate([
    {
      $match: { restaurant: restaurantId }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        averageOrderValue: { $avg: '$totalAmount' }
      }
    }
  ]);

  const statusCounts = await Order.aggregate([
    {
      $match: { restaurant: restaurantId }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const todayStats = await Order.aggregate([
    {
      $match: {
        restaurant: restaurantId,
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
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

  res.json({
    success: true,
    data: {
      ...stats[0],
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      today: todayStats[0] || { todayOrders: 0, todayRevenue: 0 }
    }
  });
});

// @desc    Get order history
// @route   GET /api/v1/restaurant/orders/history
// @access  Private/Restaurant
export const getOrderHistory = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status = 'completed'
  } = req.query;

  const orders = await Order.find({
    restaurant: req.user._id,
    status
  })
    .populate('customer', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Order.countDocuments({
    restaurant: req.user._id,
    status
  });

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

// @desc    Accept order
// @route   PUT /api/v1/restaurant/orders/:id/accept
// @access  Private/Restaurant
export const acceptOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    restaurant: req.user._id
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  if (order.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Order cannot be accepted in current status'
    });
  }

  order.status = 'confirmed';
  order.updatedAt = new Date();
  
  await order.save();

  res.json({
    success: true,
    data: order,
    message: 'Order accepted successfully'
  });
});

// @desc    Reject order
// @route   PUT /api/v1/restaurant/orders/:id/reject
// @access  Private/Restaurant
export const rejectOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const order = await Order.findOne({
    _id: req.params.id,
    restaurant: req.user._id
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  if (order.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Order cannot be rejected in current status'
    });
  }

  order.status = 'rejected';
  order.rejectionReason = reason;
  order.updatedAt = new Date();
  
  await order.save();

  res.json({
    success: true,
    data: order,
    message: 'Order rejected successfully'
  });
});

// @desc    Mark order as ready
// @route   PUT /api/v1/restaurant/orders/:id/ready
// @access  Private/Restaurant
export const markAsReady = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    restaurant: req.user._id
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  if (!['confirmed', 'preparing'].includes(order.status)) {
    return res.status(400).json({
      success: false,
      message: 'Order cannot be marked as ready in current status'
    });
  }

  order.status = 'ready';
  order.updatedAt = new Date();
  
  await order.save();

  res.json({
    success: true,
    data: order,
    message: 'Order marked as ready successfully'
  });
});
