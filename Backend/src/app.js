import express from 'express';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

import connectDB from './config/database.js';
import errorHandler from './middleware/errorHandler.js';
import { apiLimiter, superAdminLimiter, securityMiddleware } from './middleware/security.js';

// Connect to database (optional for address API)
try {
  connectDB();
} catch (error) {
  console.log('⚠️  Database connection failed, but server will continue running for address API');
  console.log('💡 Make sure MongoDB is running for full functionality');
}

const app = express();

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Trust proxy (for deployment)
app.set('trust proxy', 1);

// Security middleware
app.use(securityMiddleware);

// CORS configuration - MUST be before rate limiting
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CLIENT_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://192.168.18.38:3000',
      'http://192.168.18.38:3001'
    ];

    // Allow requests with no origin (mobile apps, postman, etc.)
    if (!origin) {
      console.log('🔓 Allowing request with no origin (mobile app)');
      return callback(null, true);
    }

    // In development, be more permissive
    if (process.env.NODE_ENV === 'development') {
      console.log('🔓 Development mode: Allowing origin:', origin);
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ Allowed origin:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  preflightContinue: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly - BEFORE rate limiting
app.options('*', cors(corsOptions));

// Rate limiting - AFTER CORS to avoid blocking preflight requests
// In development, skip rate limiting entirely
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Development mode: Skipping rate limiting');
  // No rate limiting in development
} else {
  console.log('Production mode: Using standard rate limiting');
  app.use('/api/', apiLimiter);
  // Apply more lenient rate limiting to superadmin routes in production
  app.use('/api/v1/superadmin', superAdminLimiter);
}

// Add CORS debugging middleware
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.originalUrl} - Origin: ${req.get('Origin') || 'No Origin'}`);
  next();
});

// Body parsing middleware
app.use(express.json({
  limit: process.env.MAX_FILE_SIZE || '5mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
import authRoutes from './routes/auth.js';
import adminAuthRoutes from './routes/adminAuth.js';
import customerAuthRoutes from './routes/customerAuth.js';
import restaurantAuthRoutes from './routes/restaurantAuth.js';

// Delivery Partner API Routes (Similar structure to mobile customer app)
// Location: src/delivery/routes/index.js
// Handles: /api/v1/delivery/auth/* and /api/v1/delivery/*
import deliveryRoutes from './delivery/routes/index.js';

import userRoutes from './routes/users.js';
import restaurantsRoutes from './routes/restaurants.js';
import menuItemRoutes from './routes/menuItems.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';
import restaurantVerificationRoutes from './routes/restaurantVerification.js';
import auditRoutes from './routes/audit.js';

// SuperAdmin Routes
import superAdminAuthRoutes from './routes/auth/superAdminAuth.js';
import superAdminRoutes from './routes/superadmin/index.js';
import superAdminRestaurantStatusRoutes from './routes/superadmin/restaurantStatus.js';

// Delivery Management Routes
import deliveryZoneRoutes from './routes/delivery/zones.js';
import deliveryPersonnelRoutes from './routes/delivery/personnel.js';
import deliveryTrackingRoutes from './routes/delivery/tracking.js';
import deliveryAnalyticsRoutes from './routes/delivery/analytics.js';

// Mobile API Routes
import mobileRoutes from './mobile/routes/index.js';

// Restaurant Routes
import restaurantRoutes from './routes/restaurant/index.js';
import restaurantStatusRoutes from './routes/restaurantStatus.js';

// Address Routes
import addressRoutes from './routes/address.js';

// Swagger docs
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Food Delivery API', version: '1.0.0' },
    servers: [{ url: '/api' }]
  },
  apis: [
    './src/routes/*.js', 
    './src/controllers/*.js',
    './src/mobile/routes/*.js',
    './src/mobile/controllers/*.js',
    './src/delivery/routes/*.js',
    './src/delivery/controllers/*.js'
  ]
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin/auth', adminAuthRoutes);
app.use('/api/v1/customer/auth', customerAuthRoutes);
app.use('/api/v1/restaurant/auth', restaurantAuthRoutes);

// Delivery Partner API Routes
// Structure: /api/v1/delivery/auth/* and /api/v1/delivery/*
app.use('/api/v1/delivery', deliveryRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/restaurants', restaurantsRoutes);
app.use('/api/v1/menu-items', menuItemRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/admin/restaurants/verification', restaurantVerificationRoutes);
app.use('/api/v1/admin/audit', auditRoutes);

// SuperAdmin Routes
app.use('/api/v1/auth/superadmin', superAdminAuthRoutes);
app.use('/api/v1/superadmin', superAdminRoutes);
app.use('/api/v1/superadmin/restaurants/status', superAdminRestaurantStatusRoutes);

// Delivery Management Routes
app.use('/api/v1/superadmin/delivery/zones', deliveryZoneRoutes);
app.use('/api/v1/superadmin/delivery/personnel', deliveryPersonnelRoutes);
app.use('/api/v1/superadmin/delivery/tracking', deliveryTrackingRoutes);
app.use('/api/v1/superadmin/delivery/analytics', deliveryAnalyticsRoutes);

// Delivery Person Routes are now handled in delivery/routes/index.js

// Mobile API Routes
app.use('/api/v1/mobile', mobileRoutes);

// Restaurant Routes
app.use('/api/v1/restaurant', restaurantRoutes);
app.use('/api/v1/restaurant/status', restaurantStatusRoutes);

// Address Routes
app.use('/api/v1/address', addressRoutes);

// 404 handler
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;