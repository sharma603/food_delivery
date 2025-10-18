import Customer from '../../models/Customer.js';
import asyncHandler from 'express-async-handler';

// @desc    Get all customers (SuperAdmin)
// @route   GET /api/v1/superadmin/customers
// @access  Private (SuperAdmin)
export const getAllCustomers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter object
  const filter = {};
  
  if (req.query.status) {
    filter.isActive = req.query.status === 'active';
  }
  
  if (req.query.segment) {
    // You can add segment logic here based on your business rules
    // For now, we'll use totalSpent as a proxy for segments
    switch (req.query.segment) {
      case 'premium':
        filter.totalSpent = { $gte: 1000 };
        break;
      case 'regular':
        filter.totalSpent = { $gte: 100, $lt: 1000 };
        break;
      case 'new':
        filter.totalSpent = { $lt: 100 };
        break;
    }
  }

  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  // Get customers with pagination
  const customers = await Customer.find(filter)
    .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Get total count for pagination
  const total = await Customer.countDocuments(filter);

  // Transform data to match frontend expectations
  const transformedCustomers = customers.map(customer => ({
    _id: customer._id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.addresses && customer.addresses.length > 0 
      ? `${customer.addresses[0].street}, ${customer.addresses[0].city}, ${customer.addresses[0].state} ${customer.addresses[0].zipCode}`
      : 'No address provided',
    registrationDate: customer.createdAt,
    status: customer.isActive ? 'active' : 'inactive',
    segment: customer.totalSpent >= 1000 ? 'premium' : 
             customer.totalSpent >= 100 ? 'regular' : 'new',
    totalOrders: customer.totalOrders || 0,
    totalSpent: customer.totalSpent || 0,
    averageOrderValue: customer.averageOrderValue || 0,
    lastOrderDate: customer.lastActiveAt || customer.createdAt,
    rating: 4.5, // You can calculate this from reviews if you have a review system
    avatar: customer.avatar,
    isVerified: customer.isVerified,
    loyaltyPoints: customer.loyaltyPoints || 0,
    lastLogin: customer.lastLogin
  }));

  res.status(200).json({
    success: true,
    data: transformedCustomers,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total
    }
  });
});

// @desc    Get customer by ID (SuperAdmin)
// @route   GET /api/v1/superadmin/customers/:id
// @access  Private (SuperAdmin)
export const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id)
    .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires');

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }

  // Transform data
  const transformedCustomer = {
    _id: customer._id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.addresses && customer.addresses.length > 0 
      ? `${customer.addresses[0].street}, ${customer.addresses[0].city}, ${customer.addresses[0].state} ${customer.addresses[0].zipCode}`
      : 'No address provided',
    registrationDate: customer.createdAt,
    status: customer.isActive ? 'active' : 'inactive',
    segment: customer.totalSpent >= 1000 ? 'premium' : 
             customer.totalSpent >= 100 ? 'regular' : 'new',
    totalOrders: customer.totalOrders || 0,
    totalSpent: customer.totalSpent || 0,
    averageOrderValue: customer.averageOrderValue || 0,
    lastOrderDate: customer.lastActiveAt || customer.createdAt,
    rating: 4.5,
    avatar: customer.avatar,
    isVerified: customer.isVerified,
    loyaltyPoints: customer.loyaltyPoints || 0,
    lastLogin: customer.lastLogin,
    addresses: customer.addresses,
    preferences: customer.preferences,
    notifications: customer.notifications,
    dateOfBirth: customer.dateOfBirth,
    gender: customer.gender
  };

  res.status(200).json({
    success: true,
    data: transformedCustomer
  });
});

// @desc    Update customer status (SuperAdmin)
// @route   PUT /api/v1/superadmin/customers/:id/status
// @access  Private (SuperAdmin)
export const updateCustomerStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid status (active, inactive, suspended)'
    });
  }

  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }

  // Update status
  customer.isActive = status === 'active';
  await customer.save();

  res.status(200).json({
    success: true,
    message: 'Customer status updated successfully',
    data: {
      _id: customer._id,
      status: customer.isActive ? 'active' : 'inactive'
    }
  });
});

// @desc    Delete customer (SuperAdmin)
// @route   DELETE /api/v1/superadmin/customers/:id
// @access  Private (SuperAdmin)
export const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }

  await Customer.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Customer deleted successfully'
  });
});

// @desc    Get customer analytics (SuperAdmin)
// @route   GET /api/v1/superadmin/customers/analytics
// @access  Private (SuperAdmin)
export const getCustomerAnalytics = asyncHandler(async (req, res) => {
  const totalCustomers = await Customer.countDocuments();
  const activeCustomers = await Customer.countDocuments({ isActive: true });
  const newCustomers = await Customer.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  });

  const totalRevenue = await Customer.aggregate([
    { $group: { _id: null, total: { $sum: '$totalSpent' } } }
  ]);

  const averageOrderValue = await Customer.aggregate([
    { $group: { _id: null, avg: { $avg: '$averageOrderValue' } } }
  ]);

  // Calculate total orders from all customers
  const totalOrdersResult = await Customer.aggregate([
    { $group: { _id: null, total: { $sum: '$totalOrders' } } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalCustomers,
      activeCustomers,
      newCustomers,
      totalOrders: totalOrdersResult[0]?.total || 0,
      totalRevenue: totalRevenue[0]?.total || 0,
      averageOrderValue: averageOrderValue[0]?.avg || 0,
      customerGrowth: 12.5 // You can calculate this based on your needs
    }
  });
});
