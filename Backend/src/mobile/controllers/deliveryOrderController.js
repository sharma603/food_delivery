/**
 * Delivery Boy Order Controller
 * Handles order operations for delivery personnel
 */

import Order from '../../models/Order.js';
import DeliveryPersonnel from '../../models/DeliveryPersonnel.js';
import mongoose from 'mongoose';
import { sendSMS } from '../../services/smsService.js';
import { sendEmail } from '../../services/emailService.js';
import { notifyDeliveryPartners } from '../../services/notificationService.js';

/**
 * @desc    Get all orders assigned to delivery boy
 * @route   GET /api/v1/mobile/delivery/orders
 * @access  Private (Delivery Boy only)
 */
export const getDeliveryBoyOrders = async (req, res) => {
  try {
    // Validate user is authenticated
    if (!req.user || !req.user._id) {
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
        .populate({ path: 'customer', select: 'name phone email addresses' })
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
        .populate({ path: 'customer', select: 'name phone email addresses' })
        .populate({ path: 'restaurant', select: 'restaurantName ownerName phone address description' })
        .select('-paymentId')
        .sort({ createdAt: -1 })
        .lean();
    } catch (listErr) {
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
        select: 'name phone email addresses'
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

    // Verify delivery person is assigned to this order
    // Check all possible assignment fields
    const orderDeliveryPersonId = 
      order.deliveryPerson?.toString() || 
      order.deliveryPerson?._id?.toString() ||
      order.deliveryPersonnel?.toString() ||
      order.deliveryPersonnel?._id?.toString() ||
      order.assignedDeliveryPerson?.toString() ||
      order.assignedDeliveryPerson?._id?.toString();
    
    // STRICT RULE: Order MUST be accepted (assigned) first before any status update
    if (!orderDeliveryPersonId) {
      return res.status(403).json({
        success: false,
        message: 'Order is not assigned to you. Please accept the order first before updating status.'
      });
    }
    
    // Only the assigned delivery person can update the order status
    if (orderDeliveryPersonId !== deliveryPersonId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this order. Only the assigned delivery person can update the order status.'
      });
    }

    // Update order based on status
    const updateData = { status };
    
    if (status === 'picked_up') {
      // STRICT RULE: Order must be accepted first (status should be 'confirmed' after accept)
      // After acceptance, order status is 'confirmed', then they can mark as 'picked_up'
      const allowedPreviousStatuses = ['confirmed'];
      if (!allowedPreviousStatuses.includes(order.status) && order.status !== 'picked_up') {
        return res.status(400).json({
          success: false,
          message: `Cannot mark as picked_up. Order must be accepted first (status: confirmed). Current status: ${order.status}. Please accept the order before marking as picked up.`
        });
      }
      
      updateData.pickedUpAt = new Date();
      if (!updateData.trackingUpdates) {
        updateData.trackingUpdates = [...(order.trackingUpdates || [])];
      }
      updateData.trackingUpdates.push({
        status: 'picked_up',
        timestamp: new Date(),
        message: 'Order picked up from restaurant'
      });
    } else if (status === 'delivered') {
      // Validate status transition - can mark delivered from picked_up
      if (order.status !== 'picked_up' && order.status !== 'delivered') {
        return res.status(400).json({
          success: false,
          message: `Cannot mark as delivered from current status: ${order.status}. Order must be picked_up first.`
        });
      }
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

    // If order is delivered, update delivery person's earnings and delivery count
    // Check if order is assigned to this delivery person using any of the possible fields
    // Handle both ObjectId and string comparisons
    const orderDeliveryPersonStr = order.deliveryPerson?.toString?.() || 
                                   (typeof order.deliveryPerson === 'object' && order.deliveryPerson?._id?.toString()) ||
                                   String(order.deliveryPerson || '');
    const orderDeliveryPersonnelStr = order.deliveryPersonnel?.toString?.() || 
                                     (typeof order.deliveryPersonnel === 'object' && order.deliveryPersonnel?._id?.toString()) ||
                                     String(order.deliveryPersonnel || '');
    const orderAssignedDeliveryPersonStr = order.assignedDeliveryPerson?.toString?.() || 
                                          (typeof order.assignedDeliveryPerson === 'object' && order.assignedDeliveryPerson?._id?.toString()) ||
                                          String(order.assignedDeliveryPerson || '');
    
    const isAssignedToDeliverer = 
      orderDeliveryPersonStr === deliveryPersonId.toString() ||
      orderDeliveryPersonnelStr === deliveryPersonId.toString() ||
      orderAssignedDeliveryPersonStr === deliveryPersonId.toString() ||
      // Also check updatedOrder in case it was updated
      updatedOrder.deliveryPerson?.toString() === deliveryPersonId.toString() ||
      updatedOrder.deliveryPersonnel?.toString() === deliveryPersonId.toString() ||
      updatedOrder.assignedDeliveryPerson?.toString() === deliveryPersonId.toString();
    
    console.log('📋 Delivery record creation check:', {
      status,
      isDelivered: status === 'delivered',
      isAssignedToDeliverer,
      orderDeliveryPerson: orderDeliveryPersonStr,
      orderDeliveryPersonnel: orderDeliveryPersonnelStr,
      orderAssignedDeliveryPerson: orderAssignedDeliveryPersonStr,
      updatedOrderDeliveryPerson: updatedOrder.deliveryPerson?.toString(),
      currentDeliveryPersonId: deliveryPersonId.toString(),
      willCreateDelivery: status === 'delivered' && isAssignedToDeliverer
    });
    
    // CRITICAL: Always create Delivery record when order is delivered, regardless of assignment check
    // The assignment check is for earnings updates, but Delivery record should always be created
    if (status === 'delivered') {
      // If not assigned to this deliverer, we still create Delivery record but use the assigned person or current user
      let effectiveDeliveryPersonId = deliveryPersonId;
      if (!isAssignedToDeliverer) {
        // Use the delivery person from order if available, otherwise use current user
        effectiveDeliveryPersonId = orderDeliveryPersonStr && orderDeliveryPersonStr !== 'null' && orderDeliveryPersonStr !== '' 
          ? orderDeliveryPersonStr 
          : orderDeliveryPersonnelStr && orderDeliveryPersonnelStr !== 'null' && orderDeliveryPersonnelStr !== ''
          ? orderDeliveryPersonnelStr
          : orderAssignedDeliveryPersonStr && orderAssignedDeliveryPersonStr !== 'null' && orderAssignedDeliveryPersonStr !== ''
          ? orderAssignedDeliveryPersonStr
          : deliveryPersonId.toString();
        
        warning(`Order delivery person doesn't match current user. Using: ${effectiveDeliveryPersonId}`);
      }
      
      try {
        console.log('🔄 Starting Delivery record creation process for order:', req.params.id);
        const deliveryPerson = await DeliveryPersonnel.findById(effectiveDeliveryPersonId)
          .populate('zone', 'name deliveryCharge');
        if (deliveryPerson) {
          console.log('✅ Delivery person found, proceeding with Delivery record creation');
          
          // Only update earnings if this delivery person is the one assigned
          if (isAssignedToDeliverer) {
            console.log('✅ Delivery person matches assignment - will update earnings');
          } else {
            console.log('⚠️ Delivery person does not match assignment - will create Delivery record but skip earnings update');
          }
          
          // Calculate earnings from delivery fee
          const deliveryFee = updatedOrder.pricing?.deliveryFee || order.pricing?.deliveryFee || 0;
          
          // Normalize payment method for comparison (case-insensitive, handle variations)
          const normalizePaymentMethod = (method) => {
            if (!method) return null;
            const normalized = String(method).toLowerCase().trim();
            return normalized === 'cash_on_delivery' || 
                   normalized === 'cash on delivery' ||
                   normalized === 'cod' ||
                   normalized === 'cash' ||
                   (normalized.includes('cash') && normalized.includes('delivery'));
          };
          
          const isCashOnDelivery = normalizePaymentMethod(order.paymentMethod) || 
                                   normalizePaymentMethod(updatedOrder?.paymentMethod);
          
          // Calculate cash amount for COD orders (order total, not just delivery fee)
          let cashAmount = 0;
          if (isCashOnDelivery) {
            if (updatedOrder?.pricing?.total) {
              cashAmount = updatedOrder.pricing.total;
            } else if (order?.pricing?.total) {
              cashAmount = order.pricing.total;
            } else if (updatedOrder?.totalAmount) {
              cashAmount = updatedOrder.totalAmount;
            } else if (order?.totalAmount) {
              cashAmount = order.totalAmount;
            } else if (order?.total) {
              cashAmount = order.total;
            }
          }
          
          // IMPORTANT: Create CashCollection FIRST (before Delivery record) for COD orders
          // This ensures cash collection is recorded even if Delivery record creation fails
          const CashCollection = (await import('../../models/Payment/CashCollection.js')).default;
          
          console.log('💰 CashCollection creation check:', {
            isCashOnDelivery,
            cashAmount,
            paymentMethod: order.paymentMethod,
            effectiveDeliveryPersonId: effectiveDeliveryPersonId?.toString(),
            orderId: req.params.id,
            orderNumber: updatedOrder.orderNumber || order.orderNumber
          });
          
          // Create CashCollection for COD orders in a separate transaction to ensure it's created
          if (isCashOnDelivery && cashAmount > 0) {
            console.log('💰 Creating CashCollection record for COD order...');
            try {
              // Ensure effectiveDeliveryPersonId is an ObjectId
              const deliveryPersonObjectId = mongoose.Types.ObjectId.isValid(effectiveDeliveryPersonId)
                ? new mongoose.Types.ObjectId(effectiveDeliveryPersonId)
                : effectiveDeliveryPersonId;
              
              const orderObjectId = mongoose.Types.ObjectId.isValid(req.params.id)
                ? new mongoose.Types.ObjectId(req.params.id)
                : req.params.id;
              
              const cashSession = await mongoose.startSession();
              cashSession.startTransaction();
              
              try {
                // Check if cash collection already exists for this order
                const existingCollection = await CashCollection.findOne({ order: orderObjectId }).session(cashSession);
                
                if (existingCollection) {
                  console.log('⚠️ CashCollection already exists for order:', req.params.id);
                  await cashSession.abortTransaction();
                  cashSession.endSession();
                } else {
                  console.log('✅ No existing CashCollection found, creating new record...');
                  
                  // Get delivery person in cash session to update
                  const deliveryPersonForCash = await DeliveryPersonnel.findById(deliveryPersonObjectId).session(cashSession);
                  
                  if (!deliveryPersonForCash) {
                    throw new Error(`Delivery person not found: ${deliveryPersonObjectId}`);
                  }
                  
                  console.log('✅ Delivery person found for cash update:', deliveryPersonForCash.name);
                  
                  // Update delivery person's cash tracking
                  deliveryPersonForCash.cashInHand = (deliveryPersonForCash.cashInHand || 0) + cashAmount;
                  deliveryPersonForCash.totalCashCollected = (deliveryPersonForCash.totalCashCollected || 0) + cashAmount;
                  deliveryPersonForCash.pendingCashSubmission = (deliveryPersonForCash.pendingCashSubmission || 0) + cashAmount;
                  
                  await deliveryPersonForCash.save({ session: cashSession });
                  console.log('✅ Updated delivery person cash tracking');
                  
                  // Create cash collection record in database
                  const cashCollectionData = {
                    deliveryPerson: deliveryPersonObjectId,
                    order: orderObjectId,
                    orderNumber: updatedOrder.orderNumber || order.orderNumber || `ORDER-${req.params.id}`,
                    amount: cashAmount,
                    collectedAt: new Date(),
                    notes: `Auto-recorded on delivery - Order #${updatedOrder.orderNumber || order.orderNumber || req.params.id}`,
                    submissionStatus: 'pending'
                  };
                  
                  console.log('💰 Creating CashCollection with data:', {
                    deliveryPerson: cashCollectionData.deliveryPerson.toString(),
                    order: cashCollectionData.order.toString(),
                    orderNumber: cashCollectionData.orderNumber,
                    amount: cashCollectionData.amount
                  });
                  
                  const cashCollection = await CashCollection.create([cashCollectionData], { session: cashSession });
                  
                  if (!cashCollection || !cashCollection[0]) {
                    throw new Error('Failed to create CashCollection record - create() returned empty result');
                  }
                  
                  console.log('✅✅✅ CashCollection record created successfully:', cashCollection[0]._id);
                  
                  await cashSession.commitTransaction();
                  cashSession.endSession();
                  
                  // Verify the record was actually saved
                  const verifyCollection = await CashCollection.findById(cashCollection[0]._id);
                  if (verifyCollection) {
                    console.log('✅✅✅ CashCollection verified in database:', verifyCollection._id);
                  } else {
                    console.error('❌❌❌ CRITICAL: CashCollection not found after commit!');
                  }
                }
              } catch (cashError) {
                // Log cash collection error for debugging
                console.error('❌ CashCollection transaction error:', {
                  orderId: req.params.id,
                  deliveryPersonId: deliveryPersonObjectId?.toString(),
                  cashAmount: cashAmount,
                  error: cashError.message,
                  stack: cashError.stack,
                  errorName: cashError.name,
                  errors: cashError.errors
                });
                
                try {
                  await cashSession.abortTransaction();
                  cashSession.endSession();
                } catch (abortError) {
                  console.error('Error aborting cash collection transaction:', abortError.message);
                }
                
                // CRITICAL: Try to create CashCollection outside transaction as fallback
                try {
                  console.log('⚠️ Attempting to create CashCollection outside transaction as fallback...');
                  const fallbackCollection = await CashCollection.create({
                    deliveryPerson: deliveryPersonObjectId,
                    order: orderObjectId,
                    orderNumber: updatedOrder.orderNumber || order.orderNumber || `ORDER-${req.params.id}`,
                    amount: cashAmount,
                    collectedAt: new Date(),
                    notes: `Auto-recorded on delivery (fallback) - Order #${updatedOrder.orderNumber || order.orderNumber || req.params.id}`,
                    submissionStatus: 'pending'
                  });
                  console.log('✅ Successfully created CashCollection via fallback method:', fallbackCollection._id);
                } catch (fallbackError) {
                  console.error('❌ CRITICAL: Failed to create CashCollection even via fallback:', {
                    error: fallbackError.message,
                    errors: fallbackError.errors
                  });
                }
              }
            } catch (cashSessionError) {
              console.error('❌ CashCollection session error:', {
                error: cashSessionError.message,
                stack: cashSessionError.stack
              });
              // Try fallback creation outside session
              try {
                const deliveryPersonObjectId = mongoose.Types.ObjectId.isValid(effectiveDeliveryPersonId)
                  ? new mongoose.Types.ObjectId(effectiveDeliveryPersonId)
                  : effectiveDeliveryPersonId;
                const orderObjectId = mongoose.Types.ObjectId.isValid(req.params.id)
                  ? new mongoose.Types.ObjectId(req.params.id)
                  : req.params.id;
                
                console.log('⚠️ Attempting fallback CashCollection creation...');
                const fallbackCollection = await CashCollection.create({
                  deliveryPerson: deliveryPersonObjectId,
                  order: orderObjectId,
                  orderNumber: updatedOrder.orderNumber || order.orderNumber || `ORDER-${req.params.id}`,
                  amount: cashAmount,
                  collectedAt: new Date(),
                  notes: `Auto-recorded on delivery (session fallback) - Order #${updatedOrder.orderNumber || order.orderNumber || req.params.id}`,
                  submissionStatus: 'pending'
                });
                console.log('✅ Successfully created CashCollection via session fallback:', fallbackCollection._id);
              } catch (fallbackError) {
                console.error('❌ CRITICAL: Failed to create CashCollection via session fallback:', fallbackError.message);
              }
            }
          } else {
            console.log('⚠️ Skipping CashCollection creation:', {
              isCashOnDelivery,
              cashAmount,
              reason: !isCashOnDelivery ? 'Not a COD order' : 'Cash amount is 0'
            });
          }
          
          // Use MongoDB session for atomic transaction to create Delivery record
          const session = await mongoose.startSession();
          session.startTransaction();
          
          try {
            // Reload delivery person to get latest data (in case cash was updated)
            const deliveryPersonForDelivery = await DeliveryPersonnel.findById(effectiveDeliveryPersonId).session(session);
            
            if (deliveryPersonForDelivery) {
              // Update delivery person statistics ONLY if this is the assigned delivery person
              if (isAssignedToDeliverer) {
                deliveryPersonForDelivery.totalDeliveries = (deliveryPersonForDelivery.totalDeliveries || 0) + 1;
                deliveryPersonForDelivery.totalEarnings = (deliveryPersonForDelivery.totalEarnings || 0) + deliveryFee;
                await deliveryPersonForDelivery.save({ session });
                console.log('✅ Updated delivery person statistics');
              } else {
                console.log('⚠️ Skipping earnings update - delivery person mismatch');
              }
            }
            
            // Import Delivery model
            const Delivery = (await import('../../models/Delivery.js')).default;
            
            // Check if delivery record already exists for this order
            const existingDelivery = await Delivery.findOne({ orderId: req.params.id }).session(session);
            
            if (!existingDelivery) {
              // Get order data with populated fields - CRITICAL: Always get order data even if populate fails
              let orderWithDetails;
              try {
                orderWithDetails = await Order.findById(req.params.id)
                  .populate('customer', 'name phone email')
                  .populate('restaurant', 'restaurantName address coordinates')
                  .populate('deliveryPerson', 'name phone vehicleType vehicleNumber');
              } catch (populateError) {
                // If populate fails, get order without populate - we'll use basic data
                console.warn('Error populating order details, using basic order data:', populateError.message);
                orderWithDetails = await Order.findById(req.params.id);
              }
              
              // ALWAYS create Delivery record even if orderWithDetails is missing some fields
              // Use fallback values for missing data
              if (orderWithDetails) {
                // Ensure customer data is properly populated - fetch customer if not populated
                if (!orderWithDetails.customer || typeof orderWithDetails.customer !== 'object' || !orderWithDetails.customer.name) {
                  try {
                    const Customer = (await import('../../models/Customer.js')).default;
                    const customerId = orderWithDetails.customer?.toString() || order.customer?.toString();
                    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
                      const customerDoc = await Customer.findById(customerId).select('name phone email');
                      if (customerDoc) {
                        orderWithDetails.customer = customerDoc;
                        console.log('✅ Fetched customer data:', customerDoc.name);
                      }
                    }
                  } catch (customerFetchError) {
                    console.warn('⚠️ Could not fetch customer data:', customerFetchError.message);
                  }
                }
                
                // Ensure restaurant data is properly populated - fetch restaurant if not populated
                if (!orderWithDetails.restaurant || typeof orderWithDetails.restaurant !== 'object' || !orderWithDetails.restaurant.restaurantName) {
                  try {
                    const RestaurantUser = (await import('../../models/RestaurantUser.js')).default;
                    const restaurantId = orderWithDetails.restaurant?.toString() || order.restaurant?.toString();
                    if (restaurantId && mongoose.Types.ObjectId.isValid(restaurantId)) {
                      const restaurantDoc = await RestaurantUser.findById(restaurantId).select('restaurantName address coordinates');
                      if (restaurantDoc) {
                        orderWithDetails.restaurant = restaurantDoc;
                        console.log('✅ Fetched restaurant data:', restaurantDoc.restaurantName);
                      }
                    }
                  } catch (restaurantFetchError) {
                    console.warn('⚠️ Could not fetch restaurant data:', restaurantFetchError.message);
                  }
                }
                
                // Get zone information with fallback values
                let zoneId, zoneName, zoneDeliveryCharge;
                
                if (deliveryPerson.zone && typeof deliveryPerson.zone === 'object' && deliveryPerson.zone._id) {
                  // Zone is populated
                  zoneId = deliveryPerson.zone._id;
                  zoneName = deliveryPerson.zone.name || 'Unknown Zone';
                  zoneDeliveryCharge = deliveryPerson.zone.deliveryCharge || deliveryFee;
                } else if (deliveryPerson.zone && mongoose.Types.ObjectId.isValid(deliveryPerson.zone)) {
                  // Zone is just an ObjectId, need to fetch it
                  const Zone = (await import('../../models/Zone.js')).default;
                  const zoneDoc = await Zone.findById(deliveryPerson.zone);
                  if (zoneDoc) {
                    zoneId = zoneDoc._id;
                    zoneName = zoneDoc.name || 'Unknown Zone';
                    zoneDeliveryCharge = zoneDoc.deliveryCharge || deliveryFee;
                  } else {
                    // Use fallback values if zone not found
                    zoneId = deliveryPerson.zone;
                    zoneName = 'Unknown Zone';
                    zoneDeliveryCharge = deliveryFee;
                  }
                } else {
                  // Use default values if no zone
                  zoneId = deliveryPerson._id; // Fallback to delivery person ID
                  zoneName = 'Unknown Zone';
                  zoneDeliveryCharge = deliveryFee;
                }
                
                // Create delivery record for accounting
                const deliveryRecordData = {
                  orderId: req.params.id,
                  orderNumber: updatedOrder.orderNumber || order.orderNumber,
                  
                  // Customer Information - handle both populated and non-populated customer
                  customer: {
                    id: (orderWithDetails.customer?._id && mongoose.Types.ObjectId.isValid(orderWithDetails.customer._id)) 
                        ? orderWithDetails.customer._id 
                        : (order.customer && mongoose.Types.ObjectId.isValid(order.customer) 
                          ? order.customer 
                          : new mongoose.Types.ObjectId()), // Fallback to new ObjectId if invalid
                    name: (orderWithDetails.customer?.name && orderWithDetails.customer.name.trim()) 
                        ? orderWithDetails.customer.name.trim() 
                        : 'Customer',
                    phone: (orderWithDetails.customer?.phone && orderWithDetails.customer.phone.trim()) 
                         ? orderWithDetails.customer.phone.trim() 
                         : 'N/A',
                    email: (orderWithDetails.customer?.email && orderWithDetails.customer.email.trim()) 
                         ? orderWithDetails.customer.email.trim().toLowerCase() 
                         : ''
                  },
                  
                  // Delivery Address - ensure all required fields have values
                  deliveryAddress: {
                    street: (orderWithDetails.deliveryAddress?.street && orderWithDetails.deliveryAddress.street.trim()) 
                           ? orderWithDetails.deliveryAddress.street.trim() 
                           : 'Address Not Provided',
                    city: (orderWithDetails.deliveryAddress?.city && orderWithDetails.deliveryAddress.city.trim()) 
                         ? orderWithDetails.deliveryAddress.city.trim() 
                         : 'City Not Provided',
                    state: orderWithDetails.deliveryAddress?.state?.trim() || '',
                    pincode: (orderWithDetails.deliveryAddress?.zipCode && orderWithDetails.deliveryAddress.zipCode.trim()) 
                            ? orderWithDetails.deliveryAddress.zipCode.trim() 
                            : (orderWithDetails.deliveryAddress?.pincode && orderWithDetails.deliveryAddress.pincode.trim()) 
                              ? orderWithDetails.deliveryAddress.pincode.trim() 
                              : '00000',
                    coordinates: orderWithDetails.deliveryAddress?.coordinates || {}
                  },
                  
                  // Restaurant Information - handle both populated and non-populated restaurant
                  restaurant: {
                    id: (orderWithDetails.restaurant?._id && mongoose.Types.ObjectId.isValid(orderWithDetails.restaurant._id)) 
                        ? orderWithDetails.restaurant._id 
                        : (order.restaurant && mongoose.Types.ObjectId.isValid(order.restaurant) 
                          ? order.restaurant 
                          : new mongoose.Types.ObjectId()), // Fallback to new ObjectId if invalid
                    name: (orderWithDetails.restaurant?.restaurantName && orderWithDetails.restaurant.restaurantName.trim()) 
                         ? orderWithDetails.restaurant.restaurantName.trim() 
                         : (orderWithDetails.restaurant?.name && orderWithDetails.restaurant.name.trim()) 
                           ? orderWithDetails.restaurant.name.trim() 
                           : 'Restaurant',
                    address: (orderWithDetails.restaurant?.address && orderWithDetails.restaurant.address.trim()) 
                            ? orderWithDetails.restaurant.address.trim() 
                            : 'Address Not Provided',
                    coordinates: orderWithDetails.restaurant?.coordinates || {}
                  },
                  
                  // Delivery Personnel
                  deliveryPersonnel: {
                    id: effectiveDeliveryPersonId,
                    name: deliveryPerson?.name || 'Unknown',
                    phone: deliveryPerson?.phone || '',
                    vehicleType: deliveryPerson?.vehicleType || 'Unknown',
                    vehicleNumber: deliveryPerson?.vehicleNumber || ''
                  },
                  
                  // Zone Information
                  zone: {
                    id: zoneId,
                    name: zoneName,
                    deliveryCharge: zoneDeliveryCharge
                  },
                  
                  // Status and Timestamps
                  status: 'delivered',
                  assignedAt: orderWithDetails.assignedAt || orderWithDetails.createdAt || new Date(),
                  pickedUpAt: orderWithDetails.pickedUpAt || updatedOrder.pickedUpAt || new Date(),
                  actualDelivery: new Date(),
                  estimatedDelivery: orderWithDetails.estimatedDeliveryTime || new Date(),
                  
                  // Financial Information for Accounting
                  orderValue: updatedOrder.pricing?.subtotal || order.pricing?.subtotal || 0,
                  deliveryCharge: deliveryFee,
                  totalAmount: updatedOrder.pricing?.total || order.pricing?.total || 0,
                  paymentMethod: order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 
                                order.paymentMethod === 'online' ? 'Digital Wallet' : 
                                order.paymentMethod || 'Unknown',
                  
                  // Special Instructions
                  specialInstructions: orderWithDetails.specialInstructions || ''
                };
                
                // Validate required fields before creating Delivery record
                const validationErrors = [];
                if (!deliveryRecordData.customer?.name || deliveryRecordData.customer.name === 'Unknown') {
                  validationErrors.push('Customer name is missing or invalid');
                }
                if (!deliveryRecordData.customer?.phone) {
                  validationErrors.push('Customer phone is missing');
                }
                if (!deliveryRecordData.deliveryAddress?.street) {
                  validationErrors.push('Delivery address street is missing');
                }
                if (!deliveryRecordData.deliveryAddress?.city) {
                  validationErrors.push('Delivery address city is missing');
                }
                if (!deliveryRecordData.deliveryAddress?.pincode) {
                  validationErrors.push('Delivery address pincode is missing');
                }
                if (!deliveryRecordData.restaurant?.name || deliveryRecordData.restaurant.name === 'Unknown Restaurant') {
                  validationErrors.push('Restaurant name is missing or invalid');
                }
                if (!deliveryRecordData.restaurant?.address) {
                  validationErrors.push('Restaurant address is missing');
                }
                
                if (validationErrors.length > 0) {
                  console.error('❌ Delivery record validation failed:', {
                    orderId: req.params.id,
                    errors: validationErrors,
                    data: deliveryRecordData
                  });
                  // Don't throw - try to create with fallback values
                  // Fill in missing required fields with defaults
                  if (!deliveryRecordData.customer?.name || deliveryRecordData.customer.name === 'Unknown') {
                    deliveryRecordData.customer.name = order.customer?.toString() || 'Customer';
                  }
                  if (!deliveryRecordData.customer?.phone) {
                    deliveryRecordData.customer.phone = 'N/A';
                  }
                  if (!deliveryRecordData.deliveryAddress?.street) {
                    deliveryRecordData.deliveryAddress.street = 'Address Not Provided';
                  }
                  if (!deliveryRecordData.deliveryAddress?.city) {
                    deliveryRecordData.deliveryAddress.city = 'City Not Provided';
                  }
                  if (!deliveryRecordData.deliveryAddress?.pincode) {
                    deliveryRecordData.deliveryAddress.pincode = '00000';
                  }
                  if (!deliveryRecordData.restaurant?.name || deliveryRecordData.restaurant.name === 'Unknown Restaurant') {
                    deliveryRecordData.restaurant.name = 'Restaurant';
                  }
                  if (!deliveryRecordData.restaurant?.address) {
                    deliveryRecordData.restaurant.address = 'Address Not Provided';
                  }
                  console.warn('⚠️ Using fallback values for missing required fields');
                }
                
                // Create Delivery record in transaction
                let deliveryRecord;
                try {
                  deliveryRecord = await Delivery.create([deliveryRecordData], { session });
                  console.log('✅ Delivery.create() succeeded, result:', deliveryRecord ? 'Array with ' + deliveryRecord.length + ' items' : 'null');
                } catch (createError) {
                  console.error('❌ Delivery.create() failed:', {
                    error: createError.message,
                    errors: createError.errors,
                    orderId: req.params.id,
                    deliveryRecordData: {
                      orderId: deliveryRecordData.orderId,
                      orderNumber: deliveryRecordData.orderNumber,
                      customerName: deliveryRecordData.customer?.name,
                      restaurantName: deliveryRecordData.restaurant?.name
                    }
                  });
                  throw createError;
                }
                
                if (!deliveryRecord || !deliveryRecord[0]) {
                  throw new Error('Failed to create Delivery record - create() returned empty result');
                }
                
                console.log('✅ Delivery record created successfully:', deliveryRecord[0]._id);
                
                // If COD order, link CashCollection to Delivery record
                if (isCashOnDelivery && cashAmount > 0) {
                  // Find cash collection outside session since it was committed in previous transaction
                  const cashCollectionDoc = await CashCollection.findOne({ order: req.params.id });
                  
                  if (cashCollectionDoc) {
                    deliveryRecord[0].cashCollected = {
                      amount: cashAmount,
                      collectedAt: new Date(),
                      collectedBy: effectiveDeliveryPersonId,
                      status: 'collected',
                      cashCollectionId: cashCollectionDoc._id
                    };
                    await deliveryRecord[0].save({ session });
                  } else {
                    // Cash collection not found - log warning but continue
                    console.warn('CashCollection not found for order when creating Delivery record:', {
                      orderId: req.params.id,
                      cashAmount: cashAmount
                    });
                  }
                }
              } else {
                // If orderWithDetails is null, still create Delivery record with basic data from order
                console.warn('Order details not found, creating Delivery record with basic order data:', req.params.id);
                
                // Fetch delivery person for basic record
                let basicDeliveryPerson = deliveryPerson;
                if (!basicDeliveryPerson) {
                  try {
                    basicDeliveryPerson = await DeliveryPersonnel.findById(effectiveDeliveryPersonId).select('name phone vehicleType vehicleNumber');
                  } catch (err) {
                    console.warn('Could not fetch delivery person for basic record:', err.message);
                  }
                }
                
                const basicDeliveryRecordData = {
                  orderId: req.params.id,
                  orderNumber: updatedOrder.orderNumber || order.orderNumber || `ORDER-${req.params.id}`,
                  
                  // Customer Information (from order directly) - with fallback values
                  customer: {
                    id: order.customer?.toString() && mongoose.Types.ObjectId.isValid(order.customer) 
                        ? order.customer 
                        : new mongoose.Types.ObjectId(),
                    name: 'Customer', // Use valid fallback instead of 'Unknown'
                    phone: 'N/A', // Use valid fallback instead of empty string
                    email: ''
                  },
                  
                  // Delivery Address (from order) - with fallback values
                  deliveryAddress: {
                    street: (order.deliveryAddress?.street && order.deliveryAddress.street.trim()) 
                           ? order.deliveryAddress.street.trim() 
                           : 'Address Not Provided',
                    city: (order.deliveryAddress?.city && order.deliveryAddress.city.trim()) 
                         ? order.deliveryAddress.city.trim() 
                         : 'City Not Provided',
                    state: order.deliveryAddress?.state?.trim() || '',
                    pincode: (order.deliveryAddress?.zipCode && order.deliveryAddress.zipCode.trim()) 
                            ? order.deliveryAddress.zipCode.trim() 
                            : (order.deliveryAddress?.pincode && order.deliveryAddress.pincode.trim()) 
                              ? order.deliveryAddress.pincode.trim() 
                              : '00000',
                    coordinates: order.deliveryAddress?.coordinates || {}
                  },
                  
                  // Restaurant Information (from order) - with fallback values
                  restaurant: {
                    id: order.restaurant?.toString() && mongoose.Types.ObjectId.isValid(order.restaurant) 
                        ? order.restaurant 
                        : new mongoose.Types.ObjectId(),
                    name: 'Restaurant', // Use valid fallback instead of 'Unknown Restaurant'
                    address: 'Address Not Provided', // Use valid fallback instead of empty string
                    coordinates: {}
                  },
                  
                  // Delivery Personnel
                  deliveryPersonnel: {
                    id: effectiveDeliveryPersonId,
                    name: basicDeliveryPerson?.name || 'Unknown',
                    phone: basicDeliveryPerson?.phone || '',
                    vehicleType: basicDeliveryPerson?.vehicleType || 'Unknown',
                    vehicleNumber: basicDeliveryPerson?.vehicleNumber || ''
                  },
                  
                  // Zone Information
                  zone: {
                    id: zoneId,
                    name: zoneName,
                    deliveryCharge: zoneDeliveryCharge
                  },
                  
                  // Status and Timestamps
                  status: 'delivered',
                  assignedAt: order.assignedAt || order.createdAt || new Date(),
                  pickedUpAt: order.pickedUpAt || updatedOrder.pickedUpAt || new Date(),
                  actualDelivery: new Date(),
                  estimatedDelivery: order.estimatedDeliveryTime || new Date(),
                  
                  // Financial Information for Accounting
                  orderValue: updatedOrder.pricing?.subtotal || order.pricing?.subtotal || 0,
                  deliveryCharge: deliveryFee,
                  totalAmount: updatedOrder.pricing?.total || order.pricing?.total || 0,
                  paymentMethod: order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 
                                order.paymentMethod === 'online' ? 'Digital Wallet' : 
                                order.paymentMethod || 'Unknown',
                  
                  // Special Instructions
                  specialInstructions: order.specialInstructions || ''
                };
                
                // Create Delivery record with basic data
                const basicDeliveryRecord = await Delivery.create([basicDeliveryRecordData], { session });
                
                if (!basicDeliveryRecord || !basicDeliveryRecord[0]) {
                  throw new Error('Failed to create Delivery record with basic data');
                }
                
                // Link CashCollection if COD order
                if (isCashOnDelivery && cashAmount > 0) {
                  const cashCollectionDoc = await CashCollection.findOne({ order: req.params.id });
                  if (cashCollectionDoc) {
                    basicDeliveryRecord[0].cashCollected = {
                      amount: cashAmount,
                      collectedAt: new Date(),
                      collectedBy: effectiveDeliveryPersonId,
                      status: 'collected',
                      cashCollectionId: cashCollectionDoc._id
                    };
                    await basicDeliveryRecord[0].save({ session });
                  }
                }
              }
            } else {
              // Delivery record already exists, link CashCollection if COD order
              if (isCashOnDelivery && cashAmount > 0) {
                // Find cash collection outside session since it was committed in previous transaction
                const cashCollectionDoc = await CashCollection.findOne({ order: req.params.id });
                
                if (cashCollectionDoc && !existingDelivery.cashCollected?.cashCollectionId) {
                  existingDelivery.cashCollected = {
                    amount: cashAmount,
                    collectedAt: new Date(),
                    collectedBy: effectiveDeliveryPersonId,
                    status: 'collected',
                    cashCollectionId: cashCollectionDoc._id
                  };
                  await existingDelivery.save({ session });
                } else if (!cashCollectionDoc) {
                  // Cash collection not found - log warning
                  console.warn('CashCollection not found when updating existing Delivery record:', {
                    orderId: req.params.id,
                    cashAmount: cashAmount
                  });
                }
              }
            }
            
            // Commit transaction - Delivery record saved
            await session.commitTransaction();
            session.endSession();
            
            // Verify the record was actually saved to database
            const DeliveryForVerify = (await import('../../models/Delivery.js')).default;
            const verifyDelivery = await DeliveryForVerify.findOne({ orderId: req.params.id });
            if (verifyDelivery) {
              console.log('✅✅✅ Delivery record successfully created and verified in database:', verifyDelivery._id);
              console.log('✅ Delivery record details:', {
                orderId: verifyDelivery.orderId,
                orderNumber: verifyDelivery.orderNumber,
                customerName: verifyDelivery.customer?.name,
                restaurantName: verifyDelivery.restaurant?.name,
                status: verifyDelivery.status
              });
            } else {
              console.error('❌❌❌ CRITICAL: Delivery record not found after commit!', req.params.id);
            }
            
          } catch (transactionError) {
            // Log transaction error for debugging
            console.error('Delivery record transaction error:', {
              orderId: req.params.id,
              deliveryPersonId: effectiveDeliveryPersonId?.toString() || deliveryPersonId.toString(),
              error: transactionError.message,
              stack: transactionError.stack
            });
            
            // Rollback transaction on error
            try {
              await session.abortTransaction();
              session.endSession();
            } catch (abortError) {
              console.error('Error aborting delivery transaction:', abortError.message);
            }
            
            // CRITICAL: Try to create Delivery record outside transaction as fallback
            // This ensures Delivery record is created even if transaction fails
            try {
              const Delivery = (await import('../../models/Delivery.js')).default;
              const existingDeliveryCheck = await Delivery.findOne({ orderId: req.params.id });
              
              if (!existingDeliveryCheck) {
                console.warn('Attempting to create Delivery record outside transaction as fallback...');
                
                // Fetch delivery person for fallback if not already fetched
                let fallbackDeliveryPerson = deliveryPerson;
                if (!fallbackDeliveryPerson) {
                  try {
                    fallbackDeliveryPerson = await DeliveryPersonnel.findById(effectiveDeliveryPersonId).select('name phone vehicleType vehicleNumber zone');
                    if (fallbackDeliveryPerson?.zone && mongoose.Types.ObjectId.isValid(fallbackDeliveryPerson.zone)) {
                      const Zone = (await import('../../models/Zone.js')).default;
                      const zoneDoc = await Zone.findById(fallbackDeliveryPerson.zone);
                      if (zoneDoc) {
                        fallbackDeliveryPerson.zone = zoneDoc;
                      }
                    }
                  } catch (err) {
                    console.warn('Could not fetch delivery person for fallback:', err.message);
                  }
                }
                
                // Create minimal Delivery record with all required fields and valid fallback values
                const fallbackDelivery = await Delivery.create({
                  orderId: req.params.id,
                  orderNumber: updatedOrder.orderNumber || order.orderNumber || `ORDER-${req.params.id}`,
                  customer: {
                    id: order.customer?.toString() && mongoose.Types.ObjectId.isValid(order.customer) 
                        ? order.customer 
                        : new mongoose.Types.ObjectId(),
                    name: 'Customer',
                    phone: 'N/A',
                    email: ''
                  },
                  deliveryAddress: {
                    street: (order.deliveryAddress?.street && order.deliveryAddress.street.trim()) 
                           ? order.deliveryAddress.street.trim() 
                           : 'Address Not Provided',
                    city: (order.deliveryAddress?.city && order.deliveryAddress.city.trim()) 
                         ? order.deliveryAddress.city.trim() 
                         : 'City Not Provided',
                    state: order.deliveryAddress?.state?.trim() || '',
                    pincode: (order.deliveryAddress?.zipCode && order.deliveryAddress.zipCode.trim()) 
                            ? order.deliveryAddress.zipCode.trim() 
                            : (order.deliveryAddress?.pincode && order.deliveryAddress.pincode.trim()) 
                              ? order.deliveryAddress.pincode.trim() 
                              : '00000',
                    coordinates: order.deliveryAddress?.coordinates || {}
                  },
                  restaurant: {
                    id: order.restaurant?.toString() && mongoose.Types.ObjectId.isValid(order.restaurant) 
                        ? order.restaurant 
                        : new mongoose.Types.ObjectId(),
                    name: 'Restaurant',
                    address: 'Address Not Provided',
                    coordinates: {}
                  },
                  deliveryPersonnel: {
                    id: effectiveDeliveryPersonId,
                    name: fallbackDeliveryPerson?.name || 'Unknown',
                    phone: fallbackDeliveryPerson?.phone || '',
                    vehicleType: fallbackDeliveryPerson?.vehicleType || 'Unknown',
                    vehicleNumber: fallbackDeliveryPerson?.vehicleNumber || ''
                  },
                  zone: {
                    id: (fallbackDeliveryPerson?.zone?._id && mongoose.Types.ObjectId.isValid(fallbackDeliveryPerson.zone._id)) 
                        ? fallbackDeliveryPerson.zone._id 
                        : (fallbackDeliveryPerson?.zone && mongoose.Types.ObjectId.isValid(fallbackDeliveryPerson.zone)) 
                          ? fallbackDeliveryPerson.zone 
                          : new mongoose.Types.ObjectId(),
                    name: fallbackDeliveryPerson?.zone?.name || 'Unknown Zone',
                    deliveryCharge: fallbackDeliveryPerson?.zone?.deliveryCharge || deliveryFee || 0
                  },
                  status: 'delivered',
                  assignedAt: order.assignedAt || order.createdAt || new Date(),
                  pickedUpAt: order.pickedUpAt || updatedOrder.pickedUpAt || new Date(),
                  actualDelivery: new Date(),
                  estimatedDelivery: order.estimatedDeliveryTime || new Date(),
                  orderValue: updatedOrder.pricing?.subtotal || order.pricing?.subtotal || 0,
                  deliveryCharge: deliveryFee || 0,
                  totalAmount: updatedOrder.pricing?.total || order.pricing?.total || 0,
                  paymentMethod: order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 
                                order.paymentMethod === 'online' ? 'Digital Wallet' : 
                                order.paymentMethod || 'Unknown',
                  specialInstructions: order.specialInstructions || ''
                });
                
                console.log('✅ Successfully created Delivery record via fallback method:', fallbackDelivery._id);
                
                // Link CashCollection if COD order
                if (isCashOnDelivery && cashAmount > 0) {
                  const cashCollectionDoc = await CashCollection.findOne({ order: req.params.id });
                  if (cashCollectionDoc) {
                    fallbackDelivery.cashCollected = {
                      amount: cashAmount,
                      collectedAt: new Date(),
                      collectedBy: effectiveDeliveryPersonId,
                      status: 'collected',
                      cashCollectionId: cashCollectionDoc._id
                    };
                    await fallbackDelivery.save();
                  }
                }
              }
            } catch (fallbackError) {
              // Log but don't fail - this is a last resort attempt
              console.error('CRITICAL: Failed to create Delivery record even via fallback method:', {
                orderId: req.params.id,
                error: fallbackError.message,
                stack: fallbackError.stack
              });
            }
            
            // Don't throw here to allow order update to complete even if Delivery record fails
          }
        }
      } catch (earningsError) {
        // Log earnings update error but don't fail the order update
        console.error('Error updating delivery person earnings:', {
          orderId: req.params.id,
          deliveryPersonId: deliveryPersonId.toString(),
          error: earningsError.message,
          stack: earningsError.stack
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Order ${status === 'picked_up' ? 'picked up' : 'delivered'} successfully`,
      data: updatedOrder
    });
  } catch (error) {
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

    // Populate order for notification
    const populatedOrder = await Order.findById(order._id)
      .populate('restaurant', 'restaurantName address phone')
      .populate('customer', 'name phone address');

    // Notify the delivery person that order is assigned to them
    try {
      await notifyDeliveryPartners(populatedOrder, 'order_assigned');
    } catch (notificationError) {
      // Don't fail the request if notification fails
    }

    res.status(200).json({
      success: true,
      message: 'Order accepted successfully',
      data: order
    });
  } catch (error) {
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
    return res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
};

/**
 * @desc    Get cash collection balance from Delivery records
 * @route   GET /api/v1/mobile/delivery/cash-balance
 * @access  Private (Delivery Boy only)
 */
export const getCashBalanceFromDeliveries = async (req, res) => {
  try {
    // Validate user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const deliveryPersonId = req.user._id || req.user.id;
    const { startDate, endDate, status } = req.query;

    // Import Delivery model
    const Delivery = (await import('../../models/Delivery.js')).default;

    // Build query - only COD deliveries with cash collected
    const query = {
      'deliveryPersonnel.id': new mongoose.Types.ObjectId(deliveryPersonId),
      paymentMethod: 'Cash on Delivery',
      status: 'delivered',
      cashCollected: { $exists: true }
    };

    // Add date filter if provided
    if (startDate || endDate) {
      query.actualDelivery = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.actualDelivery.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.actualDelivery.$lte = end;
      }
    }

    // Add status filter for cash collection if provided
    if (status && ['collected', 'pending'].includes(status)) {
      query['cashCollected.status'] = status;
    }

    // Get all cash collection deliveries
    const deliveries = await Delivery.find(query)
      .select('orderNumber orderId cashCollected totalAmount actualDelivery customer restaurant')
      .sort({ actualDelivery: -1 })
      .lean();

    // Calculate totals and statistics
    const totalCashCollected = deliveries.reduce((sum, d) => {
      return sum + (d.cashCollected?.amount || d.totalAmount || 0);
    }, 0);

    const totalDeliveries = deliveries.length;

    // Group by date
    const cashByDate = deliveries.reduce((acc, delivery) => {
      const dateKey = new Date(delivery.actualDelivery).toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          amount: 0,
          count: 0,
          deliveries: []
        };
      }
      const amount = delivery.cashCollected?.amount || delivery.totalAmount || 0;
      acc[dateKey].amount += amount;
      acc[dateKey].count += 1;
      acc[dateKey].deliveries.push({
        orderNumber: delivery.orderNumber,
        amount: amount,
        collectedAt: delivery.cashCollected?.collectedAt || delivery.actualDelivery,
        status: delivery.cashCollected?.status || 'collected'
      });
      return acc;
    }, {});

    // Calculate pending vs collected
    const collectedCount = deliveries.filter(d => d.cashCollected?.status === 'collected').length;
    const pendingCount = deliveries.filter(d => d.cashCollected?.status === 'pending').length;

    const collectedAmount = deliveries
      .filter(d => d.cashCollected?.status === 'collected')
      .reduce((sum, d) => sum + (d.cashCollected?.amount || d.totalAmount || 0), 0);

    const pendingAmount = deliveries
      .filter(d => d.cashCollected?.status === 'pending')
      .reduce((sum, d) => sum + (d.cashCollected?.amount || d.totalAmount || 0), 0);

    // Get summary by week (last 4 weeks)
    const weeklySummary = [];
    const now = new Date();
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (7 * (i + 1)));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekDeliveries = deliveries.filter(d => {
        const deliveryDate = new Date(d.actualDelivery);
        return deliveryDate >= weekStart && deliveryDate <= weekEnd;
      });

      const weekAmount = weekDeliveries.reduce((sum, d) => {
        return sum + (d.cashCollected?.amount || d.totalAmount || 0);
      }, 0);

      weeklySummary.push({
        week: i + 1,
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        amount: weekAmount,
        count: weekDeliveries.length
      });
    }

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCashCollected,
          totalDeliveries,
          collectedCount,
          pendingCount,
          collectedAmount,
          pendingAmount
        },
        cashByDate: Object.values(cashByDate),
        weeklySummary: weeklySummary.reverse(), // Most recent week first
        recentDeliveries: deliveries.slice(0, 20).map(d => ({
          orderNumber: d.orderNumber,
          orderId: d.orderId,
          customerName: d.customer?.name || 'Unknown',
          restaurantName: d.restaurant?.name || 'Unknown',
          amount: d.cashCollected?.amount || d.totalAmount || 0,
          collectedAt: d.cashCollected?.collectedAt || d.actualDelivery,
          status: d.cashCollected?.status || 'collected',
          deliveryDate: d.actualDelivery
        })),
        dateRange: {
          startDate: startDate || null,
          endDate: endDate || null
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cash balance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
