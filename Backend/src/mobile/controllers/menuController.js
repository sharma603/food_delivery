import MenuItem from '../../models/Menu/MenuItem.js';
import Category from '../../models/Menu/Category.js';
import RestaurantUser from '../../models/RestaurantUser.js';

// @desc    Get all menu items for mobile app
// @route   GET /api/v1/mobile/menu-items
// @access  Public
export const getMobileMenuItems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      restaurantId,
      cuisine,
      isVeg,
      restaurantIsOpen,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = {
      isActive: true,
      isAvailable: true
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (restaurantId) {
      query.restaurant = restaurantId;
    }

    if (isVeg !== undefined) {
      query.isVegetarian = isVeg === 'true';
    }

    // Execute query with population
    let menuItems = await MenuItem.find(query)
      .populate('restaurant', 'restaurantName cuisine address rating deliveryTime deliveryFee isOpen isActive')
      .populate('category', 'name displayName')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter by restaurant open status if requested
    if (restaurantIsOpen === 'true') {
      menuItems = menuItems.filter(item => 
        item.restaurant && item.restaurant.isOpen === true && item.restaurant.isActive === true
      );
    }

    const total = await MenuItem.countDocuments(query);

    // Transform data for mobile app
    const transformedMenuItems = menuItems.map(item => ({
      _id: item._id,
      name: item.name,
      description: item.description,
      price: item.price,
      images: item.images || [],
      category: item.category ? {
        _id: item.category._id,
        name: item.category.name,
        displayName: item.category.displayName
      } : null,
      restaurant: item.restaurant ? {
        _id: item.restaurant._id,
        name: item.restaurant.restaurantName,
        cuisine: item.restaurant.cuisine,
        address: item.restaurant.address,
        rating: item.restaurant.rating,
        deliveryTime: item.restaurant.deliveryTime,
        deliveryFee: item.restaurant.deliveryFee,
        isOpen: item.restaurant.isOpen,
        isActive: item.restaurant.isActive
      } : null,
      isVegetarian: item.isVegetarian || false,
      isVegan: item.isVegan || false,
      isGlutenFree: item.isGlutenFree || false,
      spiceLevel: item.spiceLevel || 'mild',
      preparationTime: item.preparationTime || 15,
      calories: item.calories || 0,
      rating: item.rating || 0,
      reviewCount: item.reviewCount || 0,
      orderCount: item.orderCount || 0,
      createdAt: item.createdAt
    }));

    res.status(200).json({
      success: true,
      data: transformedMenuItems,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total: total
      }
    });

  } catch (error) {
    console.error('Error fetching mobile menu items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu items',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single menu item for mobile app
// @route   GET /api/v1/mobile/menu-items/:id
// @access  Public
export const getMobileMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findById(id)
      .populate('restaurant', 'restaurantName cuisine address rating deliveryTime deliveryFee isOpen isActive')
      .populate('category', 'name displayName');

    if (!menuItem || !menuItem.isActive || !menuItem.isAvailable) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Transform data for mobile app
    const transformedMenuItem = {
      _id: menuItem._id,
      name: menuItem.name,
      description: menuItem.description,
      price: menuItem.price,
      images: menuItem.images || [],
      category: menuItem.category ? {
        _id: menuItem.category._id,
        name: menuItem.category.name,
        displayName: menuItem.category.displayName
      } : null,
      restaurant: menuItem.restaurant ? {
        _id: menuItem.restaurant._id,
        name: menuItem.restaurant.restaurantName,
        cuisine: menuItem.restaurant.cuisine,
        address: menuItem.restaurant.address,
        rating: menuItem.restaurant.rating,
        deliveryTime: menuItem.restaurant.deliveryTime,
        deliveryFee: menuItem.restaurant.deliveryFee,
        isOpen: menuItem.restaurant.isOpen,
        isActive: menuItem.restaurant.isActive
      } : null,
      isVegetarian: menuItem.isVegetarian || false,
      isVegan: menuItem.isVegan || false,
      isGlutenFree: menuItem.isGlutenFree || false,
      spiceLevel: menuItem.spiceLevel || 'mild',
      preparationTime: menuItem.preparationTime || 15,
      calories: menuItem.calories || 0,
      ingredients: menuItem.ingredients || [],
      allergens: menuItem.allergens || [],
      nutritionInfo: menuItem.nutritionInfo || {},
      rating: menuItem.rating || 0,
      reviewCount: menuItem.reviewCount || 0,
      orderCount: menuItem.orderCount || 0,
      createdAt: menuItem.createdAt
    };

    res.status(200).json({
      success: true,
      data: transformedMenuItem
    });

  } catch (error) {
    console.error('Error fetching mobile menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get menu items by restaurant for mobile app
// @route   GET /api/v1/mobile/restaurants/:restaurantId/menu
// @access  Public
export const getMobileRestaurantMenu = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { category, search } = req.query;

    // Check if restaurant exists and is active
    const restaurant = await RestaurantUser.findById(restaurantId);
    if (!restaurant || !restaurant.isActive || !restaurant.isVerified) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Build query
    const query = {
      restaurant: restaurantId,
      isActive: true,
      isAvailable: true
    };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Get menu items
    const menuItems = await MenuItem.find(query)
      .populate('category', 'name displayName')
      .sort({ sortOrder: 1, name: 1 });

    // Get categories for this restaurant
    const categories = await Category.find({
      restaurant: restaurantId,
      isActive: true,
      isDeleted: false
    }).sort({ sortOrder: 1, name: 1 });

    // Transform data
    const transformedMenuItems = menuItems.map(item => ({
      _id: item._id,
      name: item.name,
      description: item.description,
      price: item.price,
      images: item.images || [],
      category: item.category ? {
        _id: item.category._id,
        name: item.category.name,
        displayName: item.category.displayName
      } : null,
      isVegetarian: item.isVegetarian || false,
      isVegan: item.isVegan || false,
      isGlutenFree: item.isGlutenFree || false,
      spiceLevel: item.spiceLevel || 'mild',
      preparationTime: item.preparationTime || 15,
      calories: item.calories || 0,
      rating: item.rating || 0,
      reviewCount: item.reviewCount || 0,
      orderCount: item.orderCount || 0
    }));

    const transformedCategories = categories.map(cat => ({
      _id: cat._id,
      name: cat.name,
      displayName: cat.displayName,
      description: cat.description,
      image: cat.image || null,
      icon: cat.icon || 'restaurant'
    }));

    res.status(200).json({
      success: true,
      data: {
        restaurant: {
          _id: restaurant._id,
          name: restaurant.restaurantName,
          cuisine: restaurant.cuisine,
          rating: restaurant.rating,
          deliveryTime: restaurant.deliveryTime,
          deliveryFee: restaurant.deliveryFee
        },
        categories: transformedCategories,
        menuItems: transformedMenuItems
      }
    });

  } catch (error) {
    console.error('Error fetching mobile restaurant menu:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurant menu',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default {
  getMobileMenuItems,
  getMobileMenuItem,
  getMobileRestaurantMenu
};
