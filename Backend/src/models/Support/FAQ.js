// FAQ Model
// This file structure created as per requested organization
import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true,
    maxlength: [500, 'Question cannot exceed 500 characters']
  },
  answer: {
    type: String,
    required: [true, 'Answer is required'],
    trim: true,
    maxlength: [2000, 'Answer cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: true,
    enum: [
      'orders',
      'payments',
      'delivery',
      'account',
      'restaurants',
      'app_usage',
      'troubleshooting',
      'policies',
      'other'
    ]
  },
  targetAudience: [{
    type: String,
    enum: ['customer', 'restaurant', 'delivery_partner'],
    default: ['customer']
  }],
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  notHelpfulCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  relatedArticles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FAQ'
  }]
}, {
  timestamps: true
});

// Text search index
faqSchema.index({ 
  question: 'text', 
  answer: 'text', 
  tags: 'text' 
});

// Other indexes
faqSchema.index({ category: 1, isActive: 1, sortOrder: 1 });
faqSchema.index({ targetAudience: 1, isActive: 1 });

export default mongoose.model('FAQ', faqSchema);
