import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SERVER_IP, SERVER_PORT } from '../utils/constants';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import LocationService from '../services/locationService';
import OrderService, { formatOrderData } from '../services/orderService';

const CartScreen = ({ navigation }) => {
  const { 
    restaurants: cartRestaurants,
    totalItems,
    totalAmount,
    totalDeliveryFee,
    removeItem, 
    updateQuantity, 
    clearCart,
    getCartItemCount,
    getRestaurants,
    getItemsByRestaurant,
    getRestaurantSubtotal,
    getRestaurantDeliveryFee
  } = useCart();
  
  const { notifyOrderPlaced } = useNotifications();
  const { user, isAuthenticated } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash_on_delivery');
  const [locationData, setLocationData] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [calculatedDeliveryCharges, setCalculatedDeliveryCharges] = useState({});

  // Get image source for menu items
  const getImageSource = (item) => {
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      const imagePath = item.images[0];
      if (imagePath.startsWith('http')) {
        return { uri: imagePath };
      }
      return { uri: `http://${SERVER_IP}:${SERVER_PORT}${imagePath}` };
    }
    
    if (item.image && typeof item.image === 'string' && item.image.trim() !== '') {
      if (item.image.startsWith('http')) {
        return { uri: item.image };
      }
      return { uri: `http://${SERVER_IP}:${SERVER_PORT}${item.image}` };
    }
    
    return null;
  };

  const handleQuantityChange = (itemId, newQuantity, restaurantId) => {
    if (newQuantity <= 0) {
      removeItem(itemId, restaurantId);
    } else {
      updateQuantity(itemId, newQuantity, restaurantId);
    }
  };

  const handleRemoveItem = (itemId, itemName, restaurantId) => {
    Alert.alert(
      'Remove Item',
      `Are you sure you want to remove ${itemName} from your cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeItem(itemId, restaurantId) }
      ]
    );
  };

  const handleCheckout = async () => {
    if (totalItems === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty. Add some items to continue.');
      return;
    }

    // Calculate location-based delivery charges in background
    setIsLoadingLocation(true);
    try {
      const locationWithAddress = await LocationService.getCurrentLocationWithAddress();
      
      if (!locationWithAddress) {
        Alert.alert(
          'Location Error',
          'Unable to get your location. Please check your location settings and try again.',
          [{ text: 'OK' }]
        );
        setIsLoadingLocation(false);
        return;
      }

      // Calculate delivery charges for each restaurant
      const charges = {};
      let totalCalculatedDeliveryFee = 0;

      for (const [restaurantId, restaurantData] of Object.entries(cartRestaurants)) {
        const result = await LocationService.calculateDeliveryCharge(restaurantId);
        charges[restaurantId] = result;
        totalCalculatedDeliveryFee += result.charge;
      }

      setLocationData({
        ...locationWithAddress,
        charges: charges,
        totalCalculatedDeliveryFee: totalCalculatedDeliveryFee
      });
      setCalculatedDeliveryCharges(charges);
      
      // Directly show payment modal
      setShowPaymentModal(true);
    } catch (error) {
      console.error('Error calculating delivery charges:', error);
      Alert.alert(
        'Error',
        'Failed to calculate delivery charges. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const confirmOrderWithPayment = async () => {
    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      Alert.alert(
        'Login Required',
        'You need to login to place an order.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    // Check token validity by getting it
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    const { STORAGE_KEYS } = await import('../utils/constants');
    const token = await AsyncStorage.default.getItem(STORAGE_KEYS.AUTH_TOKEN);
    
    console.log('🔑 Token exists:', !!token);
    console.log('👤 User data:', {
      id: user._id || user.id,
      name: user.name,
      email: user.email
    });
    console.log('💳 Payment method:', selectedPaymentMethod);

    setIsProcessing(true);
    setShowPaymentModal(false);
    
    try {
      // Format order data for database
      const orderData = formatOrderData(
        {
          restaurants: cartRestaurants,
          totalAmount: totalAmount,
          totalDeliveryFee: totalDeliveryFee
        },
        locationData,
        {
          userId: user._id || user.id,
          name: user.name || 'Customer',
          phone: user.phone || '',
          email: user.email || ''
        },
        selectedPaymentMethod
      );

      console.log('Submitting order to database:', orderData);
      console.log('User info:', {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        isAuthenticated
      });

      // Save order to database
      const orderResult = await OrderService.createOrder(orderData);
      
      console.log('Order result received:', orderResult);
      
      if (!orderResult.success) {
        throw new Error(orderResult.message || 'Failed to save order to database');
      }

      const orderId = orderResult.orderId || orderResult.data?.orderNumber || orderResult.data?._id || orderResult.data?.data?._id;
      
      // Get restaurant names for notification
      const restaurantNames = getRestaurants().map(rest => rest.name).join(', ');
      
      // Notify order placed
      await notifyOrderPlaced(orderId, restaurantNames || 'Restaurants');
      
      // Clear cart
      clearCart();
      
      const finalTotal = totalAmount + locationData.totalCalculatedDeliveryFee;
      
      const paymentMethodText = selectedPaymentMethod === 'cash_on_delivery' 
        ? 'Cash on Delivery' 
        : 'Online Payment';
      
      Alert.alert(
        'Order Placed!',
        `Your order has been placed successfully!\n\nOrder ID: ${orderId}\nTotal: Rs ${finalTotal.toFixed(2)}\nPayment: ${paymentMethodText}\n\nYour order has been saved and will be processed shortly.`,
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('Dashboard') 
          }
        ]
      );
    } catch (error) {
      console.error('Error placing order:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Failed to place order. Please try again.';
      let errorTitle = 'Order Failed';
      
      // Handle specific error cases
      if (error.message === 'User not found' || error.message?.includes('User not found')) {
        errorTitle = 'Authentication Error';
        errorMessage = 'Your session has expired. Please logout and login again to place an order.';
      } else if (error.response?.status === 401) {
        errorTitle = 'Authentication Error';
        errorMessage = 'Your session is invalid. Please logout and login again.';
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert(
        errorTitle, 
        errorMessage,
        [
          { text: 'OK' },
          ...(errorTitle === 'Authentication Error' ? [{
            text: 'Go to Profile',
            onPress: () => navigation.navigate('Profile')
          }] : [{
            text: 'Retry', 
            onPress: () => {
              setShowPaymentModal(true);
            }
          }])
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const renderCartItem = ({ item, restaurantId }) => {
    console.log('Rendering cart item:', {
      itemId: item._id,
      itemName: item.name || 'Unknown',
      quantity: item.quantity,
      price: item.price,
      restaurantId: restaurantId
    });
    
    return (
    <View style={styles.cartItem}>
      <View style={styles.itemImageContainer}>
        {getImageSource(item) ? (
          <Image 
            source={getImageSource(item)} 
            style={styles.itemImage}
            onError={() => {
              console.log('Image failed to load for item:', item.name || 'Unknown');
            }}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="restaurant" size={30} color={COLORS.TEXT_SECONDARY} />
          </View>
        )}
      </View>
      
      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name || 'Item'}</Text>
        <Text style={styles.itemDescription} numberOfLines={2}>
          {item.description || 'Delicious food item'}
        </Text>
        <Text style={styles.itemPrice}>Rs {item.price}</Text>
        
        {item.isVegetarian !== undefined && (
          <View style={styles.vegBadge}>
            <Ionicons 
              name={item.isVegetarian ? "leaf" : "nutrition"} 
              size={12} 
              color={item.isVegetarian ? "#4CAF50" : "#F44336"} 
            />
            <Text style={styles.vegText}>{item.isVegetarian ? 'Veg' : 'Non-Veg'}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.quantityControls}>
        <TouchableOpacity 
          style={styles.quantityButton}
          onPress={() => handleQuantityChange(item._id, item.quantity - 1, restaurantId)}
        >
          <Ionicons name="remove" size={16} color={COLORS.PRIMARY} />
        </TouchableOpacity>
        
        <Text style={styles.quantityText}>{item.quantity}</Text>
        
        <TouchableOpacity 
          style={styles.quantityButton}
          onPress={() => handleQuantityChange(item._id, item.quantity + 1, restaurantId)}
        >
          <Ionicons name="add" size={16} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => handleRemoveItem(item._id, item.name, restaurantId)}
      >
        <Ionicons name="trash-outline" size={20} color={COLORS.ERROR} />
      </TouchableOpacity>
    </View>
    );
  };

  const renderRestaurantSection = (restaurantId, restaurantData) => {
    const items = restaurantData.items;
    
    return (
      <View key={restaurantId} style={styles.restaurantSection}>
        <View style={styles.restaurantHeader}>
          <Ionicons name="storefront" size={20} color={COLORS.PRIMARY} />
          <Text style={styles.restaurantName}>{(restaurantData.restaurant && restaurantData.restaurant.name) || 'Restaurant'}</Text>
          <Text style={styles.restaurantSubtotal}>
            Rs {getRestaurantSubtotal(restaurantId).toFixed(2)}
          </Text>
        </View>
        
        {items.map((item) => (
          <View key={item._id}>
            {renderCartItem({ item, restaurantId })}
          </View>
        ))}
        
        <View style={styles.restaurantSummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>Rs {getRestaurantSubtotal(restaurantId).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>Rs {getRestaurantDeliveryFee(restaurantId).toFixed(2)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cart-outline" size={80} color={COLORS.TEXT_SECONDARY} />
      <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
      <Text style={styles.emptyText}>
        Add some delicious items from our menu to get started!
      </Text>
      <TouchableOpacity 
        style={styles.browseButton}
        onPress={() => navigation.navigate('Dashboard')}
      >
        <Text style={styles.browseButtonText}>Browse Menu</Text>
      </TouchableOpacity>
    </View>
  );

  if (totalItems === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cart</Text>
          <View style={styles.headerRight} />
        </View>
        {renderEmptyCart()}
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
        <Text style={styles.headerTitle}>Cart ({getCartItemCount()})</Text>
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={() => {
            Alert.alert(
              'Clear Cart',
              'Are you sure you want to clear your cart?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: clearCart }
              ]
            );
          }}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.ERROR} />
        </TouchableOpacity>
      </View>

      {/* Cart Items by Restaurant */}
      <ScrollView 
        style={styles.cartList}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(cartRestaurants).map(([restaurantId, restaurantData]) => 
          renderRestaurantSection(restaurantId, restaurantData)
        )}
      </ScrollView>

      {/* Order Summary */}
      <View style={styles.orderSummary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>Rs {totalAmount.toFixed(2)}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery Fee</Text>
          <Text style={styles.summaryValue}>Rs {totalDeliveryFee.toFixed(2)}</Text>
        </View>
        
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>Rs {(totalAmount + totalDeliveryFee).toFixed(2)}</Text>
        </View>
      </View>

      {/* Checkout Button */}
      <View style={styles.checkoutContainer}>
        <TouchableOpacity 
          style={[styles.checkoutButton, (isProcessing || isLoadingLocation) && styles.checkoutButtonDisabled]}
          onPress={handleCheckout}
          disabled={isProcessing || isLoadingLocation}
        >
          <Text style={styles.checkoutButtonText}>
            {isLoadingLocation ? 'Calculating Delivery...' : 
             isProcessing ? 'Processing...' : 
             `Place Order - Rs ${(totalAmount + totalDeliveryFee).toFixed(2)}`}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      {/* Payment Method Selection Modal */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="card" size={24} color={COLORS.PRIMARY} />
              <Text style={styles.modalTitle}>Select Payment Method</Text>
            </View>

            {locationData && (
              <>
                {/* Delivery Address Display */}
                <View style={styles.deliveryAddressContainer}>
                  <View style={styles.deliveryAddressHeader}>
                    <Ionicons name="location" size={20} color={COLORS.PRIMARY} />
                    <Text style={styles.deliveryAddressTitle}>Delivering to:</Text>
                  </View>
                  <Text style={styles.deliveryAddressText}>{locationData.address}</Text>
                </View>

                <View style={styles.paymentMethodsContainer}>
                  <Text style={styles.sectionTitle}>Choose how you want to pay:</Text>
                  
                  {/* Cash on Delivery Option */}
                  <TouchableOpacity
                    style={[
                      styles.paymentMethodCard,
                      selectedPaymentMethod === 'cash_on_delivery' && styles.paymentMethodCardSelected
                    ]}
                    onPress={() => setSelectedPaymentMethod('cash_on_delivery')}
                  >
                    <View style={styles.paymentMethodIcon}>
                      <Ionicons 
                        name="cash" 
                        size={32} 
                        color={selectedPaymentMethod === 'cash_on_delivery' ? COLORS.PRIMARY : COLORS.TEXT_SECONDARY} 
                      />
                    </View>
                    <View style={styles.paymentMethodDetails}>
                      <Text style={[
                        styles.paymentMethodTitle,
                        selectedPaymentMethod === 'cash_on_delivery' && styles.paymentMethodTitleSelected
                      ]}>
                        Cash on Delivery
                      </Text>
                      <Text style={styles.paymentMethodDescription}>
                        Pay with cash when your order arrives
                      </Text>
                    </View>
                    {selectedPaymentMethod === 'cash_on_delivery' && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.PRIMARY} />
                    )}
                  </TouchableOpacity>

                  {/* Online Payment Option */}
                  <TouchableOpacity
                    style={[
                      styles.paymentMethodCard,
                      selectedPaymentMethod === 'online' && styles.paymentMethodCardSelected
                    ]}
                    onPress={() => setSelectedPaymentMethod('online')}
                  >
                    <View style={styles.paymentMethodIcon}>
                      <Ionicons 
                        name="card" 
                        size={32} 
                        color={selectedPaymentMethod === 'online' ? COLORS.PRIMARY : COLORS.TEXT_SECONDARY} 
                      />
                    </View>
                    <View style={styles.paymentMethodDetails}>
                      <Text style={[
                        styles.paymentMethodTitle,
                        selectedPaymentMethod === 'online' && styles.paymentMethodTitleSelected
                      ]}>
                        Online Payment
                      </Text>
                      <Text style={styles.paymentMethodDescription}>
                        Pay securely with card or digital wallet
                      </Text>
                    </View>
                    {selectedPaymentMethod === 'online' && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.PRIMARY} />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Order Summary in Payment Modal */}
                <View style={styles.paymentSummaryContainer}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>Rs {totalAmount.toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Delivery Fee</Text>
                    <Text style={styles.summaryValue}>Rs {locationData.totalCalculatedDeliveryFee}</Text>
                  </View>
                  <View style={[styles.summaryRow, styles.totalRow]}>
                    <Text style={styles.finalTotalLabel}>Total to Pay</Text>
                    <Text style={styles.finalTotalAmount}>
                      Rs {(totalAmount + locationData.totalCalculatedDeliveryFee).toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowPaymentModal(false);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={confirmOrderWithPayment}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color={COLORS.WHITE} />
                    ) : (
                      <View style={styles.confirmButtonContent}>
                        <Text style={styles.confirmButtonText}>
                          {selectedPaymentMethod === 'cash_on_delivery' ? 'Place Order' : 'Proceed to Pay'}
                        </Text>
                        <Ionicons name="arrow-forward" size={16} color={COLORS.WHITE} />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  headerRight: {
    width: 36,
  },
  clearButton: {
    padding: 8,
  },
  restaurantSection: {
    marginBottom: 20,
  },
  restaurantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginLeft: 8,
    flex: 1,
  },
  restaurantSubtotal: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  restaurantSummary: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    marginTop: 8,
  },
  cartList: {
    padding: 16,
  },
  cartItem: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  vegBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  vegText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '600',
    marginLeft: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
  },
  orderSummary: {
    backgroundColor: COLORS.WHITE,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  checkoutContainer: {
    padding: 20,
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  checkoutButton: {
    backgroundColor: COLORS.PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  checkoutButtonDisabled: {
    backgroundColor: COLORS.TEXT_LIGHT,
  },
  checkoutButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginLeft: 8,
  },
  locationInfo: {
    marginBottom: 20,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 16,
  },
  deliveryChargesContainer: {
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  deliveryChargesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  deliveryChargeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  restaurantChargeName: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  restaurantChargeAmount: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
  },
  totalDeliveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    marginTop: 8,
  },
  totalDeliveryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  totalDeliveryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  finalTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 2,
    borderTopColor: COLORS.PRIMARY,
    marginTop: 8,
  },
  finalTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  finalTotalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_SECONDARY,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: COLORS.PRIMARY,
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  confirmButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Payment Method Modal Styles
  deliveryAddressContainer: {
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.PRIMARY,
  },
  deliveryAddressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  deliveryAddressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginLeft: 6,
  },
  deliveryAddressText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
  paymentMethodsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
  },
  paymentMethodCardSelected: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: '#FFF5F5',
  },
  paymentMethodIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentMethodDetails: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  paymentMethodTitleSelected: {
    color: COLORS.PRIMARY,
  },
  paymentMethodDescription: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  paymentSummaryContainer: {
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
});

export default CartScreen;
