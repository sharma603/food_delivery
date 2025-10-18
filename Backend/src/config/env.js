// Environment Configuration
// This file structure created as per requested organization
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const envConfig = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI,
  REDIS_URL: process.env.REDIS_URL,
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '7d',
  
  // Client
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  
  // File Upload
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || '5mb',
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  
  // Email
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  FROM_NAME: process.env.FROM_NAME,
  FROM_EMAIL: process.env.FROM_EMAIL,
  
  // Third Party Services
  CLOUDINARY_NAME: process.env.CLOUDINARY_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  
  // Payment Gateways
  STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  
  // SMS & WhatsApp
  TWILIO_SID: process.env.TWILIO_SID,
  TWILIO_TOKEN: process.env.TWILIO_TOKEN,
  TWILIO_PHONE: process.env.TWILIO_PHONE,
  
  // Push Notifications
  FCM_SERVER_KEY: process.env.FCM_SERVER_KEY,
  
  // Google Services
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  
  // Commission Rates
  RESTAURANT_COMMISSION: process.env.RESTAURANT_COMMISSION || 15,
  DELIVERY_COMMISSION: process.env.DELIVERY_COMMISSION || 20
};

// Validate required environment variables
const validateEnv = () => {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET'
  ];
  
  const missing = required.filter(key => !envConfig[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Validate on import
if (envConfig.NODE_ENV === 'production') {
  validateEnv();
}

export { validateEnv };
export default envConfig;