import Order from '../models/Order.js';
import { getIO } from '../config/socket.js';
import { calculateDistance } from '../utils/helpers.js';
import { orderQueue } from '../jobs/orderQueue.js';

const getOrders = async (req, res) => {
  const orders = await Order.find({}).populate('customer restaurant deliveryPerson');
  res.json(orders);
};

const getOrder = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('customer restaurant deliveryPerson');

  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

const createOrder = async (req, res) => {
  try {
    console.log('Creating order with data:', req.body);
    
    const body = req.body;
    
    // Validate required fields
    const requiredFields = ['restaurants', 'items', 'pricing'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return res.status(400).json({
          success: false,
          message: `Missing required field: ${field}`
        });
      }
    }

    // Handle delivery address (can be deliveryAddress or deliveryLocation)
    if (body.deliveryAddress && !body.deliveryLocation) {
      body.deliveryLocation = body.deliveryAddress;
    }

    // Handle customer field - use authenticated user or create guest user
    if (!body.customer && req.user) {
      body.customer = req.user._id;
    } else if (!body.customer) {
      // For guest orders, use a default customer ID or create one
      body.customer = '507f1f77bcf86cd799439011'; // Default guest customer ID
    }

    // Handle multi-restaurant orders
    if (body.restaurants && Array.isArray(body.restaurants) && body.restaurants.length > 0) {
      // For multi-restaurant orders, use the first restaurant as primary
      // and store all restaurant data in a custom field
      body.restaurant = body.restaurants[0].restaurantId;
      body.multiRestaurantData = body.restaurants; // Store all restaurant data
    }

    // Calculate delivery fee if not provided
    if (!body.pricing.deliveryFee) {
      // Use the calculated delivery fee from the request or default
      body.pricing.deliveryFee = body.pricing.deliveryFee || 50; // Default fallback
    }

    // Ensure total is calculated correctly
    if (body.pricing) {
      body.pricing.total = (body.pricing.subtotal || 0) + (body.pricing.deliveryFee || 0);
    }

    // Set default status
    body.status = body.status || 'placed';

    const order = await Order.create(body);

    // Populate order data for real-time events
    await order.populate([
      { path: 'customer', select: 'name email phone' },
      { path: 'restaurant', select: 'restaurantName' }
    ]);

    // Emit real-time event and enqueue job
    try {
      orderQueue.add({ type: 'ORDER_PLACED', payload: { orderId: order._id } });
      
      // Emit to specific order room
      getIO().to(String(order._id)).emit('order:update', { 
        status: order.status, 
        orderId: String(order._id) 
      });
      
      // Emit to superadmin room for monitoring
      getIO().to('superadmin').emit('newOrder', {
        order: order,
        timestamp: new Date()
      });
      
      console.log('Order events emitted successfully');
    } catch (error) {
      console.log('Error emitting order event:', error);
    }

    console.log('Order created successfully:', order._id);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      orderId: order._id,
      orderNumber: order.orderNumber,
      data: order
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

const updateOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const prevStatus = order.status;
  Object.assign(order, req.body);
  const updatedOrder = await order.save();

  if (req.body.status && req.body.status !== prevStatus) {
    try {
      orderQueue.add({ type: 'STATUS_CHANGED', payload: { orderId: order._id, status: updatedOrder.status } });
      
      // Emit to specific order room
      getIO().to(String(order._id)).emit('order:update', { 
        status: updatedOrder.status, 
        orderId: String(order._id) 
      });
      
      // Emit to superadmin room for monitoring
      getIO().to('superadmin').emit('orderStatusChange', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        oldStatus: prevStatus,
        newStatus: updatedOrder.status,
        timestamp: new Date()
      });
    } catch (error) {
      console.log('Error emitting status change event:', error);
    }
  }

  res.json(updatedOrder);
};

const deleteOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    await order.remove();
    res.json({ message: 'Order removed' });
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

export { getOrders, getOrder, createOrder, updateOrder, deleteOrder };