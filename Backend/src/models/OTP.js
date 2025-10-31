import mongoose from 'mongoose';

// OTP Schema for Password Reset
const otpSchema = new mongoose.Schema({
  // User reference (can be Customer, Restaurant, Admin, etc.)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userType'
  },
  
  // User type to determine which model to reference
  userType: {
    type: String,
    required: true,
    enum: ['Customer', 'Restaurant', 'Admin', 'DeliveryPersonnel']
  },
  
  // Email address for the OTP
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  
  // OTP code (6 digits)
  otp: {
    type: String,
    required: true,
    length: 6
  },
  
  // OTP expiration time (5 minutes)
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
  },
  
  // Whether the OTP has been used
  isUsed: {
    type: Boolean,
    default: false
  },
  
  // Number of attempts made
  attempts: {
    type: Number,
    default: 0,
    max: 3 // Maximum 3 attempts
  },
  
  // IP address of the request
  ipAddress: {
    type: String
  },
  
  // User agent
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
otpSchema.index({ email: 1 });
otpSchema.index({ userId: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired OTPs

// Static method to generate OTP
otpSchema.statics.generateOTP = function() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

// Static method to create or update OTP request
otpSchema.statics.createOTPRequest = async function(userId, userType, email, ipAddress, userAgent) {
  // Generate new OTP
  const otp = this.generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
  
  // Delete ALL existing OTPs for this user to ensure only one record
  await this.deleteMany({ userId, userType, email });
  
  // Create ONE new OTP record
  const otpRequest = await this.create({
    userId,
    userType,
    email,
    otp,
    expiresAt,
    isUsed: false,
    attempts: 0,
    ipAddress,
    userAgent
  });
  
  return otpRequest;
};

// Instance method to check if OTP is valid
otpSchema.methods.isValid = function() {
  return !this.isUsed && this.expiresAt > new Date() && this.attempts < 3;
};

// Instance method to mark OTP as used
otpSchema.methods.markAsUsed = function() {
  this.isUsed = true;
  return this.save();
};

// Instance method to increment attempts
otpSchema.methods.incrementAttempts = function() {
  this.attempts += 1;
  return this.save();
};

// Static method to clean up expired OTPs
otpSchema.statics.cleanupExpiredOTPs = async function() {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
  console.log(`🧹 Cleaned up ${result.deletedCount} expired OTPs`);
  return result;
};

// Static method to get active OTP for user
otpSchema.statics.getActiveOTP = async function(userId, userType, email) {
  return await this.findOne({
    userId,
    userType,
    email,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  });
};

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;
