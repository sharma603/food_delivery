import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET);

const processPayment = async (amount, currency = 'usd') => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100,
    currency: currency
  });

  return paymentIntent;
};

const refundPayment = async (paymentIntentId, amount) => {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount * 100
  });

  return refund;
};

export { processPayment, refundPayment };