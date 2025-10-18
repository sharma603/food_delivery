import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Modal,
  Dimensions,
  Image,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { mobileOrderAPI } from '../services/mobileAPI';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

// Helper function to format delivery address
const formatDeliveryAddress = (deliveryAddress) => {
  if (!deliveryAddress) return 'No address';
  
  if (typeof deliveryAddress === 'string') {
    return deliveryAddress;
  }
  
  if (typeof deliveryAddress === 'object') {
    const parts = [
      deliveryAddress.street,
      deliveryAddress.city,
      deliveryAddress.state,
      deliveryAddress.zipCode
    ].filter(part => part && part.trim() !== '');
    
    return parts.length > 0 ? parts.join(', ') : 'Address not specified';
  }
  
  return 'No address';
};

// Helper function to calculate order total
const calculateOrderTotal = (order) => {
  // First try to get from order total fields
  const directTotal = order.finalAmount || order.totalAmount || order.subtotal || order.grandTotal || order.amount;
  if (directTotal && directTotal > 0) {
    return directTotal;
  }
  
  // If no direct total, calculate from items
  if (order.items && Array.isArray(order.items)) {
    const calculatedTotal = order.items.reduce((sum, item) => {
      const itemPrice = item.price || item.menuItem?.price || 0;
      const quantity = item.quantity || 1;
      return sum + (itemPrice * quantity);
    }, 0);
    return calculatedTotal > 0 ? calculatedTotal : 0;
  }
  
  return 0;
};

// Helper function to get item image source
const getItemImageSource = (orderItem) => {
  // Try different possible image field names
  const imageUrl = orderItem.image || 
                   orderItem.item?.image || 
                   orderItem.menuItem?.image ||
                   orderItem.item?.imageUrl || 
                   orderItem.menuItem?.imageUrl ||
                   orderItem.item?.photo || 
                   orderItem.menuItem?.photo;
  
  if (imageUrl && imageUrl.trim() !== '') {
    return { uri: imageUrl };
  }
  return null;
};

// Helper function to get restaurant image source
const getRestaurantImageSource = (restaurant) => {
  if (!restaurant) return null;
  
  // Try different possible image field names
  const imageUrl = restaurant.image || 
                   restaurant.imageUrl || 
                   restaurant.photo ||
                   restaurant.logo ||
                   restaurant.avatar;
  
  if (imageUrl && imageUrl.trim() !== '') {
    return { uri: imageUrl };
  }
  return null;
};

const OrdersScreen = ({ navigation }) => {
  const { isAuthenticated, loading: authLoading, user, logout } = useAuth();
  const [selectedTab, setSelectedTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Detail modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Item detail modal state
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Animation refs
  const searchAnimation = useRef(new Animated.Value(0)).current;
  const filterAnimation = useRef(new Animated.Value(0)).current;

  const tabs = [
    { key: 'all', label: 'All', icon: 'list-outline' },
    { key: 'pending', label: 'Pending', icon: 'time-outline' },
    { key: 'preparing', label: 'Preparing', icon: 'restaurant-outline' },
    { key: 'on_the_way', label: 'On Way', icon: 'bicycle-outline' },
    { key: 'delivered', label: 'Delivered', icon: 'checkmark-circle-outline' },
    { key: 'cancelled', label: 'Cancelled', icon: 'close-circle-outline' }
  ];


  // Toggle search bar
  const toggleSearch = () => {
    const toValue = showSearch ? 0 : 1;
    Animated.spring(searchAnimation, {
      toValue,
      useNativeDriver: false,
      tension: 50,
      friction: 7
    }).start();
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery('');
      setFilteredOrders(orders);
    }
  };

  // Toggle filters
  const toggleFilters = () => {
    const toValue = showFilters ? 0 : 1;
    Animated.spring(filterAnimation, {
      toValue,
      useNativeDriver: false,
      tension: 50,
      friction: 7
    }).start();
    setShowFilters(!showFilters);
  };

  // Search and filter orders
  const filterAndSortOrders = (ordersList, query = searchQuery) => {
    let filtered = [...ordersList];

    // Search filter
    if (query.trim()) {
      filtered = filtered.filter(order =>
        order.orderNumber?.toLowerCase().includes(query.toLowerCase()) ||
        (typeof order.restaurant === 'object' ? 
          order.restaurant?.name?.toLowerCase().includes(query.toLowerCase()) :
          order.restaurant?.toLowerCase().includes(query.toLowerCase())
        ) ||
        formatDeliveryAddress(order.deliveryAddress).toLowerCase().includes(query.toLowerCase())
      );
    }

    // Sort orders
    filtered.sort((a, b) => {
      let compareA, compareB;
      
      switch (sortBy) {
        case 'date':
          compareA = new Date(a.createdAt);
          compareB = new Date(b.createdAt);
          break;
        case 'amount':
          compareA = calculateOrderTotal(a);
          compareB = calculateOrderTotal(b);
          break;
        case 'status':
          compareA = a.status;
          compareB = b.status;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return compareA > compareB ? 1 : -1;
      } else {
        return compareA < compareB ? 1 : -1;
      }
    });

    return filtered;
  };

  // Load orders from API
  const loadOrders = async (status = null) => {
    try {
      setError(null);
      setLoading(true);
      
      if (!isAuthenticated || !user) {
        setError('Please login to view your orders');
        setLoading(false);
        return;
      }
      
      console.log('📦 Loading orders with status:', status);
      console.log('👤 User:', user);
      console.log('🔐 Is Authenticated:', isAuthenticated);
      
      const params = {};
      if (status && status !== 'all') {
        params.status = status;
      }

      const response = await mobileOrderAPI.getOrders(params);
      
      console.log('📊 Orders response:', response);
      
      if (response.success) {
        const orderData = response.data || [];
        console.log('✅ Orders loaded:', orderData.length);
        console.log('📊 Sample order data:', orderData[0] ? {
          _id: orderData[0]._id,
          orderNumber: orderData[0].orderNumber,
          totalAmount: orderData[0].totalAmount,
          finalAmount: orderData[0].finalAmount,
          subtotal: orderData[0].subtotal,
          grandTotal: orderData[0].grandTotal,
          amount: orderData[0].amount,
          status: orderData[0].status,
          hasItems: !!orderData[0].items,
          itemsCount: orderData[0].items?.length || 0,
          firstItem: orderData[0].items?.[0] ? {
            name: orderData[0].items[0].item?.name || orderData[0].items[0].menuItem?.name,
            price: orderData[0].items[0].price,
            quantity: orderData[0].items[0].quantity,
            hasImage: !!(orderData[0].items[0].image || orderData[0].items[0].item?.image || orderData[0].items[0].menuItem?.image)
          } : null,
          restaurant: orderData[0].restaurant ? {
            name: orderData[0].restaurant.name,
            hasImage: !!(orderData[0].restaurant.image || orderData[0].restaurant.imageUrl || orderData[0].restaurant.photo)
          } : null
        } : 'No orders found');
        setOrders(orderData);
        setFilteredOrders(filterAndSortOrders(orderData));
      } else {
        // Handle "User not found" error - token is invalid/user deleted
        if (response.message === 'User not found' || response.message?.includes('not found')) {
          setError('Your session is invalid. Please logout and login again.');
        } else {
          setError(response.message || 'Failed to load orders');
        }
      }
    } catch (err) {
      console.error('❌ Error loading orders:', err);
      
      // Handle specific error cases
      if (err.message === 'User not found' || err.message?.includes('not found')) {
        setError('Your session is invalid. Please logout and login again.');
      } else if (err.message?.includes('Network')) {
        setError('Network error. Please check your connection.');
      } else {
        setError(err.message || 'Failed to load orders. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    setFilteredOrders(filterAndSortOrders(orders, query));
  };

  // Handle sort change
  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  // Update filtered orders when sort changes
  useEffect(() => {
    if (orders.length > 0) {
      setFilteredOrders(filterAndSortOrders(orders));
    }
  }, [sortBy, sortOrder]);

  // Handle tab change
  const handleTabChange = (tabKey) => {
    setSelectedTab(tabKey);
    loadOrders(tabKey);
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders(selectedTab);
  };

  // Handle order cancellation
  const handleCancelOrder = async (orderId) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await mobileOrderAPI.cancelOrder(orderId);
              if (response.success) {
                Alert.alert('✓ Success', 'Order cancelled successfully');
                loadOrders(selectedTab);
              }
            } catch (error) {
              Alert.alert('✗ Error', error.message || 'Failed to cancel order');
            }
          }
        }
      ]
    );
  };

  // Handle reorder
  const handleReorder = (order) => {
    Alert.alert(
      'Reorder',
      'Would you like to reorder all items from this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reorder',
          onPress: () => {
            navigation.navigate('Restaurant', {
              restaurantId: order.restaurant?._id,
              reorderItems: order.items
            });
          }
        }
      ]
    );
  };

  // Handle track order
  const handleTrackOrder = (order) => {
    if (['preparing', 'on_the_way'].includes(order.status)) {
      navigation.navigate('OrderTracking', { orderId: order._id });
    } else {
      Alert.alert('Info', 'Order tracking is only available for orders being prepared or on the way');
    }
  };

  // Handle view order details
  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  // Handle view item details
  const handleViewItemDetails = (item, e) => {
    if (e) e.stopPropagation();
    setSelectedItem(item);
    setCurrentImageIndex(0);
    setShowItemModal(true);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return COLORS.WARNING;
      case 'preparing': return COLORS.INFO;
      case 'on_the_way': return COLORS.PRIMARY;
      case 'delivered': return COLORS.SUCCESS;
      case 'cancelled': return COLORS.ERROR;
      default: return COLORS.TEXT_SECONDARY;
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'preparing': return 'restaurant-outline';
      case 'on_the_way': return 'bicycle-outline';
      case 'delivered': return 'checkmark-circle-outline';
      case 'cancelled': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  // Get status progress
  const getStatusProgress = (status) => {
    switch (status) {
      case 'pending': return 0.25;
      case 'preparing': return 0.5;
      case 'on_the_way': return 0.75;
      case 'delivered': return 1;
      case 'cancelled': return 0;
      default: return 0;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Render order item
  const renderOrderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => handleViewOrderDetails(item)}
      activeOpacity={0.7}
    >
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { 
              width: `${getStatusProgress(item.status) * 100}%`,
              backgroundColor: getStatusColor(item.status)
            }
          ]} 
        />
      </View>

      {/* Order Header */}
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
          <Text style={styles.orderDate}>
            {formatDate(item.createdAt)} • {formatTime(item.createdAt)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Ionicons 
            name={getStatusIcon(item.status)} 
            size={14} 
            color={COLORS.WHITE || '#FFFFFF'} 
          />
          <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      {/* Restaurant Info */}
      <View style={styles.restaurantInfo}>
        <View style={styles.restaurantHeader}>
          {getRestaurantImageSource(item.restaurant) ? (
            <Image 
              source={getRestaurantImageSource(item.restaurant)} 
              style={styles.restaurantImage}
              onError={() => console.log('Restaurant image failed to load')}
            />
          ) : (
            <Ionicons name="restaurant" size={16} color={COLORS.PRIMARY || '#FF6B35'} />
          )}
        <Text style={styles.restaurantName}>
          {typeof item.restaurant === 'object'
            ? (item.restaurant?.name || item.restaurant?.restaurantName || 'Restaurant')
            : (item.restaurant || 'Restaurant')
          }
        </Text>
        </View>
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={14} color={COLORS.TEXT_LIGHT || '#BDBDBD'} />
          <Text style={styles.deliveryAddress} numberOfLines={1}>
            {formatDeliveryAddress(item.deliveryAddress)}
          </Text>
        </View>
      </View>

      {/* Order Items */}
      <View style={styles.orderItems}>
        {item.items && item.items.slice(0, 3).map((orderItem, index) => (
          orderItem ? (
            <View key={index} style={styles.orderItemRow}>
              <View style={styles.itemMainInfo}>
                <View style={styles.itemImageContainer}>
                  {getItemImageSource(orderItem) ? (
                    <Image 
                      source={getItemImageSource(orderItem)} 
                      style={styles.itemImage}
                      onError={() => console.log('Item image failed to load')}
                    />
                  ) : (
                    <View style={styles.itemImagePlaceholder}>
                      <Ionicons name="fast-food" size={16} color={COLORS.TEXT_SECONDARY || '#888888'} />
                    </View>
                  )}
                </View>
                <View style={styles.itemTextContainer}>
                  <View style={styles.quantityBadge}>
                    <Text style={styles.quantityText}>{orderItem.quantity || 0}x</Text>
                  </View>
                  <Text style={styles.orderItemText} numberOfLines={1}>
                    {(orderItem.item && orderItem.item.name) || 
                     (orderItem.menuItem && orderItem.menuItem.name) || 
                     'Item'}
                  </Text>
                </View>
              </View>
              <View style={styles.itemActions}>
                <Text style={styles.itemPrice}>
                  Rs {((orderItem.price || 0) * (orderItem.quantity || 1)).toFixed(0)}
                </Text>
                <TouchableOpacity 
                  style={styles.viewItemButton}
                  onPress={(e) => handleViewItemDetails(orderItem, e)}
                >
                  <Ionicons name="eye-outline" size={16} color="#FF6B35" />
                </TouchableOpacity>
              </View>
            </View>
          ) : null
        ))}
        {item.items && item.items.length > 3 && (
          <Text style={styles.moreItemsText}>
            +{item.items.length - 3} more item{item.items.length - 3 > 1 ? 's' : ''}
          </Text>
        )}
        {(!item.items || item.items.length === 0) && (
          <Text style={styles.noItemsText}>No items found</Text>
        )}
      </View>

      {/* Order Footer */}
      <View style={styles.orderFooter}>
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>Rs {calculateOrderTotal(item).toFixed(0)}</Text>
        </View>
        
        <View style={styles.actionButtons}>
          {/* Track Order Button */}
          {['preparing', 'on_the_way'].includes(item.status) && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.trackButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleTrackOrder(item);
              }}
            >
              <Ionicons name="navigate-outline" size={16} color={COLORS.PRIMARY || '#FF6B35'} />
              <Text style={styles.trackButtonText}>Track</Text>
            </TouchableOpacity>
          )}
          
          {/* Cancel Button */}
        {item.status === 'pending' && (
          <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleCancelOrder(item._id);
              }}
            >
              <Ionicons name="close-outline" size={16} color={COLORS.ERROR || '#EF5350'} />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
          
          {/* Reorder Button */}
          {item.status === 'delivered' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.reorderButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleReorder(item);
              }}
            >
              <Ionicons name="repeat-outline" size={16} color={COLORS.SUCCESS || '#66BB6A'} />
              <Text style={styles.reorderButtonText}>Reorder</Text>
          </TouchableOpacity>
        )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Load orders on component mount
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      loadOrders(selectedTab);
    }
  }, [authLoading, isAuthenticated, user, selectedTab]);

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginPrompt}>
          <Ionicons name="person-outline" size={80} color="#888888" />
          <Text style={styles.loginPromptTitle}>Login Required</Text>
          <Text style={styles.loginPromptText}>
            Please login to view your orders
          </Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {/* Tab Navigation */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContent}
        decelerationRate="fast"
        snapToInterval={100}
        snapToAlignment="start"
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              selectedTab === tab.key && styles.activeTab
            ]}
            onPress={() => handleTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              selectedTab === tab.key && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons 
            name={error.includes('session is invalid') ? "log-out-outline" : "alert-circle-outline"}
            size={60} 
            color="#FF6B35" 
          />
          <Text style={styles.errorText}>{error}</Text>
          {error.includes('session is invalid') ? (
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={async () => {
                await logout();
                Alert.alert('Logged Out', 'Please login again to continue.');
              }}
            >
              <Text style={styles.retryButtonText}>Logout & Login Again</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.retryButton} onPress={() => loadOrders(selectedTab)}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={80} color={COLORS.TEXT_LIGHT} />
          <Text style={styles.emptyTitle}>No Orders Found</Text>
          <Text style={styles.emptyText}>
            {selectedTab === 'all' 
              ? "You haven't placed any orders yet"
              : `No ${selectedTab} orders found`
            }
          </Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.browseButtonText}>Browse Restaurants</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.ordersList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.PRIMARY]}
              tintColor={COLORS.PRIMARY}
            />
          }
        />
      )}

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
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.itemModalContent} showsVerticalScrollIndicator={false}>
              {selectedItem && (
                <>
                  {/* Image Gallery */}
                  {selectedItem.item?.images && selectedItem.item.images.length > 0 ? (
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
                        {selectedItem.item.images.map((image, index) => (
                          <Image
                            key={index}
                            source={{ uri: image }}
                            style={styles.itemDetailImage}
                            resizeMode="cover"
                          />
                        ))}
                      </ScrollView>
                      {selectedItem.item.images.length > 1 && (
                        <View style={styles.imageIndicatorContainer}>
                          {selectedItem.item.images.map((_, index) => (
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
                      <Ionicons name="image-outline" size={60} color="#666666" />
                      <Text style={styles.noImageText}>No images available</Text>
                    </View>
                  )}

                  {/* Item Info */}
                  <View style={styles.itemDetailInfo}>
                    <Text style={styles.itemDetailName}>
                      {(selectedItem.item && selectedItem.item.name) || 
                       (selectedItem.menuItem && selectedItem.menuItem.name) || 
                       'Item Name'}
                    </Text>
                    
                    <View style={styles.itemDetailRow}>
                      <Text style={styles.itemDetailLabel}>Quantity:</Text>
                      <Text style={styles.itemDetailValue}>{selectedItem.quantity}x</Text>
                    </View>

                    <View style={styles.itemDetailRow}>
                      <Text style={styles.itemDetailLabel}>Price per item:</Text>
                      <Text style={styles.itemDetailValue}>Rs {(selectedItem.price || 0).toFixed(0)}</Text>
                    </View>

                    <View style={styles.itemDetailRow}>
                      <Text style={styles.itemDetailLabel}>Total:</Text>
                      <Text style={styles.itemDetailTotal}>
                        Rs {((selectedItem.price || 0) * (selectedItem.quantity || 1)).toFixed(0)}
                      </Text>
                    </View>

                    {selectedItem.item?.description && (
                      <View style={styles.descriptionContainer}>
                        <Text style={styles.descriptionLabel}>Description:</Text>
                        <Text style={styles.descriptionText}>{selectedItem.item.description}</Text>
                      </View>
                    )}

                    {selectedItem.item?.category && (
                      <View style={styles.itemDetailRow}>
                        <Text style={styles.itemDetailLabel}>Category:</Text>
                        <Text style={styles.itemDetailValue}>{selectedItem.item.category}</Text>
                      </View>
                    )}

                    {selectedItem.item?.isVeg !== undefined && (
                      <View style={styles.itemDetailRow}>
                        <Text style={styles.itemDetailLabel}>Type:</Text>
                        <View style={[styles.vegBadge, selectedItem.item.isVeg ? styles.vegBadgeGreen : styles.vegBadgeRed]}>
                          <View style={[styles.vegDot, selectedItem.item.isVeg ? styles.vegDotGreen : styles.vegDotRed]} />
                          <Text style={styles.vegText}>{selectedItem.item.isVeg ? 'Veg' : 'Non-Veg'}</Text>
                        </View>
                      </View>
                    )}
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
    backgroundColor: '#1A1A1A', // Dark background
  },
  header: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tabContainer: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 12,
    borderBottomWidth: 0,
    maxHeight: 60,
  },
  tabContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  activeTab: {
    backgroundColor: '#C94A1F', // Orange/Brown active color
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888888',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  ordersList: {
    padding: 16,
    paddingTop: 20,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: '#2A2A2A',
    marginBottom: 0,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  orderCard: {
    backgroundColor: '#2A2A2A', // Dark card
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333333',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  orderDate: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  restaurantInfo: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  restaurantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  restaurantImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveryAddress: {
    fontSize: 12,
    color: '#888888',
    flex: 1,
  },
  orderItems: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  quantityBadge: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    minWidth: 32,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  orderItemText: {
    flex: 1,
    fontSize: 14,
    color: '#CCCCCC',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  moreItemsText: {
    fontSize: 12,
    color: '#888888',
    fontStyle: 'italic',
    marginTop: 4,
  },
  orderFooter: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: '#888888',
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
    letterSpacing: 0.3,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  trackButton: {
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  trackButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B35',
  },
  cancelButton: {
    backgroundColor: 'rgba(239, 83, 80, 0.15)',
    borderWidth: 1,
    borderColor: '#EF5350',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF5350',
  },
  reorderButton: {
    backgroundColor: 'rgba(102, 187, 106, 0.15)',
    borderWidth: 1,
    borderColor: '#66BB6A',
  },
  reorderButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#66BB6A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#888888',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1A1A1A',
  },
  errorText: {
    fontSize: 16,
    color: '#EF5350',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1A1A1A',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 15,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  browseButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
  },
  browseButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1A1A1A',
  },
  loginPromptTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
  },
  loginPromptText: {
    fontSize: 15,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 28,
  },
  loginButton: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // Item row styles
  itemMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemImageContainer: {
    width: 40,
    height: 40,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
  },
  itemImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewItemButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  // Item Modal Styles
  itemModalContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
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
    backgroundColor: '#2A2A2A',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  itemModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    backgroundColor: '#FF6B35',
    width: 24,
  },
  noImageContainer: {
    height: 300,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    marginTop: 12,
    fontSize: 14,
    color: '#888888',
  },
  itemDetailInfo: {
    padding: 20,
  },
  itemDetailName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  itemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  itemDetailLabel: {
    fontSize: 15,
    color: '#888888',
  },
  itemDetailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  itemDetailTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  descriptionContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  vegBadge: {
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
  vegText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noItemsText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
});

export default OrdersScreen;
