// Super Admin Auth Controller
// This file structure created as per requested organization
import jwt from 'jsonwebtoken';
import SuperAdmin from '../../models/User/SuperAdmin.js';
import { createAuditLog } from '../../utils/auditLogger.js';

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

export default {
  superAdminLogin,
  superAdminLogout,
  superAdminRegister
};
