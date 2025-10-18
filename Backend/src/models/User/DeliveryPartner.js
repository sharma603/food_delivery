// DeliveryPartner Model
// This file structure created as per requested organization
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const deliveryPartnerSchema = new mongoose.Schema({
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
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  
  // Personal Details
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  profileImage: {
    type: String
  },
  
  // Address Information
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'India'
    },
    zipCode: {
      type: String,
      required: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Documents
  documents: {
    aadhar: {
      number: String,
      image: String,
      verified: { type: Boolean, default: false }
    },
    pan: {
      number: String,
      image: String,
      verified: { type: Boolean, default: false }
    },
    drivingLicense: {
      number: String,
      image: String,
      verified: { type: Boolean, default: false }
    },
    photo: {
      type: String
    }
  },
  
  // Vehicle Information
  vehicle: {
    type: {
      type: String,
      enum: ['bicycle', 'motorcycle', 'car', 'scooter'],
      required: true
    },
    model: String,
    color: String,
    licensePlate: String,
    insurance: {
      policyNumber: String,
      expiryDate: Date,
      image: String
    },
    rc: {
      number: String,
      image: String
    }
  },
  
  // Verification Status
  verificationStatus: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending'
  },
  verificationNotes: String,
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SuperAdmin'
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockReason: String,
  
  // Work Information
  workingZones: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryZone'
  }],
  
  workingHours: {
    monday: { start: String, end: String, isWorking: Boolean },
    tuesday: { start: String, end: String, isWorking: Boolean },
    wednesday: { start: String, end: String, isWorking: Boolean },
    thursday: { start: String, end: String, isWorking: Boolean },
    friday: { start: String, end: String, isWorking: Boolean },
    saturday: { start: String, end: String, isWorking: Boolean },
    sunday: { start: String, end: String, isWorking: Boolean }
  },
  
  // Location Tracking
  currentLocation: {
    latitude: Number,
    longitude: Number,
    address: String,
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  
  // Statistics
  stats: {
    totalDeliveries: {
      type: Number,
      default: 0
    },
    completedDeliveries: {
      type: Number,
      default: 0
    },
    cancelledDeliveries: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  },
  
  // Earnings
  earnings: {
    wallet: {
      type: Number,
      default: 0
    },
    totalEarned: {
      type: Number,
      default: 0
    },
    pendingAmount: {
      type: Number,
      default: 0
    }
  },
  
  // Bank Details
  bankDetails: {
    accountName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    branchName: String,
    upiId: String
  },
  
  // Ratings & Reviews
  reviews: [{
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Emergency Contact
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  
  // App Settings
  settings: {
    notifications: {
      orderAlerts: { type: Boolean, default: true },
      paymentAlerts: { type: Boolean, default: true },
      promotionAlerts: { type: Boolean, default: true }
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  
  // Device Information
  deviceInfo: {
    fcmToken: String,
    deviceId: String,
    platform: {
      type: String,
      enum: ['android', 'ios']
    },
    appVersion: String
  },
  
  // Login Information
  lastLogin: Date,
  lastLogout: Date,
  isLoggedIn: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
deliveryPartnerSchema.index({ email: 1 });
deliveryPartnerSchema.index({ phone: 1 });
deliveryPartnerSchema.index({ verificationStatus: 1 });
deliveryPartnerSchema.index({ isActive: 1 });
deliveryPartnerSchema.index({ isOnline: 1 });
deliveryPartnerSchema.index({ 'currentLocation.latitude': 1, 'currentLocation.longitude': 1 });
deliveryPartnerSchema.index({ workingZones: 1 });

// Virtual for completion rate
deliveryPartnerSchema.virtual('completionRate').get(function() {
  if (this.stats.totalDeliveries === 0) return 0;
  return ((this.stats.completedDeliveries / this.stats.totalDeliveries) * 100).toFixed(2);
});

// Pre-save middleware to hash password
deliveryPartnerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Update average rating when a new review is added
deliveryPartnerSchema.pre('save', function(next) {
  if (this.isModified('reviews')) {
    const totalRatings = this.reviews.length;
    if (totalRatings > 0) {
      const sumRatings = this.reviews.reduce((sum, review) => sum + review.rating, 0);
      this.stats.averageRating = (sumRatings / totalRatings).toFixed(1);
      this.stats.totalRatings = totalRatings;
    }
  }
  next();
});

// Instance method to check password
deliveryPartnerSchema.methods.correctPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to update location
deliveryPartnerSchema.methods.updateLocation = async function(latitude, longitude, address) {
  this.currentLocation = {
    latitude,
    longitude,
    address,
    lastUpdated: new Date()
  };
  return await this.save();
};

// Instance method to toggle online status
deliveryPartnerSchema.methods.toggleOnlineStatus = async function() {
  this.isOnline = !this.isOnline;
  return await this.save();
};

// Static method to find available partners in zone
deliveryPartnerSchema.statics.findAvailableInZone = function(zoneId, excludeIds = []) {
  return this.find({
    workingZones: zoneId,
    isActive: true,
    isOnline: true,
    isBlocked: false,
    verificationStatus: 'approved',
    _id: { $nin: excludeIds }
  });
};

const DeliveryPartner = mongoose.model('DeliveryPartner', deliveryPartnerSchema);

export default DeliveryPartner;
