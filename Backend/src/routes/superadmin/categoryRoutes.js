import express from 'express';
import {
  getAllSuperAdminCategories,
  getSuperAdminCategory,
  createSuperAdminCategory,
  updateSuperAdminCategory,
  deleteSuperAdminCategory,
  toggleSuperAdminCategoryStatus,
  getCategoryAnalytics,
  bulkCategoryOperations
} from '../../controllers/superadmin/categoryController.js';

const router = express.Router();

// Categories analytics
router.get('/analytics', getCategoryAnalytics);

// Bulk operations
router.post('/bulk', bulkCategoryOperations);

// Categories CRUD operations
router.route('/category')
  .get(getAllSuperAdminCategories)
  .post(createSuperAdminCategory);

router.route('/category/:id')
  .get(getSuperAdminCategory)
  .put(updateSuperAdminCategory)
  .delete(deleteSuperAdminCategory);

// Category status operations
router.put('/category/:id/toggle', toggleSuperAdminCategoryStatus);

export default router;
