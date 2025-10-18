// Coupon Model
// This file structure created as per requested organization
import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [3, 'Code must be at least 3 characters'],
    maxlength: [20, 'Code cannot exceed 20 characters']
  },
  name: {
    type: String,
    required: [true, 'Coupon name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  type: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed_amount', 'free_delivery']
  },
  value: {
    type: Number,
    required: true,
    min: [0, 'Value cannot be negative']
  },
  minOrderAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  maxDiscountAmount: {
    type: Number,
    min: 0
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  },
  applicableRestaurants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  }],
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  usageLimit: {
    total: {
      type: Number,
      min: 1
    },
    perUser: {
      type: Number,
      min: 1,
      default: 1
    }
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'createdByType',
    required: true
  },
  createdByType: {
    type: String,
    required: true,
    enum: ['Admin', 'Restaurant']
  },
  terms: {
    type: String,
    maxlength: [1000, 'Terms cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Virtual to check if coupon is expired
couponSchema.virtual('isExpired').get(function() {
  return new Date() > this.validUntil;
});

// Virtual to check if coupon is valid
couponSchema.virtual('isValid').get(function() {
  return this.isActive && !this.isExpired && 
         (!this.usageLimit.total || this.usageCount < this.usageLimit.total);
});

// Indexes
couponSchema.index({ code: 1 });
couponSchema.index({ restaurant: 1, isActive: 1 });
couponSchema.index({ validFrom: 1, validUntil: 1 });

export default mongoose.model('Coupon', couponSchema);
