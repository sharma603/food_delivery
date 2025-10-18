import jwt from 'jsonwebtoken';
import Customer from '../models/Customer.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id, type: 'customer' }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Customer registration
// @route   POST /api/customer/auth/register
// @access  Public
export const customerRegister = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validation
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and phone number'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({
      $or: [{ email: email.toLowerCase() }, { phone: phone }]
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this email or phone number already exists'
      });
    }

    // Create customer
    const customer = await Customer.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone.trim()
    });

    // Generate token
    const token = generateToken(customer._id);

    res.status(201).json({
      success: true,
      message: 'Customer registration successful',
      data: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        customerLevel: customer.customerLevel,
        loyaltyPoints: customer.loyaltyPoints,
        token
      }
    });

  } catch (error) {
    console.error('Customer registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Customer login
// @route   POST /api/customer/auth/login
// @access  Public
export const customerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find customer by email and include password field
    const customer = await Customer.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (customer.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.'
      });
    }

    // Check if customer is active
    if (!customer.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.'
      });
    }

    // Check password
    const isPasswordMatch = await customer.comparePassword(password);

    if (!isPasswordMatch) {
      await customer.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update login info
    await customer.updateLoginInfo();

    // Create response data
    const responseData = {
      _id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      avatar: customer.avatar,
      customerLevel: customer.customerLevel,
      loyaltyPoints: customer.loyaltyPoints,
      totalOrders: customer.totalOrders,
      totalSpent: customer.totalSpent,
      averageOrderValue: customer.averageOrderValue,
      addresses: customer.addresses,
      preferences: customer.preferences,
      isVerified: customer.isVerified,
      token: generateToken(customer._id)
    };

    res.json({
      success: true,
      message: 'Customer login successful',
      data: responseData
    });

  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get current customer profile
// @route   GET /api/customer/auth/me
// @access  Private (Customer)
export const getCustomerProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        avatar: customer.avatar,
        dateOfBirth: customer.dateOfBirth,
        gender: customer.gender,
        customerLevel: customer.customerLevel,
        loyaltyPoints: customer.loyaltyPoints,
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent,
        averageOrderValue: customer.averageOrderValue,
        addresses: customer.addresses,
        preferences: customer.preferences,
        notifications: customer.notifications,
        isVerified: customer.isVerified,
        createdAt: customer.createdAt
      }
    });

  } catch (error) {
    console.error('Get customer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
};

// @desc    Update customer profile
// @route   PUT /api/customer/auth/profile
// @access  Private (Customer)
export const updateCustomerProfile = async (req, res) => {
  try {
    const { name, phone, avatar, dateOfBirth, gender, preferences, notifications } = req.body;
    const customer = await Customer.findById(req.user._id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Update allowed fields
    if (name) customer.name = name.trim();
    if (phone) customer.phone = phone;
    if (avatar) customer.avatar = avatar;
    if (dateOfBirth) customer.dateOfBirth = dateOfBirth;
    if (gender) customer.gender = gender;
    if (preferences) customer.preferences = { ...customer.preferences, ...preferences };
    if (notifications) customer.notifications = { ...customer.notifications, ...notifications };

    await customer.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        avatar: customer.avatar,
        dateOfBirth: customer.dateOfBirth,
        gender: customer.gender,
        preferences: customer.preferences,
        notifications: customer.notifications
      }
    });

  } catch (error) {
    console.error('Update customer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
};

// @desc    Add customer address
// @route   POST /api/customer/auth/address
// @access  Private (Customer)
export const addCustomerAddress = async (req, res) => {
  try {
    const { type, name, street, city, state, zipCode, coordinates, isDefault } = req.body;

    if (!type || !name || !street || !city || !state || !zipCode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required address fields'
      });
    }

    const customer = await Customer.findById(req.user._id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const addressData = {
      type,
      name,
      street,
      city,
      state,
      zipCode,
      coordinates,
      isDefault: customer.addresses.length === 0 ? true : (isDefault || false)
    };

    await customer.addAddress(addressData);

    res.json({
      success: true,
      message: 'Address added successfully',
      data: customer.addresses
    });

  } catch (error) {
    console.error('Add customer address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding address'
    });
  }
};

// @desc    Change customer password
// @route   PUT /api/customer/auth/change-password
// @access  Private (Customer)
export const changeCustomerPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const customer = await Customer.findById(req.user._id).select('+password');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check current password
    const isCurrentPasswordValid = await customer.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Set new password
    customer.password = newPassword;
    await customer.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change customer password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error changing password'
    });
  }
};

// @desc    Get all customer addresses
// @route   GET /api/customer/auth/addresses
// @access  Private (Customer)
export const getAllCustomerAddresses = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).select('addresses');
    
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: customer.addresses || []
    });
  } catch (error) {
    console.error('Error fetching customer addresses:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch addresses' 
    });
  }
};

// @desc    Get single customer address
// @route   GET /api/customer/auth/addresses/:addressId
// @access  Private (Customer)
export const getCustomerAddress = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id);
    
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    const address = customer.addresses.id(req.params.addressId);
    
    if (!address) {
      return res.status(404).json({ 
        success: false, 
        message: 'Address not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Error fetching customer address:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch address' 
    });
  }
};

// @desc    Add new customer address
// @route   POST /api/customer/auth/addresses
// @access  Private (Customer)
export const addNewCustomerAddress = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id);
    
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    const { type, label, street, apartment, city, state, zipCode, country, instructions, isDefault } = req.body;

    // Validate required fields
    if (!street || !city || !state || !zipCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required address fields (street, city, state, zipCode)' 
      });
    }

    const newAddress = {
      type: type || 'other',
      label,
      street,
      apartment,
      city,
      state,
      zipCode,
      country: country || 'Nepal',
      instructions,
      isDefault: customer.addresses.length === 0 ? true : (isDefault || false)
    };

    // If this address is set as default, unset other defaults
    if (newAddress.isDefault) {
      customer.addresses.forEach(addr => addr.isDefault = false);
    }

    customer.addresses.push(newAddress);
    await customer.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: customer.addresses[customer.addresses.length - 1]
    });
  } catch (error) {
    console.error('Error adding customer address:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add address' 
    });
  }
};

// @desc    Update customer address
// @route   PUT /api/customer/auth/addresses/:addressId
// @access  Private (Customer)
export const updateCustomerAddress = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id);
    
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    const address = customer.addresses.id(req.params.addressId);
    
    if (!address) {
      return res.status(404).json({ 
        success: false, 
        message: 'Address not found' 
      });
    }

    const { type, label, street, apartment, city, state, zipCode, country, instructions, isDefault } = req.body;

    // Update fields
    if (type) address.type = type;
    if (label !== undefined) address.label = label;
    if (street) address.street = street;
    if (apartment !== undefined) address.apartment = apartment;
    if (city) address.city = city;
    if (state) address.state = state;
    if (zipCode) address.zipCode = zipCode;
    if (country) address.country = country;
    if (instructions !== undefined) address.instructions = instructions;
    
    // Handle default address change
    if (isDefault !== undefined && isDefault) {
      customer.addresses.forEach(addr => {
        if (addr._id.toString() !== req.params.addressId) {
          addr.isDefault = false;
        }
      });
      address.isDefault = true;
    }

    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: address
    });
  } catch (error) {
    console.error('Error updating customer address:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update address' 
    });
  }
};

// @desc    Delete customer address
// @route   DELETE /api/customer/auth/addresses/:addressId
// @access  Private (Customer)
export const deleteCustomerAddress = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id);
    
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    const address = customer.addresses.id(req.params.addressId);
    
    if (!address) {
      return res.status(404).json({ 
        success: false, 
        message: 'Address not found' 
      });
    }

    const wasDefault = address.isDefault;
    address.remove();
    
    // If the deleted address was default, set the first remaining address as default
    if (wasDefault && customer.addresses.length > 0) {
      customer.addresses[0].isDefault = true;
    }
    
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer address:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete address' 
    });
  }
};