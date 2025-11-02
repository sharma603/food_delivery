import mongoose from 'mongoose';
import CashCollection from '../../models/Payment/CashCollection.js';
import DeliveryPersonnel from '../../models/DeliveryPersonnel.js';
import Order from '../../models/Order.js';
import { asyncHandler } from '../../utils/helpers.js';

// @desc    Get all pending cash submissions (Admin/SuperAdmin)
// @route   GET /api/v1/superadmin/cash/pending
// @access  Private (SuperAdmin/Admin)
export const getPendingSubmissions = asyncHandler(async (req, res) => {
  const { deliveryPersonId, page = 1, limit = 50 } = req.query;
  
  const query = { submissionStatus: 'submitted' };
  if (deliveryPersonId) {
    query.deliveryPerson = deliveryPersonId;
  }

  const collections = await CashCollection.find(query)
    .populate('deliveryPerson', 'name employeeId email phone')
    .populate('order', 'orderNumber customer restaurant pricing.total')
    .sort({ submittedAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await CashCollection.countDocuments(query);

  // Calculate totals
  const totals = await CashCollection.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$submittedAmount' },
        totalCollections: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    data: collections,
    summary: {
      totalAmount: totals[0]?.totalAmount || 0,
      totalCollections: totals[0]?.totalCollections || 0
    },
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Reconcile cash submission (Admin/SuperAdmin)
// @route   POST /api/v1/superadmin/cash/reconcile/:collectionId
// @access  Private (SuperAdmin/Admin)
export const reconcileCash = asyncHandler(async (req, res) => {
  const { collectionId } = req.params;
  const { actualAmount, notes, status } = req.body; // status: 'reconciled' or 'discrepancy'

  const collection = await CashCollection.findById(collectionId)
    .populate('deliveryPerson', 'name employeeId');

  if (!collection) {
    return res.status(404).json({
      success: false,
      message: 'Cash collection not found'
    });
  }

  if (collection.submissionStatus !== 'submitted') {
    return res.status(400).json({
      success: false,
      message: 'Only submitted collections can be reconciled'
    });
  }

  const expectedAmount = collection.submittedAmount || collection.amount;
  const reconciledAmount = actualAmount || expectedAmount;
  const reconciledStatus = status || 'reconciled';

  // Update collection
  collection.submissionStatus = reconciledStatus;
  collection.reconciledAt = new Date();
  collection.reconciledBy = req.user._id;
  collection.notes = notes || collection.notes;

  if (reconciledAmount !== expectedAmount) {
    collection.discrepancy = {
      expected: expectedAmount,
      actual: reconciledAmount,
      reason: notes || 'Amount mismatch'
    };
    collection.submissionStatus = 'discrepancy';
  }

  await collection.save();

  // If there's a discrepancy, update delivery person's records
  if (reconciledAmount !== expectedAmount && collection.deliveryPerson) {
    const deliveryPerson = await DeliveryPersonnel.findById(collection.deliveryPerson._id);
    if (deliveryPerson) {
      const difference = reconciledAmount - expectedAmount;
      // Adjust cash in hand if there's a difference
      deliveryPerson.cashInHand = Math.max(0, (deliveryPerson.cashInHand || 0) + difference);
      await deliveryPerson.save();
    }
  }

  res.json({
    success: true,
    message: `Cash collection ${reconciledStatus === 'reconciled' ? 'reconciled' : 'marked with discrepancy'} successfully`,
    data: collection
  });
});

// @desc    Bulk reconcile cash submissions (Admin/SuperAdmin)
// @route   POST /api/v1/superadmin/cash/reconcile/bulk
// @access  Private (SuperAdmin/Admin)
export const bulkReconcileCash = asyncHandler(async (req, res) => {
  const { collectionIds, notes } = req.body;

  if (!collectionIds || !Array.isArray(collectionIds) || collectionIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Collection IDs are required'
    });
  }

  const collections = await CashCollection.find({
    _id: { $in: collectionIds },
    submissionStatus: 'submitted'
  });

  if (collections.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No submitted collections found to reconcile'
    });
  }

  // Update all collections
  await CashCollection.updateMany(
    { _id: { $in: collectionIds } },
    {
      submissionStatus: 'reconciled',
      reconciledAt: new Date(),
      reconciledBy: req.user._id,
      notes: notes || ''
    }
  );

  res.json({
    success: true,
    message: `${collections.length} cash collections reconciled successfully`,
    data: {
      reconciledCount: collections.length
    }
  });
});

// @desc    Get all delivery personnel with their cash collection details (Admin/SuperAdmin)
// @route   GET /api/v1/superadmin/cash/delivery-personnel
// @access  Private (SuperAdmin/Admin)
export const getAllDeliveryPersonnelCash = asyncHandler(async (req, res) => {
  const { status, zoneId, search, page = 1, limit = 50 } = req.query;

  // Build query for delivery personnel
  const personnelQuery = {};
  if (status && status !== 'all') {
    personnelQuery.status = status;
  }
  if (zoneId && zoneId !== 'all') {
    personnelQuery.zone = zoneId;
  }
  if (search) {
    personnelQuery.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } }
    ];
  }

  // Get all delivery personnel with pagination
  const personnel = await DeliveryPersonnel.find(personnelQuery)
    .populate('zone', 'name deliveryCharge')
    .select('name email phone employeeId zone zoneName status vehicleType vehicleNumber totalDeliveries totalEarnings cashInHand totalCashCollected totalCashSubmitted pendingCashSubmission')
    .sort({ name: 1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const totalPersonnel = await DeliveryPersonnel.countDocuments(personnelQuery);

  // Get detailed cash collection stats for each personnel
  const personnelWithCashDetails = await Promise.all(
    personnel.map(async (person) => {
      const personId = person._id;

      // Convert to ObjectId to ensure proper matching
      const personObjectId = mongoose.Types.ObjectId.isValid(personId) 
        ? new mongoose.Types.ObjectId(personId) 
        : personId;

      // Get cash collections stats from CashCollection records (source of truth)
      const cashStats = await CashCollection.aggregate([
        {
          $match: { deliveryPerson: personObjectId }
        },
        {
          $group: {
            _id: '$submissionStatus',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
            submittedAmount: { $sum: '$submittedAmount' }
          }
        }
      ]);

      // Calculate totals from actual records
      let pendingAmount = 0;
      let submittedAmount = 0;
      let reconciledAmount = 0;
      let pendingCount = 0;
      let submittedCount = 0;
      let reconciledCount = 0;

      cashStats.forEach(stat => {
        if (stat._id === 'pending') {
          pendingAmount = stat.totalAmount || 0;
          pendingCount = stat.count || 0;
        } else if (stat._id === 'submitted') {
          submittedAmount = stat.submittedAmount || stat.totalAmount || 0;
          submittedCount = stat.count || 0;
        } else if (stat._id === 'reconciled') {
          reconciledAmount = stat.totalAmount || 0;
          reconciledCount = stat.count || 0;
        }
      });

      // Get today's collections
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCollections = await CashCollection.aggregate([
        {
          $match: {
            deliveryPerson: personObjectId,
            collectedAt: { $gte: today }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      // Get pending collections list (last 10)
      const pendingCollections = await CashCollection.find({
        deliveryPerson: personObjectId,
        submissionStatus: 'pending'
      })
        .populate('order', 'orderNumber')
        .sort({ collectedAt: -1 })
        .limit(10)
        .select('order orderNumber amount collectedAt notes');

      // Calculate total collected from all records
      const allCollections = await CashCollection.find({ deliveryPerson: personObjectId });
      const totalCollected = allCollections.reduce((sum, col) => sum + (col.amount || 0), 0);

      return {
        _id: person._id,
        name: person.name,
        email: person.email,
        phone: person.phone,
        employeeId: person.employeeId,
        zone: person.zone ? {
          _id: person.zone._id,
          name: person.zone.name,
          deliveryCharge: person.zone.deliveryCharge
        } : null,
        zoneName: person.zoneName,
        status: person.status,
        vehicleType: person.vehicleType,
        vehicleNumber: person.vehicleNumber,
        totalDeliveries: person.totalDeliveries || 0,
        totalEarnings: person.totalEarnings || 0,
        
        // Cash collection details from CashCollection records (source of truth)
        cashInHand: pendingAmount, // This is the actual cash in hand from pending collections
        totalCashCollected: totalCollected,
        totalCashSubmitted: reconciledAmount + submittedAmount,
        pendingCashSubmission: pendingAmount,
        
        // Detailed breakdown
        pendingCollectionsCount: pendingCount,
        submittedCollectionsCount: submittedCount,
        reconciledCollectionsCount: reconciledCount,
        pendingCollectionsAmount: pendingAmount,
        submittedCollectionsAmount: submittedAmount,
        reconciledCollectionsAmount: reconciledAmount,
        
        // Today's stats
        todayCollectionsCount: todayCollections[0]?.count || 0,
        todayCollectionsAmount: todayCollections[0]?.totalAmount || 0,
        
        // Recent pending collections
        recentPendingCollections: pendingCollections
      };
    })
  );

  // Calculate overall summary
  const overallSummary = await CashCollection.aggregate([
    {
      $group: {
        _id: '$submissionStatus',
        totalAmount: { $sum: '$amount' },
        totalSubmitted: { $sum: '$submittedAmount' },
        count: { $sum: 1 }
      }
    }
  ]);

  let totalPending = 0;
  let totalSubmitted = 0;
  let totalReconciled = 0;
  let totalPendingCount = 0;
  let totalSubmittedCount = 0;
  let totalReconciledCount = 0;

  overallSummary.forEach(stat => {
    if (stat._id === 'pending') {
      totalPending = stat.totalAmount || 0;
      totalPendingCount = stat.count || 0;
    } else if (stat._id === 'submitted') {
      totalSubmitted = stat.totalSubmitted || stat.totalAmount || 0;
      totalSubmittedCount = stat.count || 0;
    } else if (stat._id === 'reconciled') {
      totalReconciled = stat.totalAmount || 0;
      totalReconciledCount = stat.count || 0;
    }
  });

  res.json({
    success: true,
    data: personnelWithCashDetails,
    summary: {
      totalPersonnel: totalPersonnel,
      totalPendingCash: totalPending,
      totalSubmittedCash: totalSubmitted,
      totalReconciledCash: totalReconciled,
      totalPendingCount: totalPendingCount,
      totalSubmittedCount: totalSubmittedCount,
      totalReconciledCount: totalReconciledCount,
      totalCashInSystem: totalPending + totalSubmitted + totalReconciled
    },
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalPersonnel,
      pages: Math.ceil(totalPersonnel / parseInt(limit))
    }
  });
});

// @desc    Get cash collection report (Admin/SuperAdmin)
// @route   GET /api/v1/superadmin/cash/report
// @access  Private (SuperAdmin/Admin)
export const getCashReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, deliveryPersonId } = req.query;

  const query = {};
  if (startDate || endDate) {
    query.collectedAt = {};
    if (startDate) query.collectedAt.$gte = new Date(startDate);
    if (endDate) query.collectedAt.$lte = new Date(endDate);
  }
  if (deliveryPersonId) {
    query.deliveryPerson = deliveryPersonId;
  }

  // Get summary statistics
  const stats = await CashCollection.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$submissionStatus',
        totalAmount: { $sum: '$amount' },
        totalSubmitted: { $sum: '$submittedAmount' },
        count: { $sum: 1 }
      }
    }
  ]);

  // Get delivery person summaries
  const deliveryPersonStats = await CashCollection.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$deliveryPerson',
        totalCollected: { $sum: '$amount' },
        totalSubmitted: { $sum: '$submittedAmount' },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$submissionStatus', 'pending'] }, 1, 0] }
        },
        submittedCount: {
          $sum: { $cond: [{ $eq: ['$submissionStatus', 'submitted'] }, 1, 0] }
        },
        reconciledCount: {
          $sum: { $cond: [{ $eq: ['$submissionStatus', 'reconciled'] }, 1, 0] }
        }
      }
    },
    {
      $lookup: {
        from: 'deliverypersonnels',
        localField: '_id',
        foreignField: '_id',
        as: 'deliveryPerson'
      }
    },
    {
      $unwind: {
        path: '$deliveryPerson',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        deliveryPersonName: '$deliveryPerson.name',
        employeeId: '$deliveryPerson.employeeId',
        totalCollected: 1,
        totalSubmitted: 1,
        pendingCount: 1,
        submittedCount: 1,
        reconciledCount: 1
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      summary: stats,
      deliveryPersonSummaries: deliveryPersonStats,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null
      }
    }
  });
});

