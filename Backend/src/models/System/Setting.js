// Setting Model
// This file structure created as per requested organization
import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'general',
      'payment',
      'delivery',
      'notification',
      'email',
      'sms',
      'security',
      'api',
      'features',
      'maintenance'
    ]
  },
  type: {
    type: String,
    required: true,
    enum: ['string', 'number', 'boolean', 'json', 'array']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isPublic: {
    type: Boolean,
    default: false // Public settings can be accessed by frontend
  },
  isEditable: {
    type: Boolean,
    default: true
  },
  validation: {
    required: {
      type: Boolean,
      default: false
    },
    min: Number,
    max: Number,
    regex: String,
    enum: [String]
  },
  defaultValue: {
    type: mongoose.Schema.Types.Mixed
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// History tracking for settings changes
const settingHistorySchema = new mongoose.Schema({
  settingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Setting',
    required: true
  },
  key: String,
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  changeReason: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Indexes
settingSchema.index({ key: 1 });
settingSchema.index({ category: 1, isPublic: 1 });
settingHistorySchema.index({ settingId: 1, timestamp: -1 });

// Pre-save middleware to track changes
settingSchema.pre('save', async function(next) {
  if (this.isModified('value') && !this.isNew) {
    const original = await this.constructor.findById(this._id);
    
    const SettingHistory = mongoose.model('SettingHistory', settingHistorySchema);
    await SettingHistory.create({
      settingId: this._id,
      key: this.key,
      oldValue: original.value,
      newValue: this.value,
      changedBy: this.lastModifiedBy
    });
    
    this.version += 1;
  }
  next();
});

const Setting = mongoose.model('Setting', settingSchema);
mongoose.model('SettingHistory', settingHistorySchema);

export default Setting;
