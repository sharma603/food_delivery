#!/usr/bin/env node

// Health check script for the backend
import mongoose from 'mongoose';
import { getRedisClient } from '../../src/config/redis.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const checkHealth = async () => {
  console.log('Running Backend Health Check...\n');
  
  let allHealthy = true;
  
  // Check environment variables
  console.log('Environment Variables:');
  const required = ['MONGODB_URI', 'JWT_SECRET'];
  required.forEach(key => {
    const value = process.env[key];
    if (value) {
      console.log(`✓ ${key}: Configured`);
    } else {
      console.log(`✗ ${key}: Missing`);
      allHealthy = false;
    }
  });
  
  // Check MongoDB connection
  console.log('\nDatabase Connection:');
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/food_delivery';
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    console.log('✓ MongoDB: Connected');
    await mongoose.connection.close();
  } catch (error) {
    console.log('✗ MongoDB: Connection failed');
    console.log(`   Error: ${error.message}`);
    allHealthy = false;
  }
  
  // Check Redis connection
  console.log('\nRedis Connection:');
  try {
    const redis = getRedisClient();
    if (redis.__disabled) {
      console.log('⚠ Redis: Disabled (REDIS_URL not set)');
    } else {
      await redis.ping();
      console.log('✓ Redis: Connected');
    }
  } catch (error) {
    console.log('✗ Redis: Connection failed');
    console.log(`   Error: ${error.message}`);
    // Redis is optional, so don't mark as unhealthy
  }
  
  // Check port availability
  console.log('\nPort Availability:');
  const port = process.env.PORT || 5000;
  try {
    const net = await import('net');
    const server = net.createServer();
    await new Promise((resolve, reject) => {
      server.listen(port, () => {
        server.close(resolve);
      });
      server.on('error', reject);
    });
    console.log(`✓ Port ${port}: Available`);
  } catch (error) {
    console.log(`✗ Port ${port}: In use or unavailable`);
    console.log(`   Error: ${error.message}`);
    allHealthy = false;
  }
  
  // Summary
  console.log('\nHealth Check Summary:');
  if (allHealthy) {
    console.log('✓ All critical systems are healthy');
    console.log('Backend should start successfully');
  } else {
    console.log('✗ Some critical systems have issues');
    console.log('Please fix the issues above before starting the backend');
  }
  
  process.exit(allHealthy ? 0 : 1);
};

checkHealth().catch(error => {
  console.error('Health check failed:', error);
  process.exit(1);
});
