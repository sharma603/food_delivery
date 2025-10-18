// ReviewResponse Model
// This file structure created as per requested organization
import mongoose from 'mongoose';

const reviewResponseSchema = new mongoose.Schema({
  review: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
    required: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  message: {
    type: String,
    required: [true, 'Response message is required'],
    trim: true,
    maxlength: [1000, 'Response cannot exceed 1000 characters']
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'respondedByType',
    required: true
  },
  respondedByType: {
    type: String,
    required: true,
    enum: ['Restaurant', 'Staff']
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
reviewResponseSchema.index({ review: 1 });
reviewResponseSchema.index({ restaurant: 1, createdAt: -1 });

export default mongoose.model('ReviewResponse', reviewResponseSchema);
