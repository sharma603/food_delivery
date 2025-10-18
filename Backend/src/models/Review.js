import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },
  images: [{ type: String }],
  response: {
    text: { type: String },
    respondedAt: { type: Date }
  }
}, { timestamps: true });

reviewSchema.index({ order: 1 });
reviewSchema.index({ customer: 1 });
reviewSchema.index({ restaurant: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;