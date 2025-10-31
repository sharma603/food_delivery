/**
 * Delivery Boy Order Controller
 * Handles order operations for delivery personnel
 */

import Order from '../../models/Order.js';
import DeliveryPersonnel from '../../models/DeliveryPersonnel.js';
import mongoose from 'mongoose';
import { sendSMS } from '../../services/smsService.js';
import { sendEmail } from '../../services/emailService.js';

/**
 * @desc    Get all orders assigned to delivery boy
 * @route   GET /api/v1/mobile/delivery/orders
 * @access  Private (Delivery Boy only)
 */
export const getDeliveryBoyOrders = async (req, res) => {
  try {
    // Validate user is authenticated
    if (!req.user || !req.user._id) {
      console.error('Authentication error: req.user is missing or invalid');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { status } = req.query;
    const deliveryPersonId = req.user._id || req.user.id;
    
    // If status is 'ready', get available orders (not assigned to anyone)
    if (status === 'ready') {
      try {
        const availableOrders = await Order.find({
        // Consider orders ready to be picked by any delivery person
        status: { $in: ['ready', 'confirmed'] },
        // Not yet assigned to any delivery person
        $or: [
          { deliveryPerson: { $exists: false } },
          { deliveryPerson: null }
        ]
      })
        .populate({ path: 'customer', select: 'name phone email' })
        .populate({ path: 'restaurant', select: 'restaurantName ownerName phone address description' })
        .select('-paymentId')
        .sort({ createdAt: -1 })
        .lean();

        // Filter out orders with missing required data
        const validOrders = availableOrders.filter(order => 
          order.customer && order.restaurant
        );

        return res.status(200).json({
          success: true,
          count: validOrders.length,
          data: validOrders
        });
      } catch (branchErr) {
        console.error('Available orders query failed:', branchErr);
        return res.status(200).json({ success: true, count: 0, data: [] });
      }
    }
    
    // Build filter for assigned orders
    const filter = { 
      deliveryPerson: deliveryPersonId
    };
    
    // Filter by status if provided (other than ready)
    if (status && status !== 'ready') {
      filter.status = status;
    } else {
      // Default: get active orders
      filter.status = { $in: ['confirmed', 'ready', 'picked_up', 'delivered'] };
    }

    let orders = [];
    try {
      orders = await Order.find(filter)
        .populate({ path: 'customer', select: 'name phone email' })
        .populate({ path: 'restaurant', select: 'restaurantName ownerName phone address description' })
        .select('-paymentId')
        .sort({ createdAt: -1 })
        .lean();
    } catch (listErr) {
      console.error('Assigned orders query failed:', listErr);
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    // Filter out orders with missing required data
    const validOrders = orders.filter(order => 
      order.customer && order.restaurant
    );

    res.status(200).json({
      success: true,
      count: validOrders.length,
      data: validOrders
    });
  } catch (error) {
    console.error('Error fetching delivery boy orders:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get single order with full details
 * @route   GET /api/v1/mobile/delivery/orders/:id
 * @access  Private (Delivery Boy only)
 */
export const getDeliveryOrderDetail = async (req, res) => {
  try {
    // Validate user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const deliveryPersonId = req.user._id || req.user.id;

    // Validate ObjectId to avoid CastError on invalid ids (e.g., "orders")
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order id'
      });
    }

    const order = await Order.findById(id)
      .populate({
        path: 'customer',
        select: 'name phone email'
      })
      .populate({
        path: 'restaurant',
        select: 'restaurantName ownerName phone address description'
      })
      .select('-paymentId')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify delivery boy is assigned to this order OR order is available
    const orderDeliveryPersonId = order.deliveryPerson?._id?.toString() || order.deliveryPerson?.toString() || order.deliveryPerson;
    
    if (orderDeliveryPersonId && orderDeliveryPersonId !== deliveryPersonId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this order'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update order status (picked_up, delivered, etc.)
 * @route   PUT /api/v1/mobile/delivery/orders/:id/status
 * @access  Private (Delivery Boy only)
 */
export const updateDeliveryStatus = async (req, res) => {
  try {
    // Validate user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const deliveryPersonId = req.user._id || req.user.id;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['picked_up', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify delivery boy is assigned to this order
    const orderDeliveryPersonId = order.deliveryPerson?.toString() || order.deliveryPerson?._id?.toString();
    if (orderDeliveryPersonId && orderDeliveryPersonId !== deliveryPersonId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this order'
      });
    }

    // Update order based on status
    const updateData = { status };
    
    if (status === 'picked_up') {
      updateData.pickedUpAt = new Date();
      updateData.trackingUpdates = [
        ...(order.trackingUpdates || []),
        {
          status: 'picked_up',
          timestamp: new Date(),
          message: 'Order picked up from restaurant'
        }
      ];
    } else if (status === 'delivered') {
      // Require OTP verified before marking delivered
      if (!order.deliveryOtp || !order.deliveryOtp.verified || (order.deliveryOtp.expiresAt && order.deliveryOtp.expiresAt <= new Date())) {
        return res.status(400).json({ success: false, message: 'Delivery OTP not verified' });
      }
      updateData.actualDeliveryTime = new Date();
      updateData.trackingUpdates = [
        ...(order.trackingUpdates || []),
        {
          status: 'delivered',
          timestamp: new Date(),
          message: 'Order delivered successfully'
        }
      ];
      
      // Update payment status if cash on delivery
      if (order.paymentMethod === 'cash_on_delivery') {
        updateData.paymentStatus = 'paid';
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate('customer', 'name phone email')
      .populate('restaurant', 'restaurantName');

    res.status(200).json({
      success: true,
      message: `Order ${status === 'picked_up' ? 'picked up' : 'delivered'} successfully`,
      data: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get delivery statistics for delivery boy
 * @route   GET /api/v1/mobile/delivery/stats
 * @access  Private (Delivery Boy only)
 */
export const getDeliveryStats = async (req, res) => {
  try {
    // Validate user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const deliveryBoyId = req.user._id || req.user.id;

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await Order.aggregate([
      {
        $match: {
          deliveryPerson: deliveryBoyId,
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalEarnings: { $sum: '$pricing.deliveryFee' }
        }
      }
    ]);

    const allTimeStats = await Order.aggregate([
      {
        $match: {
          deliveryPerson: deliveryBoyId,
          status: 'delivered'
        }
      },
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: 1 },
          totalEarnings: { $sum: '$pricing.deliveryFee' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        today: stats,
        allTime: allTimeStats[0] || { totalDeliveries: 0, totalEarnings: 0 }
      }
    });
  } catch (error) {
    console.error('Error fetching delivery stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Accept an available order
 * @route   POST /api/v1/mobile/delivery/orders/:id/accept
 * @access  Private (Delivery Boy only)
 */
export const acceptOrder = async (req, res) => {
  try {
    // Validate user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const deliveryPersonId = req.user._id || req.user.id;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is available (ready status and not assigned)
    if (order.status !== 'ready') {
      return res.status(400).json({
        success: false,
        message: 'Order is not ready for pickup'
      });
    }

    if (order.deliveryPerson) {
      return res.status(400).json({
        success: false,
        message: 'Order is already assigned to another delivery person'
      });
    }

    // Assign order to delivery person
    order.deliveryPerson = deliveryPersonId;
    order.status = 'confirmed'; // Change to confirmed after assignment
    order.trackingUpdates = [
      ...(order.trackingUpdates || []),
      {
        status: 'assigned',
        timestamp: new Date(),
        message: `Assigned to delivery person`,
        deliveryPerson: deliveryPersonId
      }
    ];

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order accepted successfully',
      data: order
    });
  } catch (error) {
    console.error('Error accepting order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Send delivery confirmation OTP to customer (valid 4 hours)
 * @route   POST /api/v1/mobile/delivery/orders/:id/send-otp
 * @access  Private (Delivery Boy only)
 */
export const sendDeliveryOtp = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const order = await Order.findById(req.params.id).populate('customer', 'name phone email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Only allow when order is picked up or confirmed/ready (driver en route)
    if (!['picked_up', 'ready', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'OTP can be sent after pickup or when en route' });
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours

    order.deliveryOtp = { code, expiresAt, resendCount: 0, verified: false };
    await order.save();

    // Send via SMS (if configured) and also via email when available
    const message = `FoodHub delivery code: ${code}. Share this OTP only with your delivery partner to confirm delivery. Valid for 4 hours.`;
    if (order.customer?.phone) {
      await sendSMS(order.customer.phone, message);
    }
    if (order.customer?.email) {
      await sendEmail({ to: order.customer.email, subject: 'Delivery OTP', text: message, html: `<p>${message}</p>` });
    }

    return res.status(200).json({ success: true, data: { expiresIn: 4 * 60 * 60 } });
  } catch (error) {
    console.error('Error sending delivery OTP:', error);
    return res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

/**
 * @desc    Resend delivery confirmation OTP (60s cooldown, max 3 resends)
 * @route   POST /api/v1/mobile/delivery/orders/:id/resend-otp
 * @access  Private (Delivery Boy only)
 */
export const resendDeliveryOtp = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const order = await Order.findById(req.params.id).populate('customer', 'name phone email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const now = new Date();
    if (!order.deliveryOtp || order.deliveryOtp.expiresAt <= now) {
      return res.status(400).json({ success: false, message: 'No active OTP. Send a new one.' });
    }
    if ((order.deliveryOtp.resendCount || 0) >= 3) {
      return res.status(429).json({ success: false, message: 'Maximum resends reached' });
    }

    order.deliveryOtp.resendCount = (order.deliveryOtp.resendCount || 0) + 1;
    await order.save();

    const message = `FoodHub delivery code: ${order.deliveryOtp.code}. Valid for 4 hours.`;
    if (order.customer?.phone) {
      await sendSMS(order.customer.phone, message);
    }
    if (order.customer?.email) {
      await sendEmail({ to: order.customer.email, subject: 'Delivery OTP', text: message, html: `<p>${message}</p>` });
    }

    return res.status(200).json({ success: true, data: { expiresIn: Math.floor((order.deliveryOtp.expiresAt.getTime() - now.getTime()) / 1000), remaining: 3 - order.deliveryOtp.resendCount } });
  } catch (error) {
    console.error('Error resending delivery OTP:', error);
    return res.status(500).json({ success: false, message: 'Failed to resend OTP' });
  }
};

/**
 * @desc    Submit delivery proof (photos, otp). Marks OTP verified.
 * @route   POST /api/v1/mobile/delivery/orders/:id/proof
 * @access  Private (Delivery Boy only)
 */
export const submitDeliveryProof = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const { otp } = req.body;
    const order = await Order.findById(req.params.id).populate('customer', 'name phone email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Require OTP for proof submission (delivery confirmation)
    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required' });
    }
    const valid = order.deliveryOtp && order.deliveryOtp.code === String(otp).trim() && order.deliveryOtp.expiresAt > new Date();
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    order.deliveryOtp.verified = true;
    await order.save();
    // Photos not persisted here (can be added with storage integration)
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error submitting delivery proof:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit proof' });
  }
};

/**
 * @desc    Verify delivery OTP only (no photos)
 * @route   POST /api/v1/mobile/delivery/orders/:id/otp/verify
 * @access  Private (Delivery Boy only)
 */
export const verifyDeliveryOtp = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const { otp } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!otp) return res.status(400).json({ success: false, message: 'OTP is required' });
    const valid = order.deliveryOtp && order.deliveryOtp.code === String(otp).trim() && order.deliveryOtp.expiresAt > new Date();
    if (!valid) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    order.deliveryOtp.verified = true;
    await order.save();
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error verifying delivery OTP:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
};
