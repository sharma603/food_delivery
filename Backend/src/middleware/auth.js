import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import User from '../models/User.js';
import Admin from '../models/Admin.js';
import SuperAdmin from '../models/User/SuperAdmin.js';
import Customer from '../models/Customer.js';
import RestaurantUser from '../models/RestaurantUser.js';
import DeliveryPersonnel from '../models/DeliveryPersonnel.js';

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (jwtError) {
        // Handle token expiration specifically
        if (jwtError.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Token expired. Please refresh your token or login again.',
            error: 'TokenExpiredError',
            expiredAt: jwtError.expiredAt
          });
        }
        // Handle other JWT errors
        if (jwtError.name === 'JsonWebTokenError') {
          return res.status(401).json({
            success: false,
            message: 'Invalid token. Please login again.',
            error: 'JsonWebTokenError'
          });
        }
        // Re-throw if it's not a known JWT error
        throw jwtError;
      }

      // Check if database is connected
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          success: false,
          message: 'Database temporarily unavailable'
        });
      }

      // Determine which model to use based on the token type
      let user;
      switch (decoded.type) {
        case 'admin':
          user = await Admin.findById(decoded.id).select('-password');
          break;
        case 'super_admin':
          user = await SuperAdmin.findById(decoded.id).select('-password');
          break;
        case 'customer':
          user = await Customer.findById(decoded.id).select('-password');
          break;
        case 'restaurant':
          user = await RestaurantUser.findById(decoded.id).select('-password');
          break;
        case 'delivery':
          user = await DeliveryPersonnel.findById(decoded.id).select('-password');
          // Note: Delivery personnel can access routes regardless of status
          // Status-based access control should be implemented at route/feature level if needed
          break;
        default:
          // Fallback to original User model for backward compatibility
          user = await User.findById(decoded.id).select('-password');
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      req.user = user;
      req.user.type = decoded.type; // Add type to request for easier access

      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  } else {
    res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

const authorize = (...allowedTypes) => {
  return (req, res, next) => {
    // Check if user type is in allowed types
    if (!allowedTypes.includes(req.user.type)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required user type: ${allowedTypes.join(' or ')}`
      });
    }

    // For admin users, also check role if it's an admin-specific route
    if (req.user.type === 'admin' && allowedTypes.includes('super_admin')) {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Super admin role required.'
        });
      }
    }

    next();
  };
};

// Check admin permissions middleware
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin access required.'
      });
    }

    // Super admin has all permissions
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Check if admin has specific permission
    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required permission: ${permission}`
      });
    }

    next();
  };
};

export { protect, authorize, checkPermission };