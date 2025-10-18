// DailySales Model
// This file structure created as per requested organization
import mongoose from 'mongoose';

const dailySalesSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  },
  totalOrders: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  completedOrders: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  cancelledOrders: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  totalRevenue: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  netRevenue: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  commission: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  deliveryFees: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  discounts: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  refunds: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  averageOrderValue: {
    type: Number,
    min: 0,
    default: 0
  },
  peakHours: [{
    hour: {
      type: Number,
      min: 0,
      max: 23
    },
    orderCount: {
      type: Number,
      min: 0
    }
  }],
  paymentMethods: {
    card: {
      count: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }
    },
    cash: {
      count: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }
    },
    wallet: {
      count: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }
    },
    upi: {
      count: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }
    }
  },
  topItems: [{
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    },
    quantity: Number,
    revenue: Number
  }],
  customerMetrics: {
    newCustomers: {
      type: Number,
      default: 0
    },
    returningCustomers: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Compound index for date and restaurant
dailySalesSchema.index({ date: 1, restaurant: 1 }, { unique: true });
dailySalesSchema.index({ date: -1 });
dailySalesSchema.index({ restaurant: 1, date: -1 });

export default mongoose.model('DailySales', dailySalesSchema);
