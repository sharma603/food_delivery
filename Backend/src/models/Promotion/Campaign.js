// Campaign Model
// This file structure created as per requested organization
import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Campaign name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  type: {
    type: String,
    required: true,
    enum: ['email', 'sms', 'push_notification', 'in_app', 'multi_channel']
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  targetAudience: {
    userType: {
      type: String,
      enum: ['all_customers', 'new_customers', 'returning_customers', 'vip_customers'],
      default: 'all_customers'
    },
    location: {
      cities: [String],
      radius: Number // in kilometers
    },
    demographics: {
      ageRange: {
        min: Number,
        max: Number
      },
      gender: {
        type: String,
        enum: ['all', 'male', 'female', 'other']
      }
    },
    orderHistory: {
      minOrders: Number,
      minSpent: Number,
      lastOrderWithin: Number // days
    }
  },
  content: {
    subject: String,
    title: String,
    message: {
      type: String,
      required: true
    },
    images: [String],
    callToAction: {
      text: String,
      link: String
    }
  },
  schedule: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date,
    frequency: {
      type: String,
      enum: ['once', 'daily', 'weekly', 'monthly'],
      default: 'once'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  metrics: {
    sent: {
      type: Number,
      default: 0
    },
    delivered: {
      type: Number,
      default: 0
    },
    opened: {
      type: Number,
      default: 0
    },
    clicked: {
      type: Number,
      default: 0
    },
    converted: {
      type: Number,
      default: 0
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
campaignSchema.index({ status: 1, 'schedule.startDate': 1 });
campaignSchema.index({ createdBy: 1, status: 1 });
campaignSchema.index({ type: 1, status: 1 });

export default mongoose.model('Campaign', campaignSchema);
