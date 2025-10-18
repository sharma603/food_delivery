import mongoose from 'mongoose';

const zoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Zone name is required'],
    trim: true,
    maxlength: [100, 'Zone name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  areas: [{
    type: String,
    trim: true,
    required: true
  }],
  pincodes: [{
    type: String,
    trim: true,
    match: [/^\d{5}$/, 'Pincode must be 5 digits']
  }],
  deliveryCharge: {
    type: Number,
    required: [true, 'Delivery charge is required'],
    min: [0, 'Delivery charge cannot be negative'],
    max: [1000, 'Delivery charge cannot exceed Rs. 1000']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  coverage: {
    type: String,
    trim: true,
    default: '5km radius'
  },
  estimatedDeliveryTime: {
    type: String,
    trim: true,
    default: '30-45 minutes'
  },
  coordinates: {
    center: {
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
    },
    boundaries: [{
      latitude: Number,
      longitude: Number
    }]
  },
  // Statistics (calculated fields)
  restaurantCount: {
    type: Number,
    default: 0
  },
  orderCount: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  // Metadata
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
zoneSchema.index({ name: 1 });
zoneSchema.index({ status: 1 });
zoneSchema.index({ areas: 1 });
zoneSchema.index({ pincodes: 1 });
zoneSchema.index({ 'coordinates.center.latitude': 1, 'coordinates.center.longitude': 1 });

// Virtual for efficiency calculation
zoneSchema.virtual('efficiency').get(function() {
  if (this.orderCount === 0) return 0;
  return Math.round((this.orderCount / (this.orderCount + (this.orderCount * 0.1))) * 100);
});

// Virtual for average delivery time
zoneSchema.virtual('averageDeliveryTime').get(function() {
  // This would be calculated from actual delivery data
  return this.estimatedDeliveryTime;
});

// Pre-save middleware
zoneSchema.pre('save', function(next) {
  // Convert areas to lowercase for consistency
  if (this.areas && this.areas.length > 0) {
    this.areas = this.areas.map(area => area.toLowerCase().trim());
  }
  
  // Remove duplicate areas
  this.areas = [...new Set(this.areas)];
  
  next();
});

// Static method to find zone by area
zoneSchema.statics.findByArea = function(area) {
  return this.findOne({
    areas: { $regex: new RegExp(area, 'i') },
    status: 'active'
  });
};

// Static method to find zone by pincode
zoneSchema.statics.findByPincode = function(pincode) {
  return this.findOne({
    pincodes: pincode,
    status: 'active'
  });
};

// Static method to get zone statistics
zoneSchema.statics.getZoneStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalZones: { $sum: 1 },
        activeZones: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        totalDeliveryCharges: { $sum: '$totalRevenue' },
        averageCharge: { $avg: '$deliveryCharge' },
        totalOrders: { $sum: '$orderCount' }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      totalZones: 0,
      activeZones: 0,
      totalDeliveryCharges: 0,
      averageCharge: 0,
      totalOrders: 0,
      monthlyGrowth: 0
    };
  }

  // Calculate monthly growth (mock calculation)
  const monthlyGrowth = Math.random() * 20; // This would be calculated from historical data

  return {
    ...stats[0],
    monthlyGrowth: Math.round(monthlyGrowth * 100) / 100
  };
};

// Instance method to update statistics
zoneSchema.methods.updateStats = async function() {
  // This would be called when orders are completed
  // For now, we'll use mock data
  this.orderCount = Math.floor(Math.random() * 2000) + 500;
  this.totalRevenue = this.orderCount * this.deliveryCharge;
  this.restaurantCount = Math.floor(Math.random() * 30) + 5;
  
  await this.save();
};

export default mongoose.model('Zone', zoneSchema);
