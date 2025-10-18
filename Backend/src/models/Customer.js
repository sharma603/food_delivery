import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Customer Schema for Customer Authentication and Management
const customerSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Customer name is required'],
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
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },

  // Personal Details
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  avatar: {
    type: String
  },

  // Customer Addresses
  addresses: [{
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'other'
    },
    label: {
      type: String // Optional: Like "Home", "Office", "John's Place"
    },
    street: {
      type: String,
      required: true
    },
    apartment: {
      type: String // Optional: Apartment, Suite, Unit, Building, Floor
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'Nepal'
    },
    instructions: {
      type: String // Optional: Delivery instructions
    },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],

  // Food Preferences
  preferences: {
    cuisines: [{
      type: String // Like "Italian", "Chinese", "Indian", etc.
    }],
    dietaryRestrictions: [{
      type: String,
      enum: ['vegetarian', 'vegan', 'gluten_free', 'halal', 'kosher', 'dairy_free', 'nut_free']
    }],
    spiceLevel: {
      type: String,
      enum: ['mild', 'medium', 'hot', 'extra_hot'],
      default: 'medium'
    },
    allergies: [{
      type: String
    }]
  },

  // Customer Statistics
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  totalOrders: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },

  // Status & Verification
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

  // Password Reset
  passwordResetToken: {
    type: String
  },
  passwordResetExpires: {
    type: Date
  },

  // Email Verification
  emailVerificationToken: {
    type: String
  },
  emailVerificationExpires: {
    type: Date
  },

  // Activity Tracking
  lastActiveAt: {
    type: Date,
    default: Date.now
  },

  // Notification Preferences
  notifications: {
    email: {
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: false }
    },
    sms: {
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Hash password before saving
customerSchema.pre('save', async function(next) {
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
customerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
customerSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
customerSchema.methods.incLoginAttempts = function() {
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
customerSchema.methods.updateLoginInfo = function() {
  this.lastLogin = new Date();
  this.lastActiveAt = new Date();

  // Reset login attempts
  if (this.loginAttempts) {
    this.loginAttempts = undefined;
    this.lockUntil = undefined;
  }

  return this.save();
};

// Add loyalty points
customerSchema.methods.addLoyaltyPoints = function(points) {
  this.loyaltyPoints += points;
  return this.save();
};

// Update order statistics
customerSchema.methods.updateOrderStats = function(orderValue) {
  this.totalOrders += 1;
  this.totalSpent += orderValue;

  // Add loyalty points (1 point per dollar spent)
  this.loyaltyPoints += Math.floor(orderValue);

  return this.save();
};

// Get default address
customerSchema.methods.getDefaultAddress = function() {
  return this.addresses.find(addr => addr.isDefault) || this.addresses[0];
};

// Add new address
customerSchema.methods.addAddress = function(addressData) {
  // If this is the first address or marked as default, make it default
  if (this.addresses.length === 0 || addressData.isDefault) {
    this.addresses.forEach(addr => addr.isDefault = false);
    addressData.isDefault = true;
  }

  this.addresses.push(addressData);
  return this.save();
};

// Virtual for customer level based on total orders
customerSchema.virtual('customerLevel').get(function() {
  if (this.totalOrders >= 50) return 'VIP';
  if (this.totalOrders >= 25) return 'Gold';
  if (this.totalOrders >= 10) return 'Silver';
  if (this.totalOrders >= 3) return 'Bronze';
  return 'New';
});

// Virtual for average order value
customerSchema.virtual('averageOrderValue').get(function() {
  return this.totalOrders > 0 ? (this.totalSpent / this.totalOrders).toFixed(2) : 0;
});

// Indexes for better performance
customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ isActive: 1, isVerified: 1 });
customerSchema.index({ 'addresses.city': 1 });
customerSchema.index({ totalOrders: -1 });
customerSchema.index({ loyaltyPoints: -1 });

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;