import express from 'express';
import { protect, authorize } from '../../middleware/auth.js';
import {
  getAllNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
  sendBroadcastNotification,
  getNotificationStats,
  markAsRead,
  getUnreadCount
} from '../../controllers/superadmin/notificationController.js';

const router = express.Router();

// Apply authentication and authorization
router.use(protect);
router.use(authorize('super_admin'));

// Notification management routes
router.route('/')
  .get(getAllNotifications)
  .post(createNotification);

router.route('/stats')
  .get(getNotificationStats);

router.route('/unread-count')
  .get(getUnreadCount);

router.route('/broadcast')
  .post(sendBroadcastNotification);

router.route('/:id')
  .put(updateNotification)
  .delete(deleteNotification);

router.route('/:id/read')
  .put(markAsRead);

export default router;
