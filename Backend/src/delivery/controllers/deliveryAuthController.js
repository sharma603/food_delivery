import DeliveryPersonnel from '../../models/DeliveryPersonnel.js';
import OTP from '../../models/OTP.js';
import tokenService from '../../utils/tokenService.js';
import { asyncHandler } from '../../utils/helpers.js';
import { sendEmail } from '../../services/emailService.js';

// @desc    Login delivery personnel
// @route   POST /api/v1/delivery/auth/login
// @access  Public
export const deliveryLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  // Find delivery personnel by email - explicitly select password field
  const normalizedEmail = email.toLowerCase().trim();
  const deliveryPerson = await DeliveryPersonnel.findOne({ 
    email: normalizedEmail 
  }).select('+password');

  // Log for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Login attempt:', {
      email: normalizedEmail,
      found: !!deliveryPerson,
      hasPassword: deliveryPerson ? !!deliveryPerson.password : false,
      status: deliveryPerson?.status
    });
  }

  if (!deliveryPerson) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Check if account is active or on duty
  if (!['active', 'on_duty'].includes(deliveryPerson.status)) {
    return res.status(401).json({
      success: false,
      message: `Account is ${deliveryPerson.status}. Please contact administrator to activate your account.`
    });
  }

  // Verify password field exists
  if (!deliveryPerson.password) {
    console.error('Delivery person found but password field is missing:', deliveryPerson.email);
    return res.status(401).json({
      success: false,
      message: 'Account configuration error. Please contact administrator.'
    });
  }

  // Check password using comparePassword method
  let isPasswordMatch = false;
  try {
    isPasswordMatch = await deliveryPerson.comparePassword(password);
  } catch (passwordError) {
    console.error('Password comparison error:', passwordError);
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('Password check result:', {
      email: normalizedEmail,
      match: isPasswordMatch,
      hasPassword: !!deliveryPerson.password
    });
  }

  if (!isPasswordMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Update last login
  deliveryPerson.lastLogin = new Date();
  await deliveryPerson.save();

  // Generate tokens
  const accessToken = tokenService.signAccessToken({
    id: deliveryPerson._id,
    role: 'delivery',
    type: 'delivery'
  });

  const { refreshToken } = await tokenService.generateRefreshToken(deliveryPerson._id.toString());

  // Prepare response data
  const responseData = {
    _id: deliveryPerson._id,
    name: deliveryPerson.name,
    email: deliveryPerson.email,
    employeeId: deliveryPerson.employeeId,
    phone: deliveryPerson.phone,
    role: 'delivery',
    status: deliveryPerson.status,
    zone: deliveryPerson.zone,
    zoneName: deliveryPerson.zoneName,
    vehicleType: deliveryPerson.vehicleType,
    vehicleNumber: deliveryPerson.vehicleNumber,
    rating: deliveryPerson.rating,
    totalDeliveries: deliveryPerson.totalDeliveries,
    earnings: deliveryPerson.earnings,
    isOnline: deliveryPerson.isOnline,
    token: accessToken,  // For compatibility with older clients
    accessToken: accessToken,  // For consistency with refresh endpoint
    refreshToken: refreshToken
  };

  res.json({
    success: true,
    data: responseData
  });
});

// @desc    Refresh delivery personnel token
// @route   POST /api/v1/delivery/auth/refresh
// @access  Public
export const refreshDeliveryToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required'
    });
  }

  try {
    // Verify refresh token
    const decoded = tokenService.verifyRefreshToken(refreshToken);
    
    // Get delivery person
    const deliveryPerson = await DeliveryPersonnel.findById(decoded.sub)
      .populate('zone', 'name description areas pincodes deliveryCharge')
      .select('-password');

    if (!deliveryPerson) {
      return res.status(404).json({
        success: false,
        message: 'Delivery person not found'
      });
    }

    if (deliveryPerson.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Account is not active'
      });
    }

    // Generate new tokens
    const accessToken = tokenService.signAccessToken({
      id: deliveryPerson._id,
      role: 'delivery',
      type: 'delivery'
    });

    const { refreshToken: newRefreshToken } = await tokenService.generateRefreshToken(deliveryPerson._id.toString());

    // Prepare response data
    const responseData = {
      accessToken,
      refreshToken: newRefreshToken,
      _id: deliveryPerson._id,
      name: deliveryPerson.name,
      email: deliveryPerson.email,
      phone: deliveryPerson.phone,
      employeeId: deliveryPerson.employeeId,
      status: deliveryPerson.status,
      isOnline: deliveryPerson.isOnline,
      zone: deliveryPerson.zone,
      zoneName: deliveryPerson.zoneName,
      vehicleType: deliveryPerson.vehicleType,
      vehicleNumber: deliveryPerson.vehicleNumber,
      rating: deliveryPerson.rating,
      totalDeliveries: deliveryPerson.totalDeliveries,
      earnings: deliveryPerson.earnings,
      currentLocation: deliveryPerson.currentLocation,
      role: 'delivery'
    };

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
});

// @desc    Get delivery personnel profile
// @route   GET /api/v1/delivery/auth/me
// @access  Private (Delivery Personnel)
export const getDeliveryMe = asyncHandler(async (req, res) => {
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

// @desc    Update delivery personnel profile
// @route   PUT /api/v1/delivery/auth/profile
// @access  Private (Delivery Personnel)
export const updateDeliveryProfile = asyncHandler(async (req, res) => {
  const { name, phone, vehicleType, vehicleNumber, vehicleModel, vehicleYear } = req.body;

  const deliveryPerson = await DeliveryPersonnel.findById(req.user._id);

  if (!deliveryPerson) {
    return res.status(404).json({
      success: false,
      message: 'Delivery person not found'
    });
  }

  // Update fields
  if (name) deliveryPerson.name = name;
  if (phone) deliveryPerson.phone = phone;
  if (vehicleType) deliveryPerson.vehicleType = vehicleType;
  if (vehicleNumber) deliveryPerson.vehicleNumber = vehicleNumber;
  if (vehicleModel) deliveryPerson.vehicleModel = vehicleModel;
  if (vehicleYear) deliveryPerson.vehicleYear = vehicleYear;

  await deliveryPerson.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: deliveryPerson
  });
});

// @desc    Change delivery personnel password
// @route   PUT /api/v1/delivery/auth/change-password
// @access  Private (Delivery Personnel)
export const changeDeliveryPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide current password and new password'
    });
  }

  const deliveryPerson = await DeliveryPersonnel.findById(req.user._id).select('+password');

  if (!deliveryPerson) {
    return res.status(404).json({
      success: false,
      message: 'Delivery person not found'
    });
  }

  // Check current password
  const isCurrentPasswordMatch = await deliveryPerson.comparePassword(currentPassword);

  if (!isCurrentPasswordMatch) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  deliveryPerson.password = newPassword;
  await deliveryPerson.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Logout delivery personnel
// @route   POST /api/v1/delivery/auth/logout
// @access  Private (Delivery Personnel)
export const deliveryLogout = asyncHandler(async (req, res) => {
  const deliveryPerson = await DeliveryPersonnel.findById(req.user._id);
  
  if (!deliveryPerson) {
    return res.status(404).json({
      success: false,
      message: 'Delivery person not found'
    });
  }

  // Calculate online time if currently online
  if (deliveryPerson.isOnline && deliveryPerson.onlineAt) {
    const onlineDuration = Math.floor((new Date() - deliveryPerson.onlineAt) / (1000 * 60)); // minutes
    deliveryPerson.totalOnlineTime += onlineDuration;
    deliveryPerson.todayOnlineTime += onlineDuration;
  }

  // Update logout information
  deliveryPerson.isOnline = false;
  deliveryPerson.onlineAt = null;
  deliveryPerson.lastLogout = new Date();
  deliveryPerson.lastActive = new Date();
  
  await deliveryPerson.save();

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Forgot password with OTP for delivery personnel
// @route   POST /api/v1/delivery/auth/forgot-password
// @access  Public
export const deliveryForgotPassword = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address'
      });
    }

    // Find delivery personnel by email (don't filter by status - allow password reset for all users)
    const normalizedEmail = email.toLowerCase().trim();
    const deliveryPerson = await DeliveryPersonnel.findOne({
      email: normalizedEmail
    });

    if (!deliveryPerson) {
      // User is not registered - return specific error
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address. Please contact administrator.'
      });
    }

    // Check if account exists but is inactive - still allow password reset
    if (!['active', 'on_duty'].includes(deliveryPerson.status)) {
      console.log(`Password reset requested for ${deliveryPerson.status} delivery person: ${normalizedEmail}`);
      // Still send OTP - they might be reactivating their account
    }

    // Get client IP and user agent
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    // Create OTP request
    const otpRequest = await OTP.createOTPRequest(
      deliveryPerson._id,
      'DeliveryPersonnel',
      deliveryPerson.email,
      ipAddress,
      userAgent
    );

    // Send OTP email
    await sendEmail({
      to: deliveryPerson.email,
      template: 'password-reset-otp',
      data: {
        name: deliveryPerson.name,
        email: deliveryPerson.email,
        otp: otpRequest.otp
      }
    });

    res.status(200).json({
      success: true,
      message: 'OTP has been sent to your email address. Please check your inbox.',
      data: {
        email: deliveryPerson.email,
        expiresIn: '5 minutes'
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process forgot password request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Verify OTP for password reset for delivery personnel
// @route   POST /api/v1/delivery/auth/verify-otp
// @access  Public
export const deliveryVerifyOTP = asyncHandler(async (req, res) => {
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
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Reset password with OTP verification for delivery personnel
// @route   POST /api/v1/delivery/auth/reset-password
// @access  Public
export const deliveryResetPassword = asyncHandler(async (req, res) => {
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

    // Find delivery personnel - need to select password field (allow all statuses for password reset)
    const normalizedEmail = email.toLowerCase().trim();
    const deliveryPerson = await DeliveryPersonnel.findOne({
      email: normalizedEmail
    }).select('+password');

    if (!deliveryPerson) {
      return res.status(404).json({
        success: false,
        message: 'Delivery personnel not found'
      });
    }

    // Update password - set plain password to trigger pre-save hook to hash it
    deliveryPerson.password = newPassword;
    deliveryPerson.markModified('password'); // Ensure the password field is marked as modified
    await deliveryPerson.save();

    // Note: OTP is already marked as used during verification step

    // Send success email
    try {
      await sendEmail({
        to: deliveryPerson.email,
        template: 'password-reset-success',
        data: {
          name: deliveryPerson.name,
          email: deliveryPerson.email
        }
      });
    } catch (emailError) {
      // Don't fail the request if email fails
      console.error('Email send error:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
