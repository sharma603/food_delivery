import { sendEmail } from './emailService.js';
import { sendSMS } from './smsService.js';
import { notificationQueue } from '../jobs/orderQueue.js';
import DeliveryPersonnel from '../models/DeliveryPersonnel.js';
import { getIO } from '../config/socket.js';

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

/**
 * Notify delivery partners about new order
 * @param {Object} order - Order object
 * @param {String} notificationType - 'new_order' | 'order_ready' | 'order_assigned'
 */
const notifyDeliveryPartners = async (order, notificationType = 'new_order') => {
  try {
    // Find all online delivery persons
    const onlineDeliveryPersons = await DeliveryPersonnel.find({
      isOnline: true
    }).select('_id name email phone');

    if (onlineDeliveryPersons.length === 0) {
      console.log('⚠️ No online delivery persons to notify');
      return;
    }

    // Prepare notification data based on type
    let notificationData;
    
    if (notificationType === 'new_order') {
      notificationData = {
        type: 'new_order',
        title: '📦 New Order Available',
        message: `New order #${order.orderNumber} from ${order.restaurant?.restaurantName || 'Restaurant'} is available for delivery`,
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          restaurant: {
            name: order.restaurant?.restaurantName || order.restaurant?.name,
            address: order.restaurant?.address,
            phone: order.restaurant?.phone
          },
          customer: {
            name: order.customer?.name,
            address: order.deliveryAddress
          },
          pricing: order.pricing,
          estimatedDeliveryTime: order.estimatedDeliveryTime,
          createdAt: order.createdAt
        },
        timestamp: new Date()
      };
    } else if (notificationType === 'order_ready') {
      notificationData = {
        type: 'order_ready',
        title: '✅ Order Ready for Pickup',
        message: `Order #${order.orderNumber} from ${order.restaurant?.restaurantName || 'Restaurant'} is ready for pickup`,
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          restaurant: {
            name: order.restaurant?.restaurantName || order.restaurant?.name,
            address: order.restaurant?.address,
            phone: order.restaurant?.phone
          },
          customer: {
            name: order.customer?.name,
            address: order.deliveryAddress
          },
          pricing: order.pricing,
          createdAt: order.createdAt
        },
        timestamp: new Date()
      };
    } else if (notificationType === 'order_assigned') {
      notificationData = {
        type: 'order_assigned',
        title: '🚚 Order Assigned',
        message: `Order #${order.orderNumber} has been assigned to you`,
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          restaurant: {
            name: order.restaurant?.restaurantName || order.restaurant?.name,
            address: order.restaurant?.address,
            phone: order.restaurant?.phone
          },
          customer: {
            name: order.customer?.name,
            address: order.deliveryAddress
          },
          pricing: order.pricing,
          createdAt: order.createdAt
        },
        timestamp: new Date()
      };
    }

    // Get Socket.IO instance
    let io;
    try {
      io = getIO();
    } catch (socketError) {
      console.error('⚠️ Socket.IO not initialized, skipping real-time notification');
      return;
    }

    // Send notification to all delivery persons through socket
    // Send to 'delivery' room (all delivery persons connected)
    try {
      io.to('delivery').emit('order:notification', notificationData);
      console.log(`📢 Sent ${notificationType} notification to 'delivery' room`);
    } catch (error) {
      console.error('Error emitting to delivery room:', error);
    }

    // Also send to individual delivery person rooms for reliability
    onlineDeliveryPersons.forEach(person => {
      try {
        io.to(`user_${person._id}`).emit('order:notification', notificationData);
      } catch (error) {
        console.error(`Error emitting to user ${person._id}:`, error);
      }
    });

    console.log(`✅ Notified ${onlineDeliveryPersons.length} online delivery persons about ${notificationType} - Order #${order.orderNumber}`);

    // Optionally send SMS/Email notifications to delivery persons
    // Uncomment if you want SMS/Email notifications as well
    /*
    onlineDeliveryPersons.forEach(async (person) => {
      try {
        if (person.phone) {
          await sendSMS(person.phone, notificationData.message);
        }
        if (person.email) {
          await sendEmail({
            to: person.email,
            subject: notificationData.title,
            text: notificationData.message
          });
        }
      } catch (error) {
        console.error(`Error sending notification to ${person._id}:`, error);
      }
    });
    */

  } catch (error) {
    console.error('Error notifying delivery partners:', error);
    // Don't throw error - notification failure shouldn't break order creation
  }
};

export { sendOrderConfirmation, sendOrderStatusUpdate, notifyDeliveryPartners };