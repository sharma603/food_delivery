import DeliveryPersonnel from '../../models/DeliveryPersonnel.js';
import Order from '../../models/Order.js';
import Zone from '../../models/Zone.js';
import { asyncHandler } from '../../utils/helpers.js';
import { errorResponse } from '../../utils/responseHandler.js';

// @desc    Get delivery person profile
// @route   GET /api/v1/delivery/profile
// @access  Private (Delivery Person)
export const getDeliveryProfile = asyncHandler(async (req, res) => {
  const deliveryPerson = await DeliveryPersonnel.findById(req.user._id)
    .populate('zone', 'name description areas pincodes deliveryCharge')
    .select('-password');

  if (!deliveryPerson) {
    return res.status(404).json({
      success: false,
      message: 'Delivery person not found'
    });
  }

  res.json({
    success: true,
    data: deliveryPerson
  });
});

// @desc    Update delivery person profile
// @route   PUT /api/v1/delivery/profile
// @access  Private (Delivery Person)
export const updateDeliveryProfile = asyncHandler(async (req, res) => {
  const allowedUpdates = ['name', 'phone', 'vehicleType', 'vehicleNumber', 'vehicleModel', 'vehicleYear'];
  const updates = {};

  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const deliveryPerson = await DeliveryPersonnel.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  ).populate('zone', 'name description areas pincodes deliveryCharge');

  res.json({
    success: true,
    data: deliveryPerson
  });
});

// @desc    Update delivery person status
// @route   PUT /api/v1/delivery/status
// @access  Private (Delivery Person)
export const updateDeliveryStatus = asyncHandler(async (req, res) => {
  const { status, isOnline } = req.body;

  const allowedStatuses = ['active', 'inactive', 'on_duty', 'off_duty', 'suspended'];
  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status'
    });
  }

  // Get the delivery person first
  const deliveryPerson = await DeliveryPersonnel.findById(req.user._id);
  if (!deliveryPerson) {
    return res.status(404).json({
      success: false,
      message: 'Delivery person not found'
    });
  }

  // Handle online/offline status changes
  if (typeof isOnline === 'boolean') {
    if (isOnline && !deliveryPerson.isOnline) {
      // Going online
      await deliveryPerson.goOnline();
    } else if (!isOnline && deliveryPerson.isOnline) {
      // Going offline
      await deliveryPerson.goOffline();
    }
  }

  // Update other status if provided
  if (status && status !== deliveryPerson.status) {
    deliveryPerson.status = status;
    // Also update isOnline based on status if isOnline wasn't explicitly provided
    if (typeof isOnline !== 'boolean') {
      if (status === 'on_duty') {
        deliveryPerson.isOnline = true;
      } else if (status === 'off_duty' || status === 'inactive' || status === 'suspended') {
        deliveryPerson.isOnline = false;
      }
    }
    await deliveryPerson.save();
  }

  // Reload the delivery person to get fresh data (after goOnline/goOffline methods)
  const updatedDeliveryPerson = await DeliveryPersonnel.findById(req.user._id)
    .populate('zone', 'name description areas pincodes deliveryCharge')
    .select('-password');

  res.json({
    success: true,
    message: 'Status updated successfully',
    data: updatedDeliveryPerson
  });
});

// @desc    Update delivery person location
// @route   PUT /api/v1/delivery/location
// @access  Private (Delivery Person)
export const updateDeliveryLocation = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: 'Latitude and longitude are required'
    });
  }

  const deliveryPerson = await DeliveryPersonnel.findByIdAndUpdate(
    req.user._id,
    {
      currentLocation: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        lastUpdated: new Date()
      },
      lastActive: new Date(),
      isOnline: true
    },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: deliveryPerson
  });
});

// @desc    Get available orders for delivery person
// @route   GET /api/v1/delivery/orders/available
// @access  Private (Delivery Person)
export const getAvailableOrders = asyncHandler(async (req, res) => {
  const deliveryPerson = await DeliveryPersonnel.findById(req.user._id);
  
  if (!deliveryPerson || !deliveryPerson.isOnline) {
    return res.status(400).json({
      success: false,
      message: 'You must be online to receive orders'
    });
  }

  // Get orders that are ready for pickup in the delivery person's zone
  const availableOrders = await Order.find({
    status: 'confirmed',
    deliveryStatus: 'pending',
    zone: deliveryPerson.zone,
    assignedDeliveryPerson: { $exists: false }
  })
    .populate('restaurant', 'name address phone location')
    .populate('customer', 'name phone address')
    .populate('zone', 'name')
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({
    success: true,
    data: availableOrders
  });
});

// @desc    Get delivery person's assigned orders
// @route   GET /api/v1/delivery/orders/my-orders
// @access  Private (Delivery Person)
export const getMyOrders = asyncHandler(async (req, res) => {
  const myOrders = await Order.find({
    assignedDeliveryPerson: req.user._id
  })
    .populate('restaurant', 'name address phone location')
    .populate('customer', 'name phone address')
    .populate('zone', 'name')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: myOrders
  });
});

// @desc    Get order details
// @route   GET /api/v1/delivery/orders/:orderId
// @access  Private (Delivery Person)
export const getOrderDetails = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId)
    .populate('restaurant', 'name address phone location')
    .populate('customer', 'name phone address')
    .populate('zone', 'name')
    .populate('assignedDeliveryPerson', 'name phone vehicleType vehicleNumber');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check if the delivery person is assigned to this order
  if (order.assignedDeliveryPerson && order.assignedDeliveryPerson._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You are not assigned to this order'
    });
  }

  res.json({
    success: true,
    data: order
  });
});

// @desc    Accept an order
// @route   POST /api/v1/delivery/orders/:orderId/accept
// @access  Private (Delivery Person)
export const acceptOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  if (order.assignedDeliveryPerson) {
    return res.status(400).json({
      success: false,
      message: 'Order is already assigned to another delivery person'
    });
  }

  if (order.status !== 'confirmed' || order.deliveryStatus !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Order is not available for assignment'
    });
  }

  // Assign order to delivery person
  order.assignedDeliveryPerson = req.user._id;
  order.deliveryStatus = 'assigned';
  order.assignedAt = new Date();
  await order.save();

  // Update delivery person stats
  await DeliveryPersonnel.findByIdAndUpdate(req.user._id, {
    $inc: { totalDeliveries: 1 }
  });

  res.json({
    success: true,
    message: 'Order accepted successfully',
    data: order
  });
});

// @desc    Mark order as picked up
// @route   POST /api/v1/delivery/orders/:orderId/pickup
// @access  Private (Delivery Person)
export const pickupOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  if (order.assignedDeliveryPerson.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You are not assigned to this order'
    });
  }

  if (order.deliveryStatus !== 'assigned') {
    return res.status(400).json({
      success: false,
      message: 'Order is not in assigned status'
    });
  }

  order.deliveryStatus = 'picked_up';
  order.pickedUpAt = new Date();
  await order.save();

  res.json({
    success: true,
    message: 'Order picked up successfully',
    data: order
  });
});

// @desc    Mark order as delivered
// @route   POST /api/v1/delivery/orders/:orderId/deliver
// @access  Private (Delivery Person)
export const deliverOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  if (order.assignedDeliveryPerson.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You are not assigned to this order'
    });
  }

  if (order.deliveryStatus !== 'picked_up') {
    return res.status(400).json({
      success: false,
      message: 'Order is not in picked up status'
    });
  }

  order.deliveryStatus = 'delivered';
  order.deliveredAt = new Date();
  order.status = 'completed';
  await order.save();

  // Update delivery person stats
  await DeliveryPersonnel.findByIdAndUpdate(req.user._id, {
    $inc: { completedDeliveries: 1 }
  });

  res.json({
    success: true,
    message: 'Order delivered successfully',
    data: order
  });
});

// @desc    Cancel an order
// @route   POST /api/v1/delivery/orders/:orderId/cancel
// @access  Private (Delivery Person)
export const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  if (order.assignedDeliveryPerson.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You are not assigned to this order'
    });
  }

  order.deliveryStatus = 'cancelled';
  order.cancelledAt = new Date();
  order.cancellationReason = reason;
  order.assignedDeliveryPerson = null;
  await order.save();

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    data: order
  });
});

// @desc    Get delivery person earnings
// @route   GET /api/v1/delivery/earnings
// @access  Private (Delivery Person)
export const getEarnings = asyncHandler(async (req, res) => {
  const { period = 'week' } = req.query;
  
  const deliveryPerson = await DeliveryPersonnel.findById(req.user._id);
  if (!deliveryPerson) {
    return res.status(404).json({
      success: false,
      message: 'Delivery person not found'
    });
  }

  // Calculate date range based on period
  const now = new Date();
  let startDate;
  
  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startDate = new Date(0); // All time
  }

  // Get completed orders in the period
  const completedOrders = await Order.find({
    assignedDeliveryPerson: req.user._id,
    deliveryStatus: 'delivered',
    deliveredAt: { $gte: startDate }
  });

  const totalEarnings = completedOrders.reduce((sum, order) => {
    return sum + (order.deliveryCharge || 0);
  }, 0);

  const totalDeliveries = completedOrders.length;
  const averageEarningPerDelivery = totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0;

  res.json({
    success: true,
    data: {
      totalEarnings,
      totalDeliveries,
      averageEarningPerDelivery,
      period
    }
  });
});

// @desc    Get delivery person earnings history
// @route   GET /api/v1/delivery/earnings/history
// @access  Private (Delivery Person)
export const getEarningsHistory = asyncHandler(async (req, res) => {
  const completedOrders = await Order.find({
    assignedDeliveryPerson: req.user._id,
    deliveryStatus: 'delivered'
  })
    .select('deliveryCharge deliveredAt')
    .sort({ deliveredAt: -1 })
    .limit(50);

  res.json({
    success: true,
    data: completedOrders
  });
});

// @desc    Get delivery person performance
// @route   GET /api/v1/delivery/performance
// @access  Private (Delivery Person)
export const getPerformance = asyncHandler(async (req, res) => {
  const deliveryPerson = await DeliveryPersonnel.findById(req.user._id);
  
  if (!deliveryPerson) {
    return res.status(404).json({
      success: false,
      message: 'Delivery person not found'
    });
  }

  // Get performance metrics
  const totalOrders = await Order.countDocuments({
    assignedDeliveryPerson: req.user._id
  });

  const completedOrders = await Order.countDocuments({
    assignedDeliveryPerson: req.user._id,
    deliveryStatus: 'delivered'
  });

  const cancelledOrders = await Order.countDocuments({
    assignedDeliveryPerson: req.user._id,
    deliveryStatus: 'cancelled'
  });

  const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

  res.json({
    success: true,
    data: {
      totalDeliveries: totalOrders,
      completedDeliveries: completedOrders,
      cancelledDeliveries: cancelledOrders,
      completionRate,
      rating: deliveryPerson.rating,
      totalEarnings: deliveryPerson.earnings
    }
  });
});

// @desc    Get delivery person stats
// @route   GET /api/v1/delivery/stats
// @access  Private (Delivery Person)
export const getStats = asyncHandler(async (req, res) => {
  const deliveryPerson = await DeliveryPersonnel.findById(req.user._id);
  
  if (!deliveryPerson) {
    return res.status(404).json({
      success: false,
      message: 'Delivery person not found'
    });
  }

  // Get today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayOrders = await Order.find({
    assignedDeliveryPerson: req.user._id,
    deliveryStatus: 'delivered',
    deliveredAt: { $gte: today }
  });

  const todayEarnings = todayOrders.reduce((sum, order) => {
    return sum + (order.deliveryCharge || 0);
  }, 0);

  res.json({
    success: true,
    data: {
      todayEarnings,
      todayDeliveries: todayOrders.length,
      onlineTime: '8h 30m', // This would be calculated based on actual online time
      isOnline: deliveryPerson.isOnline,
      status: deliveryPerson.status
    }
  });
});

// @desc    Get delivery person notifications
// @route   GET /api/v1/delivery/notifications
// @access  Private (Delivery Person)
export const getNotifications = asyncHandler(async (req, res) => {
  // This would typically come from a notifications collection
  // For now, return mock data
  const notifications = [
    {
      id: '1',
      title: 'New Order Available',
      message: 'You have a new delivery order from Pizza Palace',
      type: 'new_order',
      read: false,
      createdAt: new Date()
    },
    {
      id: '2',
      title: 'Order Completed',
      message: 'Order #12345 has been completed successfully',
      type: 'order_completed',
      read: true,
      createdAt: new Date(Date.now() - 3600000)
    }
  ];

  res.json({
    success: true,
    data: notifications
  });
});

// @desc    Mark notification as read
// @route   PUT /api/v1/delivery/notifications/:notificationId/read
// @access  Private (Delivery Person)
export const markNotificationRead = asyncHandler(async (req, res) => {
  // This would typically update a notifications collection
  // For now, return success
  
  res.json({
    success: true,
    message: 'Notification marked as read'
  });
});

// @desc    Get delivery person dashboard data
// @route   GET /api/v1/deliveryPerson/dashboard
// @access  Private (Delivery Person)
export const getDashboard = asyncHandler(async (req, res) => {
  const deliveryPersonId = req.user._id;
  
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get this week's date range
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    // Get delivery person with zone info
    const deliveryPerson = await DeliveryPersonnel.findById(deliveryPersonId)
      .populate('zone', 'name description areas pincodes deliveryCharge')
      .select('-password');
    
    if (!deliveryPerson) {
      return res.status(404).json({
        success: false,
        message: 'Delivery person not found'
      });
    }
    
    // Get today's orders
    const todayOrders = await Order.find({
      deliveryPersonnel: deliveryPersonId,
      createdAt: { $gte: today, $lt: tomorrow },
      status: { $in: ['delivered', 'picked_up', 'in_transit'] }
    }).sort({ createdAt: -1 });
    
    // Get this week's orders
    const weekOrders = await Order.find({
      deliveryPersonnel: deliveryPersonId,
      createdAt: { $gte: startOfWeek, $lt: endOfWeek },
      status: { $in: ['delivered', 'picked_up', 'in_transit'] }
    });
    
    // Calculate today's stats
    const todayDeliveries = todayOrders.filter(order => order.status === 'delivered').length;
    const todayEarnings = todayOrders.reduce((sum, order) => {
      return sum + (order.deliveryCharge || 0);
    }, 0);
    
    // Calculate weekly stats
    const weekDeliveries = weekOrders.filter(order => order.status === 'delivered').length;
    const weekEarnings = weekOrders.reduce((sum, order) => {
      return sum + (order.deliveryCharge || 0);
    }, 0);
    
    // Calculate performance metrics
    const totalDeliveries = await Order.countDocuments({
      deliveryPersonnel: deliveryPersonId,
      status: 'delivered'
    });
    
    const onTimeDeliveries = await Order.countDocuments({
      deliveryPersonnel: deliveryPersonId,
      status: 'delivered',
      deliveredAt: { $lte: new Date(Date.now() + 30 * 60 * 1000) } // Within 30 minutes
    });
    
    const completionRate = totalDeliveries > 0 ? (onTimeDeliveries / totalDeliveries) * 100 : 0;
    
    // Calculate average delivery time
    const deliveredOrders = await Order.find({
      deliveryPersonnel: deliveryPersonId,
      status: 'delivered',
      pickedUpAt: { $exists: true },
      deliveredAt: { $exists: true }
    }).limit(100);
    
    const avgDeliveryTime = deliveredOrders.length > 0 
      ? deliveredOrders.reduce((sum, order) => {
          const deliveryTime = (order.deliveredAt - order.pickedUpAt) / (1000 * 60); // minutes
          return sum + deliveryTime;
        }, 0) / deliveredOrders.length
      : 0;
    
    // Generate daily breakdown for the week
    const dailyBreakdown = [];
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(startOfWeek);
      dayStart.setDate(startOfWeek.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);
      
      const dayOrders = weekOrders.filter(order => 
        order.createdAt >= dayStart && order.createdAt < dayEnd
      );
      
      const dayDeliveries = dayOrders.filter(order => order.status === 'delivered').length;
      const dayEarnings = dayOrders.reduce((sum, order) => sum + (order.deliveryCharge || 0), 0);
      
      dailyBreakdown.push({
        day: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        earnings: dayEarnings,
        deliveries: dayDeliveries
      });
    }
    
    // Get recent orders (last 5)
    const recentOrders = await Order.find({
      deliveryPersonnel: deliveryPersonId,
      status: { $in: ['delivered', 'picked_up', 'in_transit'] }
    })
    .populate('customer', 'name phone')
    .populate('restaurant', 'name')
    .sort({ createdAt: -1 })
    .limit(5)
    .select('orderNumber status deliveryCharge createdAt deliveredAt');
    
    // Format recent orders
    const formattedRecentOrders = recentOrders.map(order => ({
      orderNumber: order.orderNumber,
      status: order.status,
      earnings: order.deliveryCharge,
      deliveryTime: order.deliveredAt ? 
        `${Math.floor((new Date() - order.deliveredAt) / (1000 * 60 * 60))} hours ago` : 
        'In progress'
    }));
    
    // Calculate real online time
    let onlineTime = '0h 0m';
    if (deliveryPerson.isOnline && deliveryPerson.onlineAt) {
      // Calculate current session time + today's accumulated time
      const currentSessionTime = Math.floor((new Date() - deliveryPerson.onlineAt) / (1000 * 60)); // minutes
      const totalTodayTime = deliveryPerson.todayOnlineTime + currentSessionTime;
      
      const hours = Math.floor(totalTodayTime / 60);
      const minutes = totalTodayTime % 60;
      onlineTime = `${hours}h ${minutes}m`;
    } else if (deliveryPerson.todayOnlineTime > 0) {
      // Show today's accumulated time even if currently offline
      const hours = Math.floor(deliveryPerson.todayOnlineTime / 60);
      const minutes = deliveryPerson.todayOnlineTime % 60;
      onlineTime = `${hours}h ${minutes}m`;
    }
    
    // Calculate hourly earnings based on actual online time
    const totalTodayMinutes = deliveryPerson.isOnline && deliveryPerson.onlineAt ? 
      deliveryPerson.todayOnlineTime + Math.floor((new Date() - deliveryPerson.onlineAt) / (1000 * 60)) :
      deliveryPerson.todayOnlineTime;
    const workHours = Math.max(1, Math.floor(totalTodayMinutes / 60));
    const hourlyEarnings = todayEarnings > 0 ? Math.round(todayEarnings / workHours) : 0;
    
    const dashboardData = {
      todayStats: {
        earnings: todayEarnings,
        deliveries: todayDeliveries,
        onlineTime: onlineTime,
        hourlyEarnings: hourlyEarnings,
        estimatedEarnings: todayEarnings + (hourlyEarnings * 2) // Estimate for remaining day
      },
      weeklyStats: {
        totalEarnings: weekEarnings,
        totalDeliveries: weekDeliveries,
        dailyBreakdown: dailyBreakdown
      },
      performance: {
        completionRate: Math.round(completionRate * 100) / 100,
        averageDeliveryTime: Math.round(avgDeliveryTime),
        onTimeDeliveries: onTimeDeliveries,
        customerRating: deliveryPerson.rating || 4.8,
        totalDistance: deliveryPerson.totalDistance || 0,
        fuelEfficiency: deliveryPerson.fuelEfficiency || 0
      },
      recentOrders: formattedRecentOrders,
      zoneInfo: {
        name: deliveryPerson.zone?.name || 'No Zone Assigned',
        description: deliveryPerson.zone?.description || '',
        deliveryCharge: deliveryPerson.zone?.deliveryCharge || 0
      },
      notifications: [], // Real notifications will be fetched separately
      currentLocation: deliveryPerson.currentLocation || null
    };
    
    res.json({
      success: true,
      data: dashboardData
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});