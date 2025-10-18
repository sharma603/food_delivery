import Restaurant from '../../models/Restaurant.js';
import { asyncHandler } from '../../utils/helpers.js';

// @desc    Get restaurant settings
// @route   GET /api/v1/restaurant/settings
// @access  Private/Restaurant
export const getRestaurantSettings = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.user.restaurantId)
    .select('settings preferences');

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  res.json({
    success: true,
    data: {
      settings: restaurant.settings || {},
      preferences: restaurant.preferences || {}
    }
  });
});

// @desc    Update restaurant settings
// @route   PUT /api/v1/restaurant/settings
// @access  Private/Restaurant
export const updateRestaurantSettings = asyncHandler(async (req, res) => {
  const { settings } = req.body;

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.user.restaurantId,
    { settings },
    { new: true }
  ).select('-password');

  res.json({
    success: true,
    data: restaurant,
    message: 'Settings updated successfully'
  });
});

// @desc    Update password
// @route   PUT /api/v1/restaurant/settings/password
// @access  Private/Restaurant
export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const restaurant = await Restaurant.findById(req.user.restaurantId).select('+password');

  if (!(await restaurant.comparePassword(currentPassword))) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  restaurant.password = newPassword;
  await restaurant.save();

  res.json({
    success: true,
    message: 'Password updated successfully'
  });
});

// @desc    Update notification settings
// @route   PUT /api/v1/restaurant/settings/notifications
// @access  Private/Restaurant
export const updateNotificationSettings = asyncHandler(async (req, res) => {
  const { notifications } = req.body;

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.user.restaurantId,
    { 'preferences.notifications': notifications },
    { new: true }
  );

  res.json({
    success: true,
    data: restaurant.preferences.notifications,
    message: 'Notification settings updated successfully'
  });
});

// @desc    Get restaurant preferences
// @route   GET /api/v1/restaurant/settings/preferences
// @access  Private/Restaurant
export const getRestaurantPreferences = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.user.restaurantId)
    .select('preferences');

  res.json({
    success: true,
    data: restaurant.preferences || {}
  });
});

// @desc    Update restaurant preferences
// @route   PUT /api/v1/restaurant/settings/preferences
// @access  Private/Restaurant
export const updateRestaurantPreferences = asyncHandler(async (req, res) => {
  const { preferences } = req.body;

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.user.restaurantId,
    { preferences },
    { new: true }
  );

  res.json({
    success: true,
    data: restaurant.preferences,
    message: 'Preferences updated successfully'
  });
});

// @desc    Get restaurant security
// @route   GET /api/v1/restaurant/settings/security
// @access  Private/Restaurant
export const getRestaurantSecurity = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.user.restaurantId)
    .select('lastLogin loginCount twoFactorEnabled');

  res.json({
    success: true,
    data: {
      lastLogin: restaurant.lastLogin,
      loginCount: restaurant.loginCount,
      twoFactorEnabled: restaurant.twoFactorEnabled || false
    }
  });
});

// @desc    Update restaurant security
// @route   PUT /api/v1/restaurant/settings/security
// @access  Private/Restaurant
export const updateRestaurantSecurity = asyncHandler(async (req, res) => {
  const { twoFactorEnabled } = req.body;

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.user.restaurantId,
    { twoFactorEnabled },
    { new: true }
  );

  res.json({
    success: true,
    data: { twoFactorEnabled: restaurant.twoFactorEnabled },
    message: 'Security settings updated successfully'
  });
});
