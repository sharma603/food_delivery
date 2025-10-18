#!/usr/bin/env node

// Script to reset rate limits for development
import { getRedisClient } from '../src/config/redis.js';

const resetRateLimits = async () => {
  console.log('🔄 Resetting rate limits...');
  
  try {
    const redis = getRedisClient();
    
    if (redis.__disabled) {
      console.log('⚠️  Redis is disabled. Rate limits are stored in memory and will reset when server restarts.');
      return;
    }
    
    // Clear all rate limit keys
    const keys = await redis.keys('*');
    const rateLimitKeys = keys.filter(key => 
      key.includes('rl:') || 
      key.includes('rate-limit') || 
      key.includes('express-rate-limit')
    );
    
    if (rateLimitKeys.length > 0) {
      await redis.del(...rateLimitKeys);
      console.log(`✅ Cleared ${rateLimitKeys.length} rate limit keys`);
    } else {
      console.log('ℹ️  No rate limit keys found');
    }
    
    console.log('🎉 Rate limits reset successfully!');
    
  } catch (error) {
    console.error('❌ Error resetting rate limits:', error.message);
  }
  
  process.exit(0);
};

resetRateLimits();
