// Offer Model
// This file structure created as per requested organization
import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Offer title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Offer description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    type: String
  },
  type: {
    type: String,
    required: true,
    enum: ['buy_x_get_y', 'combo_meal', 'happy_hour', 'first_order', 'loyalty']
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  applicableItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  }],
  conditions: {
    minItems: {
      type: Number,
      min: 1
    },
    minAmount: {
      type: Number,
      min: 0
    },
    timeSlot: {
      startTime: String, // HH:MM format
      endTime: String    // HH:MM format
    },
    daysOfWeek: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  },
  discount: {
    type: {
      type: String,
      required: true,
      enum: ['percentage', 'fixed_amount', 'free_item']
    },
    value: {
      type: Number,
      required: true,
      min: 0
    },
    maxAmount: {
      type: Number,
      min: 0
    }
  },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    min: 1
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
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  }
}, {
  timestamps: true
});

// Virtual to check if offer is expired
offerSchema.virtual('isExpired').get(function() {
  return new Date() > this.validUntil;
});

// Virtual to check if offer is valid
offerSchema.virtual('isValid').get(function() {
  return this.isActive && !this.isExpired && 
         (!this.usageLimit || this.usageCount < this.usageLimit);
});

// Indexes
offerSchema.index({ restaurant: 1, isActive: 1 });
offerSchema.index({ validFrom: 1, validUntil: 1 });
offerSchema.index({ type: 1, priority: -1 });

export default mongoose.model('Offer', offerSchema);
