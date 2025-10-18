import Bull from 'bull';
import { getRedisClient } from '../config/redis.js';
import logger from '../utils/logger.js';

const redisUrl = process.env.REDIS_URL;

export const orderQueue = redisUrl ? new Bull('order-events', redisUrl) : { add: async () => {}, process: () => {}, close: async () => {} };
export const notificationQueue = redisUrl ? new Bull('notifications', redisUrl) : { add: async () => {}, process: () => {}, close: async () => {} };

if (redisUrl) orderQueue.process(async (job) => {
  const { type, payload } = job.data;
  logger.info(`Processing order job: ${type}`);
  switch (type) {
    case 'ORDER_PLACED':
      // Notify restaurant about new order
      logger.info(`New order placed: ${payload.orderId}`);
      // ETA computation would be done here based on restaurant prep time and delivery distance
      // Example: payload.eta = calculateETA(payload.restaurantId, payload.deliveryAddress);
      return payload;
    case 'STATUS_CHANGED':
      return payload;
    default:
      return payload;
  }
});

if (redisUrl) notificationQueue.process(async (job) => {
  const { channel, message } = job.data;
  logger.info(`Sending notification via ${channel}`);
  return { channel, message };
});

export default { orderQueue, notificationQueue };


