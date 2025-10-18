import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SERVER_IP, SERVER_PORT } from '../utils/constants';
import { mobileRestaurantAPI, mobileMenuAPI } from '../services/mobileAPI';

const RestaurantDetailScreen = ({ route, navigation }) => {
  const { restaurant: initialRestaurant, restaurantId } = route.params;
  const [restaurant, setRestaurant] = useState(initialRestaurant);
  const [menu, setMenu] = useState(null);
  const [menuCategories, setMenuCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [error, setError] = useState(null);

  // Format price for display
  const formatPrice = (price) => {
    return `Rs ${price.toLocaleString('en-NP')}`;
  };

  // Get image source for menu items
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


  // Load restaurant and menu data
  const loadRestaurantData = async () => {
    try {
      setLoading(true);
      
      // Get restaurant details
      if (restaurantId && !restaurant) {
        const restaurantResponse = await mobileRestaurantAPI.getRestaurant(restaurantId);
        setRestaurant(restaurantResponse.data);
      }

      // Get menu data
      const menuResponse = await mobileMenuAPI.getRestaurantMenu(restaurantId || restaurant?._id);
      setMenu(menuResponse);

      if (menuResponse) {
        // Set categories
        setMenuCategories(menuResponse.categories || []);
        
        // Set menu items
        const items = menuResponse.items || [];
        setMenuItems(items);
        setFilteredItems(items);

        // Select first category if available
        if (menuResponse.categories && menuResponse.categories.length > 0) {
          setSelectedCategory(menuResponse.categories[0]._id);
        }
      }
    } catch (error) {
      console.error('Error loading restaurant data:', error);
      setError('Failed to load restaurant data. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadRestaurantData();
  }, []);

  // Filter items by category and search
  useEffect(() => {
    let filtered = menuItems;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredItems(filtered);
  }, [selectedCategory, searchQuery, menuItems]);

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadRestaurantData();
    setRefreshing(false);
  };

  // Add item to cart
  const addToCart = (item) => {
    Alert.alert(
      'Add to Cart',
      `Add "${item.name}" to your cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { item: 'Yes', onPress: () => {
          Alert.alert('Success', `${item.name} added to cart!`);
        }}
      ]
    );
  };

  // Render menu category tab
  const renderCategoryTab = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryTab,
        selectedCategory === item._id && styles.categoryTabActive
      ]}
      onPress={() => setSelectedCategory(item._id)}
    >
      <Text style={[
        styles.categoryTabText,
        selectedCategory === item._id && styles.categoryTabTextActive
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  // Render menu item
  const renderMenuItem = ({ item }) => (
    <View style={styles.menuItemCard}>
      {/* Item Image */}
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
          <View style={styles.menuItemImage}>
            <Ionicons name="restaurant" size={40} color={COLORS.GRAY} />
          </View>
        )}
        {!item.isAvailable && (
          <View style={styles.unavailableOverlay}>
            <Text style={styles.unavailableText}>Not Available</Text>
          </View>
        )}
      </View>

      {/* Item Details */}
      <View style={styles.menuItemDetails}>
        <View style={styles.menuItemHeader}>
          <Text style={styles.menuItemName}>{item.name}</Text>
          {item.isVegetarian && (
            <View style={styles.vegIcon}>
              <Text style={styles.vegText}>V</Text>
            </View>
          )}
        </View>

        <Text style={styles.menuItemDescription}>{item.description}</Text>

        {/* Item Tags */}
        <View style={styles.menuItemTags}>
          {item.spiceLevel && (
            <View style={styles.tag}>
              <Ionicons 
                name="flame" 
                size={12} 
                color={item.spiceLevel === 'hot' || item.spiceLevel === 'very_hot' ? COLORS.ERROR : COLORS.WARNING} 
              />
              <Text style={styles.tagText}>
                {item.spiceLevel.charAt(0).toUpperCase() + item.spiceLevel.slice(1)}
              </Text>
            </View>
          )}
          {item.preparationTime && (
            <View style={styles.tag}>
              <Ionicons name="time" size={12} color={COLORS.TEXT_LIGHT} />
              <Text style={styles.tagText}>{item.preparationTime} min</Text>
            </View>
          )}
          {item.rating > 0 && (
            <View style={styles.tag}>
              <Ionicons name="star" size={12} color={COLORS.RATING_COLOR} />
              <Text style={styles.tagText}>{item.rating}</Text>
            </View>
          )}
        </View>

        {/* Price and Add Button */}
        <View style={styles.menuItemFooter}>
          <Text style={styles.menuItemPrice}>{formatPrice(item.price)}</Text>
          <TouchableOpacity
            style={[
              styles.addButton,
              !item.isAvailable && styles.addButtonDisabled
            ]}
            onPress={() => addToCart(item)}
            disabled={!item.isAvailable}
          >
            <Text style={[
              styles.addButtonText,
              !item.isAvailable && styles.addButtonTextDisabled
            ]}>
              Add
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading && !restaurant) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading restaurant...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('RestaurantScreen');
            }
          }}>
            <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{restaurant?.name || 'Restaurant'}</Text>
          <TouchableOpacity>
            <Ionicons name="share-outline" size={24} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.TEXT_LIGHT} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor={COLORS.TEXT_LIGHT}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Restaurant Info */}
        {restaurant && (
          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantName}>{restaurant?.name || 'Restaurant'}</Text>
            <Text style={styles.restaurantCuisine}>{restaurant?.cuisine || 'Cuisine'}</Text>
            <View style={styles.restaurantDetails}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color={COLORS.RATING_COLOR} />
                <Text style={styles.rating}>
                  {typeof restaurant?.rating === 'object' ? (restaurant.rating?.average || 'N/A') : (restaurant?.rating || 'N/A')}
                </Text>
              </View>
              <Text style={styles.deliveryTime}>{restaurant?.deliveryTime || '25 mins'}</Text>
              <Text style={styles.deliveryFee}>{restaurant?.deliveryFee || 'Rs 50'}</Text>
            </View>
          </View>
        )}

        {/* Menu Categories */}
        {menuCategories && menuCategories.length > 0 && (
          <View style={styles.categoriesSection}>
            <FlatList
              data={menuCategories}
              renderItem={renderCategoryTab}
              keyExtractor={(item) => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            />
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>
            {selectedCategory 
              ? menuCategories.find(cat => cat._id === selectedCategory)?.name || 'Menu Items'
              : 'All Items'
            } ({(filteredItems || []).length})
          </Text>

          {(filteredItems && filteredItems.length > 0) ? (
            <FlatList
              data={filteredItems}
              renderItem={renderMenuItem}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.menuItemsList}
            />
          ) : (
            <View style={styles.emptyMenuState}>
              <Ionicons name="restaurant-outline" size={48} color={COLORS.TEXT_LIGHT} />
              <Text style={styles.emptyMenuText}>No items found</Text>
              <Text style={styles.emptyMenuSubtext}>
                {searchQuery ? 'Try a different search term' : 'No items available in this category'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add to Cart Button */}
      <TouchableOpacity 
        style={styles.cartButton}
        onPress={() => Alert.alert('Cart', 'Shopping cart functionality coming soon!')}
      >
        <View style={styles.cartButtonContent}>
          <View style={styles.cartIconContainer}>
            <Ionicons name="bag-outline" size={20} color={COLORS.WHITE} />
          </View>
          <Text style={styles.cartButtonText}>View Cart (0)</Text>
          <Text style={styles.cartTotal}>Rs 0</Text>
        </View>
      </TouchableOpacity>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  header: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  scrollContainer: {
    flex: 1,
  },
  restaurantInfo: {
    backgroundColor: COLORS.WHITE,
    padding: 16,
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  restaurantCuisine: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
  },
  restaurantDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.FOOD_BG,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 12,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    marginLeft: 4,
  },
  deliveryTime: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginRight: 12,
  },
  deliveryFee: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  categoriesSection: {
    backgroundColor: COLORS.WHITE,
    paddingVertical: 16,
    marginBottom: 8,
    elevation: 1,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: COLORS.BORDER,
  },
  categoryTabActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  categoryTabText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  categoryTabTextActive: {
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  menuSection: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  menuItemsList: {
    paddingBottom: 20,
  },
  menuItemCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuItemImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  menuItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: COLORS.FOOD_BG,
  },
  fallbackImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
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
  unavailableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailableText: {
    color: COLORS.WHITE,
    fontSize: 10,
    fontWeight: '600',
  },
  menuItemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  menuItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  vegIcon: {
    backgroundColor: COLORS.SUCCESS,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  vegText: {
    color: COLORS.WHITE,
    fontSize: 10,
    fontWeight: 'bold',
  },
  menuItemDescription: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
    lineHeight: 16,
  },
  menuItemTags: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.FOOD_BG,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 6,
  },
  tagText: {
    fontSize: 10,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: 4,
    fontWeight: '500',
  },
  menuItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.PRICE_COLOR,
  },
  addButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.TEXT_LIGHT,
  },
  addButtonText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: '600',
  },
  addButtonTextDisabled: {
    color: COLORS.WHITE,
  },
  emptyMenuState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyMenuText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyMenuSubtext: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  cartButton: {
    backgroundColor: COLORS.PRIMARY,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
  },
  cartButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  cartIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 12,
  },
  cartButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  cartTotal: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RestaurantDetailScreen;
