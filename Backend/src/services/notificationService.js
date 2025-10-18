import { sendEmail } from './emailService.js';
import { sendSMS } from './smsService.js';
import { notificationQueue } from '../jobs/orderQueue.js';

const sendOrderConfirmation = async (user, order) => {
  const message = `Your order ${order.orderNumber} has been placed successfully. Total: $${order.pricing.total}`;

  // enqueue async notifications
  await notificationQueue.add({ channel: 'email', message: { to: user.email, subject: 'Order Confirmation', text: message } });
  if (user.phone) await notificationQueue.add({ channel: 'sms', message: { to: user.phone, text: message } });
};

const sendOrderStatusUpdate = async (user, order, status) => {
  const message = `Your order ${order.orderNumber} status updated to: ${status}`;

  await notificationQueue.add({ channel: 'email', message: { to: user.email, subject: 'Order Status Update', text: message } });
  if (user.phone) await notificationQueue.add({ channel: 'sms', message: { to: user.phone, text: message } });
};

export { sendOrderConfirmation, sendOrderStatusUpdate };