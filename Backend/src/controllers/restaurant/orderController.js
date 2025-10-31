import Order from '../../models/Order.js';
import DeliveryPersonnel from '../../models/DeliveryPersonnel.js';
import { asyncHandler } from '../../utils/helpers.js';
import { sendOrderStatusUpdate } from '../../services/notificationService.js';
import { getIO } from '../../config/socket.js';

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
    .populate('deliveryPerson', 'name email phone')
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

  // Prevent cancellation if order is assigned to delivery person
  if (status === 'cancelled' && order.deliveryPerson) {
    return res.status(400).json({
      success: false,
      message: 'Cannot cancel order that has been assigned to a delivery person. Please contact support if cancellation is necessary.'
    });
  }

  // Prevent cancellation after marking ready (but allow cancellation during preparation)
  if (status === 'cancelled' && ['ready', 'picked_up', 'delivered', 'completed'].includes(order.status)) {
    return res.status(400).json({
      success: false,
      message: 'Cannot cancel order after it has been marked as ready. Order must be cancelled before marking as ready.'
    });
  }
  
  // Auto-confirm order when starting preparation from pending/placed
  if (status === 'preparing' && ['pending', 'placed'].includes(order.status)) {
    order.status = 'preparing';
    // Add tracking update
    if (!order.trackingUpdates) {
      order.trackingUpdates = [];
    }
    order.trackingUpdates.push({
      status: 'preparing',
      timestamp: new Date(),
      message: 'Order automatically confirmed and preparation started'
    });
    await order.save();
    
    return res.json({
      success: true,
      data: order,
      message: 'Order preparation started successfully'
    });
  }

  // Prevent changing status from ready back to preparing (no backward transitions)
  if (status === 'preparing' && order.status === 'ready') {
    return res.status(400).json({
      success: false,
      message: 'Cannot change order status from ready back to preparing. Once marked as ready, status cannot be changed back.'
    });
  }

  // Validate status transitions
  // Note: Restaurant cannot cancel after starting preparation
  // Restaurant can go directly from pending/placed to preparing (auto-confirmed)
  // Once order is ready, no status changes are allowed (forward-only flow)
  const validTransitions = {
    'pending': ['preparing', 'cancelled', 'rejected'], // Can start preparing directly
    'placed': ['preparing', 'cancelled', 'rejected'], // Can start preparing directly
    'confirmed': ['preparing'], // Legacy support if order was already confirmed
    'preparing': ['ready'], // Can only move forward to ready
    'ready': [], // No status changes allowed once ready (restaurant cannot change status back)
    'delivered': [],
    'cancelled': [],
    'rejected': []
  };

  if (!validTransitions[order.status] || !validTransitions[order.status].includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status transition from ${order.status} to ${status}`
    });
  }

  order.status = status;
  order.updatedAt = new Date();
  
  // Add tracking update for status changes
  if (!order.trackingUpdates) {
    order.trackingUpdates = [];
  }
  order.trackingUpdates.push({
    status: status,
    timestamp: new Date(),
    message: `Order status changed to ${status}`
  });
  
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

// @desc    Start preparing order (confirmed -> preparing)
// @route   PUT /api/v1/restaurant/orders/:id/prepare
// @access  Private/Restaurant
export const startPreparing = asyncHandler(async (req, res) => {
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

  if (order.status !== 'confirmed') {
    return res.status(400).json({
      success: false,
      message: 'Order must be confirmed before starting preparation'
    });
  }

  order.status = 'preparing';
  order.updatedAt = new Date();
  
  // Add tracking update
  if (!order.trackingUpdates) {
    order.trackingUpdates = [];
  }
  order.trackingUpdates.push({
    status: 'preparing',
    timestamp: new Date(),
    message: 'Restaurant has started preparing the order'
  });
  
  await order.save();

  res.json({
    success: true,
    data: order,
    message: 'Order preparation started successfully'
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
  
  // Add tracking update
  if (!order.trackingUpdates) {
    order.trackingUpdates = [];
  }
  order.trackingUpdates.push({
    status: 'ready',
    timestamp: new Date(),
    message: 'Order is ready for pickup'
  });
  
  await order.save();

  // Populate order details for notification
  await order.populate('restaurant', 'restaurantName address phone');
  await order.populate('customer', 'name phone address');

  // Notify customer that order is ready for pickup/delivery
  try {
    if (order.customer) {
      await sendOrderStatusUpdate(order.customer, order, 'ready');
    }
  } catch (customerNotifyError) {
    console.error('Error notifying customer on ready status:', customerNotifyError);
  }

  // Notify all online delivery persons about the new ready order
  try {
    // Find all online delivery persons
    const onlineDeliveryPersons = await DeliveryPersonnel.find({
      isOnline: true,
      status: { $in: ['active', 'on_duty'] }
    }).select('_id name email');

    // Prepare notification data
    const notificationData = {
      type: 'new_order_ready',
      title: 'New Order Ready for Pickup',
      message: `Order #${order.orderNumber} from ${order.restaurant?.restaurantName || 'Restaurant'} is ready for pickup`,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        restaurant: {
          name: order.restaurant?.restaurantName,
          address: order.restaurant?.address,
          phone: order.restaurant?.phone
        },
        customer: {
          name: order.customer?.name,
          address: order.deliveryAddress
        },
        pricing: order.pricing,
        createdAt: order.createdAt
      },
      timestamp: new Date()
    };

    // Get Socket.IO instance
    const io = getIO();

    // Send notification to all delivery persons through socket
    // Send to 'delivery' room (all delivery persons connected - socket.userType === 'delivery')
    try {
      io.to('delivery').emit('order:ready', notificationData);
      console.log('📢 Emitted to delivery room');
    } catch (error) {
      console.error('Error emitting to delivery room:', error);
    }

    // Also send to individual delivery person rooms for reliability
    onlineDeliveryPersons.forEach(person => {
      try {
        io.to(`user_${person._id}`).emit('order:ready', notificationData);
      } catch (error) {
        console.error(`Error emitting to user ${person._id}:`, error);
      }
    });

    console.log(`✅ Order #${order.orderNumber} marked as ready - Notified ${onlineDeliveryPersons.length} online delivery persons via Socket.IO`);
  } catch (notificationError) {
    console.error('Error sending notification to delivery persons:', notificationError);
    // Don't fail the request if notification fails
  }

  res.json({
    success: true,
    data: order,
    message: 'Order marked as ready successfully'
  });
});
