/**
 * Script to unlock a locked restaurant account
 * Usage: node scripts/fix/unlockRestaurantAccount.js <email>
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import RestaurantUser from '../../src/models/RestaurantUser.js';

dotenv.config();

const unlockAccount = async () => {
  try {
    const email = process.argv[2];

    if (!email) {
      console.error('❌ Please provide an email address');
      console.log('Usage: node scripts/unlockRestaurantAccount.js <email>');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    const restaurant = await RestaurantUser.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (!restaurant) {
      console.log('❌ Restaurant account not found');
      process.exit(1);
    }

    console.log('📋 Account Details:');
    console.log(`   Email: ${restaurant.email}`);
    console.log(`   Restaurant: ${restaurant.restaurantName}`);
    console.log(`   Login Attempts: ${restaurant.loginAttempts || 0}`);
    console.log(`   Lock Until: ${restaurant.lockUntil ? new Date(restaurant.lockUntil).toLocaleString() : 'Not locked'}`);
    console.log(`   Is Locked: ${restaurant.isLocked() ? 'Yes' : 'No'}\n`);

    if (!restaurant.isLocked() && !restaurant.loginAttempts) {
      console.log('ℹ️  Account is not locked. No action needed.');
      process.exit(0);
    }

    // Unlock the account
    await restaurant.unlockAccount();
    console.log('✅ Account unlocked successfully!');
    console.log('✅ Login attempts reset');
    console.log('✅ Lock removed');
    console.log('\n🚀 Restaurant can now login again.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

unlockAccount();

