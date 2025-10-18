// Role Model
// This file structure created as per requested organization
import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Role name cannot exceed 50 characters']
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
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 10 // 1 is highest level (super admin), 10 is lowest
  },
  userType: {
    type: String,
    required: true,
    enum: ['Admin', 'Restaurant', 'Staff', 'DeliveryPartner']
  },
  isSystemRole: {
    type: Boolean,
    default: false // System roles cannot be deleted
  },
  isActive: {
    type: Boolean,
    default: true
  },
  maxUsers: {
    type: Number,
    min: 0 // 0 means unlimited
  },
  currentUsers: {
    type: Number,
    default: 0,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for permission names
roleSchema.virtual('permissionNames', {
  ref: 'Permission',
  localField: 'permissions',
  foreignField: '_id',
  options: { select: 'name' }
});

// Pre-save middleware to generate slug
roleSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '_');
  }
  next();
});

// Indexes
roleSchema.index({ name: 1 });
roleSchema.index({ slug: 1 });
roleSchema.index({ userType: 1, level: 1 });
roleSchema.index({ isActive: 1, userType: 1 });

export default mongoose.model('Role', roleSchema);
