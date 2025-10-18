// Addon Model
// This file structure created as per requested organization
import mongoose from 'mongoose';

const addonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Addon name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  isRequired: {
    type: Boolean,
    default: false
  },
  maxSelections: {
    type: Number,
    default: 1,
    min: 1
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
addonSchema.index({ restaurant: 1, category: 1 });
addonSchema.index({ restaurant: 1, isActive: 1 });

export default mongoose.model('Addon', addonSchema);
