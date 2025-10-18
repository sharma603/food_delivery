import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Restaurant Schema for Restaurant Authentication and Management
const restaurantSchema = new mongoose.Schema({
  // Authentication Information
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

  // Restaurant Basic Information
  restaurantName: {
    type: String,
    required: [true, 'Restaurant name is required'],
    trim: true
  },
  ownerName: {
    type: String,
    required: [true, 'Owner name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  // Restaurant Address
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required']
    },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },

  // Business Information
  businessLicense: {
    type: String,
    required: [true, 'Business license number is required'],
    unique: true
  },
  taxId: {
    type: String,
    required: [true, 'Tax ID is required']
  },
  establishedYear: {
    type: Number,
    min: [1900, 'Established year must be after 1900'],
    max: [new Date().getFullYear(), 'Established year cannot be in the future']
  },

  // Cuisine Information
  cuisine: [{
    type: String,
    required: [true, 'At least one cuisine type is required']
  }],

  // Business Hours
  openingHours: {
    monday: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '22:00' },
      isClosed: { type: Boolean, default: false }
    },
    tuesday: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '22:00' },
      isClosed: { type: Boolean, default: false }
    },
    wednesday: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '22:00' },
      isClosed: { type: Boolean, default: false }
    },
    thursday: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '22:00' },
      isClosed: { type: Boolean, default: false }
    },
    friday: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '23:00' },
      isClosed: { type: Boolean, default: false }
    },
    saturday: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '23:00' },
      isClosed: { type: Boolean, default: false }
    },
    sunday: {
      open: { type: String, default: '10:00' },
      close: { type: String, default: '21:00' },
      isClosed: { type: Boolean, default: false }
    }
  },

  // Delivery Information
  deliveryInfo: {
    deliveryTime: {
      min: {
        type: Number,
        required: [true, 'Minimum delivery time is required'],
        min: [15, 'Minimum delivery time must be at least 15 minutes'],
        default: 30
      },
      max: {
        type: Number,
        required: [true, 'Maximum delivery time is required'],
        min: [20, 'Maximum delivery time must be at least 20 minutes'],
        default: 60
      }
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: [0, 'Delivery fee cannot be negative']
    },
    minimumOrder: {
      type: Number,
      default: 0,
      min: [0, 'Minimum order amount cannot be negative']
    },
    deliveryRadius: {
      type: Number,
      default: 10, // kilometers
      min: [1, 'Delivery radius must be at least 1 km']
    }
  },

  // Services & Features
  features: [{
    type: String,
    enum: ['delivery', 'pickup', 'dine_in', 'online_payment', 'cash_on_delivery', 'card_payment'],
    default: ['delivery', 'pickup']
  }],

  // Restaurant Images
  images: [{
    url: { type: String, required: true },
    alt: { type: String },
    isPrimary: { type: Boolean, default: false }
  }],

  // Contact & Social Media
  socialMedia: {
    website: { type: String },
    facebook: { type: String },
    instagram: { type: String },
    twitter: { type: String }
  },

  // Verification & Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending'
  },

  // Admin Verification Details
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  verifiedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },

  // Performance Metrics
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
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

  // Notification Settings
  notifications: {
    newOrder: { type: Boolean, default: true },
    orderUpdate: { type: Boolean, default: true },
    promotions: { type: Boolean, default: true },
    reviews: { type: Boolean, default: true }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Validation: Ensure max delivery time is greater than min
restaurantSchema.pre('save', function(next) {
  if (this.deliveryInfo?.deliveryTime?.max <= this.deliveryInfo?.deliveryTime?.min) {
    next(new Error('Maximum delivery time must be greater than minimum delivery time'));
  }
  next();
});

// Hash password before saving
restaurantSchema.pre('save', async function(next) {
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
restaurantSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
restaurantSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
restaurantSchema.methods.incLoginAttempts = function() {
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
restaurantSchema.methods.updateLoginInfo = function() {
  this.lastLogin = new Date();
  this.lastActiveAt = new Date();

  // Reset login attempts
  if (this.loginAttempts) {
    this.loginAttempts = undefined;
    this.lockUntil = undefined;
  }

  return this.save();
};

// Check if restaurant is currently open
restaurantSchema.methods.isCurrentlyOpen = function() {
  if (!this.isOpen || !this.isActive) return false;

  const now = new Date();
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

  const todayHours = this.openingHours[dayOfWeek];
  if (todayHours.isClosed) return false;

  return currentTime >= todayHours.open && currentTime <= todayHours.close;
};

// Update rating
restaurantSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = Number((totalRating / this.rating.count).toFixed(2));
  return this.save();
};

// Update order statistics
restaurantSchema.methods.updateOrderStats = function(orderValue) {
  this.totalOrders += 1;
  this.totalRevenue += orderValue;
  return this.save();
};

// Approve restaurant (admin action)
restaurantSchema.methods.approveRestaurant = function(adminId) {
  this.isVerified = true;
  this.verificationStatus = 'approved';
  this.verifiedBy = adminId;
  this.verifiedAt = new Date();
  this.rejectionReason = undefined;
  return this.save();
};

// Reject restaurant (admin action)
restaurantSchema.methods.rejectRestaurant = function(adminId, reason) {
  this.isVerified = false;
  this.verificationStatus = 'rejected';
  this.verifiedBy = adminId;
  this.verifiedAt = new Date();
  this.rejectionReason = reason;
  return this.save();
};

// Virtual for full address
restaurantSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}`;
});

// Virtual for average order value
restaurantSchema.virtual('averageOrderValue').get(function() {
  return this.totalOrders > 0 ? (this.totalRevenue / this.totalOrders).toFixed(2) : 0;
});

// Virtual for business age
restaurantSchema.virtual('businessAge').get(function() {
  if (!this.establishedYear) return null;
  return new Date().getFullYear() - this.establishedYear;
});

// Static method to find restaurants by location
restaurantSchema.statics.findByLocation = function(city, state) {
  return this.find({
    'address.city': new RegExp(city, 'i'),
    'address.state': new RegExp(state, 'i'),
    isActive: true,
    isVerified: true
  });
};

// Static method to find by cuisine
restaurantSchema.statics.findByCuisine = function(cuisineType) {
  return this.find({
    cuisine: { $in: [new RegExp(cuisineType, 'i')] },
    isActive: true,
    isVerified: true
  });
};

// Indexes for better performance
restaurantSchema.index({ email: 1 });
restaurantSchema.index({ businessLicense: 1 });
restaurantSchema.index({ cuisine: 1 });
restaurantSchema.index({ 'address.city': 1 });
restaurantSchema.index({ 'address.state': 1 });
restaurantSchema.index({ isActive: 1, isVerified: 1 });
restaurantSchema.index({ verificationStatus: 1 });
restaurantSchema.index({ 'rating.average': -1 });
restaurantSchema.index({ totalOrders: -1 });

const RestaurantUser = mongoose.model('RestaurantUser', restaurantSchema);

export default RestaurantUser;