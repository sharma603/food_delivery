import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { mobileRestaurantAPI } from '../services/mobileAPI';

const RestaurantScreen = ({ navigation }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load restaurants from API
  const loadRestaurants = async () => {
    try {
      setError(null);
      const response = await mobileRestaurantAPI.getRestaurants({ limit: 50 });
      
      if (response.success) {
        // Backend already filters by isOpen=true, so no need to filter again
        // Just set the restaurants directly
        console.log('✅ Restaurants loaded successfully:', response.data?.length || 0, 'restaurants (backend already filtered)');
        setRestaurants(response.data || []);
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
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadRestaurants();
  };

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (restaurant.cuisine && restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRestaurantPress = (restaurant) => {
    navigation.navigate('RestaurantMenuScreen', { 
      restaurantId: restaurant._id,
      restaurantName: restaurant.name 
    });
  };

  const renderRestaurant = ({ item }) => (
    <TouchableOpacity 
      style={styles.restaurantCard}
      onPress={() => handleRestaurantPress(item)}
    >
      <View style={styles.restaurantImage}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="restaurant" size={40} color={COLORS.TEXT_SECONDARY} />
          </View>
        )}
      </View>
      
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName}>{item?.name || 'Restaurant'}</Text>
        <Text style={styles.cuisineType}>{item?.cuisine || 'Cuisine'}</Text>
        
        <View style={styles.restaurantDetails}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color={COLORS.RATING_COLOR} />
            <Text style={styles.rating}>
              {typeof item?.rating?.average === 'number' ? item.rating.average.toFixed(1) : 'N/A'}
            </Text>
          </View>
          
          <Text style={styles.deliveryTime}>
            {typeof item?.deliveryTime?.min === 'number' ? item.deliveryTime.min : 25} mins
          </Text>
          
          <Text style={styles.deliveryFee}>
            Rs {typeof item?.deliveryFee === 'number' ? item.deliveryFee : 50}
          </Text>
        </View>
        
        {item?.offers && item.offers.length > 0 && (
          <View style={styles.offerContainer}>
            <Ionicons name="gift" size={12} color={COLORS.PRIMARY} />
            <Text style={styles.offerText}>{item.offers[0]}</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.viewMenuButton}
          onPress={() => navigation.navigate('RestaurantMenuScreen', { 
            restaurantId: item._id,
            restaurantName: item.name 
          })}
        >
          <Text style={styles.viewMenuText}>View Menu</Text>
          <Ionicons name="restaurant" size={16} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading && restaurants.length === 0) {
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
      {/* Header */}
      <View style={styles.header}>
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
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="menu" size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.TEXT_LIGHT} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search restaurants or cuisine..."
          placeholderTextColor={COLORS.TEXT_LIGHT}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={24} color={COLORS.ERROR} />
          <Text style={styles.errorText}>{String(error || 'An error occurred')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadRestaurants}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Restaurants List */}
      {filteredRestaurants.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={60} color={COLORS.TEXT_SECONDARY} />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No restaurants match your search' : 'No restaurants available'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRestaurants}
          renderItem={renderRestaurant}
          keyExtractor={(item) => item._id?.toString() || item.id?.toString()}
          style={styles.restaurantsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.WHITE,
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  menuButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    elevation: 1,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  restaurantsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  restaurantCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    alignItems: 'center',
  },
  restaurantImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  cuisineType: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
  },
  restaurantDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  deliveryTime: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  deliveryFee: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '600',
  },
  offerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  offerText: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    marginLeft: 4,
    fontWeight: '600',
  },
  arrowButton: {
    padding: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe6e6',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.ERROR,
    marginLeft: 8,
  },
  retryButton: {
    backgroundColor: COLORS.ERROR,
    paddingHorizontal: 16,
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
  viewMenuButton: {
    backgroundColor: COLORS.PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  viewMenuText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
});

export default RestaurantScreen;
