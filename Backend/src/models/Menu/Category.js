// Category Model
// This file structure created as per requested organization
import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  image: {
    type: String,
    default: null
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: function() {
      return !this.isGlobal; // Only required if not a global category
    }
  },
  // Reference to SuperAdmin global category
  globalCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SuperAdminCategory',
    default: null
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
  },
  deletedAt: {
    type: Date,
    default: null
  },
  // Additional fields for SuperAdmin categories
  displayName: {
    type: String,
    required: function() {
      return this.isGlobal; // Required for global categories
    },
    trim: true,
    maxlength: [50, 'Display name cannot exceed 50 characters'] 

  },
  icon: {
    type: String,
    default: 'restaurant'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  pricingSettings: {
    hasBasePrice: {
      type: Boolean,
      default: false
    },
    basePrice: {
      type: Number,
      default: 0
    },
    minPrice: {
      type: Number,
      default: null
    },
    maxPrice: {
      type: Number,
      default: null
    },
    currency: {
      type: String,
      default: 'NPR'
    }
  },
  rules: {
    maxItems: {
      type: Number,
      default: null
    },
    allowMultiplePhotos: {
      type: Boolean,
      default: true
    },
    requiresDescription: {
      type: Boolean,
      default: true
    },
    requiresPrice: {
      type: Boolean,
      default: true
    }
  },
  usage: {
    totalRestaurants: {
      type: Number,
      default: 0
    },
    totalMenuItems: {
      type: Number,
      default: 0
    },
    lastUsed: {
      type: Date,
      default: null
    }
  },
  isGlobal: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for menu items count
categorySchema.virtual('itemsCount', {
  ref: 'MenuItem',
  localField: '_id',
  foreignField: 'category',
  count: true
});

// Indexes
categorySchema.index({ restaurant: 1, name: 1 });
categorySchema.index({ restaurant: 1, sortOrder: 1 });

// Unique constraint to prevent duplicate categories (only for active categories)
// For global categories, only name needs to be unique
// For restaurant categories, name + restaurant combination needs to be unique
categorySchema.index(
  { name: 1, restaurant: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { isDeleted: false, isGlobal: false } 
  }
);

// Separate unique constraint for global categories
categorySchema.index(
  { name: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { isDeleted: false, isGlobal: true } 
  }
);

export default mongoose.model('Category', categorySchema);
