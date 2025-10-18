import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Admin Schema for Admin Authentication and Management
const adminSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Admin name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },

  // Admin Specific Information
  adminId: {
    type: String,
    required: [true, 'Admin ID is required'],
    unique: true,
    uppercase: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator'],
    default: 'admin'
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: ['Management', 'Operations', 'Customer Service', 'IT', 'Finance']
  },
  permissions: [{
    type: String,
    enum: [
      'manage_users',
      'manage_restaurants',
      'manage_orders',
      'manage_payments',
      'view_analytics',
      'system_settings',
      'user_support'
    ]
  }],

  // Contact Information
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String
  },

  // Status & Security
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },

  // Login Security
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  lastLogin: {
    type: Date
  },
  loginCount: {
    type: Number,
    default: 0
  },

  // Password Reset
  passwordResetToken: {
    type: String
  },
  passwordResetExpires: {
    type: Date
  },

  // Activity Tracking
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  lastLogoutAt: {
    type: Date
  },
  logoutCount: {
    type: Number,
    default: 0
  },

  // Created By (for tracking who created this admin)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
adminSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
adminSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1, loginAttempts: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = {
      lockUntil: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
    };
  }

  return this.updateOne(updates);
};

// Update login info on successful login
adminSchema.methods.updateLoginInfo = function() {
  this.lastLogin = new Date();
  this.loginCount = (this.loginCount || 0) + 1;
  this.lastActiveAt = new Date();

  // Reset login attempts
  if (this.loginAttempts) {
    this.loginAttempts = undefined;
    this.lockUntil = undefined;
  }

  return this.save();
};

// Check admin permissions
adminSchema.methods.hasPermission = function(permission) {
  if (this.role === 'super_admin') return true;
  return this.permissions?.includes(permission);
};

// Virtual for display name
adminSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.adminId})`;
});

// Static method to create super admin
adminSchema.statics.createSuperAdmin = async function(adminData) {
  const superAdminData = {
    ...adminData,
    role: 'super_admin',
    isVerified: true,
    permissions: [
      'manage_users',
      'manage_restaurants',
      'manage_orders',
      'manage_payments',
      'view_analytics',
      'system_settings',
      'user_support'
    ]
  };

  return this.create(superAdminData);
};

// Indexes for better performance
adminSchema.index({ email: 1 });
adminSchema.index({ adminId: 1 });
adminSchema.index({ role: 1 });
adminSchema.index({ isActive: 1, isVerified: 1 });

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;