// Stripe Payment Service
// This file structure created as per requested organization
import Stripe from 'stripe';
import paymentConfig from '../../config/payment.js';

const stripe = new Stripe(paymentConfig.stripe.secretKey);

class StripeService {
  // Create payment intent
  static async createPaymentIntent(amount, currency = 'usd', metadata = {}) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true
        }
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      console.error('Stripe payment intent error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Confirm payment
  static async confirmPayment(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      return {
        success: paymentIntent.status === 'succeeded',
        status: paymentIntent.status,
        paymentIntent
      };
    } catch (error) {
      console.error('Stripe payment confirmation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create refund
  static async createRefund(paymentIntentId, amount = null, reason = null) {
    try {
      const refundData = {
        payment_intent: paymentIntentId
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100);
      }

      if (reason) {
        refundData.reason = reason;
      }

      const refund = await stripe.refunds.create(refundData);

      return {
        success: true,
        refund
      };
    } catch (error) {
      console.error('Stripe refund error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create connected account for restaurant
  static async createConnectedAccount(restaurantData) {
    try {
      const account = await stripe.accounts.create({
        type: 'express',
        country: restaurantData.country || 'US',
        email: restaurantData.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        business_type: 'company',
        company: {
          name: restaurantData.name
        }
      });

      return {
        success: true,
        accountId: account.id
      };
    } catch (error) {
      console.error('Stripe connected account error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create transfer to restaurant
  static async createTransfer(amount, destination, metadata = {}) {
    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        destination,
        metadata
      });

      return {
        success: true,
        transfer
      };
    } catch (error) {
      console.error('Stripe transfer error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default StripeService;
