import { getRedisClient } from '../config/redis.js';
import { CACHE_TTL_SECONDS } from '../config/constants.js';

const redis = getRedisClient();

export const cache = (ttlSeconds = CACHE_TTL_SECONDS) => async (req, res, next) => {
  if (req.method !== 'GET') return next();

  const key = `cache:${req.originalUrl}`;
  try {
    if (redis.__disabled) return next();
    const cached = await redis.get(key);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.status(200).json(JSON.parse(cached));
    }

    const json = res.json.bind(res);
    res.json = (body) => {
      redis.set(key, JSON.stringify(body), 'EX', ttlSeconds).catch(() => {});
      res.set('X-Cache', 'MISS');
      return json(body);
    };
    next();
  } catch (e) {
    next();
  }
};

export default cache;


