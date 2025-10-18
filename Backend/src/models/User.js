import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  phone: { type: String, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['customer', 'restaurant', 'delivery', 'admin'], default: 'customer' },
  avatar: { type: String },
  addresses: [{
    type: { type: String, enum: ['home', 'work', 'other'], default: 'other' },
    label: { type: String },
    street: { type: String, required: true },
    apartment: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'Nepal' },
    instructions: { type: String },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  }],

  // Admin-specific fields
  adminProfile: {
    permissions: [{
      type: String,
      enum: ['manage_users', 'manage_restaurants', 'manage_orders', 'view_analytics', 'system_settings', 'financial_reports']
    }],
    department: { type: String },
    employeeId: { type: String, unique: true, sparse: true },
    accessLevel: { type: String, enum: ['super_admin', 'admin', 'moderator'], default: 'admin' },
    lastLogin: { type: Date },
    loginCount: { type: Number, default: 0 }
  },

  // Customer-specific fields
  customerProfile: {
    preferences: {
      cuisines: [{ type: String }],
      dietaryRestrictions: [{ type: String }],
      spiceLevel: { type: String, enum: ['mild', 'medium', 'hot', 'extra_hot'] }
    },
    loyaltyPoints: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 }
  },

  // Delivery person specific fields
  deliveryProfile: {
    vehicleType: { type: String, enum: ['bike', 'car', 'scooter', 'bicycle'] },
    licenseNumber: { type: String },
    vehicleDetails: {
      make: { type: String },
      model: { type: String },
      plateNumber: { type: String }
    },
    isOnline: { type: Boolean, default: false },
    currentLocation: {
      latitude: { type: Number },
      longitude: { type: Number }
    },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 }
    },
    totalDeliveries: { type: Number, default: 0 }
  },

  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lastActiveAt: { type: Date, default: Date.now },

  // Security fields
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user is admin with specific permission
userSchema.methods.hasPermission = function(permission) {
  if (this.role !== 'admin') return false;
  if (this.adminProfile?.accessLevel === 'super_admin') return true;
  return this.adminProfile?.permissions?.includes(permission);
};

// Method to check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1, loginAttempts: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = {
      lockUntil: Date.now() + 2 * 60 * 60 * 1000 // lock for 2 hours
    };
  }

  return this.updateOne(updates);
};

// Static method to create admin user
userSchema.statics.createAdminUser = async function(userData) {
  const adminData = {
    ...userData,
    role: 'admin',
    isVerified: true,
    adminProfile: {
      permissions: ['manage_users', 'manage_restaurants', 'manage_orders', 'view_analytics', 'system_settings', 'financial_reports'],
      accessLevel: userData.accessLevel || 'admin',
      employeeId: userData.employeeId
    }
  };

  return this.create(adminData);
};

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'adminProfile.employeeId': 1 });
userSchema.index({ isActive: 1, isVerified: 1 });

const User = mongoose.model('User', userSchema);

export default User;