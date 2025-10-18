// AuditLog Model
// This file structure created as per requested organization
import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'userType'
  },
  userType: {
    type: String,
    enum: ['Customer', 'Restaurant', 'DeliveryPartner', 'Admin', 'Staff', 'System']
  },
  action: {
    type: String,
    required: true,
    enum: [
      'create',
      'read',
      'update',
      'delete',
      'login',
      'logout',
      'password_change',
      'permission_change',
      'status_change',
      'approve',
      'reject',
      'activate',
      'deactivate',
      'export',
      'import',
      'bulk_update',
      'system_setting_change'
    ]
  },
  resource: {
    type: String,
    required: true // e.g., 'user', 'restaurant', 'order', 'menu_item'
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  oldValues: {
    type: mongoose.Schema.Types.Mixed
  },
  newValues: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  },
  endpoint: {
    type: String
  },
  statusCode: {
    type: Number
  },
  responseTime: {
    type: Number // in milliseconds
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  tags: [String],
  sessionId: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
auditLogSchema.index({ user: 1, userType: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, resource: 1 });
auditLogSchema.index({ resourceId: 1, action: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ severity: 1, createdAt: -1 });

// TTL index to automatically delete old audit logs after 2 years
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2 * 365 * 24 * 60 * 60 });

export default mongoose.model('AuditLog', auditLogSchema);
