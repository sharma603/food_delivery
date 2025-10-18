import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
  // Order Information
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required']
  },
  orderNumber: {
    type: String,
    required: [true, 'Order number is required'],
    trim: true
  },
  
  // Customer Information
  customer: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Customer phone is required']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  
  // Delivery Address
  deliveryAddress: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true
    },
    landmark: {
      type: String,
      trim: true
    },
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      }
    }
  },
  
  // Restaurant Information
  restaurant: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Restaurant address is required'],
      trim: true
    },
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      }
    }
  },
  
  // Delivery Personnel
  deliveryPersonnel: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryPersonnel',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Delivery personnel name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Delivery personnel phone is required']
    },
    vehicleType: {
      type: String,
      required: true
    },
    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    }
  },
  
  // Zone Information
  zone: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Zone name is required'],
      trim: true
    },
    deliveryCharge: {
      type: Number,
      required: [true, 'Delivery charge is required'],
      min: [0, 'Delivery charge cannot be negative']
    }
  },
  
  // Delivery Status and Tracking
  status: {
    type: String,
    enum: ['assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'delayed', 'failed'],
    default: 'assigned'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Timestamps
  assignedAt: {
    type: Date,
    default: Date.now
  },
  pickedUpAt: {
    type: Date
  },
  estimatedDelivery: {
    type: Date,
    required: [true, 'Estimated delivery time is required']
  },
  actualDelivery: {
    type: Date
  },
  
  // Location Tracking
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
  
  // Distance and Time
  distance: {
    type: Number,
    min: [0, 'Distance cannot be negative']
  },
  estimatedTimeRemaining: {
    type: Number,
    min: [0, 'Estimated time cannot be negative']
  },
  actualDeliveryTime: {
    type: Number,
    min: [0, 'Actual delivery time cannot be negative']
  },
  
  // Financial Information
  orderValue: {
    type: Number,
    required: [true, 'Order value is required'],
    min: [0, 'Order value cannot be negative']
  },
  deliveryCharge: {
    type: Number,
    required: [true, 'Delivery charge is required'],
    min: [0, 'Delivery charge cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    enum: ['Cash on Delivery', 'Credit Card', 'Debit Card', 'Digital Wallet', 'Bank Transfer'],
    required: [true, 'Payment method is required']
  },
  
  // Special Instructions
  specialInstructions: {
    type: String,
    trim: true,
    maxlength: [500, 'Special instructions cannot exceed 500 characters']
  },
  
  // Delay Information
  isDelayed: {
    type: Boolean,
    default: false
  },
  delayReason: {
    type: String,
    trim: true
  },
  delayTime: {
    type: Number,
    min: [0, 'Delay time cannot be negative']
  },
  
  // Customer Feedback
  customerRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  customerFeedback: {
    type: String,
    trim: true,
    maxlength: [1000, 'Feedback cannot exceed 1000 characters']
  },
  
  // Delivery Proof
  deliveryProof: {
    images: [{
      url: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    signature: {
      type: String
    },
    notes: {
      type: String,
      trim: true
    }
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
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
deliverySchema.index({ orderId: 1 });
deliverySchema.index({ 'customer.id': 1 });
deliverySchema.index({ 'restaurant.id': 1 });
deliverySchema.index({ 'deliveryPersonnel.id': 1 });
deliverySchema.index({ 'zone.id': 1 });
deliverySchema.index({ status: 1 });
deliverySchema.index({ priority: 1 });
deliverySchema.index({ assignedAt: -1 });
deliverySchema.index({ estimatedDelivery: 1 });
deliverySchema.index({ isDelayed: 1 });
deliverySchema.index({ 'currentLocation.latitude': 1, 'currentLocation.longitude': 1 });

// Virtual for delivery duration
deliverySchema.virtual('deliveryDuration').get(function() {
  if (this.actualDelivery && this.assignedAt) {
    return Math.round((this.actualDelivery - this.assignedAt) / (1000 * 60)); // in minutes
  }
  return null;
});

// Virtual for on-time delivery
deliverySchema.virtual('isOnTime').get(function() {
  if (this.actualDelivery && this.estimatedDelivery) {
    return this.actualDelivery <= this.estimatedDelivery;
  }
  return null;
});

// Virtual for delay duration
deliverySchema.virtual('delayDuration').get(function() {
  if (this.isDelayed && this.actualDelivery && this.estimatedDelivery) {
    return Math.round((this.actualDelivery - this.estimatedDelivery) / (1000 * 60)); // in minutes
  }
  return 0;
});

// Pre-save middleware
deliverySchema.pre('save', function(next) {
  // Calculate total amount
  this.totalAmount = this.orderValue + this.deliveryCharge;
  
  // Update estimated time remaining
  if (this.estimatedDelivery) {
    const now = new Date();
    const timeDiff = this.estimatedDelivery - now;
    this.estimatedTimeRemaining = Math.max(0, Math.round(timeDiff / (1000 * 60))); // in minutes
  }
  
  // Set delay status
  if (this.estimatedDelivery && new Date() > this.estimatedDelivery && this.status !== 'delivered') {
    this.isDelayed = true;
    if (!this.delayReason) {
      this.delayReason = 'Delivery delayed';
    }
  }
  
  next();
});

// Static method to find active deliveries
deliverySchema.statics.findActive = function() {
  return this.find({
    status: { $in: ['assigned', 'picked_up', 'in_transit'] }
  }).populate([
    { path: 'orderId', select: 'orderNumber items' },
    { path: 'customer.id', select: 'name phone email' },
    { path: 'restaurant.id', select: 'name address' },
    { path: 'deliveryPersonnel.id', select: 'name phone vehicleType vehicleNumber' },
    { path: 'zone.id', select: 'name deliveryCharge' }
  ]);
};

// Static method to find deliveries by personnel
deliverySchema.statics.findByPersonnel = function(personnelId) {
  return this.find({
    'deliveryPersonnel.id': personnelId
  }).populate([
    { path: 'orderId', select: 'orderNumber items' },
    { path: 'customer.id', select: 'name phone email' },
    { path: 'restaurant.id', select: 'name address' },
    { path: 'zone.id', select: 'name deliveryCharge' }
  ]);
};

// Static method to find deliveries by zone
deliverySchema.statics.findByZone = function(zoneId) {
  return this.find({
    'zone.id': zoneId
  }).populate([
    { path: 'orderId', select: 'orderNumber items' },
    { path: 'customer.id', select: 'name phone email' },
    { path: 'restaurant.id', select: 'name address' },
    { path: 'deliveryPersonnel.id', select: 'name phone vehicleType vehicleNumber' }
  ]);
};

// Static method to get tracking statistics
deliverySchema.statics.getTrackingStats = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const stats = await this.aggregate([
    {
      $facet: {
        activeDeliveries: [
          { $match: { status: { $in: ['assigned', 'picked_up', 'in_transit'] } } },
          { $count: 'count' }
        ],
        completedToday: [
          { $match: { status: 'delivered', actualDelivery: { $gte: today } } },
          { $count: 'count' }
        ],
        onTimeDeliveries: [
          { $match: { status: 'delivered', actualDelivery: { $gte: today } } },
          {
            $addFields: {
              isOnTime: { $lte: ['$actualDelivery', '$estimatedDelivery'] }
            }
          },
          { $match: { isOnTime: true } },
          { $count: 'count' }
        ],
        delayedDeliveries: [
          { $match: { isDelayed: true, status: { $in: ['assigned', 'picked_up', 'in_transit'] } } },
          { $count: 'count' }
        ],
        averageDeliveryTime: [
          { $match: { status: 'delivered', actualDelivery: { $gte: today } } },
          {
            $addFields: {
              deliveryTime: { $divide: [{ $subtract: ['$actualDelivery', '$assignedAt'] }, 60000] }
            }
          },
          { $group: { _id: null, avgTime: { $avg: '$deliveryTime' } } }
        ],
        totalDistance: [
          { $match: { status: 'delivered', actualDelivery: { $gte: today } } },
          { $group: { _id: null, totalDistance: { $sum: '$distance' } } }
        ]
      }
    }
  ]);

  const result = stats[0];
  
  return {
    activeDeliveries: result.activeDeliveries[0]?.count || 0,
    completedToday: result.completedToday[0]?.count || 0,
    averageDeliveryTime: Math.round(result.averageDeliveryTime[0]?.avgTime || 0),
    onTimeDeliveries: result.onTimeDeliveries[0]?.count || 0,
    delayedDeliveries: result.delayedDeliveries[0]?.count || 0,
    totalDistance: result.totalDistance[0]?.totalDistance || 0
  };
};

// Instance method to update status
deliverySchema.methods.updateStatus = async function(newStatus, updatedBy) {
  const oldStatus = this.status;
  this.status = newStatus;
  this.updatedBy = updatedBy;
  
  // Set timestamps based on status
  switch (newStatus) {
    case 'picked_up':
      this.pickedUpAt = new Date();
      break;
    case 'delivered':
      this.actualDelivery = new Date();
      this.actualDeliveryTime = this.deliveryDuration;
      break;
    case 'cancelled':
      // Handle cancellation logic
      break;
  }
  
  await this.save();
  
  // Update personnel performance if delivered
  if (newStatus === 'delivered' && oldStatus !== 'delivered') {
    const { default: DeliveryPersonnel } = await import('./DeliveryPersonnel.js');
    const personnel = await DeliveryPersonnel.findById(this.deliveryPersonnel.id);
    if (personnel) {
      const isOnTime = this.isOnTime;
      await personnel.updatePerformance(this.actualDeliveryTime || 30, isOnTime);
    }
  }
};

// Instance method to update location
deliverySchema.methods.updateLocation = async function(latitude, longitude, address) {
  this.currentLocation = {
    latitude,
    longitude,
    address,
    lastUpdated: new Date()
  };
  
  // Update estimated time remaining based on new location
  if (this.estimatedDelivery) {
    const now = new Date();
    const timeDiff = this.estimatedDelivery - now;
    this.estimatedTimeRemaining = Math.max(0, Math.round(timeDiff / (1000 * 60)));
  }
  
  await this.save();
};

// Instance method to add delay
deliverySchema.methods.addDelay = async function(reason, delayTime) {
  this.isDelayed = true;
  this.delayReason = reason;
  this.delayTime = delayTime;
  
  // Extend estimated delivery time
  if (this.estimatedDelivery) {
    this.estimatedDelivery = new Date(this.estimatedDelivery.getTime() + (delayTime * 60000));
  }
  
  await this.save();
};

export default mongoose.model('Delivery', deliverySchema);
