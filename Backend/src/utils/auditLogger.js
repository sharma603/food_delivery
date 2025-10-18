import mongoose from 'mongoose';

// Simple Audit Log Schema (you can expand this as needed)
const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'userModel'
  },
  userModel: {
    type: String,
    enum: ['User', 'Admin', 'SuperAdmin', 'RestaurantUser', 'Customer']
  },
  userType: {
    type: String,
    enum: ['admin', 'super_admin', 'restaurant', 'customer', 'user']
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login', 'logout', 'login_failed', 'password_reset', 'account_locked',
      'create', 'update', 'delete', 'view', 'approve', 'reject', 'suspend', 'activate',
      'export', 'import', 'settings_change', 'permission_change'
    ]
  },
  resource: {
    type: String,
    required: true
  },
  resourceId: {
    type: String
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

/**
 * Create an audit log entry
 * @param {Object} logData - The audit log data
 * @param {String} logData.user - User ID (optional)
 * @param {String} logData.userType - Type of user (admin, super_admin, etc.)
 * @param {String} logData.action - Action performed
 * @param {String} logData.resource - Resource affected
 * @param {String} logData.resourceId - ID of the resource (optional)
 * @param {Object} logData.details - Additional details (optional)
 * @param {String} logData.ipAddress - IP address (optional)
 * @param {String} logData.userAgent - User agent (optional)
 * @param {Boolean} logData.success - Whether the action was successful
 * @param {String} logData.errorMessage - Error message if action failed
 */
export const createAuditLog = async (logData) => {
  try {
    // Determine user model based on userType
    let userModel = 'User'; // default
    if (logData.userType) {
      switch (logData.userType.toLowerCase()) {
        case 'admin':
          userModel = 'Admin';
          break;
        case 'super_admin':
          userModel = 'SuperAdmin';
          break;
        case 'restaurant':
          userModel = 'RestaurantUser';
          break;
        case 'customer':
          userModel = 'Customer';
          break;
        default:
          userModel = 'User';
      }
    }

    const auditEntry = new AuditLog({
      user: logData.user || null,
      userModel,
      userType: logData.userType || 'unknown',
      action: logData.action,
      resource: logData.resource,
      resourceId: logData.resourceId || null,
      details: logData.details || {},
      ipAddress: logData.ipAddress || null,
      userAgent: logData.userAgent || null,
      success: logData.success !== undefined ? logData.success : true,
      errorMessage: logData.errorMessage || null
    });

    await auditEntry.save();
    return auditEntry;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to avoid breaking the main operation
    return null;
  }
};

/**
 * Get audit logs with filtering and pagination
 * @param {Object} filters - Filter criteria
 * @param {Object} options - Pagination and sorting options
 */
export const getAuditLogs = async (filters = {}, options = {}) => {
  try {
    const {
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = options;

    const query = AuditLog.find(filters)
      .populate('user', 'name email')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const logs = await query.exec();
    const total = await AuditLog.countDocuments(filters);

    return {
      logs,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    };
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    throw error;
  }
};

/**
 * Clean up old audit logs (older than specified days)
 * @param {Number} daysToKeep - Number of days to keep logs
 */
export const cleanupAuditLogs = async (daysToKeep = 90) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await AuditLog.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    console.log(`Cleaned up ${result.deletedCount} old audit log entries`);
    return result.deletedCount;
  } catch (error) {
    console.error('Failed to cleanup audit logs:', error);
    throw error;
  }
};

export default AuditLog;
