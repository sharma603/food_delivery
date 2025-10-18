import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
import Zone from '../src/models/Zone.js';
import DeliveryPersonnel from '../src/models/DeliveryPersonnel.js';
import Delivery from '../src/models/Delivery.js';
import DeliveryAnalytics from '../src/models/DeliveryAnalytics.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/food_delivery', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample zones data for Nepal
const sampleZones = [
  {
    name: 'Zone A - Kathmandu Valley',
    description: 'Kathmandu, Lalitpur, Bhaktapur metropolitan areas',
    areas: ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Kirtipur', 'Madhyapur Thimi'],
    pincodes: ['44600', '44700', '44800', '44900', '45000'],
    deliveryCharge: 50,
    status: 'active',
    coverage: '15km radius',
    estimatedDeliveryTime: '30-45 minutes',
    coordinates: {
      center: {
        latitude: 27.7172,
        longitude: 85.3240
      }
    }
  },
  {
    name: 'Zone B - Pokhara',
    description: 'Pokhara metropolitan area and surrounding regions',
    areas: ['Pokhara', 'Lekhnath', 'Kaski', 'Syangja'],
    pincodes: ['33700', '33800', '33900', '34000'],
    deliveryCharge: 40,
    status: 'active',
    coverage: '12km radius',
    estimatedDeliveryTime: '25-35 minutes',
    coordinates: {
      center: {
        latitude: 28.2096,
        longitude: 83.9856
      }
    }
  },
  {
    name: 'Zone C - Chitwan',
    description: 'Chitwan district and Bharatpur metropolitan area',
    areas: ['Bharatpur', 'Ratnanagar', 'Kalika', 'Madi'],
    pincodes: ['44200', '44300', '44400', '44500'],
    deliveryCharge: 35,
    status: 'active',
    coverage: '10km radius',
    estimatedDeliveryTime: '20-30 minutes',
    coordinates: {
      center: {
        latitude: 27.5290,
        longitude: 84.3542
      }
    }
  },
  {
    name: 'Zone D - Biratnagar',
    description: 'Biratnagar metropolitan area and Morang district',
    areas: ['Biratnagar', 'Itahari', 'Inaruwa', 'Sunsari'],
    pincodes: ['56600', '56700', '56800', '56900'],
    deliveryCharge: 45,
    status: 'active',
    coverage: '8km radius',
    estimatedDeliveryTime: '25-40 minutes',
    coordinates: {
      center: {
        latitude: 26.4525,
        longitude: 87.2718
      }
    }
  }
];

// Sample personnel data
const samplePersonnel = [
  {
    name: 'Rajesh Thapa',
    email: 'rajesh.thapa@delivery.com',
    phone: '+9779841234567',
    employeeId: 'EMP001',
    status: 'on_duty',
    vehicleType: 'Motorcycle',
    vehicleNumber: 'Ba-01-1234',
    vehicleModel: 'Honda CB150R',
    vehicleYear: 2022,
    baseSalary: 25000,
    commissionRate: 0.15,
    rating: 4.8,
    totalDeliveries: 1250,
    completedDeliveries: 1200,
    cancelledDeliveries: 50,
    averageDeliveryTime: 28,
    onTimeDeliveries: 1150,
    earnings: 156000,
    isOnline: true,
    currentLocation: {
      latitude: 27.7172,
      longitude: 85.3240,
      address: 'Thamel, Kathmandu',
      lastUpdated: new Date()
    }
  },
  {
    name: 'Sita Gurung',
    email: 'sita.gurung@delivery.com',
    phone: '+9779841234568',
    employeeId: 'EMP002',
    status: 'active',
    vehicleType: 'Bicycle',
    vehicleNumber: 'Ba-02-5678',
    vehicleModel: 'Hero Sprint',
    vehicleYear: 2023,
    baseSalary: 20000,
    commissionRate: 0.12,
    rating: 4.6,
    totalDeliveries: 980,
    completedDeliveries: 950,
    cancelledDeliveries: 30,
    averageDeliveryTime: 32,
    onTimeDeliveries: 900,
    earnings: 124000,
    isOnline: false,
    currentLocation: {
      latitude: 27.7172,
      longitude: 85.3240,
      address: 'New Road, Kathmandu',
      lastUpdated: new Date()
    }
  },
  {
    name: 'Amit Sharma',
    email: 'amit.sharma@delivery.com',
    phone: '+9779841234569',
    employeeId: 'EMP003',
    status: 'on_duty',
    vehicleType: 'Car',
    vehicleNumber: 'Ba-03-9012',
    vehicleModel: 'Maruti Swift',
    vehicleYear: 2021,
    baseSalary: 30000,
    commissionRate: 0.18,
    rating: 4.9,
    totalDeliveries: 1450,
    completedDeliveries: 1420,
    cancelledDeliveries: 30,
    averageDeliveryTime: 25,
    onTimeDeliveries: 1380,
    earnings: 189000,
    isOnline: true,
    currentLocation: {
      latitude: 28.2096,
      longitude: 83.9856,
      address: 'Lakeside, Pokhara',
      lastUpdated: new Date()
    }
  },
  {
    name: 'Priya Tamang',
    email: 'priya.tamang@delivery.com',
    phone: '+9779841234570',
    employeeId: 'EMP004',
    status: 'inactive',
    vehicleType: 'Scooter',
    vehicleNumber: 'Ba-04-3456',
    vehicleModel: 'Honda Activa',
    vehicleYear: 2023,
    baseSalary: 22000,
    commissionRate: 0.14,
    rating: 4.4,
    totalDeliveries: 750,
    completedDeliveries: 720,
    cancelledDeliveries: 30,
    averageDeliveryTime: 35,
    onTimeDeliveries: 680,
    earnings: 98000,
    isOnline: false,
    currentLocation: {
      latitude: 27.5290,
      longitude: 84.3542,
      address: 'Bharatpur, Chitwan',
      lastUpdated: new Date()
    }
  }
];

// Sample deliveries data
const sampleDeliveries = [
  {
    orderId: new mongoose.Types.ObjectId(),
    orderNumber: 'ORD001',
    customer: {
      id: new mongoose.Types.ObjectId(),
      name: 'Ram Bahadur',
      phone: '+9779841234001',
      email: 'ram.bahadur@email.com'
    },
    deliveryAddress: {
      street: 'Thamel, Kathmandu',
      city: 'Kathmandu',
      state: 'Bagmati',
      pincode: '44600',
      landmark: 'Near Thamel Chowk'
    },
    restaurant: {
      id: new mongoose.Types.ObjectId(),
      name: 'Pizza Palace',
      address: 'Durbar Marg, Kathmandu'
    },
    status: 'in_transit',
    priority: 'normal',
    assignedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    pickedUpAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    estimatedDelivery: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
    currentLocation: {
      latitude: 27.7172,
      longitude: 85.3240,
      address: 'Thamel, Kathmandu',
      lastUpdated: new Date()
    },
    distance: 8.5,
    estimatedTimeRemaining: 15,
    orderValue: 1250,
    deliveryCharge: 50,
    totalAmount: 1300,
    paymentMethod: 'Cash on Delivery',
    specialInstructions: 'Ring doorbell twice',
    isDelayed: false
  },
  {
    orderId: new mongoose.Types.ObjectId(),
    orderNumber: 'ORD002',
    customer: {
      id: new mongoose.Types.ObjectId(),
      name: 'Sita Devi',
      phone: '+9779841234002',
      email: 'sita.devi@email.com'
    },
    deliveryAddress: {
      street: 'Lakeside, Pokhara',
      city: 'Pokhara',
      state: 'Gandaki',
      pincode: '33700',
      landmark: 'Near Fewa Lake'
    },
    restaurant: {
      id: new mongoose.Types.ObjectId(),
      name: 'Burger House',
      address: 'Lakeside, Pokhara'
    },
    status: 'picked_up',
    priority: 'high',
    assignedAt: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
    pickedUpAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    estimatedDelivery: new Date(Date.now() + 20 * 60 * 1000), // 20 minutes from now
    currentLocation: {
      latitude: 28.2096,
      longitude: 83.9856,
      address: 'Lakeside, Pokhara',
      lastUpdated: new Date()
    },
    distance: 3.2,
    estimatedTimeRemaining: 20,
    orderValue: 890,
    deliveryCharge: 40,
    totalAmount: 930,
    paymentMethod: 'Digital Wallet',
    specialInstructions: 'Leave at door if no answer',
    isDelayed: false
  }
];

// Sample analytics data
const sampleAnalytics = [
  {
    date: new Date(),
    hour: 12,
    dayOfWeek: new Date().getDay(),
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    totalDeliveries: 45,
    completedDeliveries: 42,
    cancelledDeliveries: 3,
    averageDeliveryTime: 32,
    onTimeDeliveries: 38,
    delayedDeliveries: 4,
    totalDistance: 125.5,
    totalRevenue: 45000,
    totalDeliveryCharges: 2250,
    averageOrderValue: 1000,
    averageRating: 4.7,
    totalRatings: 35,
    positiveRatings: 32,
    negativeRatings: 3,
    completionRate: 93.3,
    onTimeRate: 90.5,
    efficiency: 91.9,
    isPeakHour: true,
    peakHourMultiplier: 1.2
  }
];

// Seed function
const seedData = async () => {
  try {
    console.log('🌱 Starting delivery data seeding...');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Zone.deleteMany({});
    await DeliveryPersonnel.deleteMany({});
    await Delivery.deleteMany({});
    await DeliveryAnalytics.deleteMany({});

    // Create a dummy admin user ID for createdBy fields
    const adminId = new mongoose.Types.ObjectId();

    // Seed zones
    console.log('📍 Seeding zones...');
    const createdZones = [];
    for (const zoneData of sampleZones) {
      const zone = new Zone({
        ...zoneData,
        createdBy: adminId,
        restaurantCount: Math.floor(Math.random() * 30) + 5,
        orderCount: Math.floor(Math.random() * 2000) + 500,
        totalRevenue: Math.floor(Math.random() * 100000) + 50000
      });
      await zone.save();
      createdZones.push(zone);
      console.log(`✅ Created zone: ${zone.name}`);
    }

    // Seed personnel
    console.log('👥 Seeding personnel...');
    const createdPersonnel = [];
    for (let i = 0; i < samplePersonnel.length; i++) {
      const personnelData = samplePersonnel[i];
      const zone = createdZones[i % createdZones.length];
      
      const personnel = new DeliveryPersonnel({
        ...personnelData,
        zone: zone._id,
        zoneName: zone.name,
        createdBy: adminId
      });
      await personnel.save();
      createdPersonnel.push(personnel);
      console.log(`✅ Created personnel: ${personnel.name} (${personnel.employeeId})`);
    }

    // Seed deliveries
    console.log('🚚 Seeding deliveries...');
    for (let i = 0; i < sampleDeliveries.length; i++) {
      const deliveryData = sampleDeliveries[i];
      const zone = createdZones[i % createdZones.length];
      const personnel = createdPersonnel[i % createdPersonnel.length];
      
      const delivery = new Delivery({
        ...deliveryData,
        zone: {
          id: zone._id,
          name: zone.name,
          deliveryCharge: zone.deliveryCharge
        },
        deliveryPersonnel: {
          id: personnel._id,
          name: personnel.name,
          phone: personnel.phone,
          vehicleType: personnel.vehicleType,
          vehicleNumber: personnel.vehicleNumber
        },
        createdBy: adminId
      });
      await delivery.save();
      console.log(`✅ Created delivery: ${delivery.orderNumber}`);
    }

    // Seed analytics
    console.log('📊 Seeding analytics...');
    for (const analyticsData of sampleAnalytics) {
      const zone = createdZones[0];
      const personnel = createdPersonnel[0];
      
      const analytics = new DeliveryAnalytics({
        ...analyticsData,
        zone: {
          id: zone._id,
          name: zone.name
        },
        personnel: {
          id: personnel._id,
          name: personnel.name
        }
      });
      await analytics.save();
      console.log(`✅ Created analytics record for ${analytics.date.toDateString()}`);
    }

    console.log('🎉 Delivery data seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Zones: ${createdZones.length}`);
    console.log(`   - Personnel: ${createdPersonnel.length}`);
    console.log(`   - Deliveries: ${sampleDeliveries.length}`);
    console.log(`   - Analytics: ${sampleAnalytics.length}`);

  } catch (error) {
    console.error('❌ Error seeding delivery data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the seeder
const runSeeder = async () => {
  await connectDB();
  await seedData();
  process.exit(0);
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeeder();
}

export { seedData, connectDB };
