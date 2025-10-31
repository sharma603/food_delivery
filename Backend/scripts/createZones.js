/**
 * Create Delivery Zones Script
 * Creates actual delivery zones for the food delivery system
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Zone from '../src/models/Zone.js';
import SuperAdmin from '../src/models/User/SuperAdmin.js';

dotenv.config();

const createZones = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // Get SuperAdmin for createdBy field
    const superAdmin = await SuperAdmin.findOne();
    if (!superAdmin) {
      console.error('❌ No SuperAdmin found. Please create SuperAdmin first.');
      process.exit(1);
    }

    console.log('🗺️  Creating Delivery Zones for Qatar...\n');

    // Qatar Delivery Zones - Actual zones based on major areas in Doha and surrounding regions
    const zonesData = [
      {
        name: 'Doha - Central',
        description: 'Central Doha including West Bay, Corniche, Downtown Doha',
        areas: ['west bay', 'corniche', 'downtown doha', 'souq waqif', 'al bidda'],
        pincodes: ['00001', '00002', '00003'],
        deliveryCharge: 15,
        coverage: '5km radius from center',
        estimatedDeliveryTime: '20-30 minutes',
        coordinates: {
          center: {
            latitude: 25.2854,
            longitude: 51.5310
          }
        }
      },
      {
        name: 'Doha - West Bay',
        description: 'West Bay area including Diplomatic Area, Al Dafna',
        areas: ['west bay', 'diplomatic area', 'al dafna', 'the pearl', 'lusail'],
        pincodes: ['00004', '00005'],
        deliveryCharge: 20,
        coverage: '6km radius',
        estimatedDeliveryTime: '25-35 minutes',
        coordinates: {
          center: {
            latitude: 25.3214,
            longitude: 51.5270
          }
        }
      },
      {
        name: 'Doha - Al Rayyan',
        description: 'Al Rayyan area including Education City, Al Gharrafa',
        areas: ['al rayyan', 'education city', 'al gharrafa', 'muaither', 'al waab'],
        pincodes: ['00006', '00007'],
        deliveryCharge: 18,
        coverage: '7km radius',
        estimatedDeliveryTime: '25-35 minutes',
        coordinates: {
          center: {
            latitude: 25.3025,
            longitude: 51.4380
          }
        }
      },
      {
        name: 'Doha - Al Sadd',
        description: 'Al Sadd area including C-Ring Road, D-Ring Road',
        areas: ['al sadd', 'c-ring road', 'd-ring road', 'bin mahmoud', 'fereej al hitmi'],
        pincodes: ['00008', '00009'],
        deliveryCharge: 16,
        coverage: '5km radius',
        estimatedDeliveryTime: '22-32 minutes',
        coordinates: {
          center: {
            latitude: 25.3054,
            longitude: 51.5055
          }
        }
      },
      {
        name: 'Doha - Old Airport',
        description: 'Old Airport area including Al Matar Al Qadeem',
        areas: ['old airport', 'al matar al qadeem', 'airport road', 'al mansoura', 'al najada'],
        pincodes: ['00010', '00011'],
        deliveryCharge: 15,
        coverage: '5km radius',
        estimatedDeliveryTime: '20-30 minutes',
        coordinates: {
          center: {
            latitude: 25.2620,
            longitude: 51.5600
          }
        }
      },
      {
        name: 'Doha - Al Waab',
        description: 'Al Waab area including Aspire Zone, Sports City',
        areas: ['al waab', 'aspire zone', 'sports city', 'khalifa stadium', 'villaggio'],
        pincodes: ['00012'],
        deliveryCharge: 19,
        coverage: '6km radius',
        estimatedDeliveryTime: '25-35 minutes',
        coordinates: {
          center: {
            latitude: 25.2640,
            longitude: 51.4400
          }
        }
      },
      {
        name: 'Doha - Al Khor',
        description: 'Al Khor area including northern regions',
        areas: ['al khor', 'al shahaniya', 'umm qarn', 'al ghariyah'],
        pincodes: ['00020', '00021'],
        deliveryCharge: 25,
        coverage: '10km radius',
        estimatedDeliveryTime: '35-45 minutes',
        coordinates: {
          center: {
            latitude: 25.6838,
            longitude: 51.5058
          }
        }
      },
      {
        name: 'Doha - Dukhan',
        description: 'Dukhan area including western regions',
        areas: ['dukhan', 'al jumaili', 'al jarayanah'],
        pincodes: ['00030'],
        deliveryCharge: 30,
        coverage: '12km radius',
        estimatedDeliveryTime: '45-55 minutes',
        coordinates: {
          center: {
            latitude: 25.4247,
            longitude: 50.7853
          }
        }
      },
      {
        name: 'Doha - Mesaieed',
        description: 'Mesaieed industrial area',
        areas: ['mesaieed', 'al wakrah', 'industrial area'],
        pincodes: ['00040', '00041'],
        deliveryCharge: 22,
        coverage: '8km radius',
        estimatedDeliveryTime: '30-40 minutes',
        coordinates: {
          center: {
            latitude: 24.9922,
            longitude: 51.5514
          }
        }
      },
      {
        name: 'Doha - Pearl Qatar',
        description: 'The Pearl Qatar and Lusail area',
        areas: ['pearl qatar', 'lusail', 'legtaifiya', 'lagoon'],
        pincodes: ['00050', '00051'],
        deliveryCharge: 20,
        coverage: '6km radius',
        estimatedDeliveryTime: '25-35 minutes',
        coordinates: {
          center: {
            latitude: 25.3700,
            longitude: 51.5400
          }
        }
      }
    ];

    let created = 0;
    let existing = 0;

    for (const zoneData of zonesData) {
      try {
        // Check if zone already exists
        const existingZone = await Zone.findOne({ 
          name: { $regex: new RegExp(`^${zoneData.name}$`, 'i') } 
        });

        if (existingZone) {
          console.log(`⚠️  Zone "${zoneData.name}" already exists`);
          existing++;
          continue;
        }

        // Create zone
        const zone = new Zone({
          ...zoneData,
          status: 'active',
          createdBy: superAdmin._id
        });

        await zone.save();
        console.log(`✅ Created: ${zoneData.name} (Rs. ${zoneData.deliveryCharge} delivery charge)`);
        created++;

      } catch (error) {
        console.error(`❌ Error creating zone "${zoneData.name}":`, error.message);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Created: ${created} zones`);
    console.log(`   ℹ️  Existing: ${existing} zones`);
    console.log(`   📋 Total zones in database: ${await Zone.countDocuments()}`);

    // List all active zones
    const allZones = await Zone.find({ status: 'active' }).sort({ name: 1 });
    if (allZones.length > 0) {
      console.log('\n🗺️  Active Zones:');
      allZones.forEach(zone => {
        console.log(`   • ${zone.name} - Rs. ${zone.deliveryCharge}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Zones setup complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
};

createZones();

