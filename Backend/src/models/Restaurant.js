import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },

  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    }
  },

  images: [{
    url: { type: String, required: true },
    alt: { type: String },
    isPrimary: { type: Boolean, default: false }
  }],

  cuisine: [{ type: String, required: true }],

  openingHours: {
    monday: { open: { type: String }, close: { type: String }, isClosed: { type: Boolean, default: false } },
    tuesday: { open: { type: String }, close: { type: String }, isClosed: { type: Boolean, default: false } },
    wednesday: { open: { type: String }, close: { type: String }, isClosed: { type: Boolean, default: false } },
    thursday: { open: { type: String }, close: { type: String }, isClosed: { type: Boolean, default: false } },
    friday: { open: { type: String }, close: { type: String }, isClosed: { type: Boolean, default: false } },
    saturday: { open: { type: String }, close: { type: String }, isClosed: { type: Boolean, default: false } },
    sunday: { open: { type: String }, close: { type: String }, isClosed: { type: Boolean, default: false } }
  },

  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },

  deliveryTime: {
    min: { type: Number, required: true }, // minimum delivery time in minutes
    max: { type: Number, required: true }  // maximum delivery time in minutes
  },
  deliveryFee: { type: Number, default: 0, min: 0 },
  minimumOrder: { type: Number, default: 0, min: 0 },

  // Business information
  businessLicense: { type: String },
  taxId: { type: String },

  // Status tracking
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  isOpen: { type: Boolean, default: true },

  // Admin tracking
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
  rejectionReason: { type: String },

  // Performance metrics
  totalOrders: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  averageOrderValue: { type: Number, default: 0 },

  // Features
  features: [{
    type: String,
    enum: ['delivery', 'pickup', 'dine_in', 'online_payment', 'cash_on_delivery']
  }],

  // Social media links
  socialMedia: {
    facebook: { type: String },
    instagram: { type: String },
    twitter: { type: String },
    website: { type: String }
  },

  // Notifications settings
  notifications: {
    newOrder: { type: Boolean, default: true },
    orderUpdate: { type: Boolean, default: true },
    promotions: { type: Boolean, default: true }
  }
}, { timestamps: true });

// Method to check if restaurant is currently open
restaurantSchema.methods.isCurrentlyOpen = function() {
  if (!this.isOpen || !this.isActive) return false;

  const now = new Date();
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

  const todayHours = this.openingHours[dayOfWeek];
  if (todayHours.isClosed) return false;

  return currentTime >= todayHours.open && currentTime <= todayHours.close;
};

// Method to update rating
restaurantSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = Number((totalRating / this.rating.count).toFixed(2));
  return this.save();
};

// Method to verify restaurant (admin action)
restaurantSchema.methods.verifyRestaurant = function(adminId) {
  this.isVerified = true;
  this.verifiedBy = adminId;
  this.verifiedAt = new Date();
  this.rejectionReason = undefined;
  return this.save();
};

// Method to reject restaurant (admin action)
restaurantSchema.methods.rejectRestaurant = function(adminId, reason) {
  this.isVerified = false;
  this.verifiedBy = adminId;
  this.verifiedAt = new Date();
  this.rejectionReason = reason;
  return this.save();
};

// Static method to get restaurants by admin for management
restaurantSchema.statics.getForAdminManagement = function(filters = {}) {
  const query = {};

  if (filters.status) {
    if (filters.status === 'pending') query.isVerified = false;
    if (filters.status === 'verified') query.isVerified = true;
    if (filters.status === 'active') query.isActive = true;
    if (filters.status === 'inactive') query.isActive = false;
  }

  if (filters.city) query['address.city'] = new RegExp(filters.city, 'i');
  if (filters.cuisine) query.cuisine = { $in: [filters.cuisine] };

  return this.find(query)
    .populate('owner', 'name email phone')
    .populate('verifiedBy', 'name')
    .sort({ createdAt: -1 });
};

restaurantSchema.index({ owner: 1 });
restaurantSchema.index({ cuisine: 1 });
restaurantSchema.index({ 'address.city': 1 });
restaurantSchema.index({ isActive: 1, isVerified: 1 });
restaurantSchema.index({ 'rating.average': -1 });
restaurantSchema.index({ totalOrders: -1 });
restaurantSchema.index({ createdAt: -1 });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

export default Restaurant;