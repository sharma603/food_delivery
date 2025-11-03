import express from 'express';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

import connectDB from './config/database.js';
import errorHandler from './middleware/errorHandler.js';
import { apiLimiter, superAdminLimiter, securityMiddleware } from './middleware/security.js';
import mongoose from 'mongoose';
import createSuperAdmin from '../scripts/create/createSuperAdmin.js';

// Connect to database and initialize SuperAdmin (one-time only)
(async () => {
  try {
    await connectDB();
    
    // Wait for database connection to be ready, then create SuperAdmin if needed (only once)
    const initializeSuperAdmin = async () => {
      let attempts = 0;
      const maxAttempts = 20; // Wait up to 10 seconds
      
      // Wait for database connection
      while (mongoose.connection.readyState !== 1 && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      if (mongoose.connection.readyState === 1) {
        // This will only create SuperAdmin if none exists (one-time setup)
        await createSuperAdmin();
      } else {
        console.warn('⚠️  Database not ready. SuperAdmin initialization will be skipped.');
        console.warn('💡 You can manually run: node Backend/scripts/create/createSuperAdmin.js');
      }
    };
    
    // Small delay to ensure connection is fully established
    setTimeout(initializeSuperAdmin, 1500);
    
  } catch (error) {
    console.log('⚠️  Database connection failed, but server will continue running for address API');
    console.log('💡 Make sure MongoDB is running for full functionality');
    console.log('💡 You can manually run: node Backend/scripts/create/createSuperAdmin.js');
  }
})();

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

// Static files - Use process.cwd() for consistent path resolution
const uploadsPath = path.join(process.cwd(), 'uploads');
const publicPath = path.join(process.cwd(), 'public');
const adminPublicPath = path.join(process.cwd(), 'public', 'admin');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log('✅ Created uploads directory:', uploadsPath);
}

// Serve static files
app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    // Set proper content type for images
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    }
    // Enable CORS for images
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
}));

app.use('/admin', express.static(adminPublicPath));
app.use(express.static(publicPath));

// Log static file paths for debugging
console.log('📁 Static file paths:');
console.log('  - Uploads:', uploadsPath);
console.log('  - Public:', publicPath);
console.log('  - Admin:', adminPublicPath);

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

// Debug Routes (only in development - uncomment when needed)
// import debugRoutes from './routes/debug.js';

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

// Debug Routes (only in development or when enabled)
// Uncomment to enable debug routes in production for troubleshooting
// import debugRoutes from './routes/debug.js';
// app.use('/api/debug', debugRoutes);

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