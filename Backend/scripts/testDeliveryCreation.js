/**
 * Test Script: Verify Delivery and CashCollection Record Creation
 * 
 * This script tests whether Delivery and CashCollection records are being
 * created correctly when an order is marked as delivered.
 * 
 * Usage: node scripts/testDeliveryCreation.js [orderId]
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Order from '../src/models/Order.js';
import Delivery from '../src/models/Delivery.js';
import CashCollection from '../src/models/Payment/CashCollection.js';
import DeliveryPersonnel from '../src/models/DeliveryPersonnel.js';
import Customer from '../src/models/Customer.js';
import RestaurantUser from '../src/models/RestaurantUser.js';

dotenv.config();

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = (color, message) => {
  console.log(`${color}${message}${colors.reset}`);
};

const success = (msg) => log(colors.green, `✅ ${msg}`);
const error = (msg) => log(colors.red, `❌ ${msg}`);
const warning = (msg) => log(colors.yellow, `⚠️  ${msg}`);
const info = (msg) => log(colors.cyan, `ℹ️  ${msg}`);
const title = (msg) => log(colors.bright + colors.blue, `\n${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}`);

async function testDeliveryCreation() {
  try {
    // Connect to MongoDB
    title('Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/food_delivery';
    await mongoose.connect(mongoUri);
    success(`Connected to MongoDB: ${mongoose.connection.name}`);

    // Get orderId from command line or use a test order
    const orderId = process.argv[2];
    
    if (!orderId) {
      // Find a delivered order
      title('Finding a delivered order...');
      const deliveredOrder = await Order.findOne({ 
        status: 'delivered',
        deliveryPerson: { $exists: true, $ne: null }
      })
        .populate('deliveryPerson', 'name email', 'DeliveryPersonnel')
        .populate('customer', 'name', 'Customer')
        .populate('restaurant', 'restaurantName', 'RestaurantUser')
        .sort({ updatedAt: -1 })
        .limit(1);
      
      if (!deliveredOrder) {
        error('No delivered orders found with assigned delivery person.');
        info('Please provide an order ID: node scripts/testDeliveryCreation.js <orderId>');
        info('Or mark an order as delivered first.');
        await mongoose.connection.close();
        process.exit(1);
      }
      
      info(`Using order: ${deliveredOrder.orderNumber} (${deliveredOrder._id})`);
      await runTests(deliveredOrder._id);
    } else {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        error(`Invalid order ID: ${orderId}`);
        await mongoose.connection.close();
        process.exit(1);
      }
      
      await runTests(orderId);
    }

    await mongoose.connection.close();
    success('Test completed. Connection closed.');
  } catch (err) {
    error(`Test failed: ${err.message}`);
    console.error(err);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
}

async function runTests(orderId) {
  title(`Testing Delivery Record Creation for Order: ${orderId}`);

  // Test 1: Check if order exists
  info('\n[Test 1] Checking if order exists...');
  const order = await Order.findById(orderId)
    .populate('customer', 'name phone email', 'Customer')
    .populate('restaurant', 'restaurantName address', 'RestaurantUser')
    .populate('deliveryPerson', 'name phone zone', 'DeliveryPersonnel');
  
  if (!order) {
    error(`Order not found: ${orderId}`);
    return;
  }
  success(`Order found: ${order.orderNumber}`);
  info(`   Status: ${order.status}`);
  info(`   Customer: ${order.customer?.name || 'N/A'}`);
  info(`   Restaurant: ${order.restaurant?.restaurantName || 'N/A'}`);
  info(`   Delivery Person: ${order.deliveryPerson?.name || 'N/A'}`);
  info(`   Payment Method: ${order.paymentMethod || 'N/A'}`);
  info(`   Total Amount: ${order.pricing?.total || order.totalAmount || 'N/A'}`);

  // Test 2: Check if order is delivered
  info('\n[Test 2] Checking if order status is "delivered"...');
  if (order.status !== 'delivered') {
    warning(`Order status is "${order.status}", not "delivered".`);
    warning('Delivery records are only created when order status is "delivered".');
    return;
  }
  success('Order status is "delivered"');

  // Test 3: Check if delivery person is assigned
  info('\n[Test 3] Checking if delivery person is assigned...');
  const deliveryPersonId = order.deliveryPerson?._id || 
                          order.deliveryPerson?.toString() || 
                          order.deliveryPersonnel?.toString() ||
                          order.assignedDeliveryPerson?.toString();
  
  if (!deliveryPersonId) {
    error('No delivery person assigned to this order.');
    warning('Delivery records are only created for orders with assigned delivery person.');
    return;
  }
  success(`Delivery person assigned: ${order.deliveryPerson?.name || deliveryPersonId}`);

  // Test 4: Check for Delivery record
  info('\n[Test 4] Checking for Delivery record...');
  const deliveryRecord = await Delivery.findOne({ orderId: orderId });
  
  if (!deliveryRecord) {
    error('❌ Delivery record NOT found in database!');
    warning('This means the Delivery record was not created when the order was delivered.');
    
    // Check if order has required fields
    info('\n[Check] Validating order data for Delivery record creation...');
    const validationIssues = [];
    
    if (!order.customer || !order.customer.name) {
      validationIssues.push('Customer name is missing');
    }
    if (!order.customer || !order.customer.phone) {
      validationIssues.push('Customer phone is missing');
    }
    if (!order.deliveryAddress || !order.deliveryAddress.street) {
      validationIssues.push('Delivery address street is missing');
    }
    if (!order.deliveryAddress || !order.deliveryAddress.city) {
      validationIssues.push('Delivery address city is missing');
    }
    if (!order.deliveryAddress || (!order.deliveryAddress.zipCode && !order.deliveryAddress.pincode)) {
      validationIssues.push('Delivery address pincode/zipCode is missing');
    }
    if (!order.restaurant || !order.restaurant.restaurantName) {
      validationIssues.push('Restaurant name is missing');
    }
    if (!order.restaurant || !order.restaurant.address) {
      validationIssues.push('Restaurant address is missing');
    }
    
    if (validationIssues.length > 0) {
      warning('Validation issues found that might prevent Delivery record creation:');
      validationIssues.forEach(issue => warning(`   - ${issue}`));
    } else {
      info('✅ All required fields are present in order');
    }
    
    return;
  }
  
  success(`Delivery record found: ${deliveryRecord._id}`);
  info(`   Order ID: ${deliveryRecord.orderId}`);
  info(`   Order Number: ${deliveryRecord.orderNumber}`);
  info(`   Customer: ${deliveryRecord.customer?.name || 'N/A'}`);
  info(`   Restaurant: ${deliveryRecord.restaurant?.name || 'N/A'}`);
  info(`   Status: ${deliveryRecord.status}`);
  info(`   Total Amount: ${deliveryRecord.totalAmount || 'N/A'}`);
  info(`   Payment Method: ${deliveryRecord.paymentMethod || 'N/A'}`);
  info(`   Created At: ${deliveryRecord.createdAt}`);

  // Test 5: Validate Delivery record data
  info('\n[Test 5] Validating Delivery record data...');
  const deliveryValidationIssues = [];
  
  if (!deliveryRecord.customer?.name || deliveryRecord.customer.name === 'Unknown' || deliveryRecord.customer.name === 'Customer') {
    deliveryValidationIssues.push('Customer name is missing or using fallback value');
  }
  if (!deliveryRecord.customer?.phone || deliveryRecord.customer.phone === 'N/A') {
    deliveryValidationIssues.push('Customer phone is missing or using fallback value');
  }
  if (!deliveryRecord.deliveryAddress?.street || deliveryRecord.deliveryAddress.street === 'Address Not Provided') {
    deliveryValidationIssues.push('Delivery address street is missing or using fallback value');
  }
  if (!deliveryRecord.deliveryAddress?.city || deliveryRecord.deliveryAddress.city === 'City Not Provided') {
    deliveryValidationIssues.push('Delivery address city is missing or using fallback value');
  }
  if (!deliveryRecord.deliveryAddress?.pincode || deliveryRecord.deliveryAddress.pincode === '00000') {
    deliveryValidationIssues.push('Delivery address pincode is missing or using fallback value');
  }
  if (!deliveryRecord.restaurant?.name || deliveryRecord.restaurant.name === 'Restaurant' || deliveryRecord.restaurant.name === 'Unknown Restaurant') {
    deliveryValidationIssues.push('Restaurant name is missing or using fallback value');
  }
  if (!deliveryRecord.restaurant?.address || deliveryRecord.restaurant.address === 'Address Not Provided') {
    deliveryValidationIssues.push('Restaurant address is missing or using fallback value');
  }
  
  if (deliveryValidationIssues.length > 0) {
    warning('Delivery record has some issues (using fallback values):');
    deliveryValidationIssues.forEach(issue => warning(`   - ${issue}`));
  } else {
    success('✅ Delivery record has all required fields with actual data');
  }

  // Test 6: Check for CashCollection record (if COD)
  info('\n[Test 6] Checking for CashCollection record (if COD order)...');
  const isCashOnDelivery = order.paymentMethod === 'cash_on_delivery' || 
                          order.paymentMethod === 'Cash on Delivery' ||
                          (order.paymentMethod && order.paymentMethod.toLowerCase().includes('cash'));
  
  if (isCashOnDelivery) {
    info('Order is Cash on Delivery - checking for CashCollection record...');
    const cashCollection = await CashCollection.findOne({ order: orderId });
    
    if (!cashCollection) {
      error('❌ CashCollection record NOT found in database!');
      warning('This means the CashCollection record was not created for this COD order.');
    } else {
      success(`CashCollection record found: ${cashCollection._id}`);
      info(`   Amount: ${cashCollection.amount}`);
      info(`   Collected At: ${cashCollection.collectedAt}`);
      info(`   Submission Status: ${cashCollection.submissionStatus}`);
      info(`   Delivery Person: ${cashCollection.deliveryPerson}`);
      info(`   Order Number: ${cashCollection.orderNumber}`);
    }
  } else {
    info('Order is not Cash on Delivery - skipping CashCollection check');
  }

  // Test 7: Check if CashCollection is linked in Delivery record
  if (isCashOnDelivery) {
    info('\n[Test 7] Checking if CashCollection is linked in Delivery record...');
    if (deliveryRecord.cashCollected?.cashCollectionId) {
      success(`CashCollection linked: ${deliveryRecord.cashCollected.cashCollectionId}`);
      info(`   Amount: ${deliveryRecord.cashCollected.amount}`);
      info(`   Status: ${deliveryRecord.cashCollected.status}`);
    } else {
      warning('CashCollection is not linked in Delivery record');
    }
  }

  // Test 8: Check delivery person statistics
  info('\n[Test 8] Checking delivery person statistics...');
  if (deliveryPersonId) {
    const deliveryPerson = await DeliveryPersonnel.findById(deliveryPersonId);
    if (deliveryPerson) {
      success(`Delivery person found: ${deliveryPerson.name}`);
      info(`   Total Deliveries: ${deliveryPerson.totalDeliveries || 0}`);
      info(`   Total Earnings: ${deliveryPerson.totalEarnings || 0}`);
      if (isCashOnDelivery) {
        info(`   Cash In Hand: ${deliveryPerson.cashInHand || 0}`);
        info(`   Total Cash Collected: ${deliveryPerson.totalCashCollected || 0}`);
        info(`   Pending Cash Submission: ${deliveryPerson.pendingCashSubmission || 0}`);
      }
    } else {
      warning(`Delivery person not found: ${deliveryPersonId}`);
    }
  }

  // Summary
  title('Test Summary');
  success('✅ Order found and status is "delivered"');
  success('✅ Delivery person is assigned');
  
  if (deliveryRecord) {
    success('✅ Delivery record exists in database');
    if (deliveryValidationIssues.length === 0) {
      success('✅ Delivery record has valid data (no fallback values)');
    } else {
      warning(`⚠️  Delivery record has ${deliveryValidationIssues.length} data issues`);
    }
  } else {
    error('❌ Delivery record NOT found');
  }
  
  if (isCashOnDelivery) {
    const cashCollection = await CashCollection.findOne({ order: orderId });
    if (cashCollection) {
      success('✅ CashCollection record exists in database');
    } else {
      error('❌ CashCollection record NOT found');
    }
  }

  title('Test Complete');
}

// Run the test
testDeliveryCreation();

