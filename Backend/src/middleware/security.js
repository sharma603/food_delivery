import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
// Note: xss-clean is deprecated, using express-validator for XSS protection instead
import hpp from 'hpp';
import { getRedisClient } from '../config/redis.js';

// Redis-based rate limiting store
const redis = getRedisClient();

// Simple in-memory store for development
const createMemoryStore = () => {
  const store = new Map();
  return {
    async increment(key) {
      const current = (store.get(key) || 0) + 1;
      store.set(key, current);
      return { totalHits: current, resetTime: new Date(Date.now() + 60000) };
    },
    
    async decrement(key) {
      const current = store.get(key) || 0;
      if (current > 0) {
        store.set(key, current - 1);
      }
    },
    
    async resetKey(key) {
      store.delete(key);
    }
  };
};

// Rate limiting
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    store: createMemoryStore(), // Use simple memory store
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

// Auth rate limiting (stricter) - Use no-op limiter in dev
const authLimiter = process.env.NODE_ENV === 'development' 
  ? noOpRateLimit 
  : createRateLimit(15 * 60 * 1000, 50); // 50 requests per 15 minutes (increased)

// General API rate limiting - Use no-op limiter in dev, production limiter in production
const apiLimiter = process.env.NODE_ENV === 'development' 
  ? noOpRateLimit 
  : createRateLimit(
      parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000,
      parseInt(process.env.RATE_LIMIT_MAX) || 50
    );

// Super admin rate limiting (more lenient for admin operations)
const superAdminLimiter = process.env.NODE_ENV === 'development'
  ? noOpRateLimit
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

// No-op rate limiter for development
const noOpRateLimit = (req, res, next) => {
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
  noOpRateLimit,
  securityMiddleware
};