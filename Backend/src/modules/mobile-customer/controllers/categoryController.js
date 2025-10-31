import Category from '../../models/Menu/Category.js';
import MenuItem from '../../models/Menu/MenuItem.js';

// @desc    Get all categories for mobile app
// @route   GET /api/v1/mobile/categories
// @access  Public
export const getMobileCategories = async (req, res) => {
  try {
    const { restaurantId } = req.query;

    let query = {
      isActive: true,
      isDeleted: false
    };

    // If restaurantId is provided, get categories for that restaurant
    if (restaurantId) {
      query.restaurant = restaurantId;
    } else {
      // Get global categories
      query.isGlobal = true;
    }

    const categories = await Category.find(query)
      .sort({ sortOrder: 1, name: 1 })
      .select('name displayName description image icon tags');

    // Get item count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const itemCount = await MenuItem.countDocuments({
          category: category._id,
          isActive: true,
          isAvailable: true
        });

        return {
          _id: category._id,
          name: category.name,
          displayName: category.displayName,
          description: category.description,
          image: category.image || null,
          icon: category.icon || 'restaurant',
          tags: category.tags || [],
          itemCount: itemCount
        };
      })
    );

    res.status(200).json({
      success: true,
      data: categoriesWithCount
    });

  } catch (error) {
    console.error('Error fetching mobile categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get popular categories for mobile app
// @route   GET /api/v1/mobile/categories/popular
// @access  Public
export const getMobilePopularCategories = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get categories with most menu items
    const popularCategories = await Category.aggregate([
      {
        $match: {
          isActive: true,
          isDeleted: false
        }
      },
      {
        $lookup: {
          from: 'menuitems',
          localField: '_id',
          foreignField: 'category',
          as: 'menuItems'
        }
      },
      {
        $addFields: {
          itemCount: {
            $size: {
              $filter: {
                input: '$menuItems',
                cond: {
                  $and: [
                    { $eq: ['$$this.isActive', true] },
                    { $eq: ['$$this.isAvailable', true] }
                  ]
                }
              }
            }
          }
        }
      },
      {
        $match: {
          itemCount: { $gt: 0 }
        }
      },
      {
        $sort: { itemCount: -1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          _id: 1,
          name: 1,
          displayName: 1,
          description: 1,
          image: 1,
          icon: 1,
          tags: 1,
          itemCount: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: popularCategories
    });

  } catch (error) {
    console.error('Error fetching mobile popular categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get menu items by category for mobile app
// @route   GET /api/v1/mobile/categories/:categoryId/menu-items
// @access  Public
export const getMobileCategoryMenuItems = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      restaurantId,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category || !category.isActive || category.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Build query
    const query = {
      category: categoryId,
      isActive: true,
      isAvailable: true
    };

    if (restaurantId) {
      query.restaurant = restaurantId;
    }

    // Get menu items
    const menuItems = await MenuItem.find(query)
      .populate('restaurant', 'restaurantName cuisine address rating deliveryTime deliveryFee')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await MenuItem.countDocuments(query);

    // Transform data
    const transformedMenuItems = menuItems.map(item => ({
      _id: item._id,
      name: item.name,
      description: item.description,
      price: item.price,
      images: item.images || [],
      restaurant: item.restaurant ? {
        _id: item.restaurant._id,
        name: item.restaurant.restaurantName,
        cuisine: item.restaurant.cuisine,
        address: item.restaurant.address,
        rating: item.restaurant.rating,
        deliveryTime: item.restaurant.deliveryTime,
        deliveryFee: item.restaurant.deliveryFee
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

    res.status(200).json({
      success: true,
      data: {
        category: {
          _id: category._id,
          name: category.name,
          displayName: category.displayName,
          description: category.description,
          image: category.image || null,
          icon: category.icon || 'restaurant'
        },
        menuItems: transformedMenuItems,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total: total
        }
      }
    });

  } catch (error) {
    console.error('Error fetching mobile category menu items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category menu items',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default {
  getMobileCategories,
  getMobilePopularCategories,
  getMobileCategoryMenuItems
};
