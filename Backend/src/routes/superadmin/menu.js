// SuperAdmin Menu Routes
import express from 'express';
import {
  getAllMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  bulkMenuOperations,
  getMenuAnalytics
} from '../../controllers/superadmin/menuController.js';
import {
  getAllSuperAdminCategories,
  createSuperAdminCategory,
  updateSuperAdminCategory,
  deleteSuperAdminCategory
} from '../../controllers/superadmin/categoryController.js';
import { protect, authorize } from '../../middleware/auth.js';
import menuUpload from '../../middleware/menuUpload.js';

const router = express.Router();

// All routes are protected and require super_admin authorization
router.use(protect);
router.use(authorize('super_admin'));

// Menu Analytics
// @route   GET /api/v1/superadmin/menu/analytics
// @desc    Get menu analytics dashboard
// @access  Private (SuperAdmin)
router.get('/analytics', getMenuAnalytics);

// Bulk operations (must be before single item routes)
// @route   POST /api/v1/superadmin/menu/bulk
// @desc    Perform bulk operations on menu items
// @access  Private (SuperAdmin)
router.post('/bulk', bulkMenuOperations);

// Category Routes (SuperAdmin Categories) - Must be before /:id routes
// @route   GET /api/v1/superadmin/menu/categories
// @desc    Get all SuperAdmin categories with filtering
// @access  Private (SuperAdmin)
router.get('/categories', getAllSuperAdminCategories);

// @route   POST /api/v1/superadmin/menu/categories
// @desc    Create new SuperAdmin category
// @access  Private (SuperAdmin)
router.post('/categories', createSuperAdminCategory);

// @route   PUT /api/v1/superadmin/menu/categories/:id
// @desc    Update SuperAdmin category
// @access  Private (SuperAdmin)
router.put('/categories/:id', updateSuperAdminCategory);

// @route   DELETE /api/v1/superadmin/menu/categories/:id
// @desc    Delete SuperAdmin category
// @access  Private (SuperAdmin)
router.delete('/categories/:id', deleteSuperAdminCategory);

// Menu Items Collection Routes
// @route   GET /api/v1/superadmin/menu
// @desc    Get all menu items with filtering and pagination
// @access  Private (SuperAdmin)
router.get('/', getAllMenuItems);

// @route   GET /api/v1/superadmin/menu/items
// @desc    Get all menu items with filtering and pagination (alternative route)
// @access  Private (SuperAdmin)
router.get('/items', getAllMenuItems);

// @route   POST /api/v1/superadmin/menu
// @desc    Create new menu item
// @access  Private (SuperAdmin)
router.post('/', menuUpload.array('images', 5), createMenuItem);

// @route   POST /api/v1/superadmin/menu/items
// @desc    Create new menu item (alternative route)
// @access  Private (SuperAdmin)
router.post('/items', menuUpload.array('images', 5), createMenuItem);

// Individual Menu Item Routes - Must be after category routes
// @route   GET /api/v1/superadmin/menu/:id
// @desc    Get specific menu item
// @access  Private (SuperAdmin)
router.get('/:id', getMenuItem);

// @route   PUT /api/v1/superadmin/menu/:id
// @desc    Update menu item
// @access  Private (SuperAdmin)
router.put('/:id', updateMenuItem);

// @route   DELETE /api/v1/superadmin/menu/:id
// @desc    Delete menu item
// @access  Private (SuperAdmin)
router.delete('/:id', deleteMenuItem);

// @route   PATCH /api/v1/superadmin/menu/:id/toggle
// @desc    Toggle menu item availability
// @access  Private (SuperAdmin)
router.patch('/:id/toggle', toggleMenuItemAvailability);

export default router;