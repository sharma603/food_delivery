import Customer from '../../models/Customer.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Generate JWT Token for mobile customers
const generateToken = (id) => {
  return jwt.sign({ id, type: 'customer' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// @desc    Register customer for mobile app
// @route   POST /api/v1/mobile/auth/register
// @access  Public
export const mobileRegister = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      dateOfBirth,
      gender,
      address
    } = req.body;

    // Validation
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, phone, password'
      });
    }

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer already exists with this email or phone number'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create customer
    const customer = await Customer.create({
      name,
      email,
      phone,
      password: hashedPassword,
      dateOfBirth,
      gender,
      address,
      isActive: true,
      isVerified: false
    });

    // Generate token
    const token = generateToken(customer._id);

    // Remove password from response
    const customerData = {
      _id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      dateOfBirth: customer.dateOfBirth,
      gender: customer.gender,
      address: customer.address,
      customerLevel: customer.customerLevel,
      loyaltyPoints: customer.loyaltyPoints,
      totalOrders: customer.totalOrders,
      isActive: customer.isActive,
      isVerified: customer.isVerified,
      createdAt: customer.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      data: {
        customer: customerData,
        token
      }
    });

  } catch (error) {
    console.error('Mobile register error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register customer',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Login customer for mobile app
// @route   POST /api/v1/mobile/auth/login
// @access  Public
export const mobileLogin = async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    
    console.log('🔐 Mobile Login Attempt:', {
      email: email || 'not provided',
      phone: phone || 'not provided',
      hasPassword: !!password,
      passwordLength: password?.length
    });

    // Validation
    if (!password || (!email && !phone)) {
      console.log('❌ Validation failed: Missing email/phone or password');
      return res.status(400).json({
        success: false,
        message: 'Please provide email/phone and password'
      });
    }

    // Find customer by email or phone
    console.log('🔍 Searching for customer with:', {
      email: email || 'not provided',
      phone: phone || 'not provided'
    });
    
    const customer = await Customer.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : [])
      ],
      isActive: true
    }).select('+password');

    console.log('👤 Customer found:', {
      found: !!customer,
      id: customer?._id,
      name: customer?.name,
      email: customer?.email,
      isActive: customer?.isActive
    });

    if (!customer) {
      console.log('❌ Customer not found or inactive');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    console.log('🔑 Checking password...');
    const isPasswordValid = await bcrypt.compare(password, customer.password);
    console.log('🔑 Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Password validation failed');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    console.log('🎫 Generating JWT token...');
    const token = generateToken(customer._id);

    // Remove password from response
    const customerData = {
      _id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      dateOfBirth: customer.dateOfBirth,
      gender: customer.gender,
      address: customer.address,
      customerLevel: customer.customerLevel,
      loyaltyPoints: customer.loyaltyPoints,
      totalOrders: customer.totalOrders,
      isActive: customer.isActive,
      isVerified: customer.isVerified,
      lastLoginAt: new Date(),
      createdAt: customer.createdAt
    };

    console.log('👤 Customer data prepared:', {
      id: customerData._id,
      name: customerData.name,
      email: customerData.email,
      hasToken: !!token
    });

    // Update last login
    customer.lastLoginAt = new Date();
    await customer.save();

    console.log('✅ Login successful, sending response');
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        customer: customerData,
        token
      }
    });

  } catch (error) {
    console.error('Mobile login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get current customer profile for mobile app
// @route   GET /api/v1/mobile/auth/profile
// @access  Private
export const mobileGetProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const customerData = {
      _id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      dateOfBirth: customer.dateOfBirth,
      gender: customer.gender,
      address: customer.address,
      customerLevel: customer.customerLevel,
      loyaltyPoints: customer.loyaltyPoints,
      totalOrders: customer.totalOrders,
      isActive: customer.isActive,
      isVerified: customer.isVerified,
      lastLoginAt: customer.lastLoginAt,
      createdAt: customer.createdAt
    };

    res.status(200).json({
      success: true,
      data: customerData
    });

  } catch (error) {
    console.error('Mobile get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update customer profile for mobile app
// @route   PUT /api/v1/mobile/auth/profile
// @access  Private
export const mobileUpdateProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      dateOfBirth,
      gender,
      address
    } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (gender) updateData.gender = gender;
    if (address) updateData.address = address;

    const customer = await Customer.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const customerData = {
      _id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      dateOfBirth: customer.dateOfBirth,
      gender: customer.gender,
      address: customer.address,
      customerLevel: customer.customerLevel,
      loyaltyPoints: customer.loyaltyPoints,
      totalOrders: customer.totalOrders,
      isActive: customer.isActive,
      isVerified: customer.isVerified,
      lastLoginAt: customer.lastLoginAt,
      createdAt: customer.createdAt
    };

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: customerData
    });

  } catch (error) {
    console.error('Mobile update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Change password for mobile app
// @route   PUT /api/v1/mobile/auth/change-password
// @access  Private
export const mobileChangePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password'
      });
    }

    const customer = await Customer.findById(req.user.id).select('+password');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, customer.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    customer.password = hashedNewPassword;
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Mobile change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Logout customer for mobile app
// @route   POST /api/v1/mobile/auth/logout
// @access  Private
export const mobileLogout = async (req, res) => {
  try {
    // For JWT tokens, logout is handled client-side by removing the token
    // But we can log the logout event or perform cleanup if needed
    
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Mobile logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default {
  mobileRegister,
  mobileLogin,
  mobileGetProfile,
  mobileUpdateProfile,
  mobileChangePassword,
  mobileLogout
};
