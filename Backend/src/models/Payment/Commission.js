// Commission Model
// This file structure created as per requested organization
import mongoose from 'mongoose';

const commissionSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  orderAmount: {
    type: Number,
    required: true,
    min: 0
  },
  commissionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  commissionAmount: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryCommission: {
    rate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    amount: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  paymentGatewayFee: {
    type: Number,
    min: 0,
    default: 0
  },
  totalDeductions: {
    type: Number,
    required: true,
    min: 0
  },
  netAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'paid'],
    default: 'pending'
  },
  payout: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payout'
  },
  processedAt: {
    type: Date
  },
  period: {
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: true
    }
  }
}, {
  timestamps: true
});

// Indexes
commissionSchema.index({ restaurant: 1, 'period.year': 1, 'period.month': 1 });
commissionSchema.index({ order: 1 });
commissionSchema.index({ status: 1, processedAt: -1 });
commissionSchema.index({ payout: 1 });

export default mongoose.model('Commission', commissionSchema);
