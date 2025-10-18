import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
// Note: xss-clean is deprecated, using express-validator for XSS protection instead
import hpp from 'hpp';
import { getRedisClient } from '../config/redis.js';

// Redis-based rate limiting store
const redis = getRedisClient();

// Custom Redis store for rate limiting
const createRedisStore = () => {
  return {
    async increment(key) {
      try {
        if (redis.__disabled) {
          // Fallback to in-memory if Redis is disabled
          return { totalHits: 1, resetTime: new Date(Date.now() + 60000) };
        }
        
        const current = await redis.incr(key);
        if (current === 1) {
          await redis.expire(key, 60); // 1 minute TTL
        }
        return { totalHits: current, resetTime: new Date(Date.now() + 60000) };
      } catch (error) {
        console.warn('Redis rate limit error:', error.message);
        return { totalHits: 1, resetTime: new Date(Date.now() + 60000) };
      }
    },
    
    async decrement(key) {
      try {
        if (!redis.__disabled) {
          await redis.decr(key);
        }
      } catch (error) {
        console.warn('Redis decrement error:', error.message);
      }
    },
    
    async resetKey(key) {
      try {
        if (!redis.__disabled) {
          await redis.del(key);
        }
      } catch (error) {
        console.warn('Redis reset error:', error.message);
      }
    }
  };
};

// Rate limiting
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    store: createRedisStore(),
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for CORS preflight requests
      return req.method === 'OPTIONS';
    },
  });
};

// Development rate limiter (very lenient)
const devRateLimit = createRateLimit(1 * 60 * 1000, 50000); // 50,000 requests per minute in development

// Auth rate limiting (stricter)
const authLimiter = createRateLimit(15 * 60 * 1000, 5); // 5 requests per 15 minutes

// General API rate limiting - Use development limiter in dev, production limiter in production
const apiLimiter = process.env.NODE_ENV === 'development' 
  ? devRateLimit 
  : createRateLimit(
      parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000,
      parseInt(process.env.RATE_LIMIT_MAX) || 50
    );

// Super admin rate limiting (more lenient for admin operations)
const superAdminLimiter = process.env.NODE_ENV === 'development'
  ? devRateLimit
  : createRateLimit(
      15 * 60 * 1000, // 15 minutes
      200
    );

// Security headers
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http://localhost:3000", "http://localhost:5000"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images to be loaded cross-origin
});

// Data sanitization against NoSQL query injection
const mongoSanitization = mongoSanitize();

// XSS protection through input validation (handled in validation middleware)

// Prevent parameter pollution
const parameterPollution = hpp({
  whitelist: ['sort', 'fields', 'page', 'limit', 'cuisine']
});

const securityMiddleware = [
  securityHeaders,
  mongoSanitization,
  parameterPollution
];

// Development bypass middleware (no rate limiting in development)
const devBypass = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    return next(); // Skip rate limiting entirely in development
  }
  next();
};

export {
  apiLimiter,
  authLimiter,
  superAdminLimiter,
  devRateLimit,
  devBypass,
  securityMiddleware
};