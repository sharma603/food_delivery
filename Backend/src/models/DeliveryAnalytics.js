import mongoose from 'mongoose';

const deliveryAnalyticsSchema = new mongoose.Schema({
  // Date and Time Information
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
  },
  hour: {
    type: Number,
    min: 0,
    max: 23
  },
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6 // 0 = Sunday, 1 = Monday, etc.
  },
  month: {
    type: Number,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    min: 2020
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
      required: true,
      trim: true
    }
  },
  
  // Personnel Information
  personnel: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryPersonnel'
    },
    name: {
      type: String,
      trim: true
    }
  },
  
  // Delivery Metrics
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
  failedDeliveries: {
    type: Number,
    default: 0,
    min: [0, 'Failed deliveries cannot be negative']
  },
  
  // Time Metrics
  averageDeliveryTime: {
    type: Number,
    default: 0,
    min: [0, 'Average delivery time cannot be negative']
  },
  totalDeliveryTime: {
    type: Number,
    default: 0,
    min: [0, 'Total delivery time cannot be negative']
  },
  onTimeDeliveries: {
    type: Number,
    default: 0,
    min: [0, 'On-time deliveries cannot be negative']
  },
  delayedDeliveries: {
    type: Number,
    default: 0,
    min: [0, 'Delayed deliveries cannot be negative']
  },
  
  // Distance Metrics
  totalDistance: {
    type: Number,
    default: 0,
    min: [0, 'Total distance cannot be negative']
  },
  averageDistance: {
    type: Number,
    default: 0,
    min: [0, 'Average distance cannot be negative']
  },
  
  // Financial Metrics
  totalRevenue: {
    type: Number,
    default: 0,
    min: [0, 'Total revenue cannot be negative']
  },
  totalDeliveryCharges: {
    type: Number,
    default: 0,
    min: [0, 'Total delivery charges cannot be negative']
  },
  averageOrderValue: {
    type: Number,
    default: 0,
    min: [0, 'Average order value cannot be negative']
  },
  
  // Customer Satisfaction
  averageRating: {
    type: Number,
    default: 0,
    min: [0, 'Average rating cannot be negative'],
    max: [5, 'Average rating cannot exceed 5']
  },
  totalRatings: {
    type: Number,
    default: 0,
    min: [0, 'Total ratings cannot be negative']
  },
  positiveRatings: {
    type: Number,
    default: 0,
    min: [0, 'Positive ratings cannot be negative']
  },
  negativeRatings: {
    type: Number,
    default: 0,
    min: [0, 'Negative ratings cannot be negative']
  },
  
  // Performance Metrics
  completionRate: {
    type: Number,
    default: 0,
    min: [0, 'Completion rate cannot be negative'],
    max: [100, 'Completion rate cannot exceed 100%']
  },
  onTimeRate: {
    type: Number,
    default: 0,
    min: [0, 'On-time rate cannot be negative'],
    max: [100, 'On-time rate cannot exceed 100%']
  },
  efficiency: {
    type: Number,
    default: 0,
    min: [0, 'Efficiency cannot be negative'],
    max: [100, 'Efficiency cannot exceed 100%']
  },
  
  // Peak Hours Analysis
  isPeakHour: {
    type: Boolean,
    default: false
  },
  peakHourMultiplier: {
    type: Number,
    default: 1.0,
    min: [0, 'Peak hour multiplier cannot be negative']
  },
  
  // Weather Impact (if available)
  weather: {
    condition: {
      type: String,
      enum: ['sunny', 'cloudy', 'rainy', 'stormy', 'snowy']
    },
    temperature: {
      type: Number
    },
    impact: {
      type: Number,
      default: 0 // -1 to 1, negative = negative impact, positive = positive impact
    }
  },
  
  // Special Events
  specialEvents: [{
    name: {
      type: String,
      trim: true
    },
    impact: {
      type: Number,
      default: 0
    }
  }],
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
deliveryAnalyticsSchema.index({ date: -1 });
deliveryAnalyticsSchema.index({ 'zone.id': 1, date: -1 });
deliveryAnalyticsSchema.index({ 'personnel.id': 1, date: -1 });
deliveryAnalyticsSchema.index({ hour: 1, date: -1 });
deliveryAnalyticsSchema.index({ dayOfWeek: 1, date: -1 });
deliveryAnalyticsSchema.index({ month: 1, year: 1 });

// Compound indexes for common queries
deliveryAnalyticsSchema.index({ 'zone.id': 1, 'personnel.id': 1, date: -1 });
deliveryAnalyticsSchema.index({ date: -1, hour: 1 });

// Virtual for success rate
deliveryAnalyticsSchema.virtual('successRate').get(function() {
  if (this.totalDeliveries === 0) return 0;
  return Math.round((this.completedDeliveries / this.totalDeliveries) * 100);
});

// Virtual for customer satisfaction score
deliveryAnalyticsSchema.virtual('satisfactionScore').get(function() {
  if (this.totalRatings === 0) return 0;
  return Math.round((this.positiveRatings / this.totalRatings) * 100);
});

// Virtual for performance grade
deliveryAnalyticsSchema.virtual('performanceGrade').get(function() {
  const score = (this.completionRate + this.onTimeRate + this.satisfactionScore) / 3;
  
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
});

// Pre-save middleware
deliveryAnalyticsSchema.pre('save', function(next) {
  // Calculate derived metrics
  if (this.totalDeliveries > 0) {
    this.completionRate = Math.round((this.completedDeliveries / this.totalDeliveries) * 100);
    this.averageDistance = Math.round((this.totalDistance / this.completedDeliveries) * 100) / 100;
    this.averageOrderValue = Math.round((this.totalRevenue / this.completedDeliveries) * 100) / 100;
  }
  
  if (this.completedDeliveries > 0) {
    this.onTimeRate = Math.round((this.onTimeDeliveries / this.completedDeliveries) * 100);
    this.averageDeliveryTime = Math.round(this.totalDeliveryTime / this.completedDeliveries);
  }
  
  // Calculate efficiency
  this.efficiency = Math.round((this.completionRate + this.onTimeRate) / 2);
  
  // Set date components
  if (this.date) {
    this.dayOfWeek = this.date.getDay();
    this.month = this.date.getMonth() + 1;
    this.year = this.date.getFullYear();
  }
  
  next();
});

// Static method to get overall statistics
deliveryAnalyticsSchema.statics.getOverallStats = async function(dateRange = 'week') {
  const { startDate, endDate } = getDateRange(dateRange);
  
  const stats = await this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalDeliveries: { $sum: '$totalDeliveries' },
        completedDeliveries: { $sum: '$completedDeliveries' },
        cancelledDeliveries: { $sum: '$cancelledDeliveries' },
        averageDeliveryTime: { $avg: '$averageDeliveryTime' },
        onTimeRate: { $avg: '$onTimeRate' },
        customerSatisfaction: { $avg: '$averageRating' },
        totalRevenue: { $sum: '$totalRevenue' },
        averageOrderValue: { $avg: '$averageOrderValue' }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return {
      totalDeliveries: 0,
      completedDeliveries: 0,
      cancelledDeliveries: 0,
      averageDeliveryTime: 0,
      onTimeRate: 0,
      customerSatisfaction: 0,
      totalRevenue: 0,
      averageOrderValue: 0
    };
  }
  
  return {
    ...stats[0],
    averageDeliveryTime: Math.round(stats[0].averageDeliveryTime || 0),
    onTimeRate: Math.round(stats[0].onTimeRate || 0),
    customerSatisfaction: Math.round((stats[0].customerSatisfaction || 0) * 100) / 100,
    averageOrderValue: Math.round((stats[0].averageOrderValue || 0) * 100) / 100
  };
};

// Static method to get zone performance
deliveryAnalyticsSchema.statics.getZonePerformance = async function(dateRange = 'week') {
  const { startDate, endDate } = getDateRange(dateRange);
  
  const stats = await this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        'zone.id': { $exists: true }
      }
    },
    {
      $group: {
        _id: '$zone.id',
        zone: { $first: '$zone.name' },
        totalDeliveries: { $sum: '$totalDeliveries' },
        completedDeliveries: { $sum: '$completedDeliveries' },
        averageTime: { $avg: '$averageDeliveryTime' },
        onTimeRate: { $avg: '$onTimeRate' },
        customerRating: { $avg: '$averageRating' },
        revenue: { $sum: '$totalRevenue' },
        efficiency: { $avg: '$efficiency' }
      }
    },
    {
      $sort: { efficiency: -1 }
    }
  ]);
  
  return stats.map(stat => ({
    zone: stat.zone,
    totalDeliveries: stat.totalDeliveries,
    completedDeliveries: stat.completedDeliveries,
    averageTime: Math.round(stat.averageTime || 0),
    onTimeRate: Math.round(stat.onTimeRate || 0),
    customerRating: Math.round((stat.customerRating || 0) * 100) / 100,
    revenue: stat.revenue,
    efficiency: Math.round(stat.efficiency || 0)
  }));
};

// Static method to get personnel performance
deliveryAnalyticsSchema.statics.getPersonnelPerformance = async function(dateRange = 'week') {
  const { startDate, endDate } = getDateRange(dateRange);
  
  const stats = await this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        'personnel.id': { $exists: true }
      }
    },
    {
      $group: {
        _id: '$personnel.id',
        name: { $first: '$personnel.name' },
        zone: { $first: '$zone.name' },
        totalDeliveries: { $sum: '$totalDeliveries' },
        completedDeliveries: { $sum: '$completedDeliveries' },
        averageTime: { $avg: '$averageDeliveryTime' },
        onTimeRate: { $avg: '$onTimeRate' },
        customerRating: { $avg: '$averageRating' },
        earnings: { $sum: '$totalDeliveryCharges' },
        efficiency: { $avg: '$efficiency' }
      }
    },
    {
      $sort: { efficiency: -1 }
    }
  ]);
  
  return stats.map(stat => ({
    id: stat._id,
    name: stat.name,
    zone: stat.zone,
    totalDeliveries: stat.totalDeliveries,
    completedDeliveries: stat.completedDeliveries,
    averageTime: Math.round(stat.averageTime || 0),
    onTimeRate: Math.round(stat.onTimeRate || 0),
    customerRating: Math.round((stat.customerRating || 0) * 100) / 100,
    earnings: stat.earnings,
    efficiency: Math.round(stat.efficiency || 0),
    performance: getPerformanceGrade(stat.efficiency)
  }));
};

// Static method to get time analytics
deliveryAnalyticsSchema.statics.getTimeAnalytics = async function(dateRange = 'week') {
  const { startDate, endDate } = getDateRange(dateRange);
  
  const stats = await this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        hour: { $exists: true }
      }
    },
    {
      $group: {
        _id: '$hour',
        deliveries: { $sum: '$totalDeliveries' },
        averageTime: { $avg: '$averageDeliveryTime' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
  
  return stats.map(stat => ({
    hour: `${stat._id.toString().padStart(2, '0')}:00`,
    deliveries: stat.deliveries,
    averageTime: Math.round(stat.averageTime || 0)
  }));
};

// Static method to get delivery trends
deliveryAnalyticsSchema.statics.getDeliveryTrends = async function(dateRange = 'week') {
  const { startDate, endDate } = getDateRange(dateRange);
  
  const stats = await this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$date' }
        },
        deliveries: { $sum: '$totalDeliveries' },
        revenue: { $sum: '$totalRevenue' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
  
  return stats.map(stat => ({
    date: stat._id,
    deliveries: stat.deliveries,
    revenue: stat.revenue
  }));
};

// Static method to get top performing zones
deliveryAnalyticsSchema.statics.getTopZones = async function(limit = 10) {
  const stats = await this.aggregate([
    {
      $match: {
        'zone.id': { $exists: true }
      }
    },
    {
      $group: {
        _id: '$zone.id',
        zone: { $first: '$zone.name' },
        efficiency: { $avg: '$efficiency' },
        deliveries: { $sum: '$totalDeliveries' }
      }
    },
    {
      $sort: { efficiency: -1 }
    },
    {
      $limit: limit
    }
  ]);
  
  return stats.map(stat => ({
    zone: stat.zone,
    efficiency: Math.round(stat.efficiency || 0),
    deliveries: stat.deliveries
  }));
};

// Static method to get top performing personnel
deliveryAnalyticsSchema.statics.getTopPersonnel = async function(limit = 10) {
  const stats = await this.aggregate([
    {
      $match: {
        'personnel.id': { $exists: true }
      }
    },
    {
      $group: {
        _id: '$personnel.id',
        name: { $first: '$personnel.name' },
        efficiency: { $avg: '$efficiency' },
        deliveries: { $sum: '$totalDeliveries' },
        rating: { $avg: '$averageRating' }
      }
    },
    {
      $sort: { efficiency: -1 }
    },
    {
      $limit: limit
    }
  ]);
  
  return stats.map(stat => ({
    name: stat.name,
    efficiency: Math.round(stat.efficiency || 0),
    deliveries: stat.deliveries,
    rating: Math.round((stat.rating || 0) * 100) / 100
  }));
};

// Helper function to get date range
function getDateRange(range) {
  const endDate = new Date();
  const startDate = new Date();
  
  switch (range) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 7);
  }
  
  return { startDate, endDate };
}

// Helper function to get performance grade
function getPerformanceGrade(efficiency) {
  if (efficiency >= 90) return 'excellent';
  if (efficiency >= 80) return 'good';
  if (efficiency >= 70) return 'average';
  return 'poor';
}

export default mongoose.model('DeliveryAnalytics', deliveryAnalyticsSchema);
