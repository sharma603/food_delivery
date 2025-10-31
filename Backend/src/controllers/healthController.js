import mongoose from 'mongoose';
import redis from '../config/redis.js';

/**
 * Health Check Controller
 * Provides detailed health status of the application
 */

export const healthCheck = async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.APP_VERSION || '1.0.0',
      services: {}
    };

    // Check MongoDB connection
    try {
      const dbState = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };
      
      health.services.database = {
        status: dbState === 1 ? 'healthy' : 'unhealthy',
        state: states[dbState] || 'unknown',
        host: mongoose.connection.host,
        database: mongoose.connection.name
      };

      // Test database query
      if (dbState === 1) {
        await mongoose.connection.db.admin().ping();
      }
    } catch (error) {
      health.services.database = {
        status: 'unhealthy',
        error: error.message
      };
      health.status = 'unhealthy';
    }

    // Check Redis connection (if configured)
    try {
      if (redis && redis.isOpen) {
        await redis.ping();
        health.services.redis = {
          status: 'healthy',
          connected: true
        };
      } else {
        health.services.redis = {
          status: 'not_configured',
          connected: false
        };
      }
    } catch (error) {
      health.services.redis = {
        status: 'unhealthy',
        error: error.message
      };
      health.status = 'unhealthy';
    }

    // System information
    health.system = {
      memory: {
        used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        percentage: Math.round(
          (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100
        )
      },
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version
    };

    // Response status code based on health
    const statusCode = health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      message: error.message
    });
  }
};

// Simple ping endpoint
export const ping = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString()
  });
};

// Readiness check (for Kubernetes)
export const readiness = async (req, res) => {
  try {
    const checks = {
      database: mongoose.connection.readyState === 1,
      server: true
    };

    const isReady = Object.values(checks).every(check => check === true);

    if (isReady) {
      res.status(200).json({
        status: 'ready',
        checks
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        checks
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      error: error.message
    });
  }
};

// Liveness check (for Kubernetes)
export const liveness = (req, res) => {
  res.status(200).json({
    status: 'alive'
  });
};

