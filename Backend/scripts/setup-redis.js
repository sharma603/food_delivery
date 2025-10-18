#!/usr/bin/env node

/**
 * Redis Setup Script for Food Delivery System
 * This script helps set up Redis for the backend
 */

import { createClient } from 'redis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Redis Setup Script');
console.log('====================');

// Check if Redis is available
async function checkRedis() {
  console.log('\n1. Checking Redis connection...');
  
  try {
    const client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    await client.connect();
    const pong = await client.ping();
    
    if (pong === 'PONG') {
      console.log('✅ Redis is running and accessible');
      
      // Test basic operations
      await client.set('test:setup', 'success');
      const result = await client.get('test:setup');
      await client.del('test:setup');
      
      if (result === 'success') {
        console.log('✅ Redis read/write operations working');
      }
      
      await client.quit();
      return true;
    }
  } catch (error) {
    console.log('❌ Redis connection failed:', error.message);
    return false;
  }
}

// Update .env file
function updateEnvFile() {
  console.log('\n2. Updating .env file...');
  
  const envPath = path.join(__dirname, '..', '.env');
  const redisUrl = 'redis://localhost:6379';
  
  try {
    let envContent = '';
    
    // Read existing .env file if it exists
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Check if REDIS_URL already exists
    if (envContent.includes('REDIS_URL=')) {
      // Update existing REDIS_URL
      envContent = envContent.replace(/REDIS_URL=.*/, `REDIS_URL=${redisUrl}`);
      console.log('✅ Updated existing REDIS_URL in .env');
    } else {
      // Add REDIS_URL
      envContent += `\n# Redis Configuration\nREDIS_URL=${redisUrl}\n`;
      console.log('✅ Added REDIS_URL to .env');
    }
    
    fs.writeFileSync(envPath, envContent);
    return true;
  } catch (error) {
    console.log('❌ Failed to update .env file:', error.message);
    return false;
  }
}

// Provide setup instructions
function showInstructions() {
  console.log('\n3. Setup Instructions:');
  console.log('======================');
  
  console.log('\n📋 To install Redis:');
  console.log('');
  console.log('🐳 Docker (Recommended):');
  console.log('   docker run -d --name redis-server -p 6379:6379 redis:alpine');
  console.log('');
  console.log('🍺 macOS (Homebrew):');
  console.log('   brew install redis');
  console.log('   brew services start redis');
  console.log('');
  console.log('🐧 Linux (Ubuntu/Debian):');
  console.log('   sudo apt update');
  console.log('   sudo apt install redis-server');
  console.log('   sudo systemctl start redis-server');
  console.log('');
  console.log('🪟 Windows:');
  console.log('   Download from: https://github.com/microsoftarchive/redis/releases');
  console.log('   Or use WSL: sudo apt-get install redis-server');
  console.log('');
  console.log('☁️  Cloud (Production):');
  console.log('   Redis Cloud: https://redis.com/try-free/');
  console.log('   AWS ElastiCache, Google Cloud Memorystore');
}

// Main function
async function main() {
  const redisWorking = await checkRedis();
  
  if (redisWorking) {
    console.log('\n🎉 Redis is already set up and working!');
    console.log('Your backend should now handle rate limiting properly.');
    return;
  }
  
  const envUpdated = updateEnvFile();
  showInstructions();
  
  console.log('\n📝 Next Steps:');
  console.log('==============');
  console.log('1. Install Redis using one of the methods above');
  console.log('2. Start Redis server');
  console.log('3. Run this script again to verify: node scripts/setup-redis.js');
  console.log('4. Restart your backend server: npm start');
  console.log('');
  console.log('💡 Tip: Use Docker for the easiest setup!');
}

// Run the script
main().catch(console.error);
