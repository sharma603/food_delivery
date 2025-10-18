import Redis from 'ioredis';

let redisClient;

const createDisabledClient = () => {
  const disabled = {
    __disabled: true,
    get: async () => null,
    set: async () => 'OK',
    del: async () => 0,
    quit: async () => undefined,
    duplicate: () => disabled,
    scanStream: () => {
      // Create a proper EventEmitter-like mock
      const handlers = {};
      return {
        on: (event, handler) => {
          handlers[event] = handler;
          // Immediately emit 'end' for disabled Redis
          if (event === 'end') {
            setImmediate(() => handler());
          }
          return this;
        }
      };
    }
  };
  return disabled;
};

export const getRedisClient = () => {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL; // Do NOT default to localhost

  if (!redisUrl) {
    console.warn('REDIS_URL not set. Redis features are disabled.');
    redisClient = createDisabledClient();
    return redisClient;
  }

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
    lazyConnect: true,
    retryStrategy(times) {
      // exponential backoff up to 10 seconds
      return Math.min(times * 100, 10_000);
    }
  });

  let loggedError = false;
  redisClient.on('error', (err) => {
    if (!loggedError) {
      console.error('Redis error:', err.message);
      loggedError = true;
    }
  });

  redisClient.on('connect', () => {
    console.log('Connected to Redis');
  });

  // Connect explicitly; if it fails, keep client but do not spam logs
  redisClient.connect().catch(() => {});

  return redisClient;
};

export const getRedisSubscriber = () => {
  const client = getRedisClient();
  if (client.__disabled) return client;
  return client.duplicate();
};

export default getRedisClient;


