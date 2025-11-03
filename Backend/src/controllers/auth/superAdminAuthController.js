// Super Admin Auth Controller
// This file structure created as per requested organization
import jwt from 'jsonwebtoken';
import SuperAdmin from '../../models/User/SuperAdmin.js';
import OTP from '../../models/OTP.js';
import { createAuditLog } from '../../utils/auditLogger.js';
import { sendEmail } from '../../services/emailService.js';

// Generate JWT Token for Super Admin
const generateSuperAdminToken = (id) => {
  return jwt.sign({ 
    id, 
    type: 'super_admin',
    permissions: ['*'] // Super admin has all permissions
  }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// @desc    Super Admin login
// @route   POST /api/v1/auth/superadmin/login
// @access  Public
export const superAdminLogin = async (req, res) => {
  try {
    const { email, password, twoFactorCode } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find super admin by email
    const superAdmin = await SuperAdmin.findOne({ 
      email: email.toLowerCase().trim()
    }).select('+password');

    if (!superAdmin) {
      await createAuditLog({
        action: 'login_failed',
        resource: 'super_admin',
        details: { email, reason: 'user_not_found' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!superAdmin.isActive) {
      return res.status(423).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Check password
    const isPasswordMatch = await superAdmin.comparePassword(password);

    if (!isPasswordMatch) {
      await createAuditLog({
        user: superAdmin._id,
        userType: 'super_admin',
        action: 'login_failed',
        resource: 'super_admin',
        details: { reason: 'invalid_password' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update login info
    await superAdmin.updateLoginInfo();

    // Create audit log
    await createAuditLog({
      user: superAdmin._id,
      userType: 'super_admin',
      action: 'login',
      resource: 'super_admin',
      details: { success: true },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Create response data
    const responseData = {
      _id: superAdmin._id,
      name: superAdmin.name,
      email: superAdmin.email,
      role: 'super_admin',
      permissions: ['*'],
      lastLogin: superAdmin.lastLogin,
      token: generateSuperAdminToken(superAdmin._id)
    };

    res.json({
      success: true,
      message: 'Super admin login successful',
      data: responseData
    });

  } catch (error) {
    console.error('Super admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Super Admin logout
// @route   POST /api/v1/auth/superadmin/logout
// @access  Private (Super Admin)
export const superAdminLogout = async (req, res) => {
  try {
    const superAdminId = req.user._id;

    // Create audit log
    await createAuditLog({
      user: superAdminId,
      userType: 'super_admin',
      action: 'logout',
      resource: 'super_admin',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Update last logout time
    await SuperAdmin.findByIdAndUpdate(superAdminId, {
      lastLogoutAt: new Date(),
      logoutCount: (req.user.logoutCount || 0) + 1
    });

    res.json({
      success: true,
      message: 'Super admin logout successful'
    });

  } catch (error) {
    console.error('Super admin logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

// @desc    Register new Super Admin (Only existing SuperAdmin can create)
// @route   POST /api/v1/auth/superadmin/register
// @access  Private (Super Admin only)
export const superAdminRegister = async (req, res) => {
  try {
    const { name, email, password, adminId, department } = req.body;

    // Validation
    if (!name || !email || !password || !adminId || !department) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, adminId, department'
      });
    }

    // Check if email already exists
    const existingSuperAdmin = await SuperAdmin.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { adminId: adminId.toUpperCase() }
      ]
    });

    if (existingSuperAdmin) {
      return res.status(400).json({
        success: false,
        message: 'SuperAdmin with this email or admin ID already exists'
      });
    }

    // Create new SuperAdmin
    const superAdminData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      adminId: adminId.toUpperCase(),
      role: 'super_admin',
      department,
      isActive: true,
      isVerified: true,
      createdBy: req.user._id,
      permissions: [
        'manage_restaurants',
        'create_restaurant_accounts',
        'approve_restaurants',
        'suspend_restaurants',
        'view_restaurant_details',
        'manage_users',
        'create_users',
        'suspend_users',
        'view_user_details',
        'manage_delivery_partners',
        'view_all_orders',
        'manage_orders',
        'handle_disputes',
        'process_refunds',
        'view_financials',
        'manage_payouts',
        'set_commission_rates',
        'view_transactions',
        'generate_financial_reports',
        'view_analytics',
        'generate_reports',
        'export_data',
        'system_settings',
        'manage_admins',
        'app_configurations',
        'notification_settings',
        'security_settings',
        'handle_support_tickets',
        'manage_faqs',
        'broadcast_notifications'
      ]
    };

    const newSuperAdmin = await SuperAdmin.create(superAdminData);

    // Create audit log
    await createAuditLog({
      user: req.user._id,
      userType: 'super_admin',
      action: 'create_superadmin',
      resource: 'super_admin',
      details: {
        newSuperAdminId: newSuperAdmin._id,
        email: newSuperAdmin.email,
        adminId: newSuperAdmin.adminId
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: 'SuperAdmin created successfully',
      data: {
        _id: newSuperAdmin._id,
        name: newSuperAdmin.name,
        email: newSuperAdmin.email,
        adminId: newSuperAdmin.adminId,
        role: newSuperAdmin.role,
        department: newSuperAdmin.department,
        createdAt: newSuperAdmin.createdAt
      }
    });

  } catch (error) {
    console.error('Super admin registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Forgot password with OTP for super admin
// @route   POST /api/v1/auth/superadmin/forgot-password
// @access  Public
export const superAdminForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address'
      });
    }

    // Find super admin by email
    const superAdmin = await SuperAdmin.findOne({ 
      email: email.toLowerCase().trim()
    });

    if (!superAdmin) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, an OTP has been sent. Please check your inbox.',
        data: {
          email: email.toLowerCase().trim(),
          expiresIn: '5 minutes'
        }
      });
    }

    // Check if account is active
    if (!superAdmin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.'
      });
    }

    // Get client IP and user agent
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    // Create OTP request
    const otpRequest = await OTP.createOTPRequest(
      superAdmin._id,
      'Admin', // Using 'Admin' as userType for SuperAdmin
      superAdmin.email,
      ipAddress,
      userAgent
    );

    // Send OTP email
    try {
      await sendEmail({
        to: superAdmin.email,
        template: 'password-reset-otp',
        data: {
          name: superAdmin.name,
          email: superAdmin.email,
          otp: otpRequest.otp
        }
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the request if email fails - log it
    }

    // Create audit log
    await createAuditLog({
      user: superAdmin._id,
      userType: 'super_admin',
      action: 'forgot_password_requested',
      resource: 'super_admin',
      details: { email: superAdmin.email },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: 'OTP has been sent to your email address. Please check your inbox.',
      data: {
        email: superAdmin.email,
        expiresIn: '5 minutes'
      }
    });

  } catch (error) {
    console.error('Super admin forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process forgot password request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Verify OTP for password reset for super admin
// @route   POST /api/v1/auth/superadmin/verify-otp
// @access  Public
export const superAdminVerifyOTP = async (req, res) => {
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
      userType: 'Admin',
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      // Check if OTP exists but is expired or used
      const expiredOTP = await OTP.findOne({
        email: email.toLowerCase().trim(),
        otp: otp.trim(),
        userType: 'Admin'
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
        email: email.toLowerCase().trim(),
        verified: true
      }
    });

  } catch (error) {
    console.error('Super admin verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Reset password with OTP verification for super admin
// @route   POST /api/v1/auth/superadmin/reset-password
// @access  Public
export const superAdminResetPassword = async (req, res) => {
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
      userType: 'Admin',
      isUsed: true,  // OTP must be verified (used) before resetting password
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid, expired, or unverified OTP. Please verify OTP first.'
      });
    }

    // Find super admin - need to select password field
    const superAdmin = await SuperAdmin.findOne({ 
      email: email.toLowerCase().trim()
    }).select('+password');

    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Super admin not found'
      });
    }

    // Update password - set plain password to trigger pre-save hook to hash it
    superAdmin.password = newPassword;
    superAdmin.markModified('password'); // Ensure the password field is marked as modified
    await superAdmin.save();

    // Send success email
    try {
      await sendEmail({
        to: superAdmin.email,
        template: 'password-reset-success',
        data: {
          name: superAdmin.name,
          email: superAdmin.email
        }
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the request if email fails
    }

    // Create audit log
    await createAuditLog({
      user: superAdmin._id,
      userType: 'super_admin',
      action: 'password_reset',
      resource: 'super_admin',
      details: { email: superAdmin.email },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
      data: {
        email: superAdmin.email
      }
    });

  } catch (error) {
    console.error('Super admin reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default {
  superAdminLogin,
  superAdminLogout,
  superAdminRegister,
  superAdminForgotPassword,
  superAdminVerifyOTP,
  superAdminResetPassword
};
