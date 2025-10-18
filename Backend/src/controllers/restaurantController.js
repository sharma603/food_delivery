import Restaurant from '../models/Restaurant.js';
import RestaurantUser from '../models/RestaurantUser.js';
import MenuItem from '../models/Menu/MenuItem.js';
import Category from '../models/Menu/Category.js';

// Helper function to get default opening hours
const getDefaultOpeningHours = () => ({
  monday: { open: '10:00', close: '22:00', isClosed: false },
  tuesday: { open: '10:00', close: '22:00', isClosed: false },
  wednesday: { open: '10:00', close: '22:00', isClosed: false },
  thursday: { open: '10:00', close: '22:00', isClosed: false },
  friday: { open: '10:00', close: '23:00', isClosed: false },
  saturday: { open: '10:00', close: '23:00', isClosed: false },
  sunday: { open: '10:00', close: '22:00', isClosed: false }
});

const getRestaurants = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      cuisine,
      search,
      sortBy = 'rating.average',
      sortOrder = 'desc',
      latitude,
      longitude,
      radius = 10
    } = req.query;

    const query = { isActive: true, isOpen: true };

    // Search functionality
    if (search) {
      query.$or = [
        { restaurantName: { $regex: search, $options: 'i' } }, // RestaurantUser field
        { name: { $regex: search, $options: 'i' } }, // Restaurant field
        { description: { $regex: search, $options: 'i' } },
        { cuisine: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Cuisine filter
    if (cuisine) {
      query.cuisine = { $in: cuisine.split(',') };
    }

    // Location-based filtering (if coordinates provided)
    if (latitude && longitude) {
      query['address.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      };
    }

    // Try RestaurantUser first (for authenticated restaurants), then fallback to Restaurant
    let restaurants = await RestaurantUser.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password -securityAnswer');

    let total = await RestaurantUser.countDocuments(query);

    // If no RestaurantUser found, try Restaurant model
    if (restaurants.length === 0) {
      restaurants = await Restaurant.find(query)
        .populate('owner', 'name email')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      total = await Restaurant.countDocuments(query);
    }

    // Transform RestaurantUser data to match Restaurant format
    const transformedRestaurants = restaurants.map(restaurant => {
      if (restaurant.restaurantName) {
        // This is a RestaurantUser, transform it
        return {
          _id: restaurant._id,
          name: restaurant.restaurantName,
          email: restaurant.email,
          phone: restaurant.phone,
          description: restaurant.description,
          address: restaurant.address,
          cuisine: restaurant.cuisine,
          images: restaurant.images,
          rating: {
            average: restaurant.rating?.average || 0,
            count: restaurant.rating?.count || 0
          },
          deliveryTime: restaurant.deliveryInfo?.deliveryTime || { min: 30, max: 60 },
          deliveryFee: restaurant.deliveryInfo?.deliveryFee || 0,
          minimumOrder: restaurant.deliveryInfo?.minimumOrder || 0,
          isActive: restaurant.isActive,
          isOpen: restaurant.isOpen,
          openingHours: restaurant.openingHours,
          createdAt: restaurant.createdAt,
          updatedAt: restaurant.updatedAt
        };
      }
      // This is already a Restaurant, return as is
      return restaurant;
    });

    res.json({
      success: true,
      data: transformedRestaurants,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurants',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate('owner', 'name email');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    res.json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurant',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const createRestaurant = async (req, res) => {
  try {
    const {
      name,
      description,
      email,
      phone,
      address,
      cuisine,
      openingHours,
      deliveryTime,
      deliveryFee,
      minimumOrder
    } = req.body;

    // Validation
    if (!name || !email || !address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide restaurant name, email, and address'
      });
    }

    // Check if user already has a restaurant
    const existingRestaurant = await Restaurant.findOne({ owner: req.user._id });
    if (existingRestaurant) {
      return res.status(400).json({
        success: false,
        message: 'You already have a registered restaurant'
      });
    }

    const restaurant = new Restaurant({
      name: name.trim(),
      description,
      owner: req.user._id,
      email: email.toLowerCase().trim(),
      phone,
      address,
      cuisine: cuisine || [],
      openingHours: openingHours || getDefaultOpeningHours(),
      deliveryTime: deliveryTime || { min: 25, max: 40 },
      deliveryFee: deliveryFee || 0,
      minimumOrder: minimumOrder || 0,
      isActive: false, // Set to inactive until approved
      isVerified: false, // Requires admin verification
      isOpen: false,
      rating: { average: 0, count: 0 },
      features: ['delivery'], // Default feature
      images: [] // Initialize empty images array
    });

    const createdRestaurant = await restaurant.save();
    await createdRestaurant.populate('owner', 'name email');

    // Menu items will be created individually using MenuItem model

    res.status(201).json({
      success: true,
      data: {
        restaurant: createdRestaurant,
        message: 'Restaurant created successfully with active status. Menu initialized and ready for item addition.'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating restaurant',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const updateRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Check ownership
    if (restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this restaurant'
      });
    }

    const allowedUpdates = [
      'name', 'description', 'phone', 'address', 'cuisine',
      'openingHours', 'deliveryTime', 'deliveryFee', 'minimumOrder', 'images'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    Object.assign(restaurant, updates);
    const updatedRestaurant = await restaurant.save();

    res.json({
      success: true,
      data: updatedRestaurant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating restaurant',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Check ownership
    if (restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this restaurant'
      });
    }

    await restaurant.deleteOne();

    // Menu items will be handled separately if needed

    res.json({
      success: true,
      message: 'Restaurant removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting restaurant',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getMyRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'No restaurant found for this user'
      });
    }

    res.json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurant'
    });
  }
};

// Get all menu items directly from MenuItem table
const getAllMenuItems = async (req, res) => {
  try {
    console.log('=== getAllMenuItems CALLED ===');
    const {
      page = 1,
      limit = 20,
      category,
      search,
      cuisine,
      isVeg,  
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    console.log('Query params:', { page, limit, category, search, cuisine, isVeg, sortBy, sortOrder });

    // Get ALL menu items directly from MenuItem table (only from open restaurants)
    console.log('Querying ALL menu items from MenuItem table...');
    const menuItems = await MenuItem.find({})
      .populate({
        path: 'restaurant', 
        select: 'name cuisine rating isOpen isActive',
        match: { isOpen: true, isActive: true }, // Only include open and active restaurants
        options: { lean: true }
      })
      .populate({
        path: 'category',
        select: 'name displayName',
        options: { lean: true }
      })
      .lean();

    // Found menu items for aggregation
    if (menuItems.length > 0) {
      console.log('Sample menu item found:', {
        restaurant: menuItems[0].restaurant?.name,
        category: menuItems[0].category?.name
      });
    } else {
      console.log('No menu items found in MenuItem table');
    }

    // Process menu items directly (no flattening needed)
    // Filter out items from closed restaurants and unavailable items
    let allMenuItems = menuItems.filter(item => 
      item.isAvailable !== false && 
      item.restaurant && // Restaurant exists
      item.restaurant.isOpen !== false && // Restaurant is open
      item.restaurant.isActive !== false // Restaurant is active
    );
    
    console.log('Total menu items extracted:', allMenuItems.length);

    // Apply search filter if needed
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      allMenuItems = allMenuItems.filter(item => 
        searchRegex.test(item.name) || 
        searchRegex.test(item.description || '')
      );
    }

    // Apply category filter
    if (category) {
      allMenuItems = allMenuItems.filter(item => 
        item.category.name.toLowerCase() === category.toLowerCase()
      );
    }

    // Apply veg filter
    if (isVeg !== undefined) {
      allMenuItems = allMenuItems.filter(item =>
        item.isVegetarian === (isVeg === 'true')
      );
    }

    // Sort items
    if (sortBy === 'price') {
      allMenuItems.sort((a, b) => sortOrder === 'desc' ? b.price - a.price : a.price - b.price);
    } else if (sortBy === 'name') {
      allMenuItems.sort((a, b) => sortOrder === 'desc' ? 
        b.name.localeCompare(a.name) : a.name.localeCompare(b.name));
    } else if (sortBy === 'restaurant') {
      allMenuItems.sort((a, b) => sortOrder === 'desc' ? 
        b.restaurant.name.localeCompare(a.restaurant.name) : a.restaurant.name.localeCompare(b.restaurant.name));
    }

    // Pagination
    const total = allMenuItems.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedItems = allMenuItems.slice(startIndex, endIndex);

    // Response prepared with pagination

    res.json({
      success: true,
      data: paginatedItems,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get all menu items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu items',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all public categories (for customer app)
const getPublicCategories = async (req, res) => {
  try {
    console.log('=== getPublicCategories CALLED ===');
    
    // First, try to get categories from the Category collection
    let categories = [];
    try {
      categories = await Category.find({ 
        isActive: true, 
        isDeleted: false 
      })
      .select('name displayName description image icon tags')
      .sort({ sortOrder: 1, name: 1 })
      .lean(); // Use lean() to avoid virtual fields and get plain objects
      
      console.log('Found categories from Category collection:', categories.length);
    } catch (categoryError) {
      console.log('Error fetching from Category collection:', categoryError.message);
    }

    // Get unique categories from menu items (since some items might have string categories)
    let menuItemCategories = [];
    try {
      // Use raw MongoDB aggregation to bypass Mongoose schema validation
      const categoryAggregation = await MenuItem.collection.aggregate([
        {
          $match: {
            isActive: true,
            isDeleted: false,
            category: { $exists: true, $ne: null, $ne: '' }
          }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]).toArray();

      console.log('Category aggregation result:', categoryAggregation);

      // Convert aggregation result to category objects
      menuItemCategories = categoryAggregation.map(item => {
        const categoryName = item._id;
        return {
          name: categoryName,
          displayName: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
          description: `${categoryName} items`,
          image: null,
          icon: 'restaurant',
          tags: [categoryName.toLowerCase()],
          itemCount: item.count
        };
      });

      console.log('Found categories from menu items:', menuItemCategories.length);
    } catch (menuError) {
      console.log('Error fetching categories from menu items:', menuError.message);
    }

    // Combine and deduplicate categories
    const allCategories = [...categories];
    
    // Add menu item categories that don't exist in the Category collection
    menuItemCategories.forEach(menuCat => {
      const exists = allCategories.some(cat => 
        cat.name === menuCat.name || cat.displayName === menuCat.name
      );
      if (!exists) {
        allCategories.push(menuCat);
      }
    });

    console.log('Total categories to return:', allCategories.length);

    res.status(200).json({
      success: true,
      data: allCategories,
      message: 'Categories fetched successfully'
    });

  } catch (error) {
    console.error('Get public categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export { getRestaurants, getRestaurant, createRestaurant, updateRestaurant, deleteRestaurant, getMyRestaurant, getAllMenuItems, getPublicCategories };