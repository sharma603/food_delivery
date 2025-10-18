// OrderTracking Model
// This file structure created as per requested organization
import mongoose from 'mongoose';

const orderTrackingSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: [
      'placed',
      'confirmed',
      'preparing',
      'ready',
      'picked_up',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'rejected'
    ]
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    maxlength: [200, 'Notes cannot exceed 200 characters']
  },
  location: {
    latitude: Number,
    longitude: Number
  },
  estimatedTime: {
    type: Date
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'updatedByType'
  },
  updatedByType: {
    type: String,
    enum: ['Restaurant', 'DeliveryPartner', 'Customer', 'Admin']
  }
}, {
  timestamps: true
});

// Indexes
orderTrackingSchema.index({ order: 1, timestamp: -1 });
orderTrackingSchema.index({ status: 1, timestamp: -1 });

export default mongoose.model('OrderTracking', orderTrackingSchema);
