// OrderDispute Model
// This file structure created as per requested organization
import mongoose from 'mongoose';

const orderDisputeSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  raisedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'raisedByType',
    required: true
  },
  raisedByType: {
    type: String,
    required: true,
    enum: ['Customer', 'Restaurant', 'DeliveryPartner']
  },
  type: {
    type: String,
    required: true,
    enum: [
      'quality_issue',
      'missing_items',
      'wrong_order',
      'delivery_delay',
      'payment_issue',
      'damage',
      'other'
    ]
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Subject cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  images: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  resolution: {
    type: String,
    maxlength: [1000, 'Resolution cannot exceed 1000 characters']
  },
  refundAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

// Indexes
orderDisputeSchema.index({ order: 1 });
orderDisputeSchema.index({ status: 1, priority: 1 });
orderDisputeSchema.index({ assignedTo: 1, status: 1 });

export default mongoose.model('OrderDispute', orderDisputeSchema);
