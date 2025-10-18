import mongoose from 'mongoose';

const deliveryPersonnelSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
  },
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // Work Information
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_duty', 'off_duty', 'suspended'],
    default: 'active'
  },
  zone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
    required: [true, 'Zone assignment is required']
  },
  zoneName: {
    type: String,
    trim: true
  },
  
  // Vehicle Information
  vehicleType: {
    type: String,
    enum: ['Motorcycle', 'Bicycle', 'Car', 'Scooter', 'E-bike'],
    required: [true, 'Vehicle type is required']
  },
  vehicleNumber: {
    type: String,
    required: [true, 'Vehicle number is required'],
    trim: true,
    uppercase: true
  },
  vehicleModel: {
    type: String,
    trim: true
  },
  vehicleYear: {
    type: Number,
    min: [2000, 'Vehicle year must be after 2000'],
    max: [new Date().getFullYear() + 1, 'Vehicle year cannot be in the future']
  },
  
  // Performance Metrics
  rating: {
    type: Number,
    default: 5.0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  totalDeliveries: {
    type: Number,
    default: 0,
    min: [0, 'Total deliveries cannot be negative']
  },
  completedDeliveries: {
    type: Number,
    default: 0,
    min: [0, 'Completed deliveries cannot be negative']
  },
  cancelledDeliveries: {
    type: Number,
    default: 0,
    min: [0, 'Cancelled deliveries cannot be negative']
  },
  averageDeliveryTime: {
    type: Number,
    default: 30,
    min: [0, 'Average delivery time cannot be negative']
  },
  onTimeDeliveries: {
    type: Number,
    default: 0,
    min: [0, 'On-time deliveries cannot be negative']
  },
  
  // Financial Information
  earnings: {
    type: Number,
    default: 0,
    min: [0, 'Earnings cannot be negative']
  },
  baseSalary: {
    type: Number,
    default: 0,
    min: [0, 'Base salary cannot be negative']
  },
  commissionRate: {
    type: Number,
    default: 0.1,
    min: [0, 'Commission rate cannot be negative'],
    max: [1, 'Commission rate cannot exceed 100%']
  },
  
  // Location and Tracking
  currentLocation: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    },
    address: {
      type: String,
      trim: true
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  
  // Work Schedule
  workSchedule: {
    monday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    tuesday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    wednesday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    thursday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    friday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    saturday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    sunday: { start: String, end: String, isWorking: { type: Boolean, default: false } }
  },
  
  // Documents
  documents: {
    licenseNumber: {
      type: String,
      trim: true
    },
    licenseExpiry: {
      type: Date
    },
    insuranceNumber: {
      type: String,
      trim: true
    },
    insuranceExpiry: {
      type: Date
    },
    idProof: {
      type: String,
      trim: true
    }
  },
  
  // Metadata
  joinDate: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
deliveryPersonnelSchema.index({ email: 1 });
deliveryPersonnelSchema.index({ phone: 1 });
deliveryPersonnelSchema.index({ employeeId: 1 });
deliveryPersonnelSchema.index({ status: 1 });
deliveryPersonnelSchema.index({ zone: 1 });
deliveryPersonnelSchema.index({ isOnline: 1 });
deliveryPersonnelSchema.index({ 'currentLocation.latitude': 1, 'currentLocation.longitude': 1 });

// Virtual for performance calculation
deliveryPersonnelSchema.virtual('performance').get(function() {
  if (this.totalDeliveries === 0) return 'new';
  
  const completionRate = (this.completedDeliveries / this.totalDeliveries) * 100;
  const onTimeRate = (this.onTimeDeliveries / this.completedDeliveries) * 100;
  
  if (completionRate >= 95 && onTimeRate >= 90 && this.rating >= 4.5) {
    return 'excellent';
  } else if (completionRate >= 85 && onTimeRate >= 80 && this.rating >= 4.0) {
    return 'good';
  } else if (completionRate >= 70 && onTimeRate >= 70 && this.rating >= 3.5) {
    return 'average';
  } else {
    return 'poor';
  }
});

// Virtual for efficiency calculation
deliveryPersonnelSchema.virtual('efficiency').get(function() {
  if (this.totalDeliveries === 0) return 0;
  
  const completionRate = (this.completedDeliveries / this.totalDeliveries) * 100;
  const onTimeRate = this.completedDeliveries > 0 ? (this.onTimeDeliveries / this.completedDeliveries) * 100 : 0;
  
  return Math.round((completionRate + onTimeRate) / 2);
});

// Virtual for completion rate
deliveryPersonnelSchema.virtual('completionRate').get(function() {
  if (this.totalDeliveries === 0) return 0;
  return Math.round((this.completedDeliveries / this.totalDeliveries) * 100);
});

// Pre-save middleware
deliveryPersonnelSchema.pre('save', function(next) {
  // Update zone name if zone is populated
  if (this.zone && this.zone.name) {
    this.zoneName = this.zone.name;
  }
  
  // Ensure completed deliveries don't exceed total deliveries
  if (this.completedDeliveries > this.totalDeliveries) {
    this.completedDeliveries = this.totalDeliveries;
  }
  
  // Ensure on-time deliveries don't exceed completed deliveries
  if (this.onTimeDeliveries > this.completedDeliveries) {
    this.onTimeDeliveries = this.completedDeliveries;
  }
  
  next();
});

// Static method to find available personnel
deliveryPersonnelSchema.statics.findAvailable = function(zoneId) {
  return this.find({
    status: { $in: ['active', 'on_duty'] },
    zone: zoneId,
    isOnline: true
  }).populate('zone');
};

// Static method to get personnel statistics
deliveryPersonnelSchema.statics.getPersonnelStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalPersonnel: { $sum: 1 },
        activePersonnel: {
          $sum: { $cond: [{ $in: ['$status', ['active', 'on_duty']] }, 1, 0] }
        },
        onDutyPersonnel: {
          $sum: { $cond: [{ $eq: ['$status', 'on_duty'] }, 1, 0] }
        },
        averageRating: { $avg: '$rating' },
        totalDeliveries: { $sum: '$totalDeliveries' }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      totalPersonnel: 0,
      activePersonnel: 0,
      onDutyPersonnel: 0,
      averageRating: 0,
      totalDeliveries: 0,
      monthlyGrowth: 0
    };
  }

  // Calculate monthly growth (mock calculation)
  const monthlyGrowth = Math.random() * 15; // This would be calculated from historical data

  return {
    ...stats[0],
    averageRating: Math.round(stats[0].averageRating * 100) / 100,
    monthlyGrowth: Math.round(monthlyGrowth * 100) / 100
  };
};

// Instance method to update location
deliveryPersonnelSchema.methods.updateLocation = async function(latitude, longitude, address) {
  this.currentLocation = {
    latitude,
    longitude,
    address,
    lastUpdated: new Date()
  };
  this.lastActive = new Date();
  this.isOnline = true;
  
  await this.save();
};

// Instance method to go offline
deliveryPersonnelSchema.methods.goOffline = async function() {
  this.isOnline = false;
  this.status = 'off_duty';
  this.lastActive = new Date();
  
  await this.save();
};

// Instance method to go online
deliveryPersonnelSchema.methods.goOnline = async function() {
  this.isOnline = true;
  this.status = 'on_duty';
  this.lastActive = new Date();
  
  await this.save();
};

// Instance method to update performance
deliveryPersonnelSchema.methods.updatePerformance = async function(deliveryTime, isOnTime = true) {
  this.totalDeliveries += 1;
  this.completedDeliveries += 1;
  
  if (isOnTime) {
    this.onTimeDeliveries += 1;
  }
  
  // Update average delivery time
  const totalTime = (this.averageDeliveryTime * (this.completedDeliveries - 1)) + deliveryTime;
  this.averageDeliveryTime = Math.round(totalTime / this.completedDeliveries);
  
  await this.save();
};

export default mongoose.model('DeliveryPersonnel', deliveryPersonnelSchema);
