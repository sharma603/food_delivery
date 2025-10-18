import RestaurantUser from '../models/RestaurantUser.js';
import Restaurant from '../models/Restaurant.js';
import AdminUser from '../models/Admin.js';

// @desc    Get restaurants for verification
// @route   GET /api/admin/restaurants/verification
// @access  Private (Admin)
export const getRestaurantsForVerification = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;

    // Build query
    const query = {};
    if (status !== 'all') {
      query.verificationStatus = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get restaurants with pagination
    const restaurants = await RestaurantUser.find(query)
      .select('-password -securityAnswer')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('verifiedBy', 'name adminId');

    // Get total count for pagination
    const total = await RestaurantUser.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: restaurants,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    console.error('Get restaurants for verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching restaurants'
    });
  }
};

// @desc    Get single restaurant for verification
// @route   GET /api/admin/restaurants/verification/:id
// @access  Private (Admin)
export const getRestaurantForVerification = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await RestaurantUser.findById(id)
      .select('-password -securityAnswer')
      .populate('verifiedBy', 'name adminId email');

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
    console.error('Get restaurant for verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching restaurant details'
    });
  }
};

// @desc    Verify restaurant (approve/reject)
// @route   PUT /api/admin/restaurants/verification/:id
// @access  Private (Admin)
export const verifyRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body;

    // Validation
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid action (approve/reject)'
      });
    }

    if (action === 'reject' && !rejectionReason?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide rejection reason'
      });
    }

    const restaurant = await RestaurantUser.findById(id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Check if already verified
    if (restaurant.verificationStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Restaurant is already ${restaurant.verificationStatus}`
      });
    }

    // Update restaurant status
    if (action === 'approve') {
      restaurant.verificationStatus = 'approved';
      restaurant.isVerified = true;
      restaurant.verifiedBy = req.user._id;
      restaurant.verifiedAt = new Date();
      restaurant.rejectionReason = undefined;
    } else {
      restaurant.verificationStatus = 'rejected';
      restaurant.isVerified = false;
      restaurant.rejectionReason = rejectionReason.trim();
      restaurant.rejectedBy = req.user._id;
      restaurant.rejectedAt = new Date();
    }

    await restaurant.save();

    // Update corresponding Restaurant model if it exists
    try {
      let restaurantModel = await Restaurant.findOne({ owner: restaurant._id });
      
      if (action === 'approve') {
        if (!restaurantModel) {
          // Create Restaurant model if it doesn't exist (should not happen in normal flow)
          restaurantModel = new Restaurant({
            owner: restaurant._id,
            name: restaurant.restaurantName,
            description: restaurant.description,
            email: restaurant.email,
            phone: restaurant.phone,
            address: restaurant.address,
            cuisine: restaurant.cuisine,
            businessLicense: restaurant.businessLicense,
            taxId: restaurant.taxId,
            features: restaurant.features,
            socialMedia: restaurant.socialMedia,
            openingHours: restaurant.openingHours || {
              monday: { open: '10:00', close: '22:00', isClosed: false },
              tuesday: { open: '10:00', close: '22:00', isClosed: false },
              wednesday: { open: '10:00', close: '22:00', isClosed: false },
              thursday: { open: '10:00', close: '22:00', isClosed: false },
              friday: { open: '10:00', close: '23:00', isClosed: false },
              saturday: { open: '10:00', close: '23:00', isClosed: false },
              sunday: { open: '10:00', close: '22:00', isClosed: false }
            },
            deliveryTime: restaurant.deliveryInfo?.deliveryTime || { min: 25, max: 40 },
            deliveryFee: restaurant.deliveryInfo?.deliveryFee || 0,
            minimumOrder: restaurant.deliveryInfo?.minimumOrder || 0
          });
          console.log('Created Restaurant model during approval');
        }
        
        // Update Restaurant model with ALL data from RestaurantUser
        restaurantModel.name = restaurant.restaurantName;
        restaurantModel.description = restaurant.description || '';
        restaurantModel.email = restaurant.email;
        restaurantModel.phone = restaurant.phone || '';
        restaurantModel.address = restaurant.address;
        restaurantModel.cuisine = restaurant.cuisine || [];
        restaurantModel.businessLicense = restaurant.businessLicense || '';
        restaurantModel.taxId = restaurant.taxId || '';
        restaurantModel.features = restaurant.features || ['delivery'];
        restaurantModel.socialMedia = restaurant.socialMedia || {};
        
        // Set approval status
        restaurantModel.isActive = true;
        restaurantModel.isVerified = true;
        restaurantModel.isOpen = true;
        restaurantModel.verifiedBy = req.user._id;
        restaurantModel.verifiedAt = new Date();
        
        await restaurantModel.save();
        console.log(`Updated Restaurant model with complete data sync: ${restaurant.restaurantName}`);
        console.log(`Email: ${restaurant.email}`);
        console.log(`Owner ID: ${restaurant._id}`);
        console.log(`Restaurant ID: ${restaurantModel._id}`);
        
        // Ensure menu exists
        const Menu = (await import('../models/Menu.js')).default;
        let menu = await Menu.findOne({ restaurant: restaurantModel._id });
        if (!menu) {
          menu = await Menu.create({
            restaurant: restaurantModel._id,
            categories: []
          });
          console.log(`Created menu for restaurant: ${restaurant.restaurantName}`);
        }
        
      } else {
        // Handle rejection
        if (restaurantModel) {
          restaurantModel.isActive = false;
          restaurantModel.isVerified = false;
          restaurantModel.isOpen = false;
          restaurantModel.rejectionReason = rejectionReason?.trim() || 'Restaurant rejected during verification';
          await restaurantModel.save();
          console.log(`Restaurant rejected: ${restaurant.restaurantName}`);
        }
      }
    } catch (error) {
      console.error('Error updating Restaurant model:', error);
      // Don't fail the verification if Restaurant model update fails
    }

    // Email notification to restaurant
    // NOTE: Implement email service (e.g., nodemailer, SendGrid) to notify restaurant of verification status
    // Example: await emailService.sendVerificationResult(restaurant.email, { approved, rejectionReason });

    // Get admin details for response
    const admin = await AdminUser.findById(req.user._id).select('name adminId');

    // Get updated restaurant model data for response
    let restaurantModelData = null;
    try {
      const updatedRestaurantModel = await Restaurant.findOne({ owner: restaurant._id });
      if (updatedRestaurantModel) {
        restaurantModelData = {
          _id: updatedRestaurantModel._id,
          name: updatedRestaurantModel.name,
          email: updatedRestaurantModel.email,
          phone: updatedRestaurantModel.phone,
          owner: updatedRestaurantModel.owner,
          address: updatedRestaurantModel.address,
          cuisine: updatedRestaurantModel.cuisine,
          isActive: updatedRestaurantModel.isActive,
          isVerified: updatedRestaurantModel.isVerified,
          isOpen: updatedRestaurantModel.isOpen,
          verifiedBy: updatedRestaurantModel.verifiedBy,
          verifiedAt: updatedRestaurantModel.verifiedAt,
          createdAt: updatedRestaurantModel.createdAt,
          updatedAt: updatedRestaurantModel.updatedAt
        };
      }
    } catch (error) {
      console.error('Error fetching restaurant model data:', error);
    }

    res.json({
      success: true,
      message: `Restaurant ${action === 'approve' ? 'approved' : 'rejected'} successfully${action === 'approve' ? '. Restaurant model updated with complete details.' : ''}`,
      data: {
        restaurantUser: {
          _id: restaurant._id,
          restaurantName: restaurant.restaurantName,
          verificationStatus: restaurant.verificationStatus,
          isVerified: restaurant.isVerified,
          verifiedBy: admin,
          verifiedAt: restaurant.verifiedAt,
          rejectionReason: restaurant.rejectionReason,
          rejectedAt: restaurant.rejectedAt
        },
        restaurantModel: restaurantModelData
      }
    });

  } catch (error) {
    console.error('Verify restaurant error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing verification'
    });
  }
};

// @desc    Get verification statistics
// @route   GET /api/admin/restaurants/verification/stats
// @access  Private (Admin)
export const getVerificationStats = async (req, res) => {
  try {
    const stats = await RestaurantUser.aggregate([
      {
        $group: {
          _id: '$verificationStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format stats
    const formattedStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      under_review: 0,
      total: 0
    };

    stats.forEach(stat => {
      if (formattedStats.hasOwnProperty(stat._id)) {
        formattedStats[stat._id] = stat.count;
      }
      formattedStats.total += stat.count;
    });

    // Get recent activities
    const recentActivities = await RestaurantUser.find({
      $or: [
        { verificationStatus: 'approved' },
        { verificationStatus: 'rejected' }
      ]
    })
      .select('restaurantName verificationStatus verifiedAt rejectedAt')
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('verifiedBy rejectedBy', 'name adminId');

    res.json({
      success: true,
      data: {
        stats: formattedStats,
        recentActivities
      }
    });

  } catch (error) {
    console.error('Get verification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching verification statistics'
    });
  }
};

// @desc    Bulk verify restaurants
// @route   PUT /api/admin/restaurants/verification/bulk
// @access  Private (Admin)
export const bulkVerifyRestaurants = async (req, res) => {
  try {
    const { restaurantIds, action, rejectionReason } = req.body;

    // Validation
    if (!restaurantIds || !Array.isArray(restaurantIds) || restaurantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide restaurant IDs array'
      });
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid action (approve/reject)'
      });
    }

    if (action === 'reject' && !rejectionReason?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide rejection reason for bulk rejection'
      });
    }

    // Find restaurants
    const restaurants = await RestaurantUser.find({
      _id: { $in: restaurantIds },
      verificationStatus: 'pending'
    });

    if (restaurants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No pending restaurants found with provided IDs'
      });
    }

    // Update restaurants
    const updateData = {
      verificationStatus: action === 'approve' ? 'approved' : 'rejected',
      isVerified: action === 'approve',
      updatedAt: new Date()
    };

    if (action === 'approve') {
      updateData.verifiedBy = req.user._id;
      updateData.verifiedAt = new Date();
    } else {
      updateData.rejectionReason = rejectionReason.trim();
      updateData.rejectedBy = req.user._id;
      updateData.rejectedAt = new Date();
    }

    const result = await RestaurantUser.updateMany(
      {
        _id: { $in: restaurantIds },
        verificationStatus: 'pending'
      },
      updateData
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} restaurants ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      data: {
        modifiedCount: result.modifiedCount,
        action,
        restaurantIds: restaurantIds.slice(0, result.modifiedCount)
      }
    });

  } catch (error) {
    console.error('Bulk verify restaurants error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing bulk verification'
    });
  }
};

// @desc    Update verification status (for setting under review)
// @route   PATCH /api/admin/restaurants/verification/:id/status
// @access  Private (Admin)
export const updateVerificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Validation
    const allowedStatuses = ['pending', 'under_review', 'approved', 'rejected'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid status (pending, under_review, approved, rejected)'
      });
    }

    const restaurant = await RestaurantUser.findById(id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Update status
    restaurant.verificationStatus = status;
    restaurant.reviewNotes = notes || restaurant.reviewNotes;
    restaurant.reviewedBy = req.user._id;
    restaurant.reviewedAt = new Date();

    // Set verification flag
    restaurant.isVerified = status === 'approved';

    await restaurant.save();

    res.json({
      success: true,
      message: 'Verification status updated successfully',
      data: {
        _id: restaurant._id,
        restaurantName: restaurant.restaurantName,
        verificationStatus: restaurant.verificationStatus,
        isVerified: restaurant.isVerified,
        reviewNotes: restaurant.reviewNotes,
        reviewedAt: restaurant.reviewedAt
      }
    });

  } catch (error) {
    console.error('Update verification status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating verification status'
    });
  }
};