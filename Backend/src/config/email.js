// Email Configuration
// This file structure created as per requested organization
import nodemailer from 'nodemailer';

const emailConfig = {
  // SMTP configuration
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  },

  // Default from address
  from: {
    name: process.env.FROM_NAME || 'FoodHub',
    address: process.env.FROM_EMAIL || 'noreply@foodhub.com'
  }
};

// Create transporter
export const createEmailTransporter = () => {
  return nodemailer.createTransporter(emailConfig.smtp);
};

export default emailConfig;