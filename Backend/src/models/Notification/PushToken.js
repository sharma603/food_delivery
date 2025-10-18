// PushToken Model
// This file structure created as per requested organization
import mongoose from 'mongoose';

const pushTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'userType',
    required: true
  },
  userType: {
    type: String,
    required: true,
    enum: ['Customer', 'Restaurant', 'DeliveryPartner', 'Staff']
  },
  token: {
    type: String,
    required: [true, 'Push token is required'],
    unique: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['ios', 'android', 'web']
  },
  deviceInfo: {
    deviceId: String,
    model: String,
    osVersion: String,
    appVersion: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
pushTokenSchema.index({ user: 1, userType: 1 });
pushTokenSchema.index({ token: 1 });
pushTokenSchema.index({ platform: 1, isActive: 1 });

export default mongoose.model('PushToken', pushTokenSchema);
