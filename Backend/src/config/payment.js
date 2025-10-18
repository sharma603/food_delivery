// Payment Configuration
// This file structure created as per requested organization

const paymentConfig = {
  stripe: {
    publicKey: process.env.STRIPE_PUBLIC_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET
  },

  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    mode: process.env.PAYPAL_MODE || 'sandbox' // 'sandbox' or 'live'
  },

  // Default commission rates
  commission: {
    restaurant: parseFloat(process.env.RESTAURANT_COMMISSION) || 15, // 15%
    delivery: parseFloat(process.env.DELIVERY_COMMISSION) || 20 // 20%
  }
};

export default paymentConfig;