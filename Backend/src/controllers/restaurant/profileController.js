import Restaurant from '../../models/Restaurant.js';
import { asyncHandler } from '../../utils/helpers.js';

// @desc    Get restaurant profile
// @route   GET /api/v1/restaurant/profile
// @access  Private/Restaurant
export const getRestaurantProfile = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.user.restaurantId)
    .select('-password');

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
});

// @desc    Update restaurant profile
// @route   PUT /api/v1/restaurant/profile
// @access  Private/Restaurant
export const updateRestaurantProfile = asyncHandler(async (req, res) => {
  const updateData = req.body;

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.user.restaurantId,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  res.json({
    success: true,
    data: restaurant,
    message: 'Profile updated successfully'
  });
});

// @desc    Update restaurant settings
// @route   PUT /api/v1/restaurant/profile/settings
// @access  Private/Restaurant
export const updateRestaurantSettings = asyncHandler(async (req, res) => {
  const { settings } = req.body;

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.user.restaurantId,
    { settings },
    { new: true }
  ).select('-password');

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  res.json({
    success: true,
    data: restaurant,
    message: 'Settings updated successfully'
  });
});

// @desc    Upload restaurant image
// @route   POST /api/v1/restaurant/profile/image
// @access  Private/Restaurant
export const uploadRestaurantImage = asyncHandler(async (req, res) => {
  // In a real implementation, you would handle file upload here
  const { imageUrl } = req.body;

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.user.restaurantId,
    { image: imageUrl },
    { new: true }
  ).select('-password');

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  res.json({
    success: true,
    data: restaurant,
    message: 'Image uploaded successfully'
  });
});

// @desc    Get restaurant statistics
// @route   GET /api/v1/restaurant/profile/stats
// @access  Private/Restaurant
export const getRestaurantStats = asyncHandler(async (req, res) => {
  const restaurantId = req.user.restaurantId;

  // In a real implementation, you would calculate actual stats
  const stats = {
    totalOrders: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalReviews: 0,
    monthlyRevenue: 0
  };

  res.json({
    success: true,
    data: stats
  });
});

// @desc    Update restaurant hours
// @route   PUT /api/v1/restaurant/profile/hours
// @access  Private/Restaurant
export const updateRestaurantHours = asyncHandler(async (req, res) => {
  const { hours } = req.body;

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.user.restaurantId,
    { hours },
    { new: true }
  ).select('-password');

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  res.json({
    success: true,
    data: restaurant,
    message: 'Hours updated successfully'
  });
});

// @desc    Update restaurant location
// @route   PUT /api/v1/restaurant/profile/location
// @access  Private/Restaurant
export const updateRestaurantLocation = asyncHandler(async (req, res) => {
  const { address, coordinates } = req.body;

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.user.restaurantId,
    { address, coordinates },
    { new: true }
  ).select('-password');

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  res.json({
    success: true,
    data: restaurant,
    message: 'Location updated successfully'
  });
});
