/**
 * Navigation helper functions to prevent navigation errors
 */

export const safeGoBack = (navigation, fallbackScreen = 'Dashboard') => {
  if (navigation.canGoBack()) {
    navigation.goBack();
  } else {
    // Navigate to fallback screen if no previous screen exists
    navigation.navigate(fallbackScreen);
  }
};

export const safeGoBackToHome = (navigation) => {
  safeGoBack(navigation, 'Dashboard');
};

export const safeGoBackToRestaurants = (navigation) => {
  safeGoBack(navigation, 'RestaurantScreen');
};
