import mongoose from 'mongoose';
import RestaurantUser from '../../models/RestaurantUser.js';
import Restaurant from '../../models/Restaurant.js';
import MenuItem from '../../models/Menu/MenuItem.js';
import Category from '../../models/Menu/Category.js';
import asyncHandler from 'express-async-handler';

// @desc    Get all menu items for a restaurant
// @route   GET /api/v1/restaurant/menu/items
// @access  Private (Restaurant only)
export const getRestaurantMenuItems = asyncHandler(async (req, res) => {
  try {
    console.log('Restaurant menu items requested by:', req.user._id);
    
    // Get menu items for the restaurant (check both RestaurantUser ID and Restaurant ID)
    const restaurant = await RestaurantUser.findById(req.user._id);
    let menuItems = [];
    
    if (restaurant) {
      // First try to find menu items linked to the RestaurantUser ID
      menuItems = await MenuItem.find({ restaurant: req.user._id })
        .populate('category', 'name displayName')
        .sort({ sortOrder: 1, name: 1 });
      
      // If no items found, try to find items linked to the Restaurant model ID
      if (menuItems.length === 0) {
        const restaurantDoc = await Restaurant.findOne({ owner: req.user._id });
        if (restaurantDoc) {
          menuItems = await MenuItem.find({ restaurant: restaurantDoc._id })
            .populate('category', 'name displayName')
            .sort({ sortOrder: 1, name: 1 });
        }
      }
      
      // If still no items found, check the 'menus' collection (legacy data)
      if (menuItems.length === 0) {
        console.log('No items in MenuItem collection, checking menus collection...');
        const menusCollection = mongoose.connection.db.collection('menus');
        const legacyMenuItems = await menusCollection.find({ 
          restaurant: req.user._id,
          isDeleted: { $ne: true }
        }).toArray();
        
        console.log('Found legacy menu items:', legacyMenuItems.length);
        
        if (legacyMenuItems.length > 0) {
          // Get category information for legacy menu items
          const categoryIds = legacyMenuItems.map(item => item.category).filter(Boolean);
          const categoriesCollection = mongoose.connection.db.collection('categories');
          const categories = await categoriesCollection.find({ 
            _id: { $in: categoryIds } 
          }).toArray();
          
          const categoryMap = {};
          categories.forEach(cat => {
            categoryMap[cat._id.toString()] = {
              _id: cat._id,
              name: cat.name,
              displayName: cat.displayName || cat.name
            };
          });
          
          // Convert legacy menu items to the expected format
          menuItems = legacyMenuItems.map(item => ({
            _id: item._id,
            name: item.name,
            description: item.description,
            price: item.price,
            images: item.images || [],
            category: categoryMap[item.category?.toString()] || { name: 'Uncategorized', displayName: 'Uncategorized' },
            restaurant: item.restaurant,
            isVegetarian: item.isVegetarian || false,
            isAvailable: item.isAvailable !== false,
            isActive: item.isActive !== false,
            preparationTime: item.preparationTime || 15,
            spiceLevel: item.spiceLevel || 'mild',
            rating: item.rating || 0,
            orderCount: item.orderCount || 0,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          }));
        }
      }
    }
    
    if (!menuItems || menuItems.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No menu items found for this restaurant'
      });
    }


    // Format menu items for response
    const formattedMenuItems = menuItems.map(item => ({
      _id: item._id,
      id: item._id, // For compatibility
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.images && item.images.length > 0 ? item.images[0] : '',
      images: item.images || [],
      ingredients: item.ingredients,
      isVeg: item.isVegetarian,
      isVegetarian: item.isVegetarian, // For compatibility
      isAvailable: item.isAvailable,
      isActive: item.isActive, // For compatibility
      isVegan: item.isVegan || false,
      isGlutenFree: item.isGlutenFree || false,
      isFeatured: item.isFeatured || false,
      spicyLevel: item.spiceLevel || 'mild',
      preparationTime: item.preparationTime || '10-15 minutes',
      calories: item.calories || null,
      discount: item.discount || 0,
      tags: item.tags || [],
      category: item.category?.name || 'Uncategorized',
      categoryId: item.category?._id,
      customizations: item.customizations || [],
      orderCount: 0, // Default value
      rating: 0, // Default value
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));

    console.log('Returning', formattedMenuItems.length, 'menu items');

    res.status(200).json({
      success: true,
      data: formattedMenuItems,
      count: formattedMenuItems.length
    });

  } catch (error) {
    console.error('Error fetching restaurant menu items:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching menu items'
    });
  }
});

// @desc    Get single menu item for a restaurant
// @route   GET /api/v1/restaurant/menu/items/:itemId
// @access  Private (Restaurant only)
export const getRestaurantMenuItem = asyncHandler(async (req, res) => {
  try {
    const { itemId } = req.params;

    // Find menu item using MenuItem model (check both RestaurantUser ID and Restaurant ID)
    let menuItem = await MenuItem.findOne({ 
      _id: itemId, 
      restaurant: req.user._id 
    }).populate('category', 'name displayName');
    
    // If not found, try to find by Restaurant model ID
    if (!menuItem) {
      const restaurantDoc = await Restaurant.findOne({ owner: req.user._id });
      if (restaurantDoc) {
        menuItem = await MenuItem.findOne({ 
          _id: itemId, 
          restaurant: restaurantDoc._id 
        }).populate('category', 'name displayName');
      }
    }

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    const formattedMenuItem = {
      _id: menuItem._id,
      id: menuItem._id,
      name: menuItem.name,
      description: menuItem.description,
      price: menuItem.price,
      image: menuItem.images && menuItem.images.length > 0 ? menuItem.images[0] : '',
      images: menuItem.images || [],
      ingredients: menuItem.tags || [],
      isVeg: menuItem.isVegetarian,
      isVegetarian: menuItem.isVegetarian,
      isAvailable: menuItem.isAvailable,
      isActive: menuItem.isActive,
      category: menuItem.category?.name || 'Uncategorized',
      categoryId: menuItem.category?._id,
      isVegan: menuItem.isVegan || false,
      isGlutenFree: menuItem.isGlutenFree || false,
      spicyLevel: menuItem.spiceLevel || 'mild',
      preparationTime: menuItem.preparationTime || 15,
      calories: menuItem.calories || null,
      tags: menuItem.tags || [],
      createdAt: menuItem.createdAt,
      updatedAt: menuItem.updatedAt
    };

    res.status(200).json({
      success: true,
      data: formattedMenuItem
    });

  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching menu item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Create new menu item for a restaurant
// @route   POST /api/v1/restaurant/menu/items
// @access  Private (Restaurant only)
export const createMenuItem = asyncHandler(async (req, res) => {
  try {
    const { name, description, price, category, image, ingredients, isVeg, isAvailable, customizations } = req.body;
    
    // Check if restaurant is verified before adding menu items
    const restaurant = await RestaurantUser.findById(req.user._id);
    if (!restaurant || !restaurant.isVerified || !restaurant.isActive) {
      return res.status(403).json({
        success: false,
        message: 'You cannot add menu items until your restaurant is verified and approved by admin.'
      });
    }

    // Validate required fields
    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, and category are required'
      });
    }

    // Find or create category
    let categoryDoc = await Category.findOne({ 
      name: category, 
      restaurant: req.user._id 
    });
    
    if (!categoryDoc) {
      categoryDoc = new Category({
        name: category,
        displayName: category,
        restaurant: req.user._id,
        isActive: true
      });
      await categoryDoc.save();
    }

    // Create new menu item using MenuItem model
    const newMenuItem = new MenuItem({
      name,
      description: description || '',
      price: parseFloat(price),
      images: image ? [image] : [],
      category: categoryDoc._id,
      restaurant: req.user._id,
      isVegetarian: isVeg || false,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      isActive: true,
      tags: ingredients || [],
      preparationTime: 15, // Default preparation time
      spiceLevel: 'mild'
    });

    await newMenuItem.save();

    // Populate the created item for response
    const createdItem = await MenuItem.findById(newMenuItem._id)
      .populate('category', 'name displayName');

    res.status(201).json({
      success: true,
      data: {
        _id: createdItem._id,
        id: createdItem._id,
        name: createdItem.name,
        description: createdItem.description,
        price: createdItem.price,
        image: createdItem.images && createdItem.images.length > 0 ? createdItem.images[0] : '',
        images: createdItem.images || [],
        ingredients: createdItem.tags || [],
        isVegetarian: createdItem.isVegetarian,
        isAvailable: createdItem.isAvailable,
        category: createdItem.category?.name || category,
        categoryId: createdItem.category?._id,
        isActive: createdItem.isActive,
        createdAt: createdItem.createdAt,
        updatedAt: createdItem.updatedAt
      },
      message: 'Menu item created successfully'
    });

  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating menu item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Update menu item for a restaurant
// @route   PUT /api/v1/restaurant/menu/items/:itemId
// @access  Private (Restaurant only)
export const updateMenuItem = asyncHandler(async (req, res) => {
  try {
    // Check if restaurant is verified
    const restaurant = await RestaurantUser.findById(req.user._id);
    if (!restaurant || !restaurant.isVerified || !restaurant.isActive) {
      return res.status(403).json({
        success: false,
        message: 'You cannot update menu items until your restaurant is verified and approved by admin.'
      });
    }

    const { itemId } = req.params;
    const { name, description, price, category, image, ingredients, isVeg, isAvailable, customizations } = req.body;

    // Find the menu item (check both RestaurantUser ID and Restaurant ID)
    let menuItem = await MenuItem.findOne({ 
      _id: itemId, 
      restaurant: req.user._id 
    }).populate('category', 'name displayName');
    
    // If not found, try to find by Restaurant model ID
    if (!menuItem) {
      const restaurantDoc = await Restaurant.findOne({ owner: req.user._id });
      if (restaurantDoc) {
        menuItem = await MenuItem.findOne({ 
          _id: itemId, 
          restaurant: restaurantDoc._id 
        }).populate('category', 'name displayName');
      }
    }

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Update item fields
    if (name !== undefined) menuItem.name = name;
    if (description !== undefined) menuItem.description = description;
    if (price !== undefined) menuItem.price = parseFloat(price);
    if (image !== undefined) menuItem.images = image ? [image] : [];
    if (ingredients !== undefined) menuItem.tags = ingredients;
    if (isVeg !== undefined) menuItem.isVegetarian = isVeg;
    if (isAvailable !== undefined) menuItem.isAvailable = isAvailable;

    // If category is being changed, find or create new category
    if (category && category !== menuItem.category?.name) {
      let categoryDoc = await Category.findOne({ 
        name: category, 
        restaurant: req.user._id 
      });
      
      if (!categoryDoc) {
        categoryDoc = new Category({
          name: category,
          displayName: category,
          restaurant: req.user._id,
          isActive: true
        });
        await categoryDoc.save();
      }
      
      menuItem.category = categoryDoc._id;
    }

    await menuItem.save();

    // Populate the updated item for response
    const updatedItem = await MenuItem.findById(menuItem._id)
      .populate('category', 'name displayName');

    res.status(200).json({
      success: true,
      data: {
        _id: updatedItem._id,
        id: updatedItem._id,
        name: updatedItem.name,
        description: updatedItem.description,
        price: updatedItem.price,
        image: updatedItem.images && updatedItem.images.length > 0 ? updatedItem.images[0] : '',
        images: updatedItem.images || [],
        ingredients: updatedItem.tags || [],
        isVegetarian: updatedItem.isVegetarian,
        isAvailable: updatedItem.isAvailable,
        category: updatedItem.category?.name || category,
        categoryId: updatedItem.category?._id,
        isActive: updatedItem.isActive,
        createdAt: updatedItem.createdAt,
        updatedAt: updatedItem.updatedAt
      },
      message: 'Menu item updated successfully'
    });

  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating menu item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Delete menu item for a restaurant
// @route   DELETE /api/v1/restaurant/menu/items/:itemId
// @access  Private (Restaurant only)
export const deleteMenuItem = asyncHandler(async (req, res) => {
  try {
    // Check if restaurant is verified
    const restaurant = await RestaurantUser.findById(req.user._id);
    if (!restaurant || !restaurant.isVerified || !restaurant.isActive) {
      return res.status(403).json({
        success: false,
        message: 'You cannot delete menu items until your restaurant is verified and approved by admin.'
      });
    }

    const { itemId } = req.params;

    // Find and delete the menu item (check both RestaurantUser ID and Restaurant ID)
    let menuItem = await MenuItem.findOneAndDelete({ 
      _id: itemId, 
      restaurant: req.user._id 
    });
    
    // If not found, try to find and delete by Restaurant model ID
    if (!menuItem) {
      const restaurantDoc = await Restaurant.findOne({ owner: req.user._id });
      if (restaurantDoc) {
        menuItem = await MenuItem.findOneAndDelete({ 
          _id: itemId, 
          restaurant: restaurantDoc._id 
        });
      }
    }

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting menu item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Toggle menu item availability status
// @route   PATCH /api/v1/restaurant/menu/items/:itemId/toggle-status
// @access  Private (Restaurant only)
export const toggleMenuItemStatus = asyncHandler(async (req, res) => {
  try {
    const { itemId } = req.params;
    const { isAvailable } = req.body;

    // Find the menu item (check both RestaurantUser ID and Restaurant ID)
    let menuItem = await MenuItem.findOne({ 
      _id: itemId, 
      restaurant: req.user._id 
    }).populate('category', 'name displayName');
    
    // If not found, try to find by Restaurant model ID
    if (!menuItem) {
      const restaurantDoc = await Restaurant.findOne({ owner: req.user._id });
      if (restaurantDoc) {
        menuItem = await MenuItem.findOne({ 
          _id: itemId, 
          restaurant: restaurantDoc._id 
        }).populate('category', 'name displayName');
      }
    }

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Toggle availability
    menuItem.isAvailable = isAvailable !== undefined ? isAvailable : !menuItem.isAvailable;
    await menuItem.save();

    res.status(200).json({
      success: true,
      data: {
        _id: menuItem._id,
        name: menuItem.name,
        isAvailable: menuItem.isAvailable,
        category: menuItem.category?.name
      },
      message: `Menu item ${menuItem.isAvailable ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('Error toggling menu item status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating menu item status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
