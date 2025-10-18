import Order from '../../models/Order.js';
import Customer from '../../models/Customer.js';
import Restaurant from '../../models/Restaurant.js';
import { asyncHandler } from '../../utils/helpers.js';

// @desc    Get all disputes
// @route   GET /api/v1/superadmin/disputes
// @access  Private/SuperAdmin
export const getAllDisputes = asyncHandler(async (req, res) => {
  const { 
    status = 'all', 
    priority = 'all', 
    page = 1, 
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build filter object
  const filter = {};
  if (status !== 'all') {
    filter.disputeStatus = status;
  }
  if (priority !== 'all') {
    filter.disputePriority = priority;
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Get disputes with pagination and population
  const disputes = await Order.find(filter)
    .populate('customer', 'name email phone')
    .populate('restaurant', 'name email phone')
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .lean();

  // Get total count for pagination
  const total = await Order.countDocuments(filter);

  // Calculate dispute statistics
  const stats = await Order.aggregate([
    {
      $group: {
        _id: '$disputeStatus',
        count: { $sum: 1 }
      }
    }
  ]);

  const statsByPriority = await Order.aggregate([
    {
      $group: {
        _id: '$disputePriority',
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      disputes,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      },
      stats: {
        byStatus: stats,
        byPriority: statsByPriority
      }
    }
  });
});

// @desc    Get dispute by ID
// @route   GET /api/v1/superadmin/disputes/:id
// @access  Private/SuperAdmin
export const getDisputeById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const dispute = await Order.findById(id)
    .populate('customer', 'name email phone address')
    .populate('restaurant', 'name email phone address')
    .populate('deliveryPerson', 'name email phone')
    .lean();

  if (!dispute) {
    return res.status(404).json({
      success: false,
      message: 'Dispute not found'
    });
  }

  res.json({
    success: true,
    data: dispute
  });
});

// @desc    Update dispute status
// @route   PUT /api/v1/superadmin/disputes/:id/status
// @access  Private/SuperAdmin
export const updateDisputeStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { disputeStatus, resolution, adminNotes } = req.body;

  const dispute = await Order.findById(id);
  if (!dispute) {
    return res.status(404).json({
      success: false,
      message: 'Dispute not found'
    });
  }

  // Update dispute status and resolution
  dispute.disputeStatus = disputeStatus;
  dispute.disputeResolution = resolution;
  dispute.disputeAdminNotes = adminNotes;
  dispute.disputeResolvedAt = new Date();
  dispute.disputeResolvedBy = req.user.id;

  await dispute.save();

  res.json({
    success: true,
    message: 'Dispute status updated successfully',
    data: dispute
  });
});

// @desc    Assign dispute to admin
// @route   PUT /api/v1/superadmin/disputes/:id/assign
// @access  Private/SuperAdmin
export const assignDispute = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { assignedTo } = req.body;

  const dispute = await Order.findById(id);
  if (!dispute) {
    return res.status(404).json({
      success: false,
      message: 'Dispute not found'
    });
  }

  dispute.disputeAssignedTo = assignedTo;
  dispute.disputeAssignedAt = new Date();

  await dispute.save();

  res.json({
    success: true,
    message: 'Dispute assigned successfully',
    data: dispute
  });
});

// @desc    Add dispute comment
// @route   POST /api/v1/superadmin/disputes/:id/comments
// @access  Private/SuperAdmin
export const addDisputeComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { comment, isInternal = false } = req.body;

  const dispute = await Order.findById(id);
  if (!dispute) {
    return res.status(404).json({
      success: false,
      message: 'Dispute not found'
    });
  }

  // Initialize comments array if it doesn't exist
  if (!dispute.disputeComments) {
    dispute.disputeComments = [];
  }

  // Add new comment
  dispute.disputeComments.push({
    comment,
    isInternal,
    addedBy: req.user.id,
    addedAt: new Date()
  });

  await dispute.save();

  res.json({
    success: true,
    message: 'Comment added successfully',
    data: dispute.disputeComments[dispute.disputeComments.length - 1]
  });
});

// @desc    Process dispute resolution
// @route   POST /api/v1/superadmin/disputes/:id/resolve
// @access  Private/SuperAdmin
export const resolveDispute = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    resolution, 
    refundAmount, 
    refundReason, 
    customerCompensation,
    restaurantPenalty,
    adminNotes 
  } = req.body;

  const dispute = await Order.findById(id);
  if (!dispute) {
    return res.status(404).json({
      success: false,
      message: 'Dispute not found'
    });
  }

  // Update dispute with resolution details
  dispute.disputeStatus = 'resolved';
  dispute.disputeResolution = resolution;
  dispute.disputeRefundAmount = refundAmount || 0;
  dispute.disputeRefundReason = refundReason;
  dispute.disputeCustomerCompensation = customerCompensation || 0;
  dispute.disputeRestaurantPenalty = restaurantPenalty || 0;
  dispute.disputeAdminNotes = adminNotes;
  dispute.disputeResolvedAt = new Date();
  dispute.disputeResolvedBy = req.user.id;

  await dispute.save();

  // TODO: Implement actual refund processing through payment gateway
  // TODO: Send notifications to customer and restaurant
  // TODO: Update restaurant rating if penalty applied

  res.json({
    success: true,
    message: 'Dispute resolved successfully',
    data: dispute
  });
});

// @desc    Get dispute analytics
// @route   GET /api/v1/superadmin/disputes/analytics
// @access  Private/SuperAdmin
export const getDisputeAnalytics = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;

  let startDate;
  const endDate = new Date();
  
  switch (period) {
    case '7d':
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Get dispute statistics
  const disputeStats = await Order.aggregate([
    {
      $match: {
        disputeStatus: { $exists: true, $ne: null },
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$disputeStatus',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get disputes by priority
  const priorityStats = await Order.aggregate([
    {
      $match: {
        disputeStatus: { $exists: true, $ne: null },
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$disputePriority',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get resolution time analytics
  const resolutionTimeStats = await Order.aggregate([
    {
      $match: {
        disputeStatus: 'resolved',
        disputeResolvedAt: { $exists: true },
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $project: {
        resolutionTime: {
          $divide: [
            { $subtract: ['$disputeResolvedAt', '$disputeCreatedAt'] },
            1000 * 60 * 60 * 24 // Convert to days
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        avgResolutionTime: { $avg: '$resolutionTime' },
        maxResolutionTime: { $max: '$resolutionTime' },
        minResolutionTime: { $min: '$resolutionTime' }
      }
    }
  ]);

  // Get total refund amount
  const refundStats = await Order.aggregate([
    {
      $match: {
        disputeStatus: 'resolved',
        disputeRefundAmount: { $gt: 0 },
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalRefunds: { $sum: '$disputeRefundAmount' },
        avgRefund: { $avg: '$disputeRefundAmount' },
        refundCount: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      period: { startDate, endDate },
      disputeStats,
      priorityStats,
      resolutionTime: resolutionTimeStats[0] || {
        avgResolutionTime: 0,
        maxResolutionTime: 0,
        minResolutionTime: 0
      },
      refunds: refundStats[0] || {
        totalRefunds: 0,
        avgRefund: 0,
        refundCount: 0
      }
    }
  });
});

// @desc    Export disputes
// @route   POST /api/v1/superadmin/disputes/export
// @access  Private/SuperAdmin
export const exportDisputes = asyncHandler(async (req, res) => {
  const { filters = {}, format = 'csv' } = req.body;

  // Build filter object
  const filter = {};
  if (filters.status && filters.status !== 'all') {
    filter.disputeStatus = filters.status;
  }
  if (filters.priority && filters.priority !== 'all') {
    filter.disputePriority = filters.priority;
  }
  if (filters.dateFrom) {
    filter.createdAt = { ...filter.createdAt, $gte: new Date(filters.dateFrom) };
  }
  if (filters.dateTo) {
    filter.createdAt = { ...filter.createdAt, $lte: new Date(filters.dateTo) };
  }

  const disputes = await Order.find(filter)
    .populate('customer', 'name email phone')
    .populate('restaurant', 'name email phone')
    .sort({ createdAt: -1 })
    .lean();

  // TODO: Implement actual CSV/Excel export
  res.json({
    success: true,
    message: 'Disputes exported successfully',
    data: {
      disputes,
      format,
      count: disputes.length
    }
  });
});
