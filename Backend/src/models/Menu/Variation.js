// Variation Model
// This file structure created as per requested organization
import mongoose from 'mongoose';

const variationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Variation name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  type: {
    type: String,
    required: true,
    enum: ['size', 'flavor', 'crust', 'temperature', 'other'],
    default: 'other'
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  priceType: {
    type: String,
    enum: ['fixed', 'additional'],
    default: 'additional'
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
variationSchema.index({ restaurant: 1, type: 1 });
variationSchema.index({ restaurant: 1, isActive: 1 });

export default mongoose.model('Variation', variationSchema);
