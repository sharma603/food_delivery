// Payout Model
// This file structure created as per requested organization
import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  totalOrderAmount: {
    type: Number,
    required: true,
    min: 0
  },
  commission: {
    rate: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    }
  },
  taxes: {
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
  adjustments: {
    type: Number,
    default: 0
  },
  netAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'paypal', 'stripe'],
    default: 'bank_transfer'
  },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    routingNumber: String,
    bankName: String
  },
  transactionId: {
    type: String
  },
  processedAt: {
    type: Date
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Indexes
payoutSchema.index({ restaurant: 1, 'period.startDate': 1 });
payoutSchema.index({ status: 1, createdAt: -1 });
payoutSchema.index({ processedBy: 1, status: 1 });

export default mongoose.model('Payout', payoutSchema);
