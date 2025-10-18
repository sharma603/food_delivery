import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import tokenService from '../utils/tokenService.js';

const register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
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

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'customer',
      phone: phone || null
    });

    // Map role to type for JWT token
    const typeMap = {
      'admin': 'super_admin',
      'customer': 'customer',
      'delivery': 'delivery',
      'restaurant': 'restaurant'
    };

    const userType = typeMap[user.role] || user.role;

    const accessToken = tokenService.signAccessToken({
      id: user._id,
      role: user.role,
      type: userType
    });
    const { refreshToken } = await tokenService.generateRefreshToken(user._id.toString());

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // If role is specified, check if user has that role
    if (role && user.role !== role) {
      await user.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: `Access denied. This account is not authorized for ${role} access.`
      });
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      await user.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update login tracking for admin users
    if (user.role === 'admin') {
      user.adminProfile.lastLogin = new Date();
      user.adminProfile.loginCount = (user.adminProfile.loginCount || 0) + 1;
    }

    // Reset login attempts on successful login
    if (user.loginAttempts) {
      await user.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
      });
    }

    // Update last active time
    user.lastActiveAt = new Date();
    await user.save();

    // Map role to type for JWT token
    const typeMap = {
      'admin': 'super_admin',
      'customer': 'customer',
      'delivery': 'delivery',
      'restaurant': 'restaurant'
    };

    const userType = typeMap[user.role] || user.role;

    // Prepare response data based on role
    const accessToken = tokenService.signAccessToken({
      id: user._id,
      role: user.role,
      type: userType
    });
    const { refreshToken } = await tokenService.generateRefreshToken(user._id.toString());

    const responseData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken,
      refreshToken,
      isVerified: user.isVerified
    };

    // Add role-specific data
    if (user.role === 'admin') {
      responseData.adminProfile = user.adminProfile;
    } else if (user.role === 'customer') {
      responseData.customerProfile = user.customerProfile;
    } else if (user.role === 'delivery') {
      responseData.deliveryProfile = user.deliveryProfile;
    }

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching user profile'
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, addresses } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (name) user.name = name.trim();
    if (phone) user.phone = phone;
    if (addresses) user.addresses = addresses;

    await user.save();

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Refresh token required' });
    }
    const decoded = await tokenService.verifyRefreshToken(token);
    const newAccess = tokenService.signAccessToken({ id: decoded.sub });
    const { refreshToken: newRefresh, jti } = await tokenService.rotateRefreshToken(decoded.jti, decoded.sub);
    res.json({ success: true, data: { accessToken: newAccess, refreshToken: newRefresh, jti } });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

const logoutAll = async (req, res) => {
  try {
    await tokenService.revokeAllRefreshTokensForUser(req.user._id.toString());
    res.json({ success: true, message: 'Logged out from all sessions' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to logout' });
  }
};

export { register, login, getMe, updateProfile, refreshToken, logoutAll };