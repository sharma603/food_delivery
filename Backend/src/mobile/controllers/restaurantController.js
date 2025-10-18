import RestaurantUser from '../../models/RestaurantUser.js';
import MenuItem from '../../models/Menu/MenuItem.js';
import Category from '../../models/Menu/Category.js';

// @desc    Get all restaurants for mobile app
// @route   GET /api/v1/mobile/restaurants
// @access  Public
export const getMobileRestaurants = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      cuisine,
      city,
      sortBy = 'rating.average',
      sortOrder = 'desc' 
    } = req.query;

    // Build query for active and verified restaurants
    const query = {
      isActive: true,
      isVerified: true
    };
    
    if (search) {
      query.$or = [
        { restaurantName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (cuisine) {
      query.cuisine = { $in: [cuisine] };
    }

    if (city) {
      query['address.city'] = { $regex: city, $options: 'i' };
    }

    // Execute query
    const restaurants = await RestaurantUser.find(query)
      .select('-password -securityAnswer -securityQuestion')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await RestaurantUser.countDocuments(query);

    // Transform data for mobile app
    const transformedRestaurants = restaurants.map(restaurant => ({
      _id: restaurant._id,
      name: restaurant.restaurantName,
      email: restaurant.email,
      phone: restaurant.phone,
      address: restaurant.address,
      cuisine: restaurant.cuisine,
      rating: restaurant.rating || { average: 0, count: 0 },
      deliveryTime: restaurant.deliveryTime || { min: 30, max: 45 },
      deliveryFee: restaurant.deliveryFee || 0,
      minimumOrder: restaurant.minimumOrder || 0,
      isOpen: restaurant.isOpen || true,
      image: restaurant.image || null,
      createdAt: restaurant.createdAt
    }));

    res.status(200).json({
      success: true,
      data: transformedRestaurants,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total: total
      }
    });

  } catch (error) {
    console.error('Error fetching mobile restaurants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurants',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single restaurant for mobile app
// @route   GET /api/v1/mobile/restaurants/:id
// @access  Public
export const getMobileRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await RestaurantUser.findById(id)
      .select('-password -securityAnswer -securityQuestion');

    if (!restaurant || !restaurant.isActive || !restaurant.isVerified) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Get restaurant's menu items
    const menuItems = await MenuItem.find({ 
      restaurant: id,
      isActive: true,
      isAvailable: true
    })
    .populate('category', 'name displayName')
    .sort({ sortOrder: 1, name: 1 });

    // Transform restaurant data
    const transformedRestaurant = {
      _id: restaurant._id,
      name: restaurant.restaurantName,
      email: restaurant.email,
      phone: restaurant.phone,
      address: restaurant.address,
      cuisine: restaurant.cuisine,
      rating: restaurant.rating || { average: 0, count: 0 },
      deliveryTime: restaurant.deliveryTime || { min: 30, max: 45 },
      deliveryFee: restaurant.deliveryFee || 0,
      minimumOrder: restaurant.minimumOrder || 0,
      isOpen: restaurant.isOpen || true,
      image: restaurant.image || null,
      menuItems: menuItems,
      createdAt: restaurant.createdAt
    };

    res.status(200).json({
      success: true,
      data: transformedRestaurant
    });

  } catch (error) {
    console.error('Error fetching mobile restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurant',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default {
  getMobileRestaurants,
  getMobileRestaurant
};
