import express from 'express';
import { protect, authorize } from '../../middleware/auth.js';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  suspendUser,
  activateUser,
  getUserStats,
  exportUsers
} from '../../controllers/superadmin/userManagementController.js';

const router = express.Router();

// Apply authentication and authorization
router.use(protect);
router.use(authorize('super_admin'));

// User management routes
router.route('/')
  .get(getAllUsers)
  .post(createUser);

router.route('/stats')
  .get(getUserStats);

router.route('/export')
  .post(exportUsers);

router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

router.route('/:id/suspend')
  .put(suspendUser);

router.route('/:id/activate')
  .put(activateUser);

export default router;
