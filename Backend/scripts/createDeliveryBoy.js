import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import DeliveryPersonnel from '../src/models/DeliveryPersonnel.js';

dotenv.config();

const createDeliveryBoy = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Check if delivery person already exists
    const existingDP = await DeliveryPersonnel.findOne({ email: 'sharma@gmail.com' });

    if (existingDP) {
      console.log('\n⚠️  Delivery person already exists:');
      console.log('Email:', existingDP.email);
      console.log('Name:', existingDP.name);
      console.log('Status:', existingDP.status);
      
      // Update password - set plain text, let pre-save hook encrypt it
      // This ensures proper hashing through the model's middleware
      existingDP.password = 'admin123';
      // No need to markModified since we're setting a new value
      
      // Ensure status is active
      if (existingDP.status !== 'active') {
        existingDP.status = 'active';
        console.log('⚠️  Status updated to: active');
      }
      
      // Save - the pre-save hook will automatically hash the password
      await existingDP.save();
      
      // Verify password was hashed
      const verifyDP = await DeliveryPersonnel.findOne({ email: 'sharma@gmail.com' }).select('+password');
      const isPasswordHashed = verifyDP.password && verifyDP.password.length >= 60 && 
                               (verifyDP.password.startsWith('$2a$') || 
                                verifyDP.password.startsWith('$2b$') || 
                                verifyDP.password.startsWith('$2y$'));
      
      // Test password comparison
      const bcrypt = (await import('bcryptjs')).default;
      const passwordMatches = await bcrypt.compare('admin123', verifyDP.password);
      
      if (isPasswordHashed && passwordMatches) {
        console.log('✅ Password encrypted and updated to: admin123');
        console.log('✅ Password hash length:', verifyDP.password.length, 'characters');
        console.log('✅ Password verification: PASSED');
      } else {
        console.log('⚠️  Warning: Password encryption may have issues');
        if (!isPasswordHashed) {
          console.log('   - Password is not properly hashed');
        }
        if (!passwordMatches) {
          console.log('   - Password comparison failed');
        }
      }
      console.log('✅ Account is now ready for login');
      
      process.exit(0);
    }

    // First, let's check if there's a zone in the database
    const Zone = mongoose.model('Zone', new mongoose.Schema({ name: String }));
    let zone = await Zone.findOne();
    
    if (!zone) {
      // Create a default zone
      zone = await Zone.create({
        name: 'Kathmandu',
        description: 'Default delivery zone',
        deliveryCharge: 50
      });
      console.log('✅ Created default zone:', zone.name);
    }

    // Create Delivery Boy
    const deliveryBoyData = {
      name: 'Sharma Kumar',
      email: 'sharma@gmail.com',
      password: 'admin123',
      phone: '9841234567',
      employeeId: 'DP001',
      status: 'active',
      zone: zone._id,
      zoneName: zone.name,
      vehicleType: 'bike',
      vehicleNumber: 'BA-01-2345',
      isOnline: false,
      rating: 0,
      totalDeliveries: 0,
      earnings: 0
    };

    const deliveryBoy = await DeliveryPersonnel.create(deliveryBoyData);

    console.log('\n✅ Delivery person created successfully!');
    console.log('\n📧 Email: sharma@gmail.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Name:', deliveryBoy.name);
    console.log('📱 Phone:', deliveryBoy.phone);
    console.log('🆔 Employee ID:', deliveryBoy.employeeId);
    console.log('📍 Zone:', deliveryBoy.zoneName);
    console.log('\n🚀 You can now login to the delivery app!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating delivery person:', error.message);
    process.exit(1);
  }
};

createDeliveryBoy();

