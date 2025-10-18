// SuperAdmin Model
// This file structure created as per requested organization
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const superAdminSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false
  },
  
  // Admin Specific
  adminId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator'],
    default: 'super_admin'
  },
  department: {
    type: String,
    enum: ['operations', 'finance', 'marketing', 'support', 'technical'],
    required: true
  },
  
  // Permissions
  permissions: [{
    type: String,
    enum: [
      // Restaurant Management
      'manage_restaurants', 'create_restaurant_accounts', 'approve_restaurants',
      'suspend_restaurants', 'view_restaurant_details',
      
      // User Management
      'manage_users', 'create_users', 'suspend_users', 'view_user_details',
      'manage_delivery_partners',
      
      // Order Management
      'view_all_orders', 'manage_orders', 'handle_disputes', 'process_refunds',
      
      // Financial Management
      'view_financials', 'manage_payouts', 'set_commission_rates', 'view_transactions',
      'generate_financial_reports',
      
      // Analytics & Reports
      'view_analytics', 'generate_reports', 'export_data',
      
      // System Settings
      'system_settings', 'manage_admins', 'app_configurations',
      'notification_settings', 'security_settings',
      
      // Support
      'handle_support_tickets', 'manage_faqs', 'broadcast_notifications'
    ]
  }],
  
  // Profile Information
  avatar: {
    type: String
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  
  // Security
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
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
  lastLogoutAt: {
    type: Date
  },
  logoutCount: {
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
  
  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SuperAdmin'
  },
  
  // Settings
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
superAdminSchema.index({ email: 1 });
superAdminSchema.index({ adminId: 1 });
superAdminSchema.index({ isActive: 1 });
superAdminSchema.index({ createdAt: -1 });

// Virtual for account lock status
superAdminSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
superAdminSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method to check password
superAdminSchema.methods.correctPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Alias for comparePassword (used in auth controller)
superAdminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to update login info
superAdminSchema.methods.updateLoginInfo = async function() {
  this.lastLogin = new Date();
  this.loginCount += 1;
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  this.lastActiveAt = new Date();
  return await this.save();
};

// Instance method to handle failed login
superAdminSchema.methods.incLoginAttempts = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isAccountLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return await this.updateOne(updates);
};

// Instance method to check if account is locked
superAdminSchema.methods.isAccountLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Static method to find by credentials
superAdminSchema.statics.findByCredentials = async function(email, password) {
  const admin = await this.findOne({ email }).select('+password');
  
  if (!admin || !(await admin.correctPassword(password))) {
    throw new Error('Invalid credentials');
  }
  
  return admin;
};

const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema);

export default SuperAdmin;
