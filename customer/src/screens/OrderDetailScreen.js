import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { mobileAPI } from '../services/mobileAPI';

const OrderDetailScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await mobileAPI.orders.getOrder(orderId);
      
      if (response.success) {
        setOrder(response.data);
      } else {
        Alert.alert('Error', response.message || 'Failed to load order details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading order details:', error);
      Alert.alert('Error', error.message || 'Failed to load order details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'placed': return COLORS.WARNING;
      case 'confirmed': return COLORS.INFO;
      case 'preparing': return COLORS.PRIMARY;
      case 'ready': return COLORS.SUCCESS;
      case 'delivered': return COLORS.SUCCESS;
      case 'cancelled': return COLORS.ERROR;
      default: return COLORS.TEXT_SECONDARY;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'placed': return 'time';
      case 'confirmed': return 'checkmark-circle';
      case 'preparing': return 'restaurant';
      case 'ready': return 'checkmark-done';
      case 'delivered': return 'car';
      case 'cancelled': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getImageSource = (item) => {
    if (item.menuItem?.image) {
      return { uri: item.menuItem.image };
    }
    return null;
  };

  const renderOrderItem = (item, index) => (
    <View key={index} style={styles.orderItemCard}>
      <View style={styles.itemImageContainer}>
        {getImageSource(item) ? (
          <Image 
            source={getImageSource(item)} 
            style={styles.itemImage}
            onError={() => {
              console.log('Image failed to load for item:', (item.menuItem && item.menuItem.name) || 'Unknown');
            }}
          />
        ) : (
          <View style={styles.itemImagePlaceholder}>
            <Ionicons name="restaurant" size={24} color={COLORS.TEXT_LIGHT} />
          </View>
        )}
      </View>
      
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{(item.menuItem && item.menuItem.name) || 'Item'}</Text>
        <Text style={styles.itemPrice}>Rs {item.menuItem?.price || 0}</Text>
        <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
        
        {item.customizations && item.customizations.length > 0 && (
          <View style={styles.customizationsContainer}>
            <Text style={styles.customizationsTitle}>Customizations:</Text>
            {item.customizations.map((customization, idx) => (
              <Text key={idx} style={styles.customizationText}>
                • {(customization && customization.name) || 'Customization'}: {customization.selectedOptions?.join(', ')}
                {(customization && customization.additionalPrice > 0) && ` (+Rs ${customization.additionalPrice})`}
              </Text>
            ))}
          </View>
        )}
        
        <Text style={styles.itemSubtotal}>Subtotal: Rs {item.subtotal}</Text>
      </View>
    </View>
  );

  const renderRestaurantSection = (restaurantData, index) => (
    <View key={index} style={styles.restaurantSection}>
      <View style={styles.restaurantHeader}>
        <View style={styles.restaurantInfo}>
          <Ionicons name="restaurant" size={20} color={COLORS.PRIMARY} />
          <Text style={styles.restaurantName}>{restaurantData.restaurantName}</Text>
        </View>
        <Text style={styles.deliveryFee}>Delivery: Rs {restaurantData.deliveryFee}</Text>
      </View>
      
      <View style={styles.restaurantItems}>
        {restaurantData.items.map((item, itemIndex) => (
          <View key={itemIndex} style={styles.restaurantItem}>
            <Text style={styles.restaurantItemName}>{item.itemName}</Text>
            <View style={styles.restaurantItemDetails}>
              <Text style={styles.restaurantItemPrice}>Rs {item.itemPrice}</Text>
              <Text style={styles.restaurantItemQuantity}>x{item.quantity}</Text>
              <Text style={styles.restaurantItemTotal}>Rs {item.totalPrice}</Text>
            </View>
            {item.specialInstructions && (
              <Text style={styles.specialInstructions}>
                Note: {item.specialInstructions}
              </Text>
            )}
          </View>
        ))}
      </View>
      
      <View style={styles.restaurantSubtotal}>
        <Text style={styles.restaurantSubtotalText}>
          Restaurant Subtotal: Rs {restaurantData.subtotal}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={80} color={COLORS.ERROR} />
          <Text style={styles.errorTitle}>Order Not Found</Text>
          <Text style={styles.errorText}>The order you're looking for doesn't exist.</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
              <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <Ionicons name={getStatusIcon(order.status)} size={16} color={COLORS.WHITE} />
              <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
            </View>
          </View>
          
          <View style={styles.paymentStatus}>
            <Ionicons name="card" size={16} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.paymentStatusText}>
              Payment: {order.paymentStatus?.toUpperCase() || 'PENDING'} • {order.paymentMethod?.toUpperCase() || 'CASH ON DELIVERY'}
            </Text>
          </View>
        </View>

        {/* Restaurant Information */}
        {order.multiRestaurantData?.restaurants && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Restaurant Orders</Text>
            {order.multiRestaurantData.restaurants.map(renderRestaurantSection)}
          </View>
        )}

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items?.map(renderOrderItem)}
        </View>

        {/* Delivery Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Information</Text>
          <View style={styles.deliveryCard}>
            <View style={styles.deliveryAddress}>
              <Ionicons name="location" size={20} color={COLORS.PRIMARY} />
              <View style={styles.addressDetails}>
                <Text style={styles.addressText}>{order.deliveryAddress?.street}</Text>
                <Text style={styles.addressText}>
                  {order.deliveryAddress?.city}, {order.deliveryAddress?.state} {order.deliveryAddress?.zipCode}
                </Text>
              </View>
            </View>
            
            {order.estimatedDeliveryTime && (
              <View style={styles.deliveryTime}>
                <Ionicons name="time" size={16} color={COLORS.TEXT_SECONDARY} />
                <Text style={styles.deliveryTimeText}>
                  Estimated Delivery: {formatDate(order.estimatedDeliveryTime)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>Rs {order.pricing?.subtotal || 0}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>Rs {order.pricing?.deliveryFee || 0}</Text>
            </View>
            
            {order.pricing?.tax > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax</Text>
                <Text style={styles.summaryValue}>Rs {order.pricing.tax}</Text>
              </View>
            )}
            
            {order.pricing?.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, { color: COLORS.SUCCESS }]}>
                  -Rs {order.pricing.discount}
                </Text>
              </View>
            )}
            
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>Rs {order.pricing?.total || 0}</Text>
            </View>
          </View>
        </View>

        {/* Order Actions */}
        {order.status !== 'delivered' && order.status !== 'cancelled' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                Alert.alert(
                  'Cancel Order',
                  'Are you sure you want to cancel this order?',
                  [
                    { text: 'No', style: 'cancel' },
                    {
                      text: 'Yes, Cancel',
                      style: 'destructive',
                      onPress: () => cancelOrder()
                    }
                  ]
                );
              }}
            >
              <Ionicons name="close-circle" size={20} color={COLORS.WHITE} />
              <Text style={styles.cancelButtonText}>Cancel Order</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );

  async function cancelOrder() {
    try {
      const response = await mobileAPI.orders.cancelOrder(orderId);
      if (response.success) {
        Alert.alert('Success', 'Order cancelled successfully');
        loadOrderDetails(); // Refresh the order details
      } else {
        Alert.alert('Error', response.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      Alert.alert('Error', error.message || 'Failed to cancel order');
    }
  }
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
    paddingVertical: 15,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerBackButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.BACKGROUND,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.WHITE,
    marginLeft: 6,
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentStatusText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: 6,
  },
  restaurantSection: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginLeft: 8,
  },
  deliveryFee: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  restaurantItems: {
    marginBottom: 12,
  },
  restaurantItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  restaurantItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  restaurantItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restaurantItemPrice: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  restaurantItemQuantity: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  restaurantItemTotal: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  specialInstructions: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
    marginTop: 4,
  },
  restaurantSubtotal: {
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    paddingTop: 8,
  },
  restaurantSubtotalText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    textAlign: 'right',
  },
  orderItemCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
  },
  customizationsContainer: {
    marginBottom: 8,
  },
  customizationsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  customizationText: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 2,
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  deliveryCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deliveryAddress: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  addressDetails: {
    flex: 1,
    marginLeft: 12,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 20,
  },
  deliveryTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryTimeText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: 6,
  },
  summaryCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  cancelButton: {
    backgroundColor: COLORS.ERROR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.WHITE,
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 20,
  },
});

export default OrderDetailScreen;
