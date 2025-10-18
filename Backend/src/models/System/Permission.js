// Permission Model
// This file structure created as per requested organization
import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Permission name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Permission name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [300, 'Description cannot exceed 300 characters']
  },
  resource: {
    type: String,
    required: true,
    enum: [
      'users',
      'restaurants',
      'orders',
      'payments',
      'reviews',
      'analytics',
      'settings',
      'support',
      'promotions',
      'notifications',
      'reports',
      'audit_logs',
      'menu_items',
      'categories',
      'staff',
      'delivery_partners',
      'system'
    ]
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'read', 'update', 'delete', 'approve', 'export', 'manage']
  },
  category: {
    type: String,
    required: true,
    enum: [
      'user_management',
      'restaurant_management', 
      'order_management',
      'payment_management',
      'content_management',
      'system_administration',
      'analytics_reporting',
      'customer_support',
      'marketing_promotions'
    ]
  },
  isSystemPermission: {
    type: Boolean,
    default: false // System permissions cannot be deleted
  },
  isActive: {
    type: Boolean,
    default: true
  },
  level: {
    type: String,
    enum: ['basic', 'advanced', 'super'],
    default: 'basic'
  },
  dependencies: [{ // Permissions that are required for this permission
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  conflictsWith: [{ // Permissions that conflict with this one
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

// Pre-save middleware to generate slug
permissionSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '_');
  }
  next();
});

// Static method to get permission by resource and action
permissionSchema.statics.findByResourceAction = function(resource, action) {
  return this.findOne({ resource, action, isActive: true });
};

// Indexes
permissionSchema.index({ name: 1 });
permissionSchema.index({ slug: 1 });
permissionSchema.index({ resource: 1, action: 1 });
permissionSchema.index({ category: 1, level: 1 });

export default mongoose.model('Permission', permissionSchema);
