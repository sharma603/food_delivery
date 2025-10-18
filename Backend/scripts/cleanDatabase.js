import dotenv from 'dotenv';
import mongoose from 'mongoose';
import SuperAdmin from '../src/models/User/SuperAdmin.js';
import RestaurantStatus from '../src/models/RestaurantStatus.js';
import RestaurantUser from '../src/models/RestaurantUser.js';

dotenv.config();

// Optimize restaurant status records
const optimizeRestaurantStatus = async () => {
  try {
    console.log('Starting restaurant status optimization...');

    // Get all restaurants
    const restaurants = await RestaurantUser.find({}, '_id restaurantName isOpen');
    console.log(`Found ${restaurants.length} restaurants`);

    let optimizedCount = 0;
    let deletedCount = 0;

    for (const restaurant of restaurants) {
      // Find all status records for this restaurant
      const statusRecords = await RestaurantStatus.find({
        restaurant: restaurant._id,
        isActive: true
      }).sort({ createdAt: -1 });

      if (statusRecords.length > 1) {
        console.log(`Restaurant ${restaurant.restaurantName} has ${statusRecords.length} status records`);
        
        // Keep the most recent record and delete others
        const keepRecord = statusRecords[0];
        const deleteRecords = statusRecords.slice(1);

        // Update the kept record to match current restaurant status
        keepRecord.status = restaurant.isOpen ? 'open' : 'closed';
        keepRecord.reason = 'Optimized - current status';
        keepRecord.updatedAt = new Date();
        await keepRecord.save();

        // Delete duplicate records
        const deleteIds = deleteRecords.map(record => record._id);
        await RestaurantStatus.deleteMany({ _id: { $in: deleteIds } });

        deletedCount += deleteRecords.length;
        optimizedCount++;
        
        console.log(`  - Kept 1 record, deleted ${deleteRecords.length} duplicates`);
      } else if (statusRecords.length === 0) {
        // Create initial status record for restaurants without any
        await RestaurantStatus.create({
          restaurant: restaurant._id,
          status: restaurant.isOpen ? 'open' : 'closed',
          changedBy: restaurant._id,
          reason: 'Initial status record created during optimization',
          isActive: true
        });
        
        console.log(`  - Created initial status record for ${restaurant.restaurantName}`);
        optimizedCount++;
      }
    }

    console.log('\nOptimization completed!');
    console.log(`- Restaurants optimized: ${optimizedCount}`);
    console.log(`- Duplicate records deleted: ${deletedCount}`);
    
    // Show final statistics
    const totalStatusRecords = await RestaurantStatus.countDocuments({ isActive: true });
    const totalRestaurants = await RestaurantUser.countDocuments();
    
    console.log(`\nFinal statistics:`);
    console.log(`- Total restaurants: ${totalRestaurants}`);
    console.log(`- Total status records: ${totalStatusRecords}`);
    console.log(`- Average records per restaurant: ${(totalStatusRecords / totalRestaurants).toFixed(2)}`);

  } catch (error) {
    console.error('Error optimizing restaurant status:', error);
  }
};

const cleanDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();

    console.log('\nCurrent Database Collections:');
    console.log('================================');

    for (const collection of collections) {
      const collectionName = collection.name;
      const count = await mongoose.connection.db.collection(collectionName).countDocuments();
      console.log(`${collectionName}: ${count} documents`);
    }

    console.log('\nWARNING: This will delete ALL data except SuperAdmin!');
    console.log('\nCollections that will be cleared:');

    const protectedCollections = ['superadmins'];
    const collectionsToClean = collections
      .map(c => c.name)
      .filter(name => !protectedCollections.includes(name));

    collectionsToClean.forEach(name => {
      console.log(`   - ${name}`);
    });

    console.log('\nTo proceed with deletion, run: node scripts/cleanDatabase.js --confirm');
    console.log('To optimize restaurant status records, run: node scripts/cleanDatabase.js --optimize-status');

    if (process.argv.includes('--confirm')) {
      console.log('\nCleaning database...\n');

      for (const collectionName of collectionsToClean) {
        const result = await mongoose.connection.db.collection(collectionName).deleteMany({});
        console.log(`Cleared ${collectionName}: ${result.deletedCount} documents deleted`);
      }

      console.log('\nDatabase cleaned successfully!');
      console.log('SuperAdmin account preserved');
    }

    if (process.argv.includes('--optimize-status')) {
      console.log('\nOptimizing restaurant status records...\n');
      await optimizeRestaurantStatus();
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

cleanDatabase();
