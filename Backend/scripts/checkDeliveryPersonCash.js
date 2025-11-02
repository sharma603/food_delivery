import dotenv from 'dotenv';
import mongoose from 'mongoose';
import DeliveryPersonnel from '../src/models/DeliveryPersonnel.js';
import CashCollection from '../src/models/Payment/CashCollection.js';
import Delivery from '../src/models/Delivery.js';
import Order from '../src/models/Order.js';

dotenv.config();

const checkDeliveryPersonCash = async () => {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB Connected\n');

  try {
    // Find the delivery person by employee ID or email
    const searchCriteria = {
      $or: [
        { employeeId: 'EMO002' },
        { email: 'admin@gmail.com' },
        { name: { $regex: 'Bijay', $options: 'i' } }
      ]
    };

    console.log('🔍 Searching for delivery person...');
    const deliveryPerson = await DeliveryPersonnel.findOne(searchCriteria);

    if (!deliveryPerson) {
      console.error('❌ Delivery person not found with criteria:', searchCriteria);
      return;
    }

    console.log('✅ Delivery Person Found:');
    console.log('   ID:', deliveryPerson._id);
    console.log('   Name:', deliveryPerson.name);
    console.log('   Email:', deliveryPerson.email);
    console.log('   Employee ID:', deliveryPerson.employeeId);
    console.log('   Total Deliveries:', deliveryPerson.totalDeliveries || 0);
    console.log('   Cash In Hand:', deliveryPerson.cashInHand || 0);
    console.log('   Total Cash Collected:', deliveryPerson.totalCashCollected || 0);
    console.log('');

    // Check CashCollection records
    console.log('💰 Checking CashCollection records...');
    const cashCollections = await CashCollection.find({
      deliveryPerson: deliveryPerson._id
    }).populate('order', 'orderNumber status');

    console.log(`   Found ${cashCollections.length} CashCollection records`);
    if (cashCollections.length > 0) {
      console.log('   Cash Collections:');
      cashCollections.forEach((collection, idx) => {
        console.log(`   ${idx + 1}. Order: ${collection.order?.orderNumber || collection.order || 'N/A'}`);
        console.log(`      Amount: ${collection.amount}`);
        console.log(`      Status: ${collection.submissionStatus}`);
        console.log(`      Collected At: ${collection.collectedAt}`);
        console.log(`      Order Status: ${collection.order?.status || 'N/A'}`);
        console.log('');
      });

      const totalCollected = cashCollections.reduce((sum, col) => sum + (col.amount || 0), 0);
      const pendingAmount = cashCollections
        .filter(col => col.submissionStatus === 'pending')
        .reduce((sum, col) => sum + (col.amount || 0), 0);
      
      console.log(`   Total Collected: ${totalCollected}`);
      console.log(`   Pending Amount: ${pendingAmount}`);
    } else {
      console.log('   ⚠️ No CashCollection records found!');
    }
    console.log('');

    // Check Delivery records
    console.log('📦 Checking Delivery records...');
    const deliveries = await Delivery.find({
      'deliveryPersonnel.id': deliveryPerson._id
    });

    console.log(`   Found ${deliveries.length} Delivery records`);
    if (deliveries.length > 0) {
      console.log('   Deliveries:');
      deliveries.forEach((delivery, idx) => {
        console.log(`   ${idx + 1}. Order: ${delivery.orderNumber || delivery.orderId}`);
        console.log(`      Status: ${delivery.status}`);
        console.log(`      Delivery Date: ${delivery.actualDelivery || delivery.createdAt}`);
        console.log(`      Cash Collected: ${delivery.cashCollected?.amount || 0}`);
        console.log('');
      });
    } else {
      console.log('   ⚠️ No Delivery records found!');
    }
    console.log('');

    // Check Orders delivered by this person
    console.log('📋 Checking Orders...');
    const orders = await Order.find({
      $or: [
        { deliveryPerson: deliveryPerson._id },
        { deliveryPersonnel: deliveryPerson._id },
        { assignedDeliveryPerson: deliveryPerson._id }
      ],
      status: 'delivered'
    }).select('orderNumber status deliveryPerson deliveryPersonnel assignedDeliveryPerson pricing.total paymentMethod');

    console.log(`   Found ${orders.length} delivered orders`);
    if (orders.length > 0) {
      console.log('   Orders:');
      orders.forEach((order, idx) => {
        console.log(`   ${idx + 1}. Order: ${order.orderNumber}`);
        console.log(`      Status: ${order.status}`);
        console.log(`      Payment: ${order.paymentMethod}`);
        console.log(`      Total: ${order.pricing?.total || order.totalAmount || 0}`);
        console.log(`      Delivery Person Field: ${order.deliveryPerson?.toString() || 'N/A'}`);
        console.log(`      Delivery Personnel Field: ${order.deliveryPersonnel?.toString() || 'N/A'}`);
        console.log(`      Assigned Delivery Person: ${order.assignedDeliveryPerson?.toString() || 'N/A'}`);
        
        
        console.log('');
      });

      // Count COD orders
      const codOrders = orders.filter(order => 
        order.paymentMethod === 'cash_on_delivery' || 
        order.paymentMethod === 'cash' ||
        order.paymentMethod?.toLowerCase().includes('cash')
      );
      console.log(`   COD Orders: ${codOrders.length}`);
      console.log(`   Total COD Amount: ${codOrders.reduce((sum, o) => sum + (o.pricing?.total || o.totalAmount || 0), 0)}`);
    } else {
      console.log('   ⚠️ No delivered orders found!');
    }
    console.log('');

    // Check for mismatched IDs
    console.log('🔍 Checking for ID mismatches...');
    const cashCollectionsWithDifferentId = await CashCollection.find({
      order: { $in: orders.map(o => o._id) }
    }).populate('deliveryPerson', 'name employeeId');

    console.log(`   Found ${cashCollectionsWithDifferentId.length} CashCollection records for these orders`);
    cashCollectionsWithDifferentId.forEach(collection => {
      if (collection.deliveryPerson?._id?.toString() !== deliveryPerson._id.toString()) {
        console.log(`   ⚠️ MISMATCH FOUND!`);
        console.log(`      CashCollection deliveryPerson: ${collection.deliveryPerson?._id} (${collection.deliveryPerson?.name || 'N/A'})`);
        console.log(`      Expected deliveryPerson: ${deliveryPerson._id} (${deliveryPerson.name})`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ MongoDB Disconnected');
    process.exit(0);
  }
};

checkDeliveryPersonCash();

