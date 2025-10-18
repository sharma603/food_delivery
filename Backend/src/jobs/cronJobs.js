import cron from 'node-cron';
import { getRedisClient } from '../config/redis.js';
import logger from '../utils/logger.js';

export const scheduleJobs = () => {
  // Clean old cache keys hourly
  cron.schedule('0 * * * *', async () => {
    try {
      const redis = getRedisClient();
      
      // Skip if Redis is disabled
      if (redis.__disabled) {
        logger.info('Redis is disabled, skipping cache cleanup');
        return;
      }
      
      const stream = redis.scanStream({ match: 'cache:*', count: 100 });
      const keys = [];
      stream.on('data', (ks) => keys.push(...ks));
      stream.on('end', async () => {
        if (keys.length) await redis.del(keys);
        logger.info(`Cache cleanup complete, removed ${keys.length} keys`);
      });
      stream.on('error', (err) => {
        logger.error('Cache cleanup stream error:', err);
      });
    } catch (e) {
      logger.error('Cache cleanup failed:', e);
    }
  });
};

export default scheduleJobs;


