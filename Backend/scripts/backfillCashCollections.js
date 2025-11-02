import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Order from '../src/models/Order.js';
import DeliveryPersonnel from '../src/models/DeliveryPersonnel.js';
import CashCollection from '../src/models/Payment/CashCollection.js';

dotenv.config();

const backfillCashCollections = async () => {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB Connected\n');

  try {
    // Find all delivered orders with COD payment
    console.log('🔍 Finding delivered COD orders...');
    const deliveredOrders = await Order.find({
      status: 'delivered',
      $or: [
        { paymentMethod: 'cash_on_delivery' },
        { paymentMethod: 'cash' },
        { paymentMethod: 'cod' },
        { paymentMethod: { $regex: /cash/i } }
      ],
      deliveryPerson: { $exists: true, $ne: null }
    }).populate('deliveryPerson', 'name employeeId');

    console.log(`📦 Found ${deliveredOrders.length} delivered COD orders\n`);

    if (deliveredOrders.length === 0) {
      console.log('No delivered COD orders found to backfill.');
      return;
    }

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const order of deliveredOrders) {
      try {
        // Check if CashCollection already exists
        const existing = await CashCollection.findOne({ order: order._id });
        
        if (existing) {
          console.log(`⏭️  Skipping order ${order.orderNumber} - CashCollection already exists`);
          skipped++;
          continue;
        }

        // Get delivery person ID
        const deliveryPersonId = order.deliveryPerson?._id || 
                                  order.deliveryPerson?.toString() ||
                                  order.deliveryPersonnel?.toString() ||
                                  order.assignedDeliveryPerson?.toString();

        if (!deliveryPersonId) {
          console.log(`⚠️  Skipping order ${order.orderNumber} - No delivery person assigned`);
          skipped++;
          continue;
        }

        // Verify delivery person exists
        const deliveryPerson = await DeliveryPersonnel.findById(deliveryPersonId);
        if (!deliveryPerson) {
          console.log(`⚠️  Skipping order ${order.orderNumber} - Delivery person not found: ${deliveryPersonId}`);
          skipped++;
          continue;
        }

        // Calculate cash amount
        const cashAmount = order.pricing?.total || 
                          order.totalAmount || 
                          order.total || 
                          0;

        if (cashAmount <= 0) {
          console.log(`⚠️  Skipping order ${order.orderNumber} - Cash amount is 0`);
          skipped++;
          continue;
        }

        // Create CashCollection record
        const cashCollection = await CashCollection.create({
          deliveryPerson: deliveryPersonId,
          order: order._id,
          orderNumber: order.orderNumber || `ORDER-${order._id}`,
          amount: cashAmount,
          collectedAt: order.actualDeliveryTime || order.updatedAt || order.createdAt || new Date(),
          notes: `Backfilled - Order #${order.orderNumber || order._id} delivered on ${order.actualDeliveryTime || order.updatedAt || order.createdAt}`,
          submissionStatus: 'pending'
        });

        // Update delivery person's cash tracking
        deliveryPerson.cashInHand = (deliveryPerson.cashInHand || 0) + cashAmount;
        deliveryPerson.totalCashCollected = (deliveryPerson.totalCashCollected || 0) + cashAmount;
        deliveryPerson.pendingCashSubmission = (deliveryPerson.pendingCashSubmission || 0) + cashAmount;
        await deliveryPerson.save();

        console.log(`✅ Created CashCollection for order ${order.orderNumber}:`);
        console.log(`   Amount: ${cashAmount}`);
        console.log(`   Delivery Person: ${deliveryPerson.name} (${deliveryPerson.employeeId})`);
        console.log(`   Collection ID: ${cashCollection._id}\n`);

        created++;

      } catch (error) {
        console.error(`❌ Error processing order ${order.orderNumber}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📦 Total: ${deliveredOrders.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ MongoDB Disconnected');
    process.exit(0);
  }
};

backfillCashCollections();

