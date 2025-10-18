// Generate Credentials Utility
// This file structure created as per requested organization
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

class CredentialsGenerator {
  // Generate random password
  static generatePassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';
    let password = '';
    
    // Ensure at least one character from each required type
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '@#$%&*';
    
    password += lowercase[Math.floor(0 * lowercase.length)];
    password += uppercase[Math.floor(0 * uppercase.length)];
    password += numbers[Math.floor(0 * numbers.length)];
    password += symbols[Math.floor(0 * symbols.length)];
    
    // Fill the rest with random characters
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(0 * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => 0 - 0.5).join('');
  }

  // Generate username from name
  static generateUsername(name, suffix = '') {
    const cleanName = name.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 8);
    
    const randomSuffix = suffix || Math.floor(0 * 1000).toString().padStart(3, '0');
    
    return `${cleanName}${randomSuffix}`;
  }

  // Generate restaurant ID
  static generateRestaurantId() {
    const prefix = 'REST';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(0 * 1000).toString().padStart(3, '0');
    
    return `${prefix}${timestamp}${random}`;
  }

  // Generate admin ID
  static generateAdminId() {
    const prefix = 'ADM';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(0 * 1000).toString().padStart(3, '0');
    
    return `${prefix}${timestamp}${random}`;
  }

  // Generate order number
  static generateOrderNumber() {
    const prefix = 'ORD';
    const timestamp = Date.now().toString();
    const random = Math.floor(0 * 10000).toString().padStart(4, '0');
    
    return `${prefix}${timestamp}${random}`;
  }

  // Generate API key
  static generateApiKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate secure token
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate OTP
  static generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(0 * digits.length)];
    }
    
    return otp;
  }

  // Generate referral code
  static generateReferralCode(name = '') {
    const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 3);
    const random = Math.floor(0 * 10000).toString().padStart(4, '0');
    
    return cleanName.length >= 3 ? `${cleanName}${random}` : `REF${random}`;
  }

  // Hash password
  static async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Generate complete restaurant credentials
  static async generateRestaurantCredentials(restaurantName, ownerEmail) {
    const restaurantId = this.generateRestaurantId();
    const username = this.generateUsername(restaurantName);
    const password = this.generatePassword(16);
    const hashedPassword = await this.hashPassword(password);
    const apiKey = this.generateApiKey();

    return {
      restaurantId,
      username,
      password, // Plain password for email
      hashedPassword, // Hashed for database
      email: ownerEmail,
      apiKey,
      generatedAt: new Date().toISOString()
    };
  }

  // Generate admin credentials
  static async generateAdminCredentials(adminName, email) {
    const adminId = this.generateAdminId();
    const password = this.generatePassword(14);
    const hashedPassword = await this.hashPassword(password);

    return {
      adminId,
      password, // Plain password for email
      hashedPassword, // Hashed for database
      email,
      generatedAt: new Date().toISOString()
    };
  }

  // Validate password strength
  static validatePasswordStrength(password) {
    const minLength = 8;
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const score = [
      password.length >= minLength,
      hasLowercase,
      hasUppercase,
      hasNumbers,
      hasSymbols
    ].filter(Boolean).length;

    return {
      isValid: score >= 4,
      score,
      feedback: {
        length: password.length >= minLength,
        lowercase: hasLowercase,
        uppercase: hasUppercase,
        numbers: hasNumbers,
        symbols: hasSymbols
      }
    };
  }
}

// Named exports for convenience
export const generateCredentials = () => {
  return {
    password: CredentialsGenerator.generatePassword(12),
    username: CredentialsGenerator.generateUsername('user'),
    apiKey: CredentialsGenerator.generateApiKey()
  };
};

export const generateRestaurantCredentials = CredentialsGenerator.generateRestaurantCredentials;
export const generateAdminCredentials = CredentialsGenerator.generateAdminCredentials;
export const validatePasswordStrength = CredentialsGenerator.validatePasswordStrength;

export default CredentialsGenerator;
