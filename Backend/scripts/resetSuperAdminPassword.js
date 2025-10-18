import dotenv from 'dotenv';
import mongoose from 'mongoose';
import SuperAdmin from '../src/models/User/SuperAdmin.js';

dotenv.config();

const resetSuperAdminPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Find the SuperAdmin
    const superAdmin = await SuperAdmin.findOne({ role: 'super_admin' });

    if (!superAdmin) {
      console.log('No SuperAdmin found!');
      process.exit(1);
    }

    // Reset password
    const newPassword = 'Admin@123';
    superAdmin.password = newPassword;
    await superAdmin.save();

    console.log('\nSuperAdmin password reset successfully!');
    console.log('\nEmail:', superAdmin.email);
    console.log('New Password: Admin@123');
    console.log('Admin ID:', superAdmin.adminId);
    console.log('\nPlease change the password after login!');

    process.exit(0);
  } catch (error) {
    console.error('Error resetting password:', error.message);
    process.exit(1);
  }
};

resetSuperAdminPassword();
