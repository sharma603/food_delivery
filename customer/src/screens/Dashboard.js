import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  RefreshControl,
  Image,
  Alert,
  Modal,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, SERVER_IP, SERVER_PORT } from '../utils/constants';
import { mobileRestaurantAPI, mobileMenuAPI } from '../services/mobileAPI';
import { useNotifications } from '../context/NotificationContext';
import { useCart } from '../context/CartContext';

const { width } = Dimensions.get('window');

const Dashboard = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [restaurantsData, setRestaurantsData] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [foodCategories, setFoodCategories] = useState([]);
  
  // Item detail modal state
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Scroll detection state
  const [scrollY, setScrollY] = useState(0);
  const [isSearchVisible, setIsSearchVisible] = useState(true);
  
  // Notification context
  const { badgeCount, clearBadgeCount, notifyPromotion } = useNotifications();
  
  // Cart context
  const { addItem, getCartItemCount, restaurants: cartRestaurants, totalItems, totalAmount } = useCart();
  
  // Debug cart state (only in development)
  useEffect(() => {
    if (__DEV__) {
      console.log('Dashboard - Cart state updated:', {
        restaurantsCount: Object.keys(cartRestaurants).length,
        totalItems: totalItems,
        totalAmount: totalAmount,
        restaurants: Object.keys(cartRestaurants).map(id => ({
          id,
          name: cartRestaurants[id].restaurant.name,
          itemsCount: cartRestaurants[id].items.length,
          subtotal: cartRestaurants[id].subtotal
        }))
      });
    }
  }, [cartRestaurants, totalItems, totalAmount]);

  const getImageSource = (item) => {
    // First priority: Check for images array from database
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      const imagePath = item.images[0];
      console.log('Using database image:', imagePath);
      // If it's already a full URL, return it
      if (imagePath.startsWith('http')) {
        return { uri: imagePath };
      }
      // If it's a relative path, construct full URL
      return { uri: `http://${SERVER_IP}:${SERVER_PORT}${imagePath}` };
    }
    
    // Second priority: Check for single image field
    if (item.image && typeof item.image === 'string' && item.image.trim() !== '') {
      console.log('Using single image field:', item.image);
      if (item.image.startsWith('http')) {
        return { uri: item.image };
      }
      return { uri: `http://${SERVER_IP}:${SERVER_PORT}${item.image}` };
    }
    
    // Third priority: Check for imageUrl field
    if (item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim() !== '') {
      console.log('Using imageUrl field:', item.imageUrl);
      if (item.imageUrl.startsWith('http')) {
        return { uri: item.imageUrl };
      }
      return { uri: `http://${SERVER_IP}:${SERVER_PORT}${item.imageUrl}` };
    }
    
    // Fourth priority: Check for imageUrl object
    if (item.imageUrl && typeof item.imageUrl === 'object' && item.imageUrl.url) {
      console.log('Using imageUrl object:', item.imageUrl.url);
      if (item.imageUrl.url.startsWith('http')) {
        return { uri: item.imageUrl.url };
      }
      return { uri: `http://${SERVER_IP}:${SERVER_PORT}${item.imageUrl.url}` };
    }
    
    // Fifth priority: Check for other image fields
    if (item.imagePath && typeof item.imagePath === 'string' && item.imagePath.trim() !== '') {
      console.log('Using imagePath field:', item.imagePath);
      if (item.imagePath.startsWith('http')) {
        return { uri: item.imagePath };
      }
      return { uri: `http://${SERVER_IP}:${SERVER_PORT}${item.imagePath}` };
    }
    
    if (item.photo && typeof item.photo === 'string' && item.photo.trim() !== '') {
      console.log('Using photo field:', item.photo);
      if (item.photo.startsWith('http')) {
        return { uri: item.photo };
      }
      return { uri: `http://${SERVER_IP}:${SERVER_PORT}${item.photo}` };
    }
    
    if (item.picture && typeof item.picture === 'string' && item.picture.trim() !== '') {
      console.log('Using picture field:', item.picture);
      if (item.picture.startsWith('http')) {
        return { uri: item.picture };
      }
      return { uri: `http://${SERVER_IP}:${SERVER_PORT}${item.picture}` };
    }
    
    // No image found
    console.log('No image found for item:', item.name);
    return null;
  };

  // Handle view item details
  const handleViewItemDetails = (item, e) => {
    if (e) e.stopPropagation();
    setSelectedItem(item);
    setCurrentImageIndex(0);
    setShowItemModal(true);
  };

  // Load menu items from database
  const loadMenuItems = async () => {
    try {
      setMenuError(null);
      setMenuLoading(true);
      console.log('🍽️ Loading menu items...');
      const response = await mobileMenuAPI.getMenuItems({ limit: 20 });
      console.log('📦 Menu items response:', response);
      
      if (response.success) {
        console.log('✅ Menu items loaded successfully:', response.data?.length || 0, 'items');
        console.log('🔍 Raw menu items data:', response.data);
        
        // Backend already filters by restaurantIsOpen=true, so no need to filter again
        // Just set the items directly
        console.log('🎯 Setting menu items directly (backend already filtered):', response.data?.length || 0, 'items');
        setMenuItems(response.data || []);
      } else {
        console.error('❌ Menu items response failed:', response.message);
        setMenuError(response.message || 'Failed to load menu items');
      }
    } catch (error) {
      console.error('❌ Error loading menu items:', error);
      setMenuError('Failed to load menu items');
    } finally {
      setMenuLoading(false);
    }
  };

  // Load restaurants from API
  const loadRestaurants = async () => {
    try {
      setError(null);
      console.log('🏪 Loading restaurants...');
      const response = await mobileRestaurantAPI.getRestaurants({ limit: 20 });
      console.log('📦 Restaurants response:', response);
      
      if (response.success) {
        console.log('✅ Restaurants loaded successfully:', response.data?.length || 0, 'restaurants');
        console.log('🔍 Raw restaurants data:', response.data);
        
        // Filter out closed restaurants (backend already filters by isOpen=true, but check isActive if present)
        const openRestaurants = (response.data || []).filter(restaurant => {
          const isOpen = restaurant.isOpen === true;
          const isActive = restaurant.isActive !== false; // Default to true if not specified
          const shouldInclude = isOpen && isActive;
          console.log(`🏪 Restaurant "${restaurant.name || restaurant.restaurantName}" - isOpen: ${restaurant.isOpen}, isActive: ${restaurant.isActive}, filtered: ${shouldInclude}`);
          return shouldInclude;
        });
        
        console.log('🎯 Filtered restaurants:', openRestaurants.length, 'restaurants');
        setRestaurantsData(openRestaurants);
        
        // Extract unique cuisines for categories from open restaurants only
        const uniqueCuisines = [...new Set(
          openRestaurants.map(restaurant => restaurant.cuisine).filter(Boolean)
        )];
        
        const categories = uniqueCuisines.map((cuisine, index) => ({
          id: index + 1,
          name: cuisine,
          icon: 'restaurant'
        }));
        
        // Add common categories
        categories.unshift({ id: 0, name: 'All', icon: 'grid' });
        setFoodCategories(categories);
      }
    } catch (err) {
      console.error('Error loading restaurants:', err);
      setError(err.message || 'Failed to load restaurants');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
    loadMenuItems();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadRestaurants(), loadMenuItems()]);
    setRefreshing(false);
  };

  // Handle scroll to hide/show search
  const handleScroll = useCallback((event) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    
    // Show search when scrolling up or at the top
    if (currentScrollY < scrollY || currentScrollY <= 0) {
      setIsSearchVisible(true);
    } 
    // Hide search when scrolling down and past threshold
    else if (currentScrollY > 100 && currentScrollY > scrollY) {
      setIsSearchVisible(false);
    }
    
    setScrollY(currentScrollY);
  }, [scrollY]);

  const renderFoodCategory = ({ item }) => (
    <TouchableOpacity 
      style={styles.categoryCard}
      onPress={() => navigation.navigate('RestaurantScreen', { cuisine: item.name })}
    >
      <View style={styles.categoryIcon}>
        <Ionicons name={item.icon} size={24} color={COLORS.PRIMARY} />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderMenuItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.menuItemCard}
      onPress={() => {
        Alert.alert('Menu Item', `${item.name}\nFrom: ${item.restaurant?.name || 'Restaurant'}\nPrice: Rs ${item.price}`, [
          { text: 'Close', style: 'cancel' },
          { text: 'View Restaurant', onPress: () => navigation.navigate('RestaurantDetailScreen', { restaurantId: item.restaurant?._id }) }
        ]);
      }}
    >
      <View style={styles.menuItemImage}>
        {getImageSource(item) ? (
          <Image 
            source={getImageSource(item)} 
            style={styles.itemImage}
            onError={() => {
              console.log('Image failed to load for item:', item.name);
            }}
          />
        ) : (
          <View style={styles.itemImage}>
            <Ionicons name="restaurant" size={40} color={COLORS.TEXT_SECONDARY} />
          </View>
        )}
        
        {/* Veg Badge overlay */}
        {item.isVegetarian !== undefined && (
          <View style={styles.vegBadge}>
            <Text style={styles.vegText}>{item.isVegetarian ? 'Veg' : 'Non-Veg'}</Text>
          </View>
        )}
        
        {/* Add to Cart Button overlay */}
        <TouchableOpacity 
          style={styles.addToCartButtonOverlay}
          onPress={(e) => {
            e.stopPropagation(); // Prevent the parent onPress from firing
            // Add item to cart
            const restaurant = {
              _id: item.restaurant?._id || 'unknown', 
              name: item.restaurant?.name || 'Unknown Restaurant',
              deliveryFee: item.restaurant?.deliveryFee || 50 
            };
            console.log('Dashboard (Horizontal) - Adding item:', {
              itemId: item._id,
              itemName: item.name,
              restaurantId: restaurant._id,
              restaurantName: restaurant.name
            });
            addItem(item, restaurant);
            Alert.alert('Added to Cart', `${item.name} has been added to your cart!`);
          }}
        >
          <Ionicons name="add" size={20} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.menuItemName} numberOfLines={2}>{item.name}</Text>
        
        {/* Description */}
        <Text style={styles.menuItemDescription} numberOfLines={2}>
          {item.description || `${item.name || 'Item'} - Delicious food`}
        </Text>
        
        {/* Price */}
        <Text style={styles.menuItemPrice}>Rs {String(item.price || 0)}</Text>
        
        {/* Availability */}
        <Text style={styles.availability}>N/A</Text>
        
        {/* Restaurant */}
        <Text style={styles.menuItemRestaurant} numberOfLines={1}>{item.restaurant?.name || 'Restaurant'}</Text>
        
        {/* Tags */}
        <View style={styles.tagsContainer}>
          {item.category && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>
                {typeof item.category === 'object' 
                  ? String(item.category?.name || item.category?.displayName || 'Category')
                  : String(item.category)
                }
              </Text>
            </View>
          )}
          {item.isVegetarian !== undefined && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'}</Text>
            </View>
          )}
          <View style={styles.tag}>
            <Text style={styles.tagText}>Active</Text>
          </View>
        </View>
        
        {/* Rating and Last Updated */}
        <View style={styles.ratingContainer}>
          {item.rating && (
            <View style={styles.menuItemRating}>
              <Ionicons name="star" size={14} color={COLORS.WARNING} />
              <Text style={styles.ratingText}>{(item.rating || 0).toFixed(1)}</Text>
            </View>
          )}
          <Text style={styles.lastUpdated}>Last updated: Today</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderRestaurant = ({ item }) => (
    <TouchableOpacity 
      style={styles.restaurantCard}
      onPress={() => navigation.navigate('RestaurantDetailScreen', { restaurantId: item._id })}
      activeOpacity={0.8}
    >
      <View style={styles.restaurantImageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.restaurantImage} />
        ) : (
          <View style={styles.restaurantImagePlaceholder}>
            <Ionicons name="restaurant" size={40} color={COLORS.TEXT_SECONDARY} />
          </View>
        )}
        
        {/* Status Badge */}
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Open</Text>
        </View>
        
        {/* Offer Badge */}
        {item?.offers && item.offers.length > 0 && (
          <View style={styles.offerBadge}>
            <Ionicons name="gift" size={12} color={COLORS.WHITE} />
            <Text style={styles.offerText}>{item.offers[0]}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.restaurantInfo}>
        <View style={styles.restaurantHeader}>
          <Text style={styles.restaurantName} numberOfLines={1}>{item?.name || 'Restaurant'}</Text>
          <View style={styles.favoriteButton}>
            <Ionicons name="heart-outline" size={16} color={COLORS.TEXT_SECONDARY} />
          </View>
        </View>
        
        <Text style={styles.restaurantCuisine} numberOfLines={1}>
          {item?.cuisine || 'Cuisine'}
        </Text>
        
        <View style={styles.restaurantStats}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color={COLORS.RATING_COLOR} />
            <Text style={styles.rating}>
              {typeof item?.rating?.average === 'number' && item.rating.average > 0 
                ? item.rating.average.toFixed(1) 
                : 'New'
              }
            </Text>
          </View>
          
          <View style={styles.deliveryInfo}>
            <Ionicons name="time-outline" size={12} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.deliveryTime}>
              {typeof item?.deliveryTime?.min === 'number' ? item.deliveryTime.min : 25} min
            </Text>
          </View>
        </View>
        
        <View style={styles.restaurantFooter}>
          <Text style={styles.deliveryFee}>
            Rs {typeof item?.deliveryFee === 'number' ? item.deliveryFee : 50} delivery
          </Text>
          <TouchableOpacity 
            style={styles.viewMenuButton}
            onPress={() => navigation.navigate('RestaurantMenuScreen', { 
              restaurantId: item._id,
              restaurantName: item.name 
            })}
          >
            <Text style={styles.viewMenuText}>View Menu</Text>
            <Ionicons name="arrow-forward" size={12} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render function for grid layout (ALL Menu section)
  const renderMenuItemGrid = ({ item }) => (
    <TouchableOpacity
      style={styles.menuItemCardGrid}
      onPress={() => {
        handleViewItemDetails(item);
      }}
      activeOpacity={0.8}
    >
      <View style={styles.menuItemImageContainer}>
        {getImageSource(item) ? (
          <Image 
            source={getImageSource(item)} 
            style={styles.menuItemImage}
            onError={() => {
              console.log('Image failed to load for item:', item.name);
            }}
          />
        ) : (
          <View style={styles.menuItemImagePlaceholder}>
            <Ionicons name="restaurant" size={40} color={COLORS.TEXT_SECONDARY} />
          </View>
        )}
        
        {/* Veg Badge overlay */}
        {item.isVegetarian !== undefined && (
          <View style={styles.vegBadge}>
            <Ionicons 
              name={item.isVegetarian ? "leaf" : "nutrition"} 
              size={10} 
              color={item.isVegetarian ? "#4CAF50" : "#F44336"} 
            />
            <Text style={styles.vegText}>{item.isVegetarian ? 'Veg' : 'Non-Veg'}</Text>
          </View>
        )}
        
        {/* Popular Badge */}
        {item.orderCount > 10 && (
          <View style={styles.popularBadge}>
            <Ionicons name="flame" size={10} color={COLORS.WHITE} />
            <Text style={styles.popularText}>Popular</Text>
          </View>
        )}
      </View>
      
      <View style={styles.menuItemCardContent}>
        <View style={styles.menuItemHeader}>
          <Text style={styles.menuItemName} numberOfLines={2}>{item.name}</Text>
          <View style={styles.menuItemActions}>
            <TouchableOpacity 
              style={styles.viewItemButton}
              onPress={(e) => handleViewItemDetails(item, e)}
            >
              <Ionicons name="eye-outline" size={16} color="#FF6B35" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addToCartButton}
              onPress={() => {
                // Add item to cart
                const restaurant = {
                  _id: item.restaurant?._id || 'unknown', 
                  name: item.restaurant?.name || 'Unknown Restaurant',
                  deliveryFee: item.restaurant?.deliveryFee || 50 
                };
                console.log('Dashboard (Grid) - Adding item:', {
                  itemId: item._id,
                  itemName: item.name,
                  restaurantId: restaurant._id,
                  restaurantName: restaurant.name
                });
                addItem(item, restaurant);
                Alert.alert('Added to Cart', `${item.name} has been added to your cart!`);
              }}
            >
              <Ionicons name="add" size={16} color={COLORS.PRIMARY} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Description */}
        <Text style={styles.menuItemDescription} numberOfLines={2}>
          {item.description || `${item.name || 'Item'} - Delicious food`}
        </Text>
        
        {/* Restaurant */}
        <View style={styles.restaurantInfo}>
          <Ionicons name="storefront-outline" size={12} color={COLORS.TEXT_SECONDARY} />
          <Text style={styles.menuItemRestaurant} numberOfLines={1}>
            {item.restaurant?.name || 'Restaurant'}
          </Text>
        </View>
        
        {/* Price and Rating */}
        <View style={styles.menuItemFooter}>
          <Text style={styles.menuItemPrice}>Rs {String(item.price || 0)}</Text>
          {item.rating > 0 && (
            <View style={styles.menuItemRating}>
              <Ionicons name="star" size={12} color={COLORS.RATING_COLOR} />
              <Text style={styles.menuItemRatingText}>{item.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
        
        {/* Tags */}
        {item.category && (
          <View style={styles.menuItemTag}>
            <Text style={styles.menuItemTagText}>
              {typeof item.category === 'object' 
                ? String(item.category?.name || item.category?.displayName || 'Category')
                : String(item.category)
              }
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading && restaurantsData.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading restaurants...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Header */}
      <View style={[styles.header, !isSearchVisible && styles.headerCollapsed]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerGreeting}>Good evening!</Text>
            <Text style={styles.headerTitle}>FoodHub</Text>
            <Text style={styles.headerSubtitle}>What would you like to eat today?</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.cartButton}
              onPress={() => {
                // Navigate to cart screen
                navigation.navigate('CartScreen');
              }}
            >
              <Ionicons name="cart-outline" size={20} color="#f0f6fc" />
              {getCartItemCount() > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {getCartItemCount() > 99 ? '99+' : getCartItemCount().toString()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => {
                // Clear badge count when notification button is pressed
                clearBadgeCount();
                // Navigate to notifications screen
                navigation.navigate('NotificationsScreen');
              }}
            >
              <Ionicons name="notifications-outline" size={20} color="#f0f6fc" />
              {badgeCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {badgeCount > 99 ? '99+' : badgeCount.toString()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Search Bar in Header - Hide on scroll */}
        {isSearchVisible && (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search-outline" size={18} color={COLORS.TEXT_LIGHT} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search menu & restaurants..."
                placeholderTextColor={COLORS.TEXT_LIGHT}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={18} color={COLORS.TEXT_LIGHT} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Enhanced Quick Search Suggestions */}
      <View style={styles.quickSearchContainer}>
        <View style={styles.quickSearchHeader}>
          <FontAwesome5 name="fire" size={16} color={COLORS.PRIMARY} />
          <Text style={styles.quickSearchText}>Popular Categories</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
          <TouchableOpacity style={styles.suggestionChip} onPress={() => setSearchQuery('Pizza')}>
            <View style={styles.suggestionContent}>
              <FontAwesome5 name="pizza-slice" size={12} color={COLORS.PRIMARY} />
              <Text style={styles.suggestionText}>Pizza</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.suggestionChip} onPress={() => setSearchQuery('Burger')}>
            <View style={styles.suggestionContent}>
              <FontAwesome5 name="hamburger" size={12} color={COLORS.PRIMARY} />
              <Text style={styles.suggestionText}>Burger</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.suggestionChip} onPress={() => setSearchQuery('Curry')}>
            <View style={styles.suggestionContent}>
              <FontAwesome5 name="utensils" size={12} color={COLORS.PRIMARY} />
              <Text style={styles.suggestionText}>Curry</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.suggestionChip} onPress={() => setSearchQuery('Pasta')}>
            <View style={styles.suggestionContent}>
              <FontAwesome5 name="utensils" size={12} color={COLORS.PRIMARY} />
              <Text style={styles.suggestionText}>Pasta</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.suggestionChip} onPress={() => setSearchQuery('Sushi')}>
            <View style={styles.suggestionContent}>
              <FontAwesome5 name="fish" size={12} color={COLORS.PRIMARY} />
              <Text style={styles.suggestionText}>Sushi</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.suggestionChip} onPress={() => setSearchQuery('Fried Rice')}>
            <View style={styles.suggestionContent}>
              <FontAwesome5 name="utensils" size={12} color={COLORS.PRIMARY} />
              <Text style={styles.suggestionText}>Fried Rice</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.suggestionChip} onPress={() => setSearchQuery('Tacos')}>
            <View style={styles.suggestionContent}>
              <FontAwesome5 name="hamburger" size={12} color={COLORS.PRIMARY} />
              <Text style={styles.suggestionText}>Tacos</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.suggestionChip} onPress={() => setSearchQuery('Sandwich')}>
            <View style={styles.suggestionContent}>
              <FontAwesome5 name="bread-slice" size={12} color={COLORS.PRIMARY} />
              <Text style={styles.suggestionText}>Sandwich</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>


      <ScrollView 
        style={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={40} color={COLORS.ERROR} />
            <Text style={styles.errorText}>{String(error || 'An error occurred')}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadRestaurants}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Enhanced Quick Actions Banner */}
        <View style={styles.quickActionsBanner}>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate('RestaurantScreen')}>
            <View style={styles.quickActionIconContainer}>
              <Ionicons name="restaurant" size={24} color={COLORS.WHITE} />
            </View>
            <Text style={styles.quickActionText}>Browse Restaurants</Text>
            <Text style={styles.quickActionSubtext}>Find your favorite</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionButton} 
            onPress={() => {
              // Test notification
              notifyPromotion('Special Offer!', 'Get 20% off on your first order');
              navigation.navigate('OffersScreen');
            }}
          >
            <View style={styles.quickActionIconContainer}>
              <Ionicons name="gift" size={24} color={COLORS.WHITE} />
            </View>
            <Text style={styles.quickActionText}>Offers & Deals</Text>
            <Text style={styles.quickActionSubtext}>Save more today</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <FontAwesome5 name="utensils" size={18} color={COLORS.PRIMARY} />
            <Text style={styles.sectionTitleText}>Popular Menu Items</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Delicious dishes from our restaurants</Text>
          
          {menuLoading ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="restaurant-outline" size={40} color={COLORS.TEXT_SECONDARY} />
              <Text style={styles.loadingText}>Loading menu items...</Text>
            </View>
          ) : menuError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={40} color={COLORS.ERROR} />
              <Text style={styles.errorText}>{String(menuError || 'An error occurred')}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadMenuItems}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : menuItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={60} color={COLORS.TEXT_SECONDARY} />
              <Text style={styles.emptyText}>No menu items available</Text>
            </View>
          ) : (
            <FlatList
              data={menuItems.slice(0, 10)}
              renderItem={renderMenuItem}
              keyExtractor={(item) => item._id?.toString() || item.id?.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.menuList}
            />
          )}
        </View>

        {/* ALL Menu Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <View style={styles.sectionTitleContainer}>
                <FontAwesome5 name="utensils" size={18} color={COLORS.PRIMARY} />
                <Text style={styles.sectionTitleText}>ALL Menu Items</Text>
              </View>
              <Text style={styles.sectionSubtitle}>Every dish from every restaurant</Text>
            </View>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('BrowseScreen')}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.PRIMARY} />
            </TouchableOpacity>
          </View>
          
          {menuLoading ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="restaurant-outline" size={40} color={COLORS.TEXT_SECONDARY} />
              <Text style={styles.loadingText}>Loading all menu items...</Text>
            </View>
          ) : menuError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={40} color={COLORS.ERROR} />
              <Text style={styles.errorText}>{String(menuError || 'An error occurred')}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadMenuItems}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : menuItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={60} color={COLORS.TEXT_SECONDARY} />
              <Text style={styles.emptyText}>No menu items available</Text>
            </View>
          ) : (
            <FlatList
              data={menuItems}
              renderItem={renderMenuItemGrid}
              keyExtractor={(item) => item._id?.toString() || item.id?.toString()}
              numColumns={2}
              scrollEnabled={false}
              contentContainerStyle={styles.allMenuList}
              columnWrapperStyle={styles.menuRow}
            />
          )}
        </View>

        {/* Restaurants Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <FontAwesome5 name="store" size={18} color={COLORS.PRIMARY} />
            <Text style={styles.sectionTitleText}>Restaurants Near You</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Discover local favorites</Text>
          {restaurantsData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={60} color={COLORS.TEXT_SECONDARY} />
              <Text style={styles.emptyText}>No restaurants available</Text>
            </View>
          ) : (
            <View style={styles.restaurantGridContainer}>
              {restaurantsData.map((item) => (
                <View key={item._id?.toString() || item.id?.toString()} style={{ width: '50%' }}>
                  {renderRestaurant({ item })}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Item Detail Modal */}
      <Modal
        visible={showItemModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowItemModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.itemModalContainer}>
            {/* Header */}
            <View style={styles.itemModalHeader}>
              <Text style={styles.itemModalTitle}>Item Details</Text>
              <TouchableOpacity 
                style={styles.closeModalButton}
                onPress={() => setShowItemModal(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.TEXT_PRIMARY} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.itemModalContent} showsVerticalScrollIndicator={false}>
              {selectedItem && (
                <>
                  {/* Image Gallery */}
                  {selectedItem.images && selectedItem.images.length > 0 ? (
                    <View style={styles.imageGalleryContainer}>
                      <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={(e) => {
                          const index = Math.round(e.nativeEvent.contentOffset.x / width);
                          setCurrentImageIndex(index);
                        }}
                        scrollEventThrottle={16}
                      >
                        {selectedItem.images.map((image, index) => (
                          <Image
                            key={index}
                            source={{ uri: image.startsWith('http') ? image : `http://${SERVER_IP}:${SERVER_PORT}${image}` }}
                            style={styles.itemDetailImage}
                            resizeMode="cover"
                          />
                        ))}
                      </ScrollView>
                      {selectedItem.images.length > 1 && (
                        <View style={styles.imageIndicatorContainer}>
                          {selectedItem.images.map((_, index) => (
                            <View
                              key={index}
                              style={[
                                styles.imageIndicator,
                                currentImageIndex === index && styles.activeImageIndicator
                              ]}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.noImageContainer}>
                      <Ionicons name="image-outline" size={60} color={COLORS.TEXT_SECONDARY} />
                      <Text style={styles.noImageText}>No images available</Text>
                    </View>
                  )}

                  {/* Item Info */}
                  <View style={styles.itemDetailInfo}>
                    <Text style={styles.itemDetailName}>{selectedItem.name}</Text>
                    
                    <View style={styles.itemDetailRow}>
                      <Text style={styles.itemDetailLabel}>Price:</Text>
                      <Text style={styles.itemDetailTotal}>Rs {String(selectedItem.price || 0)}</Text>
                    </View>

                    <View style={styles.itemDetailRow}>
                      <Text style={styles.itemDetailLabel}>Restaurant:</Text>
                      <Text style={styles.itemDetailValue}>
                        {selectedItem.restaurant?.name || 'Unknown Restaurant'}
                      </Text>
                    </View>

                    {selectedItem.description && (
                      <View style={styles.descriptionContainer}>
                        <Text style={styles.descriptionLabel}>Description:</Text>
                        <Text style={styles.descriptionText}>{selectedItem.description}</Text>
                      </View>
                    )}

                    {selectedItem.category && (
                      <View style={styles.itemDetailRow}>
                        <Text style={styles.itemDetailLabel}>Category:</Text>
                        <Text style={styles.itemDetailValue}>
                          {typeof selectedItem.category === 'object' 
                            ? (selectedItem.category?.name || selectedItem.category?.displayName || 'Category')
                            : selectedItem.category
                          }
                        </Text>
                      </View>
                    )}

                    {selectedItem.isVegetarian !== undefined && (
                      <View style={styles.itemDetailRow}>
                        <Text style={styles.itemDetailLabel}>Type:</Text>
                        <View style={[styles.vegBadgeModal, selectedItem.isVegetarian ? styles.vegBadgeGreen : styles.vegBadgeRed]}>
                          <View style={[styles.vegDot, selectedItem.isVegetarian ? styles.vegDotGreen : styles.vegDotRed]} />
                          <Text style={styles.vegTextModal}>{selectedItem.isVegetarian ? 'Veg' : 'Non-Veg'}</Text>
                        </View>
                      </View>
                    )}

                    {selectedItem.rating > 0 && (
                      <View style={styles.itemDetailRow}>
                        <Text style={styles.itemDetailLabel}>Rating:</Text>
                        <View style={styles.ratingContainer}>
                          <Ionicons name="star" size={16} color={COLORS.RATING_COLOR} />
                          <Text style={styles.itemDetailValue}>{selectedItem.rating.toFixed(1)}</Text>
                        </View>
                      </View>
                    )}

                    {/* Add to Cart Button */}
                    <TouchableOpacity
                      style={styles.addToCartModalButton}
                      onPress={() => {
                        const restaurant = {
                          _id: selectedItem.restaurant?._id || 'unknown',
                          name: selectedItem.restaurant?.name || 'Unknown Ressstaurant',
                          deliveryFee: selectedItem.restaurant?.deliveryFee || 50
                        };
                        addItem(selectedItem, restaurant);
                        setShowItemModal(false);
                        Alert.alert('Added to Cart', `${selectedItem.name} has been added to your cart!`);
                      }}
                    >
                      <Ionicons name="cart" size={20} color={COLORS.WHITE} />
                      <Text style={styles.addToCartModalText}>Add to Cart</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117', // Dark background
  },
  header: {
    backgroundColor: '#161b22', // Dark header
    borderBottomWidth: 1,
    borderBottomColor: '#30363d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  headerCollapsed: {
    paddingVertical: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerGreeting: {
    fontSize: 11,
    color: '#8b949e',
    marginBottom: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    letterSpacing: 1,
    marginBottom: 0,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#8b949e',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartButton: {
    position: 'relative',
    padding: 8,
    marginRight: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: 'bold',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.ERROR,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickActionsBanner: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 16,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  quickActionIconContainer: {
    marginBottom: 8,
  },
  quickActionText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionSubtext: {
    color: COLORS.WHITE,
    fontSize: 12,
    opacity: 0.8,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 16,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  quickSearchContainer: {
    marginHorizontal: 20,
    marginVertical: 12,
  },
  quickSearchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickSearchText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f0f6fc',
    marginLeft: 8,
  },
  suggestionsScroll: {
    flex: 1,
  },
  suggestionChip: {
    backgroundColor: '#161b22',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  suggestionText: {
    fontSize: 12,
    color: '#f0f6fc',
    fontWeight: '500',
    marginLeft: 6,
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginHorizontal: 0,
    gap: 0,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#21262d',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    elevation: 1,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    backgroundColor: '#161b22',
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13,
    color: '#f0f6fc',
    height: 36,
  },
  content: {
    flex: 1,
  },
  section: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f0f6fc',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f0f6fc',
    marginLeft: 8,
  },
  categoryCard: {
    alignItems: 'center',
    marginHorizontal: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#161b22',
    borderRadius: 12,
    minWidth: 80,
    elevation: 1,
   shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#21262d',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: '#f0f6fc',
    textAlign: 'center',
    fontWeight: '600',
  },
  categoryList: {
    paddingHorizontal: 12,
  },
  restaurantCard: {
    marginHorizontal: 4,
    marginVertical: 8,
    backgroundColor: '#161b22',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  restaurantImageContainer: {
    height: 140,
    width: '100%',
    position: 'relative',
  },
  restaurantImage: {
    height: 140,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  restaurantImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#21262d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.WHITE,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  offerBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  offerText: {
    color: COLORS.WHITE,
    fontSize: 10,
    fontWeight: 'bold',
  },
  restaurantInfo: {
    padding: 16,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f0f6fc',
    flex: 1,
    marginRight: 8,
  },
  favoriteButton: {
    padding: 4,
  },
  restaurantCuisine: {
    fontSize: 13,
    color: '#8b949e',
    marginBottom: 8,
  },
  restaurantStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: '#f0f6fc',
    marginLeft: 4,
    fontWeight: '600',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryTime: {
    fontSize: 12,
    color: '#8b949e',
    marginLeft: 4,
  },
  restaurantFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryFee: {
    fontSize: 12,
    color: '#8b949e',
    fontWeight: '600',
  },
  viewMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#21262d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  viewMenuText: {
    fontSize: 11,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    marginRight: 4,
  },
  restaurantList: {
    paddingHorizontal: 12,
  },
  restaurantGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 20,
    backgroundColor: '#ffe6e6',
    borderRadius: 12,
    marginVertical: 16,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.ERROR,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: COLORS.ERROR,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 16,
    textAlign: 'center',
  },
  menuList: {
    paddingHorizontal: 20,
  },
  menuItemCard: {
    backgroundColor: '#161b22',
    borderRadius: 12,
    marginRight: 16,
    width: 180,
    elevation: 4,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  // Grid version for ALL Menu section
  menuItemCardGrid: {
    backgroundColor: '#161b22',
    borderRadius: 16,
    marginHorizontal: 4,
    marginBottom: 16,
    flex: 1,
    maxWidth: '48%',
    elevation: 6,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  menuItemImageContainer: {
    height: 140,
    width: '100%',
    position: 'relative',
  },
  menuItemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  menuItemImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#21262d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popularBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 87, 34, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 9,
    color: COLORS.WHITE,
    fontWeight: '600',
    marginLeft: 2,
  },
  menuItemCardContent: {
    padding: 16,
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  addToCartButton: {
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuItemRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemRatingText: {
    fontSize: 12,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: 4,
    fontWeight: '600',
  },
  menuItemTag: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  menuItemTagText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '600',
  },
  menuItemImage: {
    height: 140,
    width: '100%',
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  fallbackImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackImageText: {
    fontSize: 10,
    color: COLORS.TEXT_LIGHT,
    marginTop: 4,
    textAlign: 'center',
  },
  cardContent: {
    padding: 12,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
    lineHeight: 20,
  },
  menuItemDescription: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
    lineHeight: 16,
  },
  menuItemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 6,
  },
  availability: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  menuItemRestaurant: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '500',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  menuItemRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: 4,
    fontWeight: '500',
  },
  lastUpdated: {
    fontSize: 9,
    color: COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
  },
  vegBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0.95, 1, 0.95, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  vegText: {
    fontSize: 9,
    color: '#2E7D32',
    fontWeight: '600',
  },
  addToCartButtonOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  // ALL Menu Section Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  viewAllText: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    marginRight: 4,
  },
  allMenuList: {
    paddingHorizontal: 12,
  },
  menuRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  orderHistoryButton: {
    position: 'relative',
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.BACKGROUND,
    marginLeft: 8,
  },
  // Item modal styles
  menuItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewItemButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  itemModalContainer: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 50,
    overflow: 'hidden',
  },
  itemModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  itemModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  closeModalButton: {
    padding: 8,
  },
  itemModalContent: {
    flex: 1,
  },
  imageGalleryContainer: {
    height: 300,
    backgroundColor: '#000000',
  },
  itemDetailImage: {
    width: width,
    height: 300,
  },
  imageIndicatorContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  activeImageIndicator: {
    backgroundColor: COLORS.PRIMARY,
    width: 24,
  },
  noImageContainer: {
    height: 300,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  itemDetailInfo: {
    padding: 20,
  },
  itemDetailName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 20,
  },
  itemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  itemDetailLabel: {
    fontSize: 15,
    color: COLORS.TEXT_SECONDARY,
  },
  itemDetailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  itemDetailTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  descriptionContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 12,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
  vegBadgeModal: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  vegBadgeGreen: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  vegBadgeRed: {
    backgroundColor: 'rgba(239, 83, 80, 0.15)',
    borderWidth: 1,
    borderColor: '#EF5350',
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  vegDotGreen: {
    backgroundColor: '#4CAF50',
  },
  vegDotRed: {
    backgroundColor: '#EF5350',
  },
  vegTextModal: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addToCartModalButton: {
    marginTop: 20,
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addToCartModalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
});

export default Dashboard;
