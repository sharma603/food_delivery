// Refund Model
// This file structure created as per requested organization
import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  customer: {
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
  reason: {
    type: String,
    required: true,
    enum: [
      'order_cancelled',
      'item_unavailable',
      'quality_issue',
      'wrong_order',
      'delivery_delay',
      'customer_request',
      'system_error'
    ]
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['full', 'partial'],
    default: 'full'
  },
  method: {
    type: String,
    enum: ['original_payment', 'wallet', 'bank_transfer'],
    default: 'original_payment'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  gatewayRefundId: {
    type: String
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  processedAt: {
    type: Date
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'processedByType'
  },
  processedByType: {
    type: String,
    enum: ['Admin', 'System']
  },
  failureReason: {
    type: String
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
refundSchema.index({ order: 1 });
refundSchema.index({ transaction: 1 });
refundSchema.index({ customer: 1, status: 1 });
refundSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Refund', refundSchema);
