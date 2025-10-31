import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Image,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, SERVER_IP, SERVER_PORT } from '../utils/constants';
import { mobileMenuAPI } from '../services/mobileAPI';
import { useCart } from '../context/CartContext';

const RestaurantMenuScreen = ({ navigation, route }) => {
  const { restaurantId, restaurantName } = route.params;
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Cart context
  const { addItem, getCartItemCount } = useCart();

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

  // Load restaurant menu from API
  const loadRestaurantMenu = async () => {
    try {
      setError(null);
      setLoading(true);
      console.log('Loading menu for restaurant:', restaurantId);
      const response = await mobileMenuAPI.getRestaurantMenu(restaurantId);
      console.log('Restaurant menu response:', response);
      
      if (response.success) {
        const menuItems = response.data?.menuItems || [];
        console.log('Menu items found:', menuItems.length);
        setMenuItems(menuItems);
      } else {
        console.error('API returned error:', response.message);
        setError(response.message || 'Failed to load menu items');
      }
    } catch (err) {
      console.error('Error loading restaurant menu:', err);
      setError(err.message || 'Failed to load menu items');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (restaurantId) {
      loadRestaurantMenu();
    }
  }, [restaurantId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRestaurantMenu();
  };

  const renderMenuItem = ({ item }) => (
    <TouchableOpacity
      style={styles.menuItemCard}
      onPress={() => {
        Alert.alert('Menu Item', `${item.name}\nPrice: Rs ${item.price}`, [
          { text: 'Close', style: 'cancel' }
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
            <Ionicons name="restaurant" size={40} color={COLORS.GRAY} />
          </View>
        )}
        
        {/* Veg Badge overlay */}
        {item.isVegetarian !== undefined && (
          <View style={styles.vegBadge}>
            <Text style={styles.vegText}>{item.isVegetarian ? 'Veg' : 'Non-Veg'}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.menuItemHeader}>
          <Text style={styles.menuItemName} numberOfLines={2}>{item.name}</Text>
          <TouchableOpacity 
            style={styles.addToCartButton}
            onPress={() => {
              // Add item to cart
              const restaurant = {
                _id: restaurantId, 
                name: restaurantName,
                deliveryFee: 50 
              };
              console.log('RestaurantMenuScreen - Adding item:', {
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
        
        {/* Description */}
        <Text style={styles.menuItemDescription} numberOfLines={2}>
          {item.description || `${item.name || 'Item'} - Delicious food`}
        </Text>
        
        {/* Price */}
        <Text style={styles.menuItemPrice}>Rs {String(item.price || 0)}</Text>
        
        {/* Category */}
        {item.category && (
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryText}>
              {typeof item.category === 'object' 
                ? String(item.category?.name || item.category?.displayName || 'Category')
                : String(item.category)
              }
            </Text>
          </View>
        )}
        
        {/* Tags */}
        <View style={styles.tagsContainer}>
          {item.isVegetarian !== undefined && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'}</Text>
            </View>
          )}
          <View style={styles.tag}>
            <Text style={styles.tagText}>Available</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && menuItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading menu items...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <FontAwesome5 name="utensils" size={18} color={COLORS.PRIMARY} />
          <Text style={styles.headerTitle}>{restaurantName || 'Restaurant Menu'}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.cartButton}
            onPress={() => navigation.navigate('CartScreen')}
          >
            <Ionicons name="cart-outline" size={24} color={COLORS.TEXT_PRIMARY} />
            {getCartItemCount() > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {getCartItemCount() > 99 ? '99+' : getCartItemCount().toString()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="menu" size={24} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={24} color={COLORS.ERROR} />
          <Text style={styles.errorText}>{String(error || 'An error occurred')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadRestaurantMenu}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Menu Items List */}
      {menuItems.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={60} color={COLORS.TEXT_SECONDARY} />
          <Text style={styles.emptyText}>No menu items available for this restaurant</Text>
        </View>
      ) : (
        <FlatList
          data={menuItems}
          renderItem={renderMenuItem}
          keyExtractor={(item) => item._id?.toString() || item.id?.toString()}
          style={styles.menuList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          numColumns={2}
          contentContainerStyle={styles.menuListContent}
          columnWrapperStyle={styles.menuRow}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginLeft: 8,
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
  menuButton: {
    padding: 8,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 16,
  },
  menuList: {
    flex: 1,
  },
  menuListContent: {
    paddingHorizontal: 12,
  },
  menuRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  menuItemCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    marginHorizontal: 4,
    marginBottom: 12,
    flex: 1,
    maxWidth: '48%',
    elevation: 4,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  menuItemImage: {
    height: 120,
    width: '100%',
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
  cardContent: {
    padding: 12,
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    marginRight: 8,
  },
  addToCartButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  menuItemDescription: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
    lineHeight: 16,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 8,
  },
  categoryContainer: {
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
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
});

export default RestaurantMenuScreen;
