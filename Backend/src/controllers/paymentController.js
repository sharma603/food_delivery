import Payment from '../models/Payment.js';
import { getIO } from '../config/socket.js';
import Order from '../models/Order.js';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET);

const getPayments = async (req, res) => {
  const payments = await Payment.find({}).populate('order');
  res.json(payments);
};

const getPayment = async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate('order');

  if (payment) {
    res.json(payment);
  } else {
    res.status(404).json({ message: 'Payment not found' });
  }
};

const createPayment = async (req, res) => {
  const payment = await Payment.create(req.body);
  res.status(201).json(payment);
};

const updatePayment = async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (payment) {
    Object.assign(payment, req.body);
    const updatedPayment = await payment.save();
    res.json(updatedPayment);
  } else {
    res.status(404).json({ message: 'Payment not found' });
  }
};

export { getPayments, getPayment, createPayment, updatePayment };

// Webhook to receive Stripe events
export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const payment = await Payment.findOneAndUpdate(
      { paymentIntentId: intent.id },
      { status: 'succeeded' },
      { new: true }
    );
    if (payment?.order) {
      const order = await Order.findByIdAndUpdate(payment.order, { paymentStatus: 'paid' }, { new: true });
      try { getIO().to(String(order._id)).emit('order:update', { status: order.status, paymentStatus: order.paymentStatus }); } catch {}
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object;
    await Payment.findOneAndUpdate(
      { paymentIntentId: intent.id },
      { status: 'failed' }
    );
  }

  res.json({ received: true });
};