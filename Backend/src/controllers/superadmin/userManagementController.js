import Customer from '../../models/Customer.js';
import Restaurant from '../../models/Restaurant.js';
import { asyncHandler } from '../../utils/helpers.js';

// @desc    Get all users
// @route   GET /api/v1/superadmin/users
// @access  Private/SuperAdmin
export const getAllUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    type = 'all', // 'customers', 'restaurants', 'all'
    status,
    search
  } = req.query;

  let query = {};
  let model;

  if (type === 'customers') {
    model = Customer;
    if (status) query.isActive = status === 'active';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
  } else if (type === 'restaurants') {
    model = Restaurant;
    if (status) query.isActive = status === 'active';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
  } else {
    // Get both customers and restaurants
    const [customers, restaurants] = await Promise.all([
      Customer.find(query)
        .select('-password')
        .limit(limit * 1)
        .skip((page - 1) * limit),
      Restaurant.find(query)
        .select('-password')
        .limit(limit * 1)
        .skip((page - 1) * limit)
    ]);

    const totalCustomers = await Customer.countDocuments(query);
    const totalRestaurants = await Restaurant.countDocuments(query);

    return res.json({
      success: true,
      data: {
        users: [
          ...customers.map(user => ({ ...user.toObject(), type: 'customer' })),
          ...restaurants.map(user => ({ ...user.toObject(), type: 'restaurant' }))
        ],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCustomers + totalRestaurants,
          pages: Math.ceil((totalCustomers + totalRestaurants) / limit)
        }
      }
    });
  }

  const users = await model.find(query)
    .select('-password')
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await model.countDocuments(query);

  res.json({
    success: true,
    data: {
      users: users.map(user => ({ ...user.toObject(), type })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get user by ID
// @route   GET /api/v1/superadmin/users/:id
// @access  Private/SuperAdmin
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type } = req.query;

  let user;
  if (type === 'customer') {
    user = await Customer.findById(id).select('-password');
  } else if (type === 'restaurant') {
    user = await Restaurant.findById(id).select('-password');
  } else {
    // Try both models
    user = await Customer.findById(id).select('-password') ||
           await Restaurant.findById(id).select('-password');
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: user
  });
});

// @desc    Create user
// @route   POST /api/v1/superadmin/users
// @access  Private/SuperAdmin
export const createUser = asyncHandler(async (req, res) => {
  const { type, ...userData } = req.body;

  let user;
  if (type === 'customer') {
    user = await Customer.create(userData);
  } else if (type === 'restaurant') {
    user = await Restaurant.create(userData);
  } else {
    return res.status(400).json({
      success: false,
      message: 'User type is required'
    });
  }

  res.status(201).json({
    success: true,
    data: user,
    message: 'User created successfully'
  });
});

// @desc    Update user
// @route   PUT /api/v1/superadmin/users/:id
// @access  Private/SuperAdmin
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type, ...updateData } = req.body;

  let user;
  if (type === 'customer') {
    user = await Customer.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
  } else if (type === 'restaurant') {
    user = await Restaurant.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
  } else {
    return res.status(400).json({
      success: false,
      message: 'User type is required'
    });
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: user,
    message: 'User updated successfully'
  });
});

// @desc    Delete user
// @route   DELETE /api/v1/superadmin/users/:id
// @access  Private/SuperAdmin
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type } = req.query;

  let user;
  if (type === 'customer') {
    user = await Customer.findByIdAndDelete(id);
  } else if (type === 'restaurant') {
    user = await Restaurant.findByIdAndDelete(id);
  } else {
    return res.status(400).json({
      success: false,
      message: 'User type is required'
    });
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

// @desc    Suspend user
// @route   PUT /api/v1/superadmin/users/:id/suspend
// @access  Private/SuperAdmin
export const suspendUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type } = req.body;

  let user;
  if (type === 'customer') {
    user = await Customer.findByIdAndUpdate(id, { isActive: false }, { new: true }).select('-password');
  } else if (type === 'restaurant') {
    user = await Restaurant.findByIdAndUpdate(id, { isActive: false }, { new: true }).select('-password');
  } else {
    return res.status(400).json({
      success: false,
      message: 'User type is required'
    });
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: user,
    message: 'User suspended successfully'
  });
});

// @desc    Activate user
// @route   PUT /api/v1/superadmin/users/:id/activate
// @access  Private/SuperAdmin
export const activateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type } = req.body;

  let user;
  if (type === 'customer') {
    user = await Customer.findByIdAndUpdate(id, { isActive: true }, { new: true }).select('-password');
  } else if (type === 'restaurant') {
    user = await Restaurant.findByIdAndUpdate(id, { isActive: true }, { new: true }).select('-password');
  } else {
    return res.status(400).json({
      success: false,
      message: 'User type is required'
    });
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: user,
    message: 'User activated successfully'
  });
});

// @desc    Get user statistics
// @route   GET /api/v1/superadmin/users/stats
// @access  Private/SuperAdmin
export const getUserStats = asyncHandler(async (req, res) => {
  const [
    totalCustomers,
    activeCustomers,
    totalRestaurants,
    activeRestaurants
  ] = await Promise.all([
    Customer.countDocuments(),
    Customer.countDocuments({ isActive: true }),
    Restaurant.countDocuments(),
    Restaurant.countDocuments({ isActive: true })
  ]);

  res.json({
    success: true,
    data: {
      customers: {
        total: totalCustomers,
        active: activeCustomers,
        inactive: totalCustomers - activeCustomers
      },
      restaurants: {
        total: totalRestaurants,
        active: activeRestaurants,
        inactive: totalRestaurants - activeRestaurants
      }
    }
  });
});

// @desc    Export users
// @route   POST /api/v1/superadmin/users/export
// @access  Private/SuperAdmin
export const exportUsers = asyncHandler(async (req, res) => {
  const { type, filters = {} } = req.body;

  let users;
  if (type === 'customers') {
    users = await Customer.find(filters).select('-password');
  } else if (type === 'restaurants') {
    users = await Restaurant.find(filters).select('-password');
  } else {
    const [customers, restaurants] = await Promise.all([
      Customer.find(filters).select('-password'),
      Restaurant.find(filters).select('-password')
    ]);
    users = [
      ...customers.map(user => ({ ...user.toObject(), type: 'customer' })),
      ...restaurants.map(user => ({ ...user.toObject(), type: 'restaurant' }))
    ];
  }

  // In a real implementation, you would generate Excel/CSV file here
  res.json({
    success: true,
    data: users,
    message: 'Users exported successfully'
  });
});
