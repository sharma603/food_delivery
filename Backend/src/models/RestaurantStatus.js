import mongoose from 'mongoose';

const restaurantStatusSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RestaurantUser',
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    required: true
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RestaurantUser',
    required: true
  },
  reason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
restaurantStatusSchema.index({ restaurant: 1, createdAt: -1 });
restaurantStatusSchema.index({ status: 1, createdAt: -1 });
restaurantStatusSchema.index({ isActive: 1, status: 1 });

// Virtual for formatted date
restaurantStatusSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleString();
});

// Method to get current status
restaurantStatusSchema.statics.getCurrentStatus = async function(restaurantId) {
  const latestStatus = await this.findOne({
    restaurant: restaurantId,
    isActive: true
  }).sort({ createdAt: -1 });
  
  return latestStatus ? latestStatus.status : 'closed'; // Default to closed if no status found
};

// Method to get status history
restaurantStatusSchema.statics.getStatusHistory = async function(restaurantId, limit = 50) {
  return await this.find({
    restaurant: restaurantId,
    isActive: true
  })
  .populate('changedBy', 'restaurantName email')
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Method to get status statistics
restaurantStatusSchema.statics.getStatusStats = async function() {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  // Get current status counts
  const currentStatuses = await this.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $sort: { restaurant: 1, createdAt: -1 }
    },
    {
      $group: {
        _id: '$restaurant',
        latestStatus: { $first: '$status' },
        latestDate: { $first: '$createdAt' }
      }
    },
    {
      $group: {
        _id: '$latestStatus',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get today's status changes
  const todayChanges = await this.countDocuments({
    createdAt: { $gte: startOfToday },
    isActive: true
  });

  // Get this week's status changes
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const thisWeekChanges = await this.countDocuments({
    createdAt: { $gte: startOfWeek },
    isActive: true
  });

  const stats = {
    open: 0,
    closed: 0,
    todayChanges,
    thisWeekChanges
  };

  currentStatuses.forEach(status => {
    stats[status._id] = status.count;
  });

  return stats;
};

const RestaurantStatus = mongoose.model('RestaurantStatus', restaurantStatusSchema);

export default RestaurantStatus;
