import Customer from '../../../models/Customer.js';
import PasswordReset from '../../../models/PasswordReset.js';
import OTP from '../../../models/OTP.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { sendEmail } from '../../../services/emailService.js';

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

    // Normalize email to lowercase for consistency
    const normalizedEmail = email.toLowerCase().trim();

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({
      $or: [{ email: normalizedEmail }, { phone }]
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer already exists with this email or phone number'
      });
    }

    // Create customer - let the pre-save hook handle password hashing
    const customer = await Customer.create({
      name,
      email: normalizedEmail,
      phone,
      password: password, // Pass plain password, pre-save hook will hash it
      dateOfBirth,
      gender,
      // Note: address is handled as addresses array, not a single field
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
      addresses: customer.addresses,
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
    console.error('Registration error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }
    
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

    // Validation
    if (!password || (!email && !phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/phone and password'
      });
    }

    // Normalize email to lowercase for consistency
    const normalizedEmail = email ? email.toLowerCase().trim() : null;

    // Find customer by email or phone
    const customer = await Customer.findOne({
      $or: [
        ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
        ...(phone ? [{ phone }] : [])
      ],
      isActive: true
    }).select('+password');

    if (!customer) {
      // Check if email exists at all
      const emailExists = await Customer.findOne({
        $or: [
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
          ...(phone ? [{ phone }] : [])
        ]
      }).select('email phone');
      
      if (emailExists) {
        // Email/phone exists but account is inactive
        return res.status(401).json({
          success: false,
          message: 'Account is inactive. Please contact support.'
        });
      } else {
        // Email/phone doesn't exist
        return res.status(401).json({
          success: false,
          message: 'Email not registered. Please check your email or sign up.'
        });
      }
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, customer.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please check your password.'
      });
    }

    // Generate token
    const token = generateToken(customer._id);

    // Update last login
    customer.lastLogin = new Date();
    customer.lastActiveAt = new Date();
    await customer.save();

    // Remove password from response
    const customerData = {
      _id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      dateOfBirth: customer.dateOfBirth,
      gender: customer.gender,
      addresses: customer.addresses,
      customerLevel: customer.customerLevel,
      loyaltyPoints: customer.loyaltyPoints,
      totalOrders: customer.totalOrders,
      isActive: customer.isActive,
      isVerified: customer.isVerified,
      createdAt: customer.createdAt
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        customer: customerData,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
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

    // Update password - let the pre-save hook hash it
    customer.password = newPassword;
    customer.markModified('password');
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
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
    res.status(500).json({
      success: false,
      message: 'Failed to logout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Forgot password with OTP for mobile app
// @route   POST /api/v1/mobile/auth/forgot-password
// @access  Public
export const mobileForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address'
      });
    }

    // Find customer by email
    const customer = await Customer.findOne({ 
      email: email.toLowerCase().trim(),
      isActive: true 
    });

    if (!customer) {
      // User is not registered - return specific error
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address. Please register first.'
      });
    }

    // Get client IP and user agent
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    // Create OTP request
    const otpRequest = await OTP.createOTPRequest(
      customer._id,
      'Customer',
      customer.email,
      ipAddress,
      userAgent
    );

    // Send OTP email
    await sendEmail({
      to: customer.email,
      template: 'password-reset-otp',
      data: {
        name: customer.name,
        email: customer.email,
        otp: otpRequest.otp
      }
    });


    res.status(200).json({
      success: true,
      message: 'OTP has been sent to your email address. Please check your inbox.',
      data: {
        email: customer.email,
        expiresIn: '5 minutes'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process forgot password request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Verify OTP for password reset
// @route   POST /api/v1/mobile/auth/verify-otp
// @access  Public
export const mobileVerifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validation
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and OTP'
      });
    }

    // Find valid OTP
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase().trim(),
      otp: otp.trim(),
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      // Check if OTP exists but is expired or used
      const expiredOTP = await OTP.findOne({
        email: email.toLowerCase().trim(),
        otp: otp.trim()
      });

      if (expiredOTP) {
        if (expiredOTP.isUsed) {
          return res.status(400).json({
            success: false,
            message: 'OTP has already been used. Please request a new OTP.'
          });
        }
        
        if (expiredOTP.expiresAt <= new Date()) {
          return res.status(400).json({
            success: false,
            message: 'OTP has expired. Please request a new OTP.'
          });
        }
        
        if (expiredOTP.attempts >= 3) {
          return res.status(400).json({
            success: false,
            message: 'Maximum attempts exceeded. Please request a new OTP.'
          });
        }
      }

      // Increment attempts for invalid OTP
      if (expiredOTP) {
        await expiredOTP.incrementAttempts();
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.'
      });
    }

    // Check attempts limit
    if (otpRecord.attempts >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Maximum attempts exceeded. Please request a new OTP.'
      });
    }

    // Mark OTP as used
    await otpRecord.markAsUsed();

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully. You can now set a new password.',
      data: {
        email: email,
        verified: true
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// @desc    Reset password with OTP verification for mobile app
// @route   POST /api/v1/mobile/auth/reset-password
// @access  Public
export const mobileResetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Validation
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, OTP, and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Verify OTP - find valid OTP that has been verified (marked as used during verification)
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase().trim(),
      otp: otp.trim(),
      isUsed: true,  // OTP must be verified (used) before resetting password
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid, expired, or unverified OTP. Please verify OTP first.'
      });
    }

    // Find customer - need to select password field
    const customer = await Customer.findOne({ 
      email: email.toLowerCase().trim(),
      isActive: true 
    }).select('+password');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Update password - set plain password to trigger pre-save hook to hash it
    customer.password = newPassword;
    customer.markModified('password'); // Ensure the password field is marked as modified
    await customer.save();

    // Note: OTP is already marked as used during verification step

    // Send success email
    try {
      await sendEmail({
        to: customer.email,
        template: 'password-reset-success',
        data: {
          name: customer.name,
          email: customer.email
        }
      });
    } catch (emailError) {
      // Don't fail the request if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Verify reset token for mobile app
// @route   GET /api/v1/mobile/auth/verify-reset-token/:token
// @access  Public
export const mobileVerifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    

    // Find valid reset request
    const resetRequest = await PasswordReset.findOne({
      token,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRequest) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reset token is valid',
      data: {
        email: resetRequest.email,
        expiresAt: resetRequest.expiresAt
      }
    });

  } catch (error) {
    console.error('Mobile verify reset token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify reset token',
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
  mobileLogout,
  mobileForgotPassword,
  mobileResetPassword,
  mobileVerifyResetToken
};
