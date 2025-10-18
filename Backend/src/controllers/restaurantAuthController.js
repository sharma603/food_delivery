import jwt from 'jsonwebtoken';
import RestaurantUser from '../models/RestaurantUser.js';
import Restaurant from '../models/Restaurant.js';
import RestaurantStatus from '../models/RestaurantStatus.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id, type: 'restaurant' }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};


// @access  Public
export const restaurantRegister = async (req, res) => {
  try {
    const {
      email,
      password,
      restaurantName,
      ownerName,
      phone,
      description,
      website,
      address,
      businessLicense,
      taxId,
      registrationNumber,
      establishedYear,
      cuisineType,
      operatingHours,
      deliveryRadius,
      minimumOrder,
      deliveryFee,
      estimatedDeliveryTime,
      securityQuestion,
      securityAnswer,
      marketingConsent
    } = req.body;

    // Parse JSON fields if they're strings
    let parsedAddress = address;
    let parsedCuisineType = cuisineType;
    let parsedOperatingHours = operatingHours;

    try {
      if (typeof address === 'string') parsedAddress = JSON.parse(address);
      if (typeof cuisineType === 'string') parsedCuisineType = JSON.parse(cuisineType);
      if (typeof operatingHours === 'string') parsedOperatingHours = JSON.parse(operatingHours);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON format in request data'
      });
    }

    // Validation
    if (!email || !password || !restaurantName || !ownerName || !phone || !taxId || !registrationNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: email, password, restaurantName, ownerName, phone, taxId, registrationNumber'
      });
    }

    if (!parsedAddress || !parsedAddress.street || !parsedAddress.city || !parsedAddress.state || !parsedAddress.zipCode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide complete address information'
      });
    }

    if (!parsedCuisineType || parsedCuisineType.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one cuisine type'
      });
    }

    if (!securityQuestion || !securityAnswer) {
      return res.status(400).json({
        success: false,
        message: 'Please provide security question and answer'
      });
    }

    // Check for uploaded files
    const files = req.files || {};
    if (!files.businessLicense || !files.foodSafetyLicense || !files.ownerIdProof) {
      return res.status(400).json({
        success: false,
        message: 'Please upload all required documents: business license, food safety license, and owner ID proof'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if restaurant already exists
    const existingRestaurant = await RestaurantUser.findOne({
      $or: [
        { email: email.toLowerCase() },
        { taxId: taxId },
        { registrationNumber: registrationNumber }
      ]
    });

    if (existingRestaurant) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant with this email, tax ID, or registration number already exists'
      });
    }

    // Handle file uploads (store file paths or upload to cloud storage)
    const documentPaths = {
      businessLicense: files.businessLicense[0].path || files.businessLicense[0].filename,
      foodSafetyLicense: files.foodSafetyLicense[0].path || files.foodSafetyLicense[0].filename,
      ownerIdProof: files.ownerIdProof[0].path || files.ownerIdProof[0].filename
    };

    // Create restaurant
    const restaurantData = {
      email: email.toLowerCase().trim(),
      password,
      restaurantName: restaurantName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      description: description?.trim(),
      website: website?.trim(),
      address: parsedAddress,
      taxId: taxId.trim(),
      registrationNumber: registrationNumber.trim(),
      establishedYear,
      cuisine: parsedCuisineType,
      openingHours: parsedOperatingHours || {
        monday: { open: '09:00', close: '22:00', closed: false },
        tuesday: { open: '09:00', close: '22:00', closed: false },
        wednesday: { open: '09:00', close: '22:00', closed: false },
        thursday: { open: '09:00', close: '22:00', closed: false },
        friday: { open: '09:00', close: '22:00', closed: false },
        saturday: { open: '09:00', close: '22:00', closed: false },
        sunday: { open: '09:00', close: '22:00', closed: false }
      },
      deliveryInfo: {
        deliveryTime: { min: 20, max: estimatedDeliveryTime || 45 },
        deliveryFee: deliveryFee || 0,
        minimumOrder: minimumOrder || 0,
        deliveryRadius: deliveryRadius || 5
      },
      features: ['delivery', 'pickup'],
      documents: documentPaths,
      securityQuestion: securityQuestion?.trim(),
      securityAnswer: securityAnswer?.trim(),
      marketingConsent: marketingConsent === 'true' || marketingConsent === true,
      verificationStatus: 'pending',
      isVerified: false,
      isActive: true,
      submittedAt: new Date()
    };

    const restaurantUser = await RestaurantUser.create(restaurantData);

    // Create Restaurant model for API functionality
    const restaurantModel = await Restaurant.create({
      name: restaurantData.restaurantName,
      description: restaurantData.description,
      owner: restaurantUser._id, // References RestaurantUser
      email: restaurantData.email,
      phone: restaurantData.phone,
      address: restaurantData.address,
      cuisine: restaurantData.cuisine,
      openingHours: restaurantData.openingHours,
      deliveryTime: restaurantData.deliveryInfo.deliveryTime,
      deliveryFee: restaurantData.deliveryInfo.deliveryFee,
      minimumOrder: restaurantData.deliveryInfo.minimumOrder,
      businessLicense: restaurantData.taxId,
      taxId: restaurantData.taxId,
      features: restaurantData.features,
      socialMedia: { website: restaurantData.website },
      isActive: false, // Set to inactive until approved
      isVerified: false, // Requires admin verification
      isOpen: false, // Closed until approved
      rating: { average: 0, count: 0 }
    });

    // Create empty menu for the restaurant
    await Menu.create({
      restaurant: restaurantModel._id,
      categories: []
    });

    // Generate token
    const token = generateToken(restaurantUser._id);

    res.status(201).json({
      success: true,
      message: 'Restaurant registration successful! Your restaurant is pending verification. Admin will review and approve your account before you can add menu items.',
      data: {
        restaurantUser: {
          _id: restaurantUser._id,
          email: restaurantUser.email,
          restaurantName: restaurantUser.restaurantName,
          ownerName: restaurantUser.ownerName,
          phone: restaurantUser.phone,
          description: restaurantUser.description,
          website: restaurantUser.website,
          address: restaurantUser.address,
          cuisine: restaurantUser.cuisine,
          deliveryInfo: restaurantUser.deliveryInfo,
          verificationStatus: restaurantUser.verificationStatus,
          isVerified: restaurantUser.isVerified,
          submittedAt: restaurantUser.submittedAt,
          registrationId: restaurantUser._id.toString().toUpperCase().substr(0, 8)
        },
        restaurant: {
          _id: restaurantModel._id,
          name: restaurantModel.name,
          isActive: restaurantModel.isActive,
          isVerified: restaurantModel.isVerified,
          isOpen: restaurantModel.isOpen
        },
        token
      }
    });

  } catch (error) {
    console.error('Restaurant registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Restaurant login
// @route   POST /api/restaurant/auth/login
// @access  Public
export const restaurantLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find restaurant by email and include password field
    const restaurant = await RestaurantUser.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!restaurant) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (restaurant.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.'
      });
    }

    // Check if restaurant is active
    if (!restaurant.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.'
      });
    }

    // Check password
    const isPasswordMatch = await restaurant.comparePassword(password);

    if (!isPasswordMatch) {
      await restaurant.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update login info
    await restaurant.updateLoginInfo();

    // Create response data
    const responseData = {
      _id: restaurant._id,
      email: restaurant.email,
      restaurantName: restaurant.restaurantName,
      ownerName: restaurant.ownerName,
      phone: restaurant.phone,
      description: restaurant.description,
      address: restaurant.address,
      fullAddress: restaurant.fullAddress,
      cuisine: restaurant.cuisine,
      deliveryInfo: restaurant.deliveryInfo,
      features: restaurant.features,
      images: restaurant.images,
      socialMedia: restaurant.socialMedia,
      openingHours: restaurant.openingHours,
      rating: restaurant.rating,
      totalOrders: restaurant.totalOrders,
      totalRevenue: restaurant.totalRevenue,
      averageOrderValue: restaurant.averageOrderValue,
      businessAge: restaurant.businessAge,
      isVerified: restaurant.isVerified,
      verificationStatus: restaurant.verificationStatus,
      isOpen: restaurant.isOpen,
      notifications: restaurant.notifications,
      token: generateToken(restaurant._id)
    };

    res.json({
      success: true,
      message: 'Restaurant login successful',
      data: responseData
    });

  } catch (error) {
    console.error('Restaurant login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get current restaurant profile
// @route   GET /api/restaurant/auth/me
// @access  Private (Restaurant)
export const getRestaurantProfile = async (req, res) => {
  try {
    const restaurant = await RestaurantUser.findById(req.user._id)
      .populate('verifiedBy', 'name adminId');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    res.json({
      success: true,
      data: {
        _id: restaurant._id,
        email: restaurant.email,
        restaurantName: restaurant.restaurantName,
        ownerName: restaurant.ownerName,
        phone: restaurant.phone,
        description: restaurant.description,
        address: restaurant.address,
        fullAddress: restaurant.fullAddress,
        businessLicense: restaurant.businessLicense,
        taxId: restaurant.taxId,
        establishedYear: restaurant.establishedYear,
        businessAge: restaurant.businessAge,
        cuisine: restaurant.cuisine,
        openingHours: restaurant.openingHours,
        deliveryInfo: restaurant.deliveryInfo,
        features: restaurant.features,
        images: restaurant.images,
        socialMedia: restaurant.socialMedia,
        rating: restaurant.rating,
        totalOrders: restaurant.totalOrders,
        totalRevenue: restaurant.totalRevenue,
        averageOrderValue: restaurant.averageOrderValue,
        isVerified: restaurant.isVerified,
        verificationStatus: restaurant.verificationStatus,
        verifiedBy: restaurant.verifiedBy,
        verifiedAt: restaurant.verifiedAt,
        rejectionReason: restaurant.rejectionReason,
        isOpen: restaurant.isOpen,
        notifications: restaurant.notifications,
        createdAt: restaurant.createdAt,
        updatedAt: restaurant.updatedAt
      }
    });

  } catch (error) {
    console.error('Get restaurant profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
};

// @desc    Update restaurant profile
// @route   PUT /api/restaurant/auth/profile
// @access  Private (Restaurant)
export const updateRestaurantProfile = async (req, res) => {
  try {
    const {
      restaurantName,
      ownerName,
      phone,
      description,
      address,
      cuisine,
      openingHours,
      deliveryInfo,
      features,
      socialMedia,
      notifications
    } = req.body;

    const restaurant = await RestaurantUser.findById(req.user._id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Update allowed fields
    if (restaurantName) restaurant.restaurantName = restaurantName.trim();
    if (ownerName) restaurant.ownerName = ownerName.trim();
    if (phone) restaurant.phone = phone;
    if (description) restaurant.description = description.trim();
    if (address) restaurant.address = { ...restaurant.address, ...address };
    if (cuisine) restaurant.cuisine = cuisine;
    if (openingHours) restaurant.openingHours = { ...restaurant.openingHours, ...openingHours };
    if (deliveryInfo) restaurant.deliveryInfo = { ...restaurant.deliveryInfo, ...deliveryInfo };
    if (features) restaurant.features = features;
    if (socialMedia) restaurant.socialMedia = { ...restaurant.socialMedia, ...socialMedia };
    if (notifications) restaurant.notifications = { ...restaurant.notifications, ...notifications };

    await restaurant.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: restaurant._id,
        restaurantName: restaurant.restaurantName,
        ownerName: restaurant.ownerName,
        phone: restaurant.phone,
        description: restaurant.description,
        address: restaurant.address,
        cuisine: restaurant.cuisine,
        openingHours: restaurant.openingHours,
        deliveryInfo: restaurant.deliveryInfo,
        features: restaurant.features,
        socialMedia: restaurant.socialMedia,
        notifications: restaurant.notifications
      }
    });

  } catch (error) {
    console.error('Update restaurant profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
};

// @desc    Change restaurant password
// @route   PUT /api/restaurant/auth/change-password
// @access  Private (Restaurant)
export const changeRestaurantPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const restaurant = await RestaurantUser.findById(req.user._id).select('+password');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Check current password
    const isCurrentPasswordValid = await restaurant.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Set new password
    restaurant.password = newPassword;
    await restaurant.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change restaurant password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error changing password'
    });
  }
};

// @desc    Initialize restaurant status record (for existing restaurants)
// @route   POST /api/restaurant/auth/init-status
// @access  Private (Restaurant)
export const initializeRestaurantStatus = async (req, res) => {
  try {
    const restaurantId = req.user._id;
    
    // Check if restaurant exists
    const restaurant = await RestaurantUser.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Check if status record already exists
    const existingStatus = await RestaurantStatus.findOne({
      restaurant: restaurantId,
      isActive: true
    });

    if (existingStatus) {
      return res.json({
        success: true,
        message: 'Status record already exists',
        data: {
          isOpen: restaurant.isOpen,
          statusId: existingStatus._id
        }
      });
    }

    // Create initial status record
    const statusRecord = await RestaurantStatus.create({
      restaurant: restaurantId,
      status: restaurant.isOpen ? 'open' : 'closed',
      changedBy: restaurantId,
      reason: 'Initial status record created',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Status record initialized successfully',
      data: {
        isOpen: restaurant.isOpen,
        statusId: statusRecord._id
      }
    });

  } catch (error) {
    console.error('Initialize restaurant status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error initializing status'
    });
  }
};

// @desc    Toggle restaurant open/close status
// @route   PUT /api/restaurant/auth/toggle-status
// @access  Private (Restaurant)
export const toggleRestaurantStatus = async (req, res) => {
  try {
    const { reason } = req.body;
    const restaurantId = req.user._id;
    
    // First, get the current restaurant to know the current status
    const currentRestaurant = await RestaurantUser.findById(restaurantId);
    
    if (!currentRestaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Toggle the status
    const newStatus = !currentRestaurant.isOpen;
    
    // Update the restaurant status
    const restaurant = await RestaurantUser.findByIdAndUpdate(
      restaurantId,
      { $set: { isOpen: newStatus } },
      { new: true, runValidators: true }
    );

    // Check if this restaurant already has a status record
    let existingStatusRecord = await RestaurantStatus.findOne({
      restaurant: restaurantId,
      isActive: true
    });

    if (existingStatusRecord) {
      // Update existing status record instead of creating new one
      existingStatusRecord.status = newStatus ? 'open' : 'closed';
      existingStatusRecord.reason = reason || `Restaurant ${newStatus ? 'opened' : 'closed'} by owner`;
      existingStatusRecord.changedBy = restaurantId;
      existingStatusRecord.ipAddress = req.ip || req.connection.remoteAddress;
      existingStatusRecord.userAgent = req.get('User-Agent');
      existingStatusRecord.updatedAt = new Date();
      
      await existingStatusRecord.save();
    } else {
      // Create initial status record only if it doesn't exist
      const statusChangeData = {
        restaurant: restaurantId,
        status: newStatus ? 'open' : 'closed',
        changedBy: restaurantId,
        reason: reason || `Restaurant ${newStatus ? 'opened' : 'closed'} by owner`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      };

      existingStatusRecord = await RestaurantStatus.create(statusChangeData);
    }

    res.json({
      success: true,
      message: `Restaurant is now ${newStatus ? 'open' : 'closed'}`,
      data: {
        isOpen: newStatus,
        isCurrentlyOpen: restaurant.isCurrentlyOpen(),
        newStatus: newStatus ? 'open' : 'closed',
        changedAt: new Date(),
        statusId: existingStatusRecord._id,
        isInitialRecord: !existingStatusRecord.updatedAt
      }
    });

  } catch (error) {
    console.error('Toggle restaurant status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error toggling status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};