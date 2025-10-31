/**
 * Script to verify delivery personnel login functionality
 * This script checks if a delivery person account exists and can login
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import DeliveryPersonnel from '../src/models/DeliveryPersonnel.js';

dotenv.config();

const verifyDeliveryLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    const email = 'sharma@gmail.com';
    const password = 'admin123';

    console.log('🔍 Checking delivery personnel account...');
    console.log(`Email: ${email}\n`);

    // Find delivery personnel by email with password field
    const deliveryPerson = await DeliveryPersonnel.findOne({ 
      email: email.toLowerCase().trim() 
    }).select('+password');

    if (!deliveryPerson) {
      console.log('❌ Account not found!');
      console.log('💡 Run: node scripts/createDeliveryBoy.js to create the account\n');
      process.exit(1);
    }

    console.log('✅ Account found:');
    console.log(`   Name: ${deliveryPerson.name}`);
    console.log(`   Email: ${deliveryPerson.email}`);
    console.log(`   Status: ${deliveryPerson.status}`);
    console.log(`   Employee ID: ${deliveryPerson.employeeId}`);
    console.log(`   Has Password: ${!!deliveryPerson.password}`);
    
    if (deliveryPerson.password) {
      console.log(`   Password Length: ${deliveryPerson.password.length} (should be 60+ for bcrypt hash)`);
    }

    // Check account status
    if (deliveryPerson.status !== 'active') {
      console.log(`\n⚠️  Account status is: ${deliveryPerson.status}`);
      console.log('   Account must be "active" to login');
    }

    // Check password
    if (!deliveryPerson.password) {
      console.log('\n❌ Password field is missing!');
      console.log('💡 Run: node scripts/createDeliveryBoy.js to set password\n');
      process.exit(1);
    }

    // Test password comparison
    console.log('\n🔐 Testing password comparison...');
    const isPasswordMatch = await deliveryPerson.comparePassword(password);
    
    if (isPasswordMatch) {
      console.log('✅ Password matches! Login should work correctly.\n');
    } else {
      console.log('❌ Password does not match!');
      console.log('💡 Run: node scripts/createDeliveryBoy.js to reset password\n');
      process.exit(1);
    }

    // Summary
    console.log('📋 Login Verification Summary:');
    console.log('   ✅ Account exists');
    console.log('   ✅ Password field exists');
    console.log(`   ${deliveryPerson.status === 'active' ? '✅' : '❌'} Account status: ${deliveryPerson.status}`);
    console.log(`   ${isPasswordMatch ? '✅' : '❌'} Password matches`);
    
    if (deliveryPerson.status === 'active' && isPasswordMatch) {
      console.log('\n🎉 Everything looks good! You should be able to login.');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}\n`);
    } else {
      console.log('\n⚠️  Fix the issues above before testing login.\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

verifyDeliveryLogin();

