import mongoose from 'mongoose';
import crypto from 'crypto';

// Password Reset Token Schema
const passwordResetSchema = new mongoose.Schema({
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
    enum: ['Customer', 'Restaurant', 'Admin']
  },
  
  // Email address for the reset request
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  
  // Reset token
  token: {
    type: String,
    required: true,
    unique: true
  },
  
  // Token expiration time
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  },
  
  // Whether the token has been used
  isUsed: {
    type: Boolean,
    default: false
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
passwordResetSchema.index({ token: 1 });
passwordResetSchema.index({ email: 1 });
passwordResetSchema.index({ userId: 1 });
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired tokens

// Static method to generate reset token
passwordResetSchema.statics.generateToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Static method to create reset request
passwordResetSchema.statics.createResetRequest = async function(userId, userType, email, ipAddress, userAgent) {
  // Invalidate any existing tokens for this user
  await this.updateMany(
    { userId, userType, isUsed: false },
    { isUsed: true }
  );
  
  // Generate new token
  const token = this.generateToken();
  
  // Create new reset request
  const resetRequest = await this.create({
    userId,
    userType,
    email,
    token,
    ipAddress,
    userAgent
  });
  
  return resetRequest;
};

// Instance method to check if token is valid
passwordResetSchema.methods.isValid = function() {
  return !this.isUsed && this.expiresAt > new Date();
};

// Instance method to mark token as used
passwordResetSchema.methods.markAsUsed = function() {
  this.isUsed = true;
  return this.save();
};

const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);

export default PasswordReset;
