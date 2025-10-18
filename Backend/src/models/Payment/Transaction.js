// Transaction Model
// This file structure created as per requested organization
import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
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
  paymentMethod: {
    type: String,
    required: true,
    enum: ['card', 'wallet', 'cash', 'upi', 'net_banking']
  },
  paymentGateway: {
    type: String,
    enum: ['stripe', 'razorpay', 'paypal', 'cash'],
    required: true
  },
  gatewayTransactionId: {
    type: String
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['payment', 'refund', 'payout'],
    default: 'payment'
  },
  fees: {
    type: Number,
    min: 0,
    default: 0
  },
  netAmount: {
    type: Number,
    required: true,
    min: 0
  },
  failureReason: {
    type: String
  },
  processedAt: {
    type: Date
  },
  refundedAt: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ order: 1 });
transactionSchema.index({ user: 1, status: 1 });
transactionSchema.index({ paymentGateway: 1, gatewayTransactionId: 1 });
transactionSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Transaction', transactionSchema);
