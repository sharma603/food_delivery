import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { mobileRestaurantAPI } from '../services/mobileAPI';



const BrowseScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [sortBy, setSortBy] = useState('rating'); // 'rating', 'distance', 'delivery'
  const [restaurantsData, setRestaurantsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Generate categories dynamically from restaurant data
  const getDynamicCategories = () => {
    const categories = [{ id: 'all', name: 'All', icon: 'restaurant' }];
    
    // Extract unique cuisines from restaurants with proper filtering
    const uniqueCuisines = [...new Set(
      restaurantsData
        .map(restaurant => restaurant?.cuisine)
        .filter(cuisine => cuisine && typeof cuisine === 'string' && cuisine.trim().length > 0)
    )];
    
    const iconMap = {
      'North Indian': 'fast-food',
      'Chinese': 'restaurant',
      'South Indian': 'leaf',
      'Fast Food': 'pizza',
      'Street Food': 'cafe',
      'Desserts': 'ice-cream',
      'Biryani': 'fast-food',
      'Tibetan': 'leaf',
      'Italian': 'restaurant',
      'Indian': 'restaurant',
      'Mexican': 'restaurant',
      'Thai': 'leaf'
    };

    uniqueCuisines.forEach((cuisine, index) => {
      // Additional safety check
      if (cuisine && typeof cuisine === 'string') {
        categories.push({
          id: cuisine.toLowerCase().replace(/\s+/g, ''),
          name: cuisine,
          icon: iconMap[cuisine] || 'restaurant'
        });
      }
    });

    return categories;
  };

  const foodCategories = getDynamicCategories();

  // Load restaurants from database
  const loadRestaurants = async (params = {}) => {
    try {
      setError(null);
      setLoading(true);
      
      console.log('🚀 Fetching restaurants with params:', params);
      const response = await mobileRestaurantAPI.getRestaurants(params);
      console.log('📦 API Response received:', response);
      
      if (response && response.success) {
        // Backend already filters by isOpen=true, so no need to filter again
        // Just set the restaurants directly
        console.log('✅ Restaurants fetched successfully:', response.data?.length || 0, 'restaurants (backend already filtered)');
        console.log('🔍 Raw restaurants data:', response.data);
        setRestaurantsData(response.data || []);
      } else {
        throw new Error(response?.message || 'Failed to load restaurants');
      }
    } catch (err) {
      console.error('Error loading restaurants:', err);
      const errorMessage = err?.message || err?.toString() || 'Failed to load restaurants';
      setError(errorMessage);
      
      // For debugging - show detailed error info
      console.log('API Error Details:', {
        message: errorMessage,
        params: params,
        error: err
      });
      
      // Set empty array to show error state
      setRestaurantsData([]);
    } finally {
      setLoading(false);
    }
  };

  // Load restaurants on component mount
  useEffect(() => {
    loadRestaurants();
  }, []);

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadRestaurants();
    setRefreshing(false);
  };

  // Filter restaurants based on search and category
  const filteredRestaurants = (restaurantsData || []).filter(restaurant => {
    // Handle potential undefined properties with proper type checking
    const restaurantName = (restaurant?.name && typeof restaurant.name === 'string') ? restaurant.name : '';
    const restaurantCuisine = (restaurant?.cuisine && typeof restaurant.cuisine === 'string') ? restaurant.cuisine : '';
    const searchLower = searchQuery.toLowerCase();
    
    const matchesSearch = restaurantName.toLowerCase().includes(searchLower) ||
                         restaurantCuisine.toLowerCase().includes(searchLower);
    
    let matchesCategory = true;
    if (selectedCategory !== 'all') {
      const categoryName = foodCategories.find(cat => cat.id === selectedCategory)?.name;
      matchesCategory = restaurantCuisine.toLowerCase().includes(categoryName?.toLowerCase() || '');
    }

    return matchesSearch && matchesCategory;
  });

  // Ensure filteredRestaurants is always an array
  const safeFilteredRestaurants = Array.isArray(filteredRestaurants) ? filteredRestaurants : [];

  // Sort restaurants
  const sortedRestaurants = safeFilteredRestaurants.sort((a, b) => {
    try {
      switch (sortBy) {
        case 'rating':
          const ratingA = typeof a.rating === 'object' ? parseFloat(a.rating?.average || 0) : parseFloat(a.rating || 0);
          const ratingB = typeof b.rating === 'object' ? parseFloat(b.rating?.average || 0) : parseFloat(b.rating || 0);
          return ratingB - ratingA;
        case 'distance':
          const distanceA = parseFloat(a.distance || a.distance?.text || '0');
          const distanceB = parseFloat(b.distance || b.distance?.text || '0');
          return distanceA - distanceB;
        case 'delivery':
          const deliveryA = parseInt(
            typeof a.deliveryTime === 'object' 
              ? (a.deliveryTime?.mins || a.deliveryTime?.min || '25')
              : (a.deliveryTime || '25')
          );
          const deliveryB = parseInt(
            typeof b.deliveryTime === 'object' 
              ? (b.deliveryTime?.mins || b.deliveryTime?.min || '25')
              : (b.deliveryTime || '25')
          );
          return deliveryA - deliveryB;
        default:
          return 0;
      }
    } catch (error) {
      console.warn('Error sorting restaurants:', error);
      return 0;
    }
  });

  const navigateToRestaurant = (restaurant) => {
    try {
      console.log('Navigating to restaurant:', restaurant?.name || 'Unknown');
      navigation.navigate('RestaurantDetailScreen', { 
        restaurant,
        restaurantId: restaurant._id || restaurant.id
      });
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation
      navigation.navigate('RestaurantScreen');
    }
  };

  // Filter and search with API call
  const handleSearch = async (query) => {
    setLoading(true);
    try {
      if (query.trim()) {
        const response = await mobileRestaurantAPI.searchRestaurants(query);
        if (response.success) {
          setRestaurantsData(response.data || []);
        }
      } else {
        await loadRestaurants();
      }
    } catch (err) {
      console.error('Search error:', err);
      setRestaurantsData([]); // Fallback to empty array
    } finally {
      setLoading(false);
    }
  };

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.categoryItemActive
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <View style={[
        styles.categoryIcon,
        selectedCategory === item.id && styles.categoryIconActive
      ]}>
        <Ionicons name={item.icon} size={20} color={COLORS.PRIMARY} />
      </View>
      <Text style={[
        styles.categoryName,
        selectedCategory === item.id && styles.categoryNameActive
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderRestaurantCard = ({ item }) => (
    <TouchableOpacity style={styles.restaurantCard} onPress={() => navigateToRestaurant(item)}>
      <View style={styles.cardContent}>
        {/* Restaurant Image Section */}
        <View style={styles.imageSection}>
          <View style={styles.restaurantImage}>
            <Ionicons name="restaurant" size={40} color={COLORS.TEXT_LIGHT} />
          </View>
          
          {/* Badges */}
          {item.featured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>✨ Featured</Text>
            </View>
          )}
          
          {(item.offers && item.offers.length > 0) && (
            <View style={styles.offerBadge}>
              <Text style={styles.offerBadgeText}>{item.offers[0]}</Text>
            </View>
          )}

          {/* Favorite Button */}
          <TouchableOpacity style={styles.favoriteButton}>
            <Ionicons name="heart-outline" size={20} color={COLORS.TEXT_LIGHT} />
          </TouchableOpacity>

          {/* Availability Status */}
          <View style={styles.availabilityBadge}>
            <View style={styles.availabilityDot} />
            <Text style={styles.availabilityText}>{item.availability || 'Open'}</Text>
          </View>
        </View>

        {/* Restaurant Info Section */}
        <View style={styles.restaurantInfo}>
          <View style={styles.restaurantHeader}>
            <Text style={styles.restaurantName} numberOfLines={1}>{item.name}</Text>
          </View>

          <Text style={styles.restaurantCuisine} numberOfLines={1}>
            {item.cuisine || 'Restaurant'} • {item.distance || 'N/A'}
          </Text>
          
          <Text style={styles.priceRange}>
            {typeof item.priceRange === 'string' 
              ? item.priceRange 
              : (typeof item.priceRange === 'object' 
                  ? `${item.priceRange?.min || 'Rs 100'} - ${item.priceRange?.max || 'Rs 500'}`
                  : 'Rs 100-500')}
          </Text>

          {/* Restaurant Stats */}
          <View style={styles.restaurantStats}>
            <View style={styles.statItem}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color={COLORS.RATING_COLOR} />
                <Text style={styles.rating}>
                  {typeof item.rating === 'object' ? (item.rating?.average || 'N/A') : (item.rating || 'N/A')}
                </Text>
                <Text style={styles.reviews}>({item.reviews || 0})</Text>
              </View>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={12} color={COLORS.TEXT_SECONDARY} />
              <Text style={styles.deliveryTime}>
                {typeof item.deliveryTime === 'object' 
                  ? `${item.deliveryTime?.mins || item.deliveryTime?.min || '25'}m`
                  : `${item.deliveryTime || '25m'}`}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="car-outline" size={12} color={COLORS.TEXT_SECONDARY} />
              <Text style={styles.deliveryFee}>{item.deliveryFee || 'Rs 50'}</Text>
            </View>
          </View>

          {/* Cuisine Options */}
          <View style={styles.cuisineOptions}>
            {(item.cuisineOptions || ['Veg', 'Non-Veg']).slice(0, 2).map((option, index) => (
              <View key={index} style={styles.cuisineTag}>
                <Text style={styles.cuisineTagText}>
                  {typeof option === 'object' 
                    ? (option?.name || option?.displayName || 'Option')
                    : (option || 'Option')
                  }
                </Text>
              </View>
            ))}
            {(item.cuisineOptions && item.cuisineOptions.length > 2) && (
              <View style={styles.cuisineTag}>
                <Text style={styles.cuisineTagText}>+{item.cuisineOptions.length - 2}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Dashboard');
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Browse Restaurants</Text>
          <TouchableOpacity 
            style={styles.viewModeButton}
            onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          >
            <Ionicons 
              name={viewMode === 'list' ? "grid" : "list"} 
              size={24} 
              color={COLORS.TEXT_PRIMARY} 
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.TEXT_LIGHT} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search restaurants or cuisine..."
              placeholderTextColor={COLORS.TEXT_LIGHT}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setLoading(false);
              }}
              onSubmitEditing={() => handleSearch(searchQuery)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery('')}
              >
                <Ionicons name="close-circle" size={20} color={COLORS.TEXT_LIGHT} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Sort Options */}
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <View style={styles.sortOptions}>
            {['rating', 'distance', 'delivery'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.sortOption,
                  sortBy === option && styles.sortOptionActive
                ]}
                onPress={() => setSortBy(option)}
              >
                <Text style={[
                  styles.sortOptionText,
                  sortBy === option && styles.sortOptionTextActive
                ]}>
                  {option === 'rating' ? 'Rating' : 
                   option === 'distance' ? 'Distance' : 'Delivery'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesSection}>
        <Text style={styles.categoriesTitle}>Categories</Text>
        <FlatList
          data={foodCategories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        />
      </View>

      {/* Results Count and Filter Summary */}
      <View style={styles.resultsHeader}>
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            {(sortedRestaurants || []).length} restaurants found
          </Text>
          {(searchQuery || selectedCategory !== 'all') && (
            <TouchableOpacity 
              style={styles.clearFiltersButton}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              <Text style={styles.clearFiltersText}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Restaurants List */}
      {loading && (!restaurantsData || restaurantsData.length === 0) ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading restaurants...</Text>
        </View>
      ) : error && (!restaurantsData || restaurantsData.length === 0) ? (
        <View style={styles.errorContainer}>
          <Ionicons name="wifi-outline" size={60} color={COLORS.TEXT_LIGHT} />
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorText}>{String(error || 'An error occurred')}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => loadRestaurants()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sortedRestaurants}
          renderItem={renderRestaurantCard}
          keyExtractor={(item) => (item._id || item.id).toString()}
          contentContainerStyle={styles.restaurantsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search" size={60} color={COLORS.TEXT_LIGHT} />
              <Text style={styles.emptyStateTitle}>No restaurants found</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'Try a different search term' : 'Try adjusting your search or filters'}
              </Text>
            </View>
          }
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
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    elevation: 3,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.BACKGROUND,
  },
  headerTitle: {
    fontSize: 20,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  viewModeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.BACKGROUND,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  clearSearchButton: {
    padding: 4,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '600',
  },
  sortOptions: {
    flexDirection: 'row',
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
    backgroundColor: COLORS.BACKGROUND,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  sortOptionActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  sortOptionText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '600',
  },
  sortOptionTextActive: {
    color: COLORS.WHITE,
    fontWeight: '700',
  },
  categoriesSection: {
    backgroundColor: COLORS.WHITE,
    paddingVertical: 20,
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  categoryItemActive: {
    backgroundColor: COLORS.FOOD_BG,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryIcon: {
    backgroundColor: COLORS.BORDER,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryIconActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  categoryName: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    fontWeight: '500',
  },
  categoryNameActive: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  resultsText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  restaurantsList: {
    paddingVertical: 8,
  },
  restaurantCard: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
  },
  imageSection: {
    width: 120,
    backgroundColor: '#2D2D2D',
    position: 'relative',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.SECONDARY,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 2,
  },
  featuredBadgeText: {
    fontSize: 10,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  offerBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.SUCCESS,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 2,
  },
  offerBadgeText: {
    fontSize: 10,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  restaurantImage: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  availabilityBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 2,
  },
  availabilityText: {
    fontSize: 10,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  restaurantInfo: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.WHITE,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 2,
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.SUCCESS,
    marginRight: 4,
  },
  resultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.PRIMARY + '20',
  },
  clearFiltersText: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  favoriteButton: {
    padding: 4,
  },
  restaurantCuisine: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  priceRange: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
  },
  restaurantStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  statItem: {
    flex: 1,
    minWidth: 70,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: 4,
    fontWeight: '600',
  },
  reviews: {
    fontSize: 10,
    color: COLORS.TEXT_LIGHT,
    marginLeft: 4,
  },
  deliveryTime: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
    textAlign: 'center',
  },
  deliveryFee: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    textAlign: 'right',
  },
  cuisineOptions: {
    flexDirection: 'row',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  cuisineTag: {
    backgroundColor: COLORS.FOOD_BG,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  cuisineTagText: {
    fontSize: 10,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorTitle: {
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BrowseScreen;
