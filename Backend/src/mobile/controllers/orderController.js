import Order from '../../models/Order.js';
import Customer from '../../models/Customer.js';
import RestaurantUser from '../../models/RestaurantUser.js';
import MenuItem from '../../models/Menu/MenuItem.js';

// @desc    Get customer orders for mobile app
// @route   GET /api/v1/mobile/orders
// @access  Private
export const getMobileCustomerOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc' 
    } = req.query;

    // Build query
    const query = {
      customer: req.user.id
    };

    if (status) {
      query.status = status;
    }

    // Execute query with population
    const orders = await Order.find(query)
      .populate('customer', 'name email phone')
      .populate('restaurant', 'restaurantName email phone address rating deliveryTime deliveryFee')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    // Transform data for mobile app
    const transformedOrders = orders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      pricing: order.pricing || {
        subtotal: order.totalAmount || 0,
        deliveryFee: order.deliveryFee || 0,
        tax: order.tax || 0,
        discount: order.discount || 0,
        total: order.finalAmount || 0
      },
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      deliveryAddress: order.deliveryAddress,
      specialInstructions: order.specialInstructions,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      actualDeliveryTime: order.actualDeliveryTime,
      customer: order.customer ? {
        _id: order.customer._id,
        name: order.customer.name,
        email: order.customer.email,
        phone: order.customer.phone
      } : null,
      restaurant: order.restaurant ? {
        _id: order.restaurant._id,
        name: order.restaurant.restaurantName || order.restaurant.name,
        email: order.restaurant.email,
        phone: order.restaurant.phone,
        address: order.restaurant.address,
        rating: order.restaurant.rating,
        deliveryTime: order.restaurant.deliveryTime,
        deliveryFee: order.restaurant.deliveryFee
      } : null,
      items: order.items.map(item => ({
        _id: item._id,
        menuItem: item.menuItem,
        quantity: item.quantity,
        customizations: item.customizations || [],
        subtotal: item.subtotal
      })),
      multiRestaurantData: order.multiRestaurantData,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    res.status(200).json({
      success: true,
      data: transformedOrders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total: total
      }
    });

  } catch (error) {
    console.error('Error fetching mobile customer orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single order for mobile app
// @route   GET /api/v1/mobile/orders/:id
// @access  Private
export const getMobileOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      customer: req.user.id
    })
    .populate('customer', 'name email phone')
    .populate('restaurant', 'restaurantName email phone address rating deliveryTime deliveryFee');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Transform data for mobile app
    const transformedOrder = {
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      pricing: order.pricing || {
        subtotal: order.totalAmount || 0,
        deliveryFee: order.deliveryFee || 0,
        tax: order.tax || 0,
        discount: order.discount || 0,
        total: order.finalAmount || 0
      },
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      deliveryAddress: order.deliveryAddress,
      specialInstructions: order.specialInstructions,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      actualDeliveryTime: order.actualDeliveryTime,
      customer: order.customer ? {
        _id: order.customer._id,
        name: order.customer.name,
        email: order.customer.email,
        phone: order.customer.phone
      } : null,
      restaurant: order.restaurant ? {
        _id: order.restaurant._id,
        name: order.restaurant.restaurantName || order.restaurant.name,
        email: order.restaurant.email,
        phone: order.restaurant.phone,
        address: order.restaurant.address,
        rating: order.restaurant.rating,
        deliveryTime: order.restaurant.deliveryTime,
        deliveryFee: order.restaurant.deliveryFee
      } : null,
      items: order.items.map(item => ({
        _id: item._id,
        menuItem: item.menuItem,
        quantity: item.quantity,
        customizations: item.customizations || [],
        subtotal: item.subtotal
      })),
      multiRestaurantData: order.multiRestaurantData,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };

    res.status(200).json({
      success: true,
      data: transformedOrder
    });

  } catch (error) {
    console.error('Error fetching mobile order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create new order for mobile app
// @route   POST /api/v1/mobile/orders
// @access  Private
export const createMobileOrder = async (req, res) => {
  try {
    const {
      restaurantId,
      items,
      deliveryAddress,
      specialInstructions,
      paymentMethod = 'cash_on_delivery',
      deliveryFee: providedDeliveryFee
    } = req.body;

    // Validation
    if (!restaurantId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide restaurant ID and order items'
      });
    }

    if (!deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address is required'
      });
    }

    // Check if restaurant exists
    const restaurant = await RestaurantUser.findById(restaurantId);
    if (!restaurant || !restaurant.isActive || !restaurant.isVerified) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found or not available'
      });
    }

    // Validate and calculate order items
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.itemId);
      if (!menuItem || !menuItem.isActive || !menuItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Menu item ${item.itemId} not found or not available`
        });
      }

      const itemTotal = menuItem.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        menuItem: {
          name: menuItem.name,
          price: menuItem.price,
          image: menuItem.images?.[0] || '', // Keep for backward compatibility
          images: menuItem.images || [], // Store all images
          description: menuItem.description || '', // Store description
          category: menuItem.category?.name || 'Uncategorized' // Store category name
        },
        quantity: item.quantity,
        customizations: [],
        subtotal: itemTotal
      });
    }

    // Use provided delivery fee or fallback to restaurant default
    const deliveryFee = providedDeliveryFee || restaurant.deliveryFee || 0;
    const tax = Math.round((totalAmount + deliveryFee) * 0.13); // 13% tax
    const finalAmount = totalAmount + deliveryFee + tax;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Format delivery address - convert string to object if needed
    let formattedDeliveryAddress;
    if (typeof deliveryAddress === 'string') {
      formattedDeliveryAddress = {
        street: deliveryAddress,
        city: '',
        state: '',
        zipCode: '',
        coordinates: {
          latitude: 0,
          longitude: 0
        }
      };
    } else {
      formattedDeliveryAddress = deliveryAddress;
    }

    // Debug log order data before creation
    console.log('Creating order with data:', {
      orderNumber,
      customer: req.user.id,
      restaurant: restaurantId,
      itemsCount: orderItems.length,
      pricing: {
        subtotal: totalAmount,
        deliveryFee: deliveryFee,
        tax: tax,
        discount: 0,
        total: finalAmount
      },
      paymentMethod,
      deliveryAddress: formattedDeliveryAddress
    });

    // Create order
    const order = await Order.create({
      orderNumber,
      customer: req.user.id,
      restaurant: restaurantId,
      items: orderItems,
      pricing: {
        subtotal: totalAmount,
        deliveryFee: deliveryFee,
        tax: tax,
        discount: 0,
        total: finalAmount
      },
      paymentMethod,
      paymentStatus: paymentMethod === 'cash_on_delivery' ? 'pending' : 'pending',
      deliveryAddress: formattedDeliveryAddress,
      specialInstructions: specialInstructions || '',
      status: 'placed',
      estimatedDeliveryTime: new Date(Date.now() + (restaurant.deliveryTime?.max || 45) * 60000)
    });

    // Populate the created order
    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email phone')
      .populate('restaurant', 'restaurantName email phone address rating deliveryTime deliveryFee');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: populatedOrder
    });

  } catch (error) {
    console.error('Error creating mobile order:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Cancel order for mobile app
// @route   PUT /api/v1/mobile/orders/:id/cancel
// @access  Private
export const cancelMobileOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      customer: req.user.id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled'
      });
    }

    if (['delivered', 'completed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed or delivered order'
      });
    }

    // Update order status
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        cancelledAt: order.cancelledAt
      }
    });

  } catch (error) {
    console.error('Error cancelling mobile order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default {
  getMobileCustomerOrders,
  getMobileOrder,
  createMobileOrder,
  cancelMobileOrder
};
