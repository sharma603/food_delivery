import Order from '../../models/Order.js';
import { asyncHandler } from '../../utils/helpers.js';

// @desc    Get all payments
// @route   GET /api/v1/superadmin/payments
// @access  Private/SuperAdmin
export const getAllPayments = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    method,
    dateFrom,
    dateTo
  } = req.query;

  // Build query
  const query = {};
  
  if (status) query.paymentStatus = status;
  if (method) query.paymentMethod = method;
  
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  const payments = await Order.find(query)
    .populate('restaurant', 'name')
    .populate('customer', 'name email')
    .select('totalAmount paymentMethod paymentStatus createdAt')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Order.countDocuments(query);

  res.json({
    success: true,
    data: {
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get payment by ID
// @route   GET /api/v1/superadmin/payments/:id
// @access  Private/SuperAdmin
export const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Order.findById(req.params.id)
    .populate('restaurant', 'name email')
    .populate('customer', 'name email phone')
    .select('totalAmount paymentMethod paymentStatus paymentDetails createdAt');

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  res.json({
    success: true,
    data: payment
  });
});

// @desc    Get payment statistics
// @route   GET /api/v1/superadmin/payments/stats
// @access  Private/SuperAdmin
export const getPaymentStats = asyncHandler(async (req, res) => {
  const stats = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        averageAmount: { $avg: '$totalAmount' }
      }
    }
  ]);

  const methodStats = await Order.aggregate([
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        total: { $sum: '$totalAmount' }
      }
    }
  ]);

  const statusStats = await Order.aggregate([
    {
      $group: {
        _id: '$paymentStatus',
        count: { $sum: 1 },
        total: { $sum: '$totalAmount' }
      }
    }
  ]);

  const todayStats = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    },
    {
      $group: {
        _id: null,
        payments: { $sum: 1 },
        amount: { $sum: '$totalAmount' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      ...stats[0],
      methodDistribution: methodStats,
      statusDistribution: statusStats,
      today: todayStats[0] || { payments: 0, amount: 0 }
    }
  });
});

// @desc    Get payment analytics
// @route   GET /api/v1/superadmin/payments/analytics
// @access  Private/SuperAdmin
export const getPaymentAnalytics = asyncHandler(async (req, res) => {
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

  const analytics = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        amount: { $sum: '$totalAmount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  res.json({
    success: true,
    data: {
      analytics,
      period: { startDate, endDate }
    }
  });
});

// @desc    Process payout
// @route   POST /api/v1/superadmin/payments/payouts
// @access  Private/SuperAdmin
export const processPayout = asyncHandler(async (req, res) => {
  const { restaurantId, amount, description } = req.body;

  // In a real implementation, you would process the payout through payment gateway
  const payout = {
    id: `PAYOUT_${Date.now()}`,
    restaurantId,
    amount,
    description,
    status: 'pending',
    createdAt: new Date()
  };

  res.json({
    success: true,
    data: payout,
    message: 'Payout processed successfully'
  });
});

// @desc    Get payout history
// @route   GET /api/v1/superadmin/payments/payouts
// @access  Private/SuperAdmin
export const getPayoutHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  // In a real implementation, this would come from a payouts collection
  const payouts = [];
  const total = 0;

  res.json({
    success: true,
    data: {
      payouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get transaction history
// @route   GET /api/v1/superadmin/payments/transactions
// @access  Private/SuperAdmin
export const getTransactionHistory = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    type = 'all' // 'payments', 'payouts', 'refunds', 'all'
  } = req.query;

  // In a real implementation, this would come from a transactions collection
  const transactions = [];
  const total = 0;

  res.json({
    success: true,
    data: {
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Export payments
// @route   POST /api/v1/superadmin/payments/export
// @access  Private/SuperAdmin
export const exportPayments = asyncHandler(async (req, res) => {
  const { filters = {} } = req.body;
  
  const payments = await Order.find(filters)
    .populate('restaurant', 'name')
    .populate('customer', 'name email')
    .select('totalAmount paymentMethod paymentStatus createdAt')
    .sort({ createdAt: -1 });

  // In a real implementation, you would generate Excel/CSV file here
  res.json({
    success: true,
    data: payments,
    message: 'Payments exported successfully'
  });
});
