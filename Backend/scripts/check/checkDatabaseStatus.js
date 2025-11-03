import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const checkDatabaseStatus = async () => {
  console.log('🔍 Database Status Check Tool\n');
  console.log('='.repeat(70));
  
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/food_delivery';
    
    console.log('\n📋 Connection Information:');
    console.log(`   URI: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`);
    
    // Parse connection string
    const uriParts = mongoUri.match(/mongodb:\/\/(?:([^:]+):([^@]+)@)?([^:]+):(\d+)\/([^?]+)(\?.*)?/);
    if (uriParts) {
      const [, username, password, host, port, database] = uriParts;
      console.log(`   Host: ${host}`);
      console.log(`   Port: ${port}`);
      console.log(`   Database: ${database || '⚠️ NOT SPECIFIED (will use "test")'}`);
    }
    
    // Connect to MongoDB
    console.log('\n🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    
    const conn = mongoose.connection;
    console.log(`   ✅ Connected successfully`);
    console.log(`   Current Database: ${conn.name}`);
    
    // Check all databases
    console.log('\n📊 All Databases:');
    try {
      const adminDb = conn.db.admin();
      const { databases } = await adminDb.listDatabases();
      
      databases.forEach(db => {
        const sizeInMB = (db.sizeOnDisk / 1024 / 1024).toFixed(2);
        const isTargetDb = db.name === 'food_delivery';
        const isTestDb = db.name === 'test';
        let marker = '  ';
        
        if (isTargetDb) marker = '🎯';
        else if (isTestDb) marker = '⚠️ ';
        
        console.log(`   ${marker} ${db.name.padEnd(20)} ${sizeInMB.padStart(10)} MB`);
      });
    } catch (e) {
      console.log('   ⚠️  Could not list databases');
    }
    
    // Check current database collections
    console.log(`\n📁 Collections in "${conn.name}" database:`);
    const currentDb = conn.db;
    const collections = await currentDb.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('   ❌ No collections found!');
    } else {
      console.log(`   ✅ Found ${collections.length} collections:`);
      for (const col of collections) {
        try {
          const count = await currentDb.collection(col.name).countDocuments();
          console.log(`      - ${col.name.padEnd(25)} ${count.toString().padStart(5)} documents`);
        } catch (e) {
          console.log(`      - ${col.name} (error counting)`);
        }
      }
    }
    
    // Check SuperAdmin specifically
    console.log('\n👤 SuperAdmin Check:');
    try {
      const superAdminCollection = currentDb.collection('superadmins');
      const count = await superAdminCollection.countDocuments();
      
      if (count === 0) {
        console.log('   ❌ No SuperAdmin found in current database');
        
        // Check other databases
        console.log('\n   🔍 Checking other databases for SuperAdmin...');
        try {
          const adminDb = conn.db.admin();
          const { databases } = await adminDb.listDatabases();
          
          for (const dbInfo of databases) {
            if (dbInfo.name === conn.name) continue;
            
            try {
              const tempDb = mongoose.connection.client.db(dbInfo.name);
              const tempCount = await tempDb.collection('superadmins').countDocuments();
              if (tempCount > 0) {
                console.log(`   ✅ Found ${tempCount} SuperAdmin(s) in "${dbInfo.name}" database!`);
                console.log(`   💡 Your data is in the wrong database!`);
                console.log(`   💡 Fix: Update MONGODB_URI to include "/${dbInfo.name}"`);
              }
            } catch (e) {
              // Skip databases we can't access
            }
          }
        } catch (e) {
          console.log('   ⚠️  Could not check other databases');
        }
      } else {
        console.log(`   ✅ Found ${count} SuperAdmin(s)`);
        
        // Show SuperAdmin details
        const superAdmins = await superAdminCollection.find({}).limit(3).toArray();
        superAdmins.forEach((admin, index) => {
          console.log(`\n   ${index + 1}. SuperAdmin:`);
          console.log(`      Email: ${admin.email || 'N/A'}`);
          console.log(`      Admin ID: ${admin.adminId || 'N/A'}`);
          console.log(`      Name: ${admin.name || 'N/A'}`);
          console.log(`      Created: ${admin.createdAt || 'N/A'}`);
        });
      }
    } catch (e) {
      console.log(`   ❌ Error: ${e.message}`);
    }
    
    // Check connection string issue
    console.log('\n🔧 Connection String Analysis:');
    const dbNameMatch = mongoUri.match(/\/([^/?]+)(\?|$)/);
    if (!dbNameMatch || dbNameMatch[1] === '') {
      console.log('   ❌ Database name NOT specified in connection string!');
      console.log('   ⚠️  MongoDB will default to "test" database');
      console.log('   💡 This is likely why data appears to disappear');
      console.log('   💡 Fix: Add /food_delivery to end of URI');
    } else {
      const dbName = dbNameMatch[1];
      if (dbName !== conn.name) {
        console.log(`   ⚠️  URI specifies "${dbName}" but connected to "${conn.name}"`);
      } else {
        console.log(`   ✅ Connection string is correct`);
      }
    }
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    if (conn.name === 'test') {
      console.log('   ❌ You are connected to "test" database!');
      console.log('   💡 Update MONGODB_URI to: mongodb://localhost:27017/food_delivery');
    } else {
      const superAdminCount = await currentDb.collection('superadmins').countDocuments().catch(() => 0);
      if (superAdminCount === 0) {
        console.log('   ⚠️  SuperAdmin collection is empty');
        console.log('   💡 Possible causes:');
        console.log('      1. MongoDB data directory is temporary (cleared on restart)');
        console.log('      2. MongoDB service restarted with different data path');
        console.log('      3. Data was created in different MongoDB instance');
        console.log('\n   💡 Action: Check MongoDB data directory location');
        console.log('      - Look in: C:\\Program Files\\MongoDB\\Server\\{version}\\bin\\mongod.cfg');
        console.log('      - Check storage.dbPath setting');
        console.log('      - Ensure it\'s NOT in Temp folder');
      } else {
        console.log('   ✅ Everything looks correct!');
        console.log('   ✅ SuperAdmin exists in database');
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ Check complete!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Possible issues:');
    console.error('   - MongoDB server is not running');
    console.error('   - Connection string is incorrect');
    console.error('   - Network/firewall issue');
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

checkDatabaseStatus();

