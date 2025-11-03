import dotenv from 'dotenv';
import mongoose from 'mongoose';
import SuperAdmin from '../../src/models/User/SuperAdmin.js';

dotenv.config();

/**
 * Initialize SuperAdmin Account - Runs automatically on server startup
 * Only creates SuperAdmin if none exists (one-time setup)
 */
const createSuperAdmin = async () => {
  try {
    // If running as standalone script, connect to database
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/food_delivery';
      await mongoose.connect(mongoUri);
      console.log('✅ MongoDB Connected for SuperAdmin initialization');
    }

    // Check if SuperAdmin already exists
    const existingSuperAdmin = await SuperAdmin.findOne({ role: 'super_admin' });

    if (existingSuperAdmin) {
      console.log('✅ SuperAdmin already exists - Skipping creation');
      // Security: Don't display sensitive information (email, Admin ID) in terminal
      
      // If running as standalone script, exit
      if (process.argv[1] && process.argv[1].includes('createSuperAdmin.js')) {
        process.exit(0);
      }
      return existingSuperAdmin;
    }

    // Create SuperAdmin (only if none exists - one-time setup)
    const superAdminData = {
      name: process.env.SUPERADMIN_NAME || 'Super Admin',
      email: process.env.SUPERADMIN_EMAIL || 'admin@fooddelivery.com',
      password: process.env.SUPERADMIN_PASSWORD || 'Admin@123',
      adminId: process.env.SUPERADMIN_ID || 'SA001',
      role: 'super_admin',
      department: process.env.SUPERADMIN_DEPARTMENT || 'technical',
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

    console.log('\n✅ SuperAdmin created successfully!');
    console.log('🔑 Default Password: Admin@123');
    console.log('\n⚠️  IMPORTANT: Please change the password after first login!');
    console.log('💡 Check your .env file or database for SuperAdmin credentials.');
    // Security: Don't display email and Admin ID in terminal

    // If running as standalone script, close connection and exit
    if (process.argv[1] && process.argv[1].includes('createSuperAdmin.js')) {
      await mongoose.connection.close();
      process.exit(0);
    }
    
    return superAdmin;
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error - admin already exists (race condition)
      console.log('✅ SuperAdmin already exists (duplicate key detected)');
      if (process.argv[1] && process.argv[1].includes('createSuperAdmin.js')) {
        await mongoose.connection.close();
        process.exit(0);
      }
      return null;
    }
    
    console.error('❌ Error creating SuperAdmin:', error.message);
    
    // If running as standalone script, close connection and exit with error
    if (process.argv[1] && process.argv[1].includes('createSuperAdmin.js')) {
      await mongoose.connection.close();
      process.exit(1);
    }
    
    // If running from app.js, don't exit - just log error and return null
    return null;
  }
};

// Export for use in app.js (for automatic initialization)
export default createSuperAdmin;

// Allow running as standalone script: node Backend/scripts/create/createSuperAdmin.js
if (process.argv[1] && process.argv[1].includes('createSuperAdmin.js')) {
  createSuperAdmin();
}
