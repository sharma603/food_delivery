import mongoose from 'mongoose';
import Category from '../../models/Menu/Category.js';
import MenuItem from '../../models/Menu/MenuItem.js';

// @desc    Get all SuperAdmin categories
// @route   GET /api/v1/superadmin/categories
// @access  Private (Super Admin)
const getAllSuperAdminCategories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      isActive = 'all', // all, active, inactive
      sortBy = 'sortOrder',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = { isDeleted: false };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (isActive === 'active') {
      query.isActive = true;
    } else if (isActive === 'inactive') {
      query.isActive = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const categories = await Category.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Category.countDocuments(query);

    res.status(200).json({
      success: true,
      data: categories, // Return categories directly as array
      pagination: {
        currentPage: parseInt(page ),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching SuperAdmin categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

// @desc    Get SuperAdmin category by ID
// @route   GET /api/v1/superadmin/categories/:id
// @access  Private (Super Admin)
const getCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }

    const category = await Category.findById(id);

    if (!category || category.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });

  } catch (error) {
    console.error('Error fetching SuperAdmin category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message
    });
  }
};

// @desc    Create SuperAdmin category
// @route   POST /api/v1/superadmin/categories
// @access  Private (Super Admin)
const createSuperAdminCategory = async (req, res) => {
  try {

    const {
      name,
      displayName,
      description,
      image,
      icon = 'restaurant',
      sortOrder = 0,
      tags = [],
      pricingSettings = {},
      rules = {},
      isActive = true
    } = req.body;

    // Validation
    const validationErrors = [];
    
    if (!name || name.trim() === '') {
      validationErrors.push('Category name is required');
    }
    
    if (!displayName || displayName.trim() === '') {
      validationErrors.push('Display name is required');
    }
    
    if (name && name.length > 50) {
      validationErrors.push('Category name cannot exceed 50 characters');
    }
    
    if (displayName && displayName.length > 50) {
      validationErrors.push('Display name cannot exceed 50 characters');
    }
    
    if (description && description.length > 200) {
      validationErrors.push('Description cannot exceed 200 characters');
    }
    
    if (validationErrors.length > 0) {
      console.log('Validation failed:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Check if category already exists (for global categories)
    const existingCategory = await Category.findOne({
      name: name.toLowerCase(),
      isGlobal: true,
      isDeleted: false
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    // Prepare category data
    const categoryData = {
      name: name.toLowerCase().trim(),
      displayName: displayName.trim(),
      description: description?.trim() || '',
      image,
      icon,
      sortOrder: parseInt(sortOrder) || 0,
      tags: Array.isArray(tags) ? tags : [],
      pricingSettings: {
        hasBasePrice: false,
        basePrice: 0,
        minPrice: null,
        maxPrice: null,
        currency: 'NPR',
        ...pricingSettings
      },
      rules: {
        maxItems: null,
        allowMultiplePhotos: false,
        requiresDescription: false,
        requiresPrice: true,
        ...rules
      },
      usage: {
        totalRestaurants: 0,
        totalMenuItems: 0,
        lastUsed: null
      },
      isActive: Boolean(isActive),
      isGlobal: true, // Mark as global category for SuperAdmin
      restaurant: null, // Set to null for global categories
      createdBy: req.user?._id || null // Set to null if user not available
    };

    console.log('Category data to create:', JSON.stringify(categoryData, null, 2));

    // Create category
    const category = await Category.create(categoryData);

    // Get created category
    const populatedCategory = await Category.findById(category._id);

    console.log('Category created successfully:', populatedCategory._id);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: populatedCategory
    });

  } catch (error) {
    console.error('Error creating SuperAdmin category:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
};

// @desc    Update SuperAdmin category
// @route   PUT /api/v1/superadmin/categories/:id
// @access  Private (Super Admin)
const updateSuperAdminCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }

    const category = await Category.findById(id);
    if (!category || category.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if name is being changed and if it already exists
    if (updateData.name && updateData.name !== category.name) {
      const existingCategory = await Category.findOne({
        name: updateData.name.toLowerCase(),
        _id: { $ne: id },
        isGlobal: true,
        isDeleted: false
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    // Update category
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { 
        ...updateData,
        ...(updateData.name && { name: updateData.name.toLowerCase() })
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });

  } catch (error) {
    console.error('Error updating SuperAdmin category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
};

// @desc    Delete SuperAdmin category (soft delete)
// @route   DELETE /api/v1/superadmin/categories/:id
// @access  Private (Super Admin)
const deleteSuperAdminCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { force = false } = req.query;

    console.log('Deleting category:', id, force ? '(force delete)' : '(soft delete)');

    // Validate ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Invalid category ID format:', id);
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }

    const category = await Category.findById(id);
    if (!category || category.isDeleted) {
      console.log('Category not found or already deleted:', id);
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category is being used
    const usageCount = await Category.countDocuments({
      globalCategory: id,
      isDeleted: false
    });

    const menuItemsCount = await MenuItem.countDocuments({
      globalCategory: id
    });

    console.log('Usage check:', {
      restaurantCategories: usageCount,
      menuItems: menuItemsCount,
      forceDelete: force
    });

    if ((usageCount > 0 || menuItemsCount > 0) && !force) {
      console.log('Category is being used, cannot delete without force');
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It is being used by ${usageCount} restaurant categories and ${menuItemsCount} menu items. Use ?force=true to force delete.`
      });
    }

    if (force) {
      console.log('Performing hard delete...');
      
      // Hard delete - remove the category reference from all related documents
      const updateCategoriesResult = await Category.updateMany(
        { globalCategory: id },
        { $unset: { globalCategory: 1 } }
      );
      
      const updateMenuItemsResult = await MenuItem.updateMany(
        { globalCategory: id },
        { $unset: { globalCategory: 1 } }
      );
      
      const deleteResult = await Category.findByIdAndDelete(id);
      
      console.log('Hard delete completed:', {
        updatedCategories: updateCategoriesResult.modifiedCount,
        updatedMenuItems: updateMenuItemsResult.modifiedCount,
        deletedCategory: deleteResult ? deleteResult._id : null
      });
    } else {
      console.log('Performing soft delete...');
      
      // Soft delete
      const updateResult = await Category.findByIdAndUpdate(
        id, 
        { isDeleted: true, deletedAt: new Date() },
        { new: true }
      );
      
      console.log('Soft delete completed:', {
        categoryId: updateResult._id,
        isDeleted: updateResult.isDeleted
      });
    }

    res.status(200).json({
      success: true,
      message: force ? 'Category deleted permanently' : 'Category deleted successfully',
      data: {
        usageCount,
        menuItemsCount,
        deletedAction: force ? 'hard' : 'soft'
      }
    });

  } catch (error) {
    console.error('Error deleting SuperAdmin category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
};

// @desc    Toggle category status (active/inactive)
// @route   PUT /api/v1/superadmin/categories/:id/toggle
// @access  Private (Super Admin)
const toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category || category.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const newStatus = !category.isActive;
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { isActive: newStatus },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `Category ${newStatus ? 'activated' : 'deactivated'} successfully`,
      data: updatedCategory
    });

  } catch (error) {
    console.error('Error toggling category status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle category status',
      error: error.message
    });
  }
};

// @desc    Get category analytics
// @route   GET /api/v1/superadmin/categories/analytics
// @access  Private (Super Admin)
const getCategoryAnalytics = async (req, res) => {
  try {
    const pipeline = [
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: 'globalCategory',
          as: 'restaurantCategories'
        }
      },
      {
        $lookup: {
          from: 'menuitems',
          localField: '_id',
          foreignField: 'globalCategory',
          as: 'menuItems'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          displayName: 1,
          isActive: 1,
          restaurantCount: { $size: '$restaurantCategories' },
          menuItemCount: { $size: '$menuItems' },
          lastUsed: 1
        }
      },
      { $sort: { menuItemCount: -1 } }
    ];

    const analytics = await Category.aggregate(pipeline);

    // Get usage statistics
    const totalCategories = await Category.countDocuments({ isDeleted: false });
    const activeCategories = await Category.countDocuments({ 
      isActive: true, 
      isDeleted: false 
    });
    const categoriesWithUsage = await Category.countDocuments({
      'usage.totalMenuItems': { $gt: 0 },
      isDeleted: false
    });

    res.status(200).json({
      success: true,
      data: {
        analytics,
        summary: {
          totalCategories,
          activeCategories: activeCategories,
          inactiveCategories: totalCategories - activeCategories,
          categoriesWithUsage,
          categoriesWithoutUsage: totalCategories - categoriesWithUsage
        }
      }
    });

  } catch (error) {
    console.error('Error fetching category analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category analytics',
      error: error.message
    });
  }
};

// @desc    Bulk import/update categories
// @route   POST /api/v1/superadmin/categories/bulk
// @access  Private (Super Admin)
const bulkCategoryOperations = async (req, res) => {
  try {
    const { operation, categoriesData } = req.body;

    if (!operation || !categoriesData || !Array.isArray(categoriesData)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide operation type and categories data'
      });
    }

    let result;
    const createdBy = req.user._id;

    switch (operation) {
      case 'create':
        // Prepare categories for bulk insert
        const processedCategories = categoriesData.map(cat => ({
          ...cat,
          name: cat.name.toLowerCase(),
          displayName: cat.displayName || cat.name.charAt(0).toUpperCase() + cat.name.slice(1),
          createdBy,
          createdAt: new Date(),
          updatedAt: new Date()
        }));

        result = await Category.insertMany(processedCategories, {
          ordered: false // Continue inserting even if some fail
        });

        break;

      case 'update':
        const updatePromises = categoriesData.map(cat => {
          return Category.findByIdAndUpdate(
            cat.id,
            {
              ...cat,
              ...(cat.name && { name: cat.name.toLowerCase() })
            },
            { new: true }
          );
        });

        result = await Promise.all(updatePromises);

        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid operation type'
        });
    }

    res.status(200).json({
      success: true,
      message: `Bulk ${operation} completed successfully`,
      data: {
        processedCount: Array.isArray(result) ? result.length : result.modifiedCount,
        successCount: Array.isArray(result) ? result.length : result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Error in bulk category operation:', error);
    res.status(500).json({
      success: false,
      message: `Bulk ${operation} failed`,
      error: error.message
    });
  }
};

export {
  getAllSuperAdminCategories,
  getCategory as getSuperAdminCategory,
  createSuperAdminCategory,
  updateSuperAdminCategory,
  deleteSuperAdminCategory,
  toggleCategoryStatus as toggleSuperAdminCategoryStatus,
  getCategoryAnalytics,
  bulkCategoryOperations
};