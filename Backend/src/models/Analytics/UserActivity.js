// UserActivity Model
// This file structure created as per requested organization
import mongoose from 'mongoose';

const userActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'userType',
    required: true
  },
  userType: {
    type: String,
    required: true,
    enum: ['Customer', 'Restaurant', 'DeliveryPartner', 'Admin']
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'order_placed',
      'order_cancelled',
      'payment_made',
      'review_submitted',
      'profile_updated',
      'menu_viewed',
      'restaurant_viewed',
      'search_performed',
      'coupon_used',
      'app_opened',
      'page_viewed',
      'button_clicked',
      'item_added_to_cart',
      'cart_abandoned'
    ]
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  metadata: {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant'
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    },
    searchTerm: String,
    pageUrl: String,
    referrer: String,
    userAgent: String,
    ipAddress: String,
    location: {
      city: String,
      state: String,
      country: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    }
  },
  platform: {
    type: String,
    enum: ['web', 'ios', 'android', 'admin_panel'],
    default: 'web'
  },
  sessionId: {
    type: String
  },
  duration: {
    type: Number // in seconds
  }
}, {
  timestamps: true
});

// Indexes
userActivitySchema.index({ user: 1, userType: 1, createdAt: -1 });
userActivitySchema.index({ action: 1, createdAt: -1 });
userActivitySchema.index({ 'metadata.restaurant': 1, action: 1 });
userActivitySchema.index({ sessionId: 1 });
userActivitySchema.index({ createdAt: -1 });

// TTL index to automatically delete old records after 90 days
userActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model('UserActivity', userActivitySchema);
