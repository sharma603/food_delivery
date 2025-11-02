import mongoose from 'mongoose';
import CashCollection from '../../models/Payment/CashCollection.js';
import DeliveryPersonnel from '../../models/DeliveryPersonnel.js';
import Order from '../../models/Order.js';
import { asyncHandler } from '../../utils/helpers.js';

// @desc    Record cash collection when order is delivered
// @route   POST /api/v1/delivery/cash/collect
// @access  Private (Delivery Person)
export const recordCashCollection = asyncHandler(async (req, res) => {
  const { orderId, amount, notes } = req.body;
  const deliveryPersonId = req.user._id;

  // Validate order exists and is assigned to this delivery person
  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check if order is assigned to this delivery person
  const isAssigned = 
    order.deliveryPerson?.toString() === deliveryPersonId.toString() ||
    order.deliveryPersonnel?.toString() === deliveryPersonId.toString() ||
    order.assignedDeliveryPerson?.toString() === deliveryPersonId.toString();

  if (!isAssigned) {
    return res.status(403).json({
      success: false,
      message: 'You are not assigned to this order'
    });
  }

  // Check if order is delivered
  if (order.status !== 'delivered') {
    return res.status(400).json({
      success: false,
      message: 'Order must be delivered before collecting payment'
    });
  }

  // Check if cash collection already exists for this order
  const existingCollection = await CashCollection.findOne({ order: orderId });
  if (existingCollection) {
    return res.status(400).json({
      success: false,
      message: 'Cash collection already recorded for this order'
    });
  }

  // Get expected amount from order
  const expectedAmount = order.pricing?.total || order.total || 0;
  const collectionAmount = amount || expectedAmount;

  // Create cash collection record
  const cashCollection = await CashCollection.create({
    deliveryPerson: deliveryPersonId,
    order: orderId,
    orderNumber: order.orderNumber,
    amount: collectionAmount,
    collectedAt: new Date(),
    notes: notes || '',
    submissionStatus: 'pending'
  });

  // Update delivery person's cash tracking
  const deliveryPerson = await DeliveryPersonnel.findById(deliveryPersonId);
  if (deliveryPerson) {
    deliveryPerson.cashInHand = (deliveryPerson.cashInHand || 0) + collectionAmount;
    deliveryPerson.totalCashCollected = (deliveryPerson.totalCashCollected || 0) + collectionAmount;
    deliveryPerson.pendingCashSubmission = (deliveryPerson.pendingCashSubmission || 0) + collectionAmount;
    await deliveryPerson.save();
  }

  res.json({
    success: true,
    message: 'Cash collection recorded successfully',
    data: cashCollection
  });
});

// @desc    Submit cash to company
// @route   POST /api/v1/delivery/cash/submit
// @access  Private (Delivery Person)
export const submitCash = asyncHandler(async (req, res) => {
  // Handle both JSON and multipart/form-data requests
  let amount, collectionIds, notes, depositProof;
  
  if (req.file) {
    // Multipart form data (with file upload)
    depositProof = `/uploads/cash-deposits/${req.file.filename}`;
    amount = req.body.amount ? parseFloat(req.body.amount) : undefined;
    notes = req.body.notes || '';
    try {
      collectionIds = req.body.collectionIds ? JSON.parse(req.body.collectionIds) : undefined;
    } catch (e) {
      collectionIds = undefined;
    }
  } else {
    // Regular JSON request
    ({ amount, collectionIds, notes, depositProof } = req.body);
  }
  
  const deliveryPersonId = req.user._id;

  const deliveryPerson = await DeliveryPersonnel.findById(deliveryPersonId);
  if (!deliveryPerson) {
    return res.status(404).json({
      success: false,
      message: 'Delivery person not found'
    });
  }

  // If collectionIds provided, submit specific collections
  if (collectionIds && collectionIds.length > 0) {
    const selectedCollections = await CashCollection.find({
      _id: { $in: collectionIds },
      deliveryPerson: deliveryPersonId,
      submissionStatus: 'pending'
    });

    if (selectedCollections.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No pending collections found to submit'
      });
    }

    const totalAmount = selectedCollections.reduce((sum, col) => sum + col.amount, 0);
    const submittedAmount = amount || totalAmount;

    // Use MongoDB session for atomic transaction to ensure accounting accuracy
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update collections with deposit proof if provided
      const updateData = {
        submissionStatus: 'submitted',
        submittedAt: new Date(),
        submittedAmount: submittedAmount / selectedCollections.length, // Split equally
      };
      if (depositProof) {
        updateData.depositProof = depositProof;
      }
      if (notes) {
        updateData.notes = notes;
      }
      
      await CashCollection.updateMany(
        { _id: { $in: collectionIds } },
        { $set: updateData },
        { session }
      );

      // Update delivery person atomically
      const deliveryPersonForUpdate = await DeliveryPersonnel.findById(deliveryPersonId).session(session);
      if (deliveryPersonForUpdate) {
        deliveryPersonForUpdate.cashInHand = Math.max(0, (deliveryPersonForUpdate.cashInHand || 0) - submittedAmount);
        deliveryPersonForUpdate.totalCashSubmitted = (deliveryPersonForUpdate.totalCashSubmitted || 0) + submittedAmount;
        deliveryPersonForUpdate.pendingCashSubmission = Math.max(0, (deliveryPersonForUpdate.pendingCashSubmission || 0) - submittedAmount);
        await deliveryPersonForUpdate.save({ session });

        // Commit transaction - both records saved atomically
        await session.commitTransaction();
        session.endSession();

        return res.json({
          success: true,
          message: 'Cash submitted successfully and recorded in database',
          data: {
            submittedAmount,
            collectionsCount: selectedCollections.length,
            remainingCashInHand: deliveryPersonForUpdate.cashInHand,
            totalCashSubmitted: deliveryPersonForUpdate.totalCashSubmitted
          }
        });
      } else {
        await session.abortTransaction();
        session.endSession();
        throw new Error('Delivery person not found for cash submission');
      }
    } catch (transactionError) {
      // Rollback transaction on error
      await session.abortTransaction();
      session.endSession();
      throw transactionError;
    }
  }

  // Submit all pending cash (bulk submission)
  const pendingCollections = await CashCollection.find({
    deliveryPerson: deliveryPersonId,
    submissionStatus: 'pending'
  });

  if (pendingCollections.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No pending cash collections to submit'
    });
  }

  const totalPendingAmount = pendingCollections.reduce((sum, col) => sum + col.amount, 0);
  const submittedAmount = amount || totalPendingAmount;

  // Use MongoDB session for atomic transaction to ensure accounting accuracy
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Update all pending collections with deposit proof if provided
    const pendingCollectionIds = pendingCollections.map(col => col._id);
    const updateData = {
      submissionStatus: 'submitted',
      submittedAt: new Date(),
      submittedAmount: submittedAmount / pendingCollections.length
    };
    if (depositProof) {
      updateData.depositProof = depositProof;
    }
    if (notes) {
      updateData.notes = notes;
    }
    
    await CashCollection.updateMany(
      { _id: { $in: pendingCollectionIds } },
      { $set: updateData },
      { session }
    );

    // Update delivery person atomically
    const deliveryPersonForUpdate = await DeliveryPersonnel.findById(deliveryPersonId).session(session);
    if (deliveryPersonForUpdate) {
      deliveryPersonForUpdate.cashInHand = Math.max(0, (deliveryPersonForUpdate.cashInHand || 0) - submittedAmount);
      deliveryPersonForUpdate.totalCashSubmitted = (deliveryPersonForUpdate.totalCashSubmitted || 0) + submittedAmount;
      deliveryPersonForUpdate.pendingCashSubmission = 0;
      await deliveryPersonForUpdate.save({ session });

      // Commit transaction - both records saved atomically
      await session.commitTransaction();
      session.endSession();

      res.json({
        success: true,
        message: 'All pending cash submitted successfully and recorded in database',
        data: {
          submittedAmount,
          collectionsCount: pendingCollections.length,
          remainingCashInHand: deliveryPersonForUpdate.cashInHand,
          totalCashSubmitted: deliveryPersonForUpdate.totalCashSubmitted
        }
      });
    } else {
      await session.abortTransaction();
      session.endSession();
      throw new Error('Delivery person not found for cash submission');
    }
  } catch (transactionError) {
    // Rollback transaction on error
    await session.abortTransaction();
    session.endSession();
    throw transactionError;
  }
});

// @desc    Get cash collection summary for delivery person
// @route   GET /api/v1/delivery/cash/summary
// @access  Private (Delivery Person)
export const getCashSummary = asyncHandler(async (req, res) => {
  const deliveryPersonId = req.user._id;

  const deliveryPerson = await DeliveryPersonnel.findById(deliveryPersonId);
  if (!deliveryPerson) {
    return res.status(404).json({
      success: false,
      message: 'Delivery person not found'
    });
  }

  // Get pending collections (these are the actual records of cash collected)
  const pendingCollections = await CashCollection.find({
    deliveryPerson: deliveryPersonId,
    submissionStatus: 'pending'
  })
    .populate('order', 'orderNumber customer restaurant pricing.total')
    .sort({ collectedAt: -1 });

  // Calculate cash in hand from actual pending CashCollection records (ONLY source of truth)
  // CashCollection records are the authoritative source - ignore DeliveryPersonnel fields
  const actualCashInHand = pendingCollections.reduce((sum, col) => sum + (col.amount || 0), 0);
  
  // Get all cash collections for accurate totals
  const allCollections = await CashCollection.find({
    deliveryPerson: deliveryPersonId
  });

  // Calculate totals from actual CashCollection records (ONLY source of truth)
  const totalCashCollectedFromRecords = allCollections.reduce((sum, col) => sum + (col.amount || 0), 0);
  
  // Calculate total submitted from records with 'submitted' status
  const totalCashSubmittedFromRecords = allCollections
    .filter(col => col.submissionStatus === 'submitted')
    .reduce((sum, col) => sum + (col.submittedAmount || col.amount || 0), 0);

  // Get submitted collections (today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const submittedToday = await CashCollection.find({
    deliveryPerson: deliveryPersonId,
    submissionStatus: 'submitted',
    submittedAt: { $gte: today }
  }).countDocuments();

  const totalSubmittedToday = await CashCollection.aggregate([
    {
      $match: {
        deliveryPerson: new mongoose.Types.ObjectId(deliveryPersonId),
        submissionStatus: 'submitted',
        submittedAt: { $gte: today }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$submittedAmount' }
      }
    }
  ]);

  // Use ONLY CashCollection records as source of truth (no fallback to DeliveryPersonnel fields)
  // This ensures balance is accurate and reflects only actual recorded collections
  const cashInHand = actualCashInHand;
  const pendingCashSubmission = actualCashInHand;
  const totalCashCollected = totalCashCollectedFromRecords;
  const totalCashSubmitted = totalCashSubmittedFromRecords;
  
  // Sync DeliveryPersonnel fields with actual CashCollection data to keep them in sync
  // This prevents discrepancies between DeliveryPersonnel and CashCollection records
  if (deliveryPerson.cashInHand !== cashInHand || 
      deliveryPerson.pendingCashSubmission !== pendingCashSubmission ||
      deliveryPerson.totalCashCollected !== totalCashCollected ||
      deliveryPerson.totalCashSubmitted !== totalCashSubmitted) {
    deliveryPerson.cashInHand = cashInHand;
    deliveryPerson.pendingCashSubmission = pendingCashSubmission;
    deliveryPerson.totalCashCollected = totalCashCollected;
    deliveryPerson.totalCashSubmitted = totalCashSubmitted;
    await deliveryPerson.save();
  }

  res.json({
    success: true,
    data: {
      cashInHand: cashInHand,
      pendingCashSubmission: pendingCashSubmission,
      totalCashCollected: totalCashCollected,
      totalCashSubmitted: totalCashSubmitted,
      pendingCollections: pendingCollections.length,
      pendingCollectionsList: pendingCollections,
      submittedTodayCount: submittedToday,
      submittedTodayAmount: totalSubmittedToday[0]?.total || 0
    }
  });
});

// @desc    Get cash collection history
// @route   GET /api/v1/delivery/cash/history
// @access  Private (Delivery Person)
export const getCashHistory = asyncHandler(async (req, res) => {
  const deliveryPersonId = req.user._id;
  const { status, limit = 50, page = 1 } = req.query;

  const query = { deliveryPerson: deliveryPersonId };
  if (status) {
    query.submissionStatus = status;
  }

  const collections = await CashCollection.find(query)
    .populate('order', 'orderNumber customer restaurant')
    .populate('reconciledBy', 'name email')
    .sort({ collectedAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await CashCollection.countDocuments(query);

  res.json({
    success: true,
    data: collections,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

