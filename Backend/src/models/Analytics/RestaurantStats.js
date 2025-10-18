// RestaurantStats Model
// This file structure created as per requested organization
import mongoose from 'mongoose';

const restaurantStatsSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  period: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'yearly']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  orders: {
    total: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    cancelled: { type: Number, default: 0 },
    averageValue: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 }
  },
  revenue: {
    gross: { type: Number, default: 0 },
    net: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
    growth: { type: Number, default: 0 } // percentage
  },
  customers: {
    total: { type: Number, default: 0 },
    new: { type: Number, default: 0 },
    returning: { type: Number, default: 0 },
    retentionRate: { type: Number, default: 0 }
  },
  menu: {
    totalItems: { type: Number, default: 0 },
    activeItems: { type: Number, default: 0 },
    topSellingItems: [{
      menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem'
      },
      name: String,
      quantity: Number,
      revenue: Number
    }],
    leastSellingItems: [{
      menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem'
      },
      name: String,
      quantity: Number,
      revenue: Number
    }]
  },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
    distribution: {
      five: { type: Number, default: 0 },
      four: { type: Number, default: 0 },
      three: { type: Number, default: 0 },
      two: { type: Number, default: 0 },
      one: { type: Number, default: 0 }
    }
  },
  delivery: {
    averageTime: { type: Number, default: 0 }, // in minutes
    onTimeRate: { type: Number, default: 0 },  // percentage
    delayedOrders: { type: Number, default: 0 }
  },
  promotions: {
    couponsUsed: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 }
  },
  peakHours: [{
    hour: Number,
    orderCount: Number,
    revenue: Number
  }],
  paymentAnalytics: {
    card: { count: Number, amount: Number, percentage: Number },
    cash: { count: Number, amount: Number, percentage: Number },
    wallet: { count: Number, amount: Number, percentage: Number },
    upi: { count: Number, amount: Number, percentage: Number }
  }
}, {
  timestamps: true
});

// Indexes
restaurantStatsSchema.index({ restaurant: 1, period: 1, startDate: 1 });
restaurantStatsSchema.index({ restaurant: 1, startDate: -1 });

export default mongoose.model('RestaurantStats', restaurantStatsSchema);
