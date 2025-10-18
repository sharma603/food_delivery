import dotenv from 'dotenv';
import mongoose from 'mongoose';
import SuperAdmin from '../src/models/User/SuperAdmin.js';

dotenv.config();

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Check if SuperAdmin already exists
    const existingSuperAdmin = await SuperAdmin.findOne({ role: 'super_admin' });

    if (existingSuperAdmin) {
      console.log('SuperAdmin already exists:');
      console.log('Email:', existingSuperAdmin.email);
      console.log('Admin ID:', existingSuperAdmin.adminId);
      process.exit(0);
    }

    // Create SuperAdmin
    const superAdminData = {
      name: 'Super Admin',
      email: 'admin@fooddelivery.com',
      password: 'Admin@123',
      adminId: 'SA001',
      role: 'super_admin',
      department: 'technical',
      isActive: true,
      isVerified: true,
      permissions: [
        'manage_restaurants',
        'create_restaurant_accounts',
        'approve_restaurants',
        'suspend_restaurants',
        'view_restaurant_details',
        'manage_users',
        'create_users',
        'suspend_users',
        'view_user_details',
        'manage_delivery_partners',
        'view_all_orders',
        'manage_orders',
        'handle_disputes',
        'process_refunds',
        'view_financials',
        'manage_payouts',
        'set_commission_rates',
        'view_transactions',
        'generate_financial_reports',
        'view_analytics',
        'generate_reports',
        'export_data',
        'system_settings',
        'manage_admins',
        'app_configurations',
        'notification_settings',
        'security_settings',
        'handle_support_tickets',
        'manage_faqs',
        'broadcast_notifications'
      ]
    };

    const superAdmin = await SuperAdmin.create(superAdminData);

    console.log('\nSuperAdmin created successfully!');
    console.log('\nEmail:', superAdmin.email);
    console.log('Password: Admin@123');
    console.log('Admin ID:', superAdmin.adminId);
    console.log('\nPlease change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error creating SuperAdmin:', error.message);
    process.exit(1);
  }
};

createSuperAdmin();
