import dotenv from 'dotenv';
import mongoose from 'mongoose';
import DeliveryPersonnel from '../src/models/DeliveryPersonnel.js';

dotenv.config();

const fixDeliveryAccount = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    const email = 'sharma@gmail.com';

    console.log('🔍 Checking delivery personnel account...');
    console.log(`Email: ${email}\n`);

    // Find delivery personnel by email
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
    console.log(`   Current Status: ${deliveryPerson.status}`);
    console.log(`   Employee ID: ${deliveryPerson.employeeId}`);
    console.log(`   Has Password: ${!!deliveryPerson.password}\n`);

    // Fix status if needed
    if (!['active', 'on_duty'].includes(deliveryPerson.status)) {
      console.log(`⚠️  Status is "${deliveryPerson.status}" - needs to be "active" or "on_duty"`);
      deliveryPerson.status = 'active';
      await deliveryPerson.save();
      console.log('✅ Status updated to: active\n');
    } else {
      console.log('✅ Status is already valid for login');
    }

    // Verify password exists
    if (!deliveryPerson.password) {
      console.log('⚠️  Password is missing - updating...');
      deliveryPerson.password = 'admin123';
      await deliveryPerson.save();
      
      // Verify it was hashed
      const verifyDP = await DeliveryPersonnel.findOne({ email: email.toLowerCase().trim() }).select('+password');
      if (verifyDP.password && verifyDP.password.length >= 60) {
        console.log('✅ Password set and encrypted\n');
      } else {
        console.log('⚠️  Password may not be properly hashed\n');
      }
    } else {
      console.log('✅ Password exists');
      const isPasswordHashed = deliveryPerson.password.length >= 60 && 
                               (deliveryPerson.password.startsWith('$2a$') || 
                                deliveryPerson.password.startsWith('$2b$') || 
                                deliveryPerson.password.startsWith('$2y$'));
      if (isPasswordHashed) {
        console.log('✅ Password is properly hashed\n');
      } else {
        console.log('⚠️  Password may not be properly hashed - updating...');
        deliveryPerson.password = 'admin123';
        await deliveryPerson.save();
        console.log('✅ Password updated and encrypted\n');
      }
    }

    // Final verification
    const finalCheck = await DeliveryPersonnel.findOne({ email: email.toLowerCase().trim() }).select('+password');
    
    console.log('📋 Final Account Status:');
    console.log(`   Status: ${finalCheck.status}`);
    console.log(`   Has Password: ${!!finalCheck.password}`);
    console.log(`   Password Length: ${finalCheck.password ? finalCheck.password.length : 0}`);
    
    // Test password
    if (finalCheck.password) {
      const isMatch = await finalCheck.comparePassword('admin123');
      console.log(`   Password Test: ${isMatch ? '✅ PASSED' : '❌ FAILED'}`);
    }

    // Check if account can login
    const canLogin = ['active', 'on_duty'].includes(finalCheck.status) && !!finalCheck.password;
    
    console.log(`\n${canLogin ? '✅' : '❌'} Account Status: ${canLogin ? 'READY FOR LOGIN' : 'NOT READY'}`);
    
    if (canLogin) {
      console.log('\n✅ Account is now ready for login!');
      console.log(`   Email: ${email}`);
      console.log(`   Password: admin123`);
    } else {
      console.log('\n⚠️  Account still has issues - check the errors above');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing delivery account:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

fixDeliveryAccount();

