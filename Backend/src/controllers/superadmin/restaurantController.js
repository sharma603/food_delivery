import RestaurantUser from '../../models/RestaurantUser.js';
import Restaurant from '../../models/Restaurant.js';
import { generateCredentials } from '../../utils/generateCredentials.js';
import { sendEmail } from '../../services/emailService.js';

// @desc    Get all restaurants for SuperAdmin
// @route   GET /api/v1/superadmin/restaurants
// @access  Private (Super Admin)
export const getAllRestaurants = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status, 
      cuisine,
      city,
      sortBy = 'createdAt',
      sortOrder = 'desc' 
    } = req.query;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { restaurantName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'all') {
      if (status === 'active') {
        query.isActive = true;
        query.isVerified = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      } else if (status === 'pending') {
        query.isVerified = false;
      } else if (status === 'suspended') {
        query.isActive = false;
        query.isVerified = true;
      }
    }

    if (cuisine) {
      query.cuisine = { $in: [cuisine] };
    }

    if (city) {
      query['address.city'] = { $regex: city, $options: 'i' };
    }

    // Execute query
    const restaurants = await RestaurantUser.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password -securityAnswer')
      .populate('verifiedBy', 'name email');

    const total = await RestaurantUser.countDocuments(query);

    // Transform data for frontend
    const transformedRestaurants = restaurants.map(restaurant => ({
      _id: restaurant._id,
      restaurantName: restaurant.restaurantName,
      name: restaurant.restaurantName,
      email: restaurant.email,
      phone: restaurant.phone,
      address: restaurant.address,
      status: getRestaurantStatus(restaurant),
      isOpen: restaurant.isOpen || false,
      operatingStatus: restaurant.isOpen ? 'open' : 'closed',
      totalOrders: restaurant.totalOrders || 0,
      totalRevenue: restaurant.totalRevenue || 0,
      rating: restaurant.rating,
      cuisine: restaurant.cuisine,
      isVerified: restaurant.isVerified,
      isActive: restaurant.isActive,
      createdAt: restaurant.createdAt,
      verifiedBy: restaurant.verifiedBy,
      verifiedAt: restaurant.verifiedAt
    }));

    res.json({
      success: true,
      data: transformedRestaurants,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get all restaurants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurants'
    });
  }
};

// @desc    Create restaurant account
// @route   POST /api/v1/superadmin/restaurants
// @access  Private (Super Admin)
export const createRestaurant = async (req, res) => {
  try {
    const {
      restaurantName,
      ownerName,
      email,
      phone,
      address,
      cuisine,
      description,
      businessLicense,
      taxId,
      establishedYear,
      website,
      deliveryInfo,
      features,
      socialMedia
    } = req.body;

    // Validation
    if (!restaurantName || !ownerName || !email || !phone || !address || !businessLicense || !taxId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: restaurantName, ownerName, email, phone, address, businessLicense, taxId'
      });
    }

    // Validate address structure
    if (!address.street || !address.city || !address.state || !address.zipCode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide complete address information (street, city, state, zipCode)'
      });
    }

    // Check if restaurant already exists
    const existingRestaurant = await RestaurantUser.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { businessLicense: businessLicense }
      ]
    });

    if (existingRestaurant) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant with this email or business license already exists'
      });
    }

    // Generate temporary credentials
    const credentials = generateCredentials();

    // Create restaurant
    const restaurantData = {
      restaurantName: restaurantName.trim(),
      ownerName: ownerName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password: credentials.password,
      address: {
        street: address.street.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        zipCode: address.zipCode.trim(),
        coordinates: address.coordinates || {}
      },
      cuisine: Array.isArray(cuisine) ? cuisine : [cuisine].filter(Boolean),
      description: description?.trim(),
      businessLicense: businessLicense.trim(),
      taxId: taxId.trim(),
      establishedYear: establishedYear || new Date().getFullYear(),
      deliveryInfo: deliveryInfo || {
        deliveryTime: { min: 30, max: 60 },
        deliveryFee: 0,
        minimumOrder: 0,
        deliveryRadius: 10
      },
      features: features || ['delivery', 'pickup'],
      socialMedia: socialMedia || {},
      isVerified: true, // Auto-verified when created by SuperAdmin
      verifiedBy: req.user._id,
      verifiedAt: new Date(),
      verificationStatus: 'approved',
      isActive: true
    };

    // Creating restaurant with provided data
    
    // Create restaurant
    const restaurant = await RestaurantUser.create(restaurantData);
    // Restaurant created successfully

    // Send credentials to restaurant owner
    try {
      await sendEmail({
        to: restaurant.email,
        subject: 'Your Restaurant Account Credentials - FoodHub',
        template: 'restaurant-credentials',
        data: {
          restaurantName: restaurant.restaurantName,
          ownerName: restaurant.ownerName,
          email: restaurant.email,
          password: credentials.password,
          loginUrl: `${process.env.CLIENT_URL}/restaurant/login`
        }
      });
    } catch (emailError) {
      console.error('Failed to send credentials email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Restaurant created successfully',
      data: {
        _id: restaurant._id,
        name: restaurant.restaurantName,
        email: restaurant.email,
        phone: restaurant.phone,
        address: restaurant.address,
        status: 'active',
        credentials: {
          email: restaurant.email,
          password: credentials.password
        }
      }
    });

  } catch (error) {
    console.error('Create restaurant error:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    
    res.status(500).json({
      success: false,
      message: 'Failed to create restaurant',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Generate new credentials for restaurant
// @route   POST /api/v1/superadmin/restaurants/:id/credentials
// @access  Private (Super Admin)
export const generateRestaurantCredentials = async (req, res) => {
  try {
    const restaurant = await RestaurantUser.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Generate new credentials
    const credentials = generateCredentials();
    restaurant.password = credentials.password;
    await restaurant.save();

    // Send new credentials to restaurant owner
    try {
      await sendEmail({
        to: restaurant.email,
        subject: 'Your New Restaurant Account Credentials - FoodHub',
        template: 'restaurant-new-credentials',
        data: {
          restaurantName: restaurant.restaurantName,
          ownerName: restaurant.ownerName,
          email: restaurant.email,
          password: credentials.password,
          loginUrl: `${process.env.CLIENT_URL}/restaurant/login`
        }
      });

      res.json({
        success: true,
        message: 'New credentials generated and sent to restaurant owner',
        data: {
          credentials: {
            email: restaurant.email,
            password: credentials.password
          }
        }
      });

    } catch (emailError) {
      console.error('Failed to send new credentials email:', emailError);
      
      // Still return success but with warning
      res.json({
        success: true,
        message: 'New credentials generated but email sending failed',
        data: {
          credentials: {
            email: restaurant.email,
            password: credentials.password
          }
        },
        warning: 'Email could not be sent'
      });
    }

  } catch (error) {
    console.error('Generate credentials error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate credentials'
    });
  }
};

// @desc    Update restaurant status
// @route   PUT /api/v1/superadmin/restaurants/:id/status
// @access  Private (Super Admin)
export const updateRestaurantStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const restaurant = await RestaurantUser.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Update status based on action
    switch (status) {
      case 'active':
        restaurant.isActive = true;
        restaurant.isVerified = true;
        restaurant.verificationStatus = 'approved';
        break;
      case 'inactive':
        restaurant.isActive = false;
        break;
      case 'suspended':
        restaurant.isActive = false;
        restaurant.verificationStatus = 'suspended';
        restaurant.rejectionReason = reason;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
    }

    restaurant.verifiedBy = req.user._id;
    restaurant.verifiedAt = new Date();
    await restaurant.save();

    res.json({
      success: true,
      message: `Restaurant status updated to ${status}`,
      data: {
        _id: restaurant._id,
        name: restaurant.restaurantName,
        status: getRestaurantStatus(restaurant)
      }
    });

  } catch (error) {
    console.error('Update restaurant status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update restaurant status'
    });
  }
};

// @desc    Update restaurant details
// @route   PUT /api/v1/superadmin/restaurants/:id
// @access  Private (Super Admin)
export const updateRestaurant = async (req, res) => {
  try {
    const {
      restaurantName,
      ownerName,
      email,
      phone,
      address,
      cuisine,
      description,
      businessLicense,
      taxId,
      establishedYear,
      website,
      deliveryInfo,
      features,
      socialMedia,
      status,
      password
    } = req.body;

    const restaurant = await RestaurantUser.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== restaurant.email) {
      const existingRestaurant = await RestaurantUser.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: req.params.id }
      });

      if (existingRestaurant) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another restaurant'
        });
      }
    }

    // Update fields
    if (restaurantName) restaurant.restaurantName = restaurantName.trim();
    if (ownerName) restaurant.ownerName = ownerName.trim();
    if (email) restaurant.email = email.toLowerCase().trim();
    if (phone) restaurant.phone = phone.trim();
    if (description) restaurant.description = description.trim();
    if (businessLicense) restaurant.businessLicense = businessLicense.trim();
    if (taxId) restaurant.taxId = taxId.trim();
    if (establishedYear) restaurant.establishedYear = establishedYear;
    if (website) restaurant.socialMedia = { ...restaurant.socialMedia, website };
    
    // Update address if provided
    if (address) {
      restaurant.address = {
        ...restaurant.address,
        ...address
      };
    }

    // Update arrays
    if (cuisine) {
      restaurant.cuisine = Array.isArray(cuisine) ? cuisine : [cuisine].filter(Boolean);
    }
    if (features) restaurant.features = features;
    if (deliveryInfo) restaurant.deliveryInfo = { ...restaurant.deliveryInfo, ...deliveryInfo };
    if (socialMedia) restaurant.socialMedia = { ...restaurant.socialMedia, ...socialMedia };

    // Update status if provided
    if (status) {
      switch (status) {
        case 'active':
          restaurant.isActive = true;
          restaurant.isVerified = true;
          restaurant.verificationStatus = 'approved';
          break;
        case 'inactive':
          restaurant.isActive = false;
          break;
        case 'pending':
          restaurant.isVerified = false;
          restaurant.verificationStatus = 'pending';
          break;
        default:
          break;
      }
    }

    // Update password if provided (will be hashed by pre-save hook)
    if (password && password.trim()) {
      restaurant.password = password;
    }

    await restaurant.save();

    res.json({
      success: true,
      message: 'Restaurant updated successfully',
      data: {
        _id: restaurant._id,
        name: restaurant.restaurantName,
        email: restaurant.email,
        phone: restaurant.phone,
        address: restaurant.address,
        status: getRestaurantStatus(restaurant)
      }
    });

  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update restaurant',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete restaurant
// @route   DELETE /api/v1/superadmin/restaurants/:id
// @access  Private (Super Admin)
export const deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await RestaurantUser.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    await restaurant.deleteOne();

    res.json({
      success: true,
      message: 'Restaurant deleted successfully'
    });

  } catch (error) {
    console.error('Delete restaurant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete restaurant'
    });
  }
};

// Helper function to determine restaurant status
const getRestaurantStatus = (restaurant) => {
  if (!restaurant.isVerified) return 'pending';
  if (!restaurant.isActive && restaurant.isVerified) return 'suspended';
  if (!restaurant.isActive) return 'inactive';
  return 'active';
};

// @desc    Get restaurant status statistics
// @route   GET /api/v1/superadmin/restaurants/status/stats
// @access  Private (Super Admin)
export const getRestaurantStatusStats = async (req, res) => {
  try {
    const stats = await RestaurantUser.aggregate([
      {
        $group: {
          _id: null,
          totalRestaurants: { $sum: 1 },
          activeRestaurants: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          openRestaurants: {
            $sum: { $cond: [{ $eq: ['$isOpen', true] }, 1, 0] }
          },
          closedRestaurants: {
            $sum: { $cond: [{ $eq: ['$isOpen', false] }, 1, 0] }
          },
          verifiedRestaurants: {
            $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] }
          },
          pendingRestaurants: {
            $sum: { $cond: [{ $eq: ['$isVerified', false] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalRestaurants: 0,
      activeRestaurants: 0,
      openRestaurants: 0,
      closedRestaurants: 0,
      verifiedRestaurants: 0,
      pendingRestaurants: 0
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get restaurant status stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurant status statistics'
    });
  }
};

export default {
  getAllRestaurants,
  createRestaurant,
  generateRestaurantCredentials,
  updateRestaurantStatus,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantStatusStats
};
