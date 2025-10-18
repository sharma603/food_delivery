import express from 'express';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Log audit entry
// @route   POST /api/admin/audit/log
// @access  Private (Admin)
const logAuditEntry = async (req, res) => {
  try {
    const { action, userAgent, timestamp, ip, sessionDuration, message } = req.body;
    
    // Create audit log entry
    const auditEntry = {
      adminId: req.user._id,
      adminEmail: req.user.email,
      action,
      userAgent,
      timestamp: timestamp || new Date().toISOString(),
      ip: ip || req.ip || req.connection.remoteAddress,
      sessionDuration,
      message,
      createdAt: new Date()
    };

    // In a production environment, this would be saved to a dedicated audit database
    console.log('AUDIT LOG:', JSON.stringify(auditEntry, null, 2));
    
    // For now, we'll just log to console and file
    // In production, implement proper audit logging to database/file/external service
    
    res.json({
      success: true,
      message: 'Audit entry logged successfully',
      data: {
        logged: true,
        timestamp: auditEntry.timestamp
      }
    });

  } catch (error) {
    console.error('Audit logging error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log audit entry',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Protected routes
router.post('/log', protect, authorize('admin'), logAuditEntry);

export default router;
