import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id, type: 'admin' }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Admin login
// @route   POST /api/admin/auth/login
// @access  Public
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find admin by email and include password field
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (admin.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.'
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact system administrator.'
      });
    }

    // Check if admin is verified
    if (!admin.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Account is not yet verified. Please contact system administrator.'
      });
    }

    // Check password
    const isPasswordMatch = await admin.comparePassword(password);

    if (!isPasswordMatch) {
      await admin.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update login info
    await admin.updateLoginInfo();

    // Create response data
    const responseData = {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      adminId: admin.adminId,
      role: admin.role,
      department: admin.department,
      permissions: admin.permissions,
      avatar: admin.avatar,
      lastLogin: admin.lastLogin,
      loginCount: admin.loginCount,
      token: generateToken(admin._id)
    };

    res.json({
      success: true,
      message: 'Admin login successful',
      data: responseData
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create new admin (Super Admin only)
// @route   POST /api/admin/auth/create
// @access  Private (Super Admin)
export const createAdmin = async (req, res) => {
  try {
    const { name, email, password, adminId, department, role, permissions } = req.body;

    // Validation
    if (!name || !email || !password || !adminId || !department) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, adminId, department'
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ email: email.toLowerCase() }, { adminId: adminId.toUpperCase() }]
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email or admin ID already exists'
      });
    }

    // Create admin
    const adminData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      adminId: adminId.toUpperCase(),
      department,
      role: role || 'admin',
      permissions: permissions || ['manage_users', 'manage_restaurants', 'manage_orders', 'view_analytics'],
      isVerified: true,
      createdBy: req.user._id
    };

    const admin = await Admin.create(adminData);

    // Remove password from response
    const adminResponse = await Admin.findById(admin._id);

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: {
        _id: adminResponse._id,
        name: adminResponse.name,
        email: adminResponse.email,
        adminId: adminResponse.adminId,
        role: adminResponse.role,
        department: adminResponse.department,
        permissions: adminResponse.permissions,
        isVerified: adminResponse.isVerified,
        createdAt: adminResponse.createdAt
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating admin',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get current admin profile
// @route   GET /api/admin/auth/me
// @access  Private (Admin)
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({
      success: true,
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        adminId: admin.adminId,
        role: admin.role,
        department: admin.department,
        permissions: admin.permissions,
        avatar: admin.avatar,
        phone: admin.phone,
        lastLogin: admin.lastLogin,
        loginCount: admin.loginCount,
        lastActiveAt: admin.lastActiveAt,
        createdAt: admin.createdAt
      }
    });

  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching admin profile'
    });
  }
};

// @desc    Update admin profile
// @route   PUT /api/admin/auth/profile
// @access  Private (Admin)
export const updateAdminProfile = async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const admin = await Admin.findById(req.user._id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Update allowed fields
    if (name) admin.name = name.trim();
    if (phone) admin.phone = phone;
    if (avatar) admin.avatar = avatar;

    await admin.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        adminId: admin.adminId,
        phone: admin.phone,
        avatar: admin.avatar,
        role: admin.role,
        department: admin.department
      }
    });

  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
};

// @desc    Change admin password
// @route   PUT /api/admin/auth/change-password
// @access  Private (Admin)
export const changeAdminPassword = async (req, res) => {
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

    const admin = await Admin.findById(req.user._id).select('+password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check current password
    const isCurrentPasswordValid = await admin.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Set new password
    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change admin password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error changing password'
    });
  }
};

// @desc    Admin logout
// @route   POST /api/admin/auth/logout
// @access  Private (Admin)
export const adminLogout = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { token, refreshToken, timestamp } = req.body;

    // Find the admin
    const admin = await Admin.findById(adminId);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Update last logout time
    admin.lastLogoutAt = new Date();
    
    // Increment logout count for analytics
    if (!admin.logoutCount) {
      admin.logoutCount = 0;
    }
    admin.logoutCount += 1;

    // Calculate session duration
    const sessionDuration = admin.lastLoginAt ? 
      Math.floor((Date.now() - new Date(admin.lastLoginAt).getTime()) / 1000) : 0;

    await admin.save();

    // Log the logout action
    console.log(`Admin logout: ${admin.email} (${admin.adminId}) - Session duration: ${sessionDuration}s`);

    // In a production environment, you would also:
    // 1. Blacklist the provided tokens
    // 2. Clear any server-side sessions
    // 3. Log to an audit trail database
    // 4. Notify security monitoring systems

    res.json({
      success: true,
      message: 'Admin logout successful',
      data: {
        logoutTime: admin.lastLogoutAt,
        sessionDuration,
        adminId: admin.adminId
      }
    });

  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};