import MenuItem from '../../models/Menu/MenuItem.js';
import Category from '../../models/Menu/Category.js';
import Restaurant from '../../models/Restaurant.js';
import RestaurantUser from '../../models/RestaurantUser.js';

// @desc    Get all menu items across all restaurants (SuperAdmin view)
// @route   GET /api/v1/superadmin/menus
// @access  Private (Super Admin)
export const getAllMenuItems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      restaurantId,
      status = 'all', // all, active, inactive
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'all') {
      // Find category ID by name across all restaurants
      const categories = await Category.find({ name: { $regex: category, $options: 'i' } }).select('_id');
      const categoryIds = categories.map(cat => cat._id);
      query.category = { $in: categoryIds };
    }

    if (restaurantId && restaurantId !== 'all') {
      query.restaurant = restaurantId;
    }

    if (status === 'active') {
      query.isAvailable = true;
    } else if (status === 'inactive') {
      query.isAvailable = false;
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const menuItems = await MenuItem.find(query)
      .populate('restaurant', 'restaurantName cuisine')
      .populate({
        path: 'category',
        select: 'name displayName',
        match: { isDeleted: { $ne: true } } // Only populate if category is not deleted
      })
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MenuItem.countDocuments(query);

    // Get categories for filter
    const categories = await Category.find({ isActive: true, isDeleted: false })
      .select('name')
      .distinct('name');

    // Get restaurants for filter
    const restaurants = await Restaurant.find({ isActive: true, isDeleted: false })
      .select('_id restaurantName');

    res.status(200).json({
      success: true,
      data: menuItems, // Return menuItems directly as array
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      filters: {
        categories,
        restaurants
      }
    });

  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu items',
      error: error.message
    });
  }
};

// @desc    Get menu item details
// @route   GET /api/v1/superadmin/menus/:id
// @access  Private (Super Admin)
export const getMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid menu item ID format'
      });
    }

    const menuItem = await MenuItem.findById(id)
      .populate('restaurant', 'restaurantName cuisine')
      .populate('category', 'name description');

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: menuItem
    });

  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu item',
      error: error.message
    });
  }
};

// @desc    Create new menu item
// @route   POST /api/v1/superadmin/menus
// @access  Private (Super Admin)
export const createMenuItem = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      categoryId, // Support both category and categoryId
      restaurantId,
      imageUrl,
      preparationTime,
      isAvailable = true,
      isFeatured = false,
      allergens = [],
      nutritionInfo = {}
    } = req.body;

    // Validation
    if (!name || !price || !restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide required fields: name, price, restaurantId'
      });
    }

    // Check if restaurant exists
    const restaurant = await RestaurantUser.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Find or create category
    let finalCategoryId;
    if (categoryId) {
      // Use provided categoryId
      finalCategoryId = categoryId;
    } else if (category) {
      // Find or create category by name
      let existingCategory = await Category.findOne({
        name: category,
        restaurant: restaurantId
      });

      if (!existingCategory) {
        existingCategory = await Category.create({
          name: category,
          restaurant: restaurantId,
          description: `${category} items`
        });
      }
      finalCategoryId = existingCategory._id;
    }

    // Handle uploaded images
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => `/uploads/menu-items/${file.filename}`);
    }

    // Create menu item
    const menuItem = await MenuItem.create({
      name,
      description,
      price: parseFloat(price),
      category: finalCategoryId,
      restaurant: restaurantId,
      images: images.length > 0 ? images : (imageUrl ? [imageUrl] : []),
      preparationTime,
      isAvailable,
      isFeatured,
      allergens,
      nutritionInfo
    });

    // Populate the created item
    const populatedItem = await MenuItem.findById(menuItem._id)
      .populate('restaurant', 'restaurantName cuisine')
      .populate('category', 'name');

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: populatedItem
    });

  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create menu item',
      error: error.message
    });
  }
};

// @desc    Update menu item
// @route   PUT /api/v1/superadmin/menus/:id
// @access  Private (Super Admin)
export const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = req.body;


    // Validate ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid menu item ID format'
      });
    }

    // Find menu item
    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Handle file uploads - Delete old images if new ones are uploaded
    if (req.files && req.files.length > 0) {
      // Import file utility to delete old images
      const { deleteMultipleImageFiles } = await import('../../utils/fileUtils.js');
      
      // Delete old images before adding new ones
      if (menuItem.images && Array.isArray(menuItem.images) && menuItem.images.length > 0) {
        try {
          const { deleted, failed } = await deleteMultipleImageFiles(menuItem.images);
          console.log(`Deleted ${deleted} old image(s) for menu item ${id}. Failed: ${failed}`);
        } catch (fileError) {
          console.error('Error deleting old image files:', fileError.message);
          // Continue with update even if old file deletion fails
        }
      }
      
      // Update with new image URLs
      const imageUrls = req.files.map(file => `/uploads/menu-items/${file.filename}`);
      updateData.images = imageUrls;
    } else if (req.body.images !== undefined) {
      // If images array is explicitly set in body (e.g., to clear images or update URLs)
      updateData.images = Array.isArray(req.body.images) ? req.body.images : [];
    }

    // Handle category update
    if (updateData.category && updateData.category !== menuItem.category) {
        let existingCategory = await Category.findOne({
          name: updateData.category,
          restaurant: menuItem.restaurant
        });

        if (!existingCategory) {
          existingCategory = await Category.create({
            name: updateData.category,
            restaurant: menuItem.restaurant,
            description: `${updateData.category} items`
          });
        }
        updateData.category = existingCategory._id;
      }

    // Update menu item
    const updatedItem = await MenuItem.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('restaurant', 'restaurantName cuisine')
     .populate({
       path: 'category',
       select: 'name displayName',
       match: { isDeleted: { $ne: true } } // Only populate if category is not deleted
     });

    // Format response to ensure category is properly handled
    const formattedItem = {
      ...updatedItem.toObject(),
      category: (updatedItem.category && typeof updatedItem.category === 'object' && updatedItem.category.name) 
        ? { name: updatedItem.category.name, displayName: updatedItem.category.displayName || updatedItem.category.name, _id: updatedItem.category._id }
        : (updatedItem.category && typeof updatedItem.category === 'object' && updatedItem.category.displayName)
        ? { name: updatedItem.category.displayName, displayName: updatedItem.category.displayName, _id: updatedItem.category._id }
        : null // Don't include ObjectId strings
    };

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: formattedItem
    });

  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update menu item',
      error: error.message
    });
  }
};

// @desc    Delete menu item
// @route   DELETE /api/v1/superadmin/menus/:id
// @access  Private (Super Admin)
export const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid menu item ID format'
      });
    }

    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Import file utility function
    const { deleteMultipleImageFiles } = await import('../../utils/fileUtils.js');

    // Delete associated image files before deleting the menu item
    if (menuItem.images && Array.isArray(menuItem.images) && menuItem.images.length > 0) {
      try {
        const { deleted, failed } = await deleteMultipleImageFiles(menuItem.images);
        console.log(`Deleted ${deleted} image(s) for menu item ${id}. Failed: ${failed}`);
        
        // Log warning if some files failed to delete (but don't block deletion)
        if (failed > 0) {
          console.warn(`Warning: ${failed} image file(s) could not be deleted for menu item ${id}`);
        }
      } catch (fileError) {
        // Log error but don't block menu item deletion
        console.error('Error deleting image files:', fileError.message);
      }
    }

    // Delete the menu item from database
    await MenuItem.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete menu item',
      error: error.message
    });
  }
};

// @desc    Bulk operations on menu items
// @route   POST /api/v1/superadmin/menus/bulk
// @access  Private (Super Admin)
export const bulkMenuOperations = async (req, res) => {
  try {
    const { operation, menuItemIds, updateData } = req.body;

    if (!operation || !menuItemIds || !Array.isArray(menuItemIds)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide operation type and menu item IDs'
      });
    }

    let result;

    switch (operation) {
      case 'update':
        if (!updateData) {
          return res.status(400).json({
            success: false,
            message: 'Update data is required for bulk update operation'
          });
        }
        result = await MenuItem.updateMany(
          { _id: { $in: menuItemIds } },
          { $set: updateData }
        );
        break;

      case 'delete':
        result = await MenuItem.deleteMany({ _id: { $in: menuItemIds } });
        break;

      case 'toggleAvailability':
        result = await MenuItem.updateMany(
          { _id: { $in: menuItemIds } },
          [{ $set: { isAvailable: { $not: "$isAvailable" } } }]
        );
        break;

      case 'toggleFeatured':
        result = await MenuItem.updateMany(
          { _id: { $in: menuItemIds } },
          [{ $set: { isFeatured: { $not: "$isFeatured" } } }]
        );
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
        modifiedCount: result.modifiedCount || result.deletedCount,
        matchedCount: result.matchedCount
      }
    });

  } catch (error) {
    console.error('Error in bulk operation:', error);
    res.status(500).json({
      success: false,
      message: `Bulk ${operation} failed`,
      error: error.message
    });
  }
};

// @desc    Get all categories across restaurants
// @route   GET /api/v1/superadmin/categories
// @access  Private (Super Admin)
export const getAllCategories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      restaurantId,
      status = 'active' // active, inactive, all
    } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (restaurantId && restaurantId !== 'all') {
      query.restaurant = restaurantId;
    }

    if (status === 'active') {
      query.isActive = true;
      query.isDeleted = false;
    } else if (status === 'inactive') {
      query.isActive = false;
      query.isDeleted = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const categories = await Category.find(query)
      .populate('restaurant', 'restaurantName')
      .populate('itemsCount')
      .sort({ restaurant: 1, sortOrder: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Category.countDocuments(query);

    const restaurants = await Restaurant.find({ isActive: true, isDeleted: false })
      .select('_id restaurantName');

    res.status(200).json({
      success: true,
      data: {
        categories,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        },
        filters: {
          restaurants
        }
      }
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

// @desc    Create new category
// @route   POST /api/v1/superadmin/categories
// @access  Private (Super Admin)
export const createCategory = async (req, res) => {
  try {
    const {
      name,
      description,
      restaurantId,
      imageUrl,
      sortOrder = 0
    } = req.body;

    if (!name || !restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and restaurantId'
      });
    }

    // Check if restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Check if category already exists for this restaurant
    const existingCategory = await Category.findOne({
      name: { $regex: `^${name}$`, $options: 'i' },
      restaurant: restaurantId
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists for this restaurant'
      });
    }

    const category = await Category.create({
      name,
      description,
      restaurant: restaurantId,
      imageUrl,
      sortOrder
    });

    const populatedCategory = await Category.findById(category._id)
      .populate('restaurant', 'restaurantName')
      .populate('itemsCount');

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: populatedCategory
    });

  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
};

// @desc    Update category
// @route   PUT /api/v1/superadmin/categories/:id
// @access  Private (Super Admin)
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if name is being changed and if it already exists
    if (updateData.name && updateData.name !== category.name) {
      const existingCategory = await Category.findOne({
        name: { $regex: `^${updateData.name}$`, $options: 'i' },
        restaurant: category.restaurant,
        _id: { $ne: id }
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists for this restaurant'
        });
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('restaurant', 'restaurantName')
     .populate('itemsCount');

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });

  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/v1/superadmin/categories/:id
// @access  Private (Super Admin)
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has menu items
    const menuItemsCount = await MenuItem.countDocuments({ category: id });
    if (menuItemsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It contains ${menuItemsCount} menu items. Please move or delete the items first.`
      });
    }

    await Category.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
};

// @desc    Get menu analytics
// @route   GET /api/v1/superadmin/menus/analytics
// @access  Private (Super Admin)
export const getMenuAnalytics = async (req, res) => {
  try {
    const pipeline = [
      {
        $lookup: {
          from: 'restaurants',
          localField: 'restaurant',
          foreignField: '_id',
          as: 'restaurantInfo'
        }
      },
      {
        $unwind: '$restaurantInfo'
      },
      {
        $group: {
          _id: null,
          totalMenuItems: { $sum: 1 },
          totalAvailableItems: { $sum: { $cond: ['$isAvailable', 1, 0] } },
          totalFeaturedItems: { $sum: { $cond: ['$isFeatured', 1, 0] } },
          averagePrice: { $avg: '$price' },
          maxPrice: { $max: '$price' },
          minPrice: { $min: '$price' },
          itemsByRestaurant: {
            $push: {
              restaurantId: '$restaurant',
              restaurantName: '$restaurantInfo.restaurantName',
              itemsCount: 1,
              averagePrice: '$price'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalMenuItems: 1,
          totalAvailableItems: 1,
          totalFeaturedItems: 1,
          averagePrice: { $round: ['$averagePrice', 2] },
          maxPrice: 1,
          minPrice: 1
        }
      }
    ];

    const analytics = await MenuItem.aggregate(pipeline);
    
    // Get category distribution
    const categoryStats = await Category.aggregate([
      {
        $lookup: {
          from: 'menuitems',
          localField: '_id',
          foreignField: 'category',
          as: 'items'
        }
      },
      {
        $project: {
          name: 1,
          itemsCount: { $size: '$items' },
          averagePrice: {
            $cond: [
              { $gt: [{ $size: '$items' }, 0] },
              { $avg: '$items.price' },
              0
            ]
          }
        }
      },
      { $sort: { itemsCount: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...analytics[0],
        categoryStats
      }
    });

  } catch (error) {
    console.error('Error fetching menu analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu analytics',
      error: error.message
    });
  }
};

// Toggle menu item availability
export const toggleMenuItemAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;


    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    menuItem.isAvailable = isAvailable;
    await menuItem.save();

    res.status(200).json({
      success: true,
      message: 'Menu item availability updated successfully',
      data: {
        id: menuItem._id,
        isAvailable: menuItem.isAvailable
      }
    });

  } catch (error) {
    console.error('Toggle menu item availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle menu item availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default {
  getAllMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  bulkMenuOperations,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMenuAnalytics
};