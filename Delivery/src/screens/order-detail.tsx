import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  Modal,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { deliveryAPI } from '../services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { TextInput, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getCustomerAddressFromOrder, formatAddress } from '../utils/addressHelper';

interface OrderDetail {
  _id: string;
  orderNumber: string;
  status: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  restaurant: {
    restaurantName: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  items: Array<{
    menuItem: { name: string; price: number };
    quantity: number;
    subtotal: number;
  }>;
  pricing: {
    subtotal: number;
    deliveryFee: number;
    tax: number;
    total: number;
  };
  paymentMethod: string;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  specialInstructions?: string;
  pickedUpAt?: string;
  actualDeliveryTime?: string;
  cashCollection?: {
    amount: number;
    collectedAt: string;
    submissionStatus: 'pending' | 'submitted' | 'reconciled';
  };
  deliveryPerson?: string | { _id: string };
  deliveryPersonnel?: string | { _id: string };
  assignedDeliveryPerson?: string | { _id: string };
}

export default function OrderDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [proofPhotos, setProofPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendAttempts, setResendAttempts] = useState(0);
  const [showCashCollectionModal, setShowCashCollectionModal] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [cashNotes, setCashNotes] = useState('');

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await deliveryAPI.getOrderDetails(orderId);
      if (response.data.success) {
        setOrder(response.data.data);
      }
    } catch (error) {
      console.error('Error loading order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNavigation = (latitude: number, longitude: number, label: string) => {
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}&dirflg=d`,
      android: `google.navigation:q=${latitude},${longitude}`,
    });

    if (url) {
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          // Fallback to web browser
          const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
          Linking.openURL(webUrl);
        }
      });
    }
  };

  const handleUpdateStatus = async (status: 'picked_up' | 'delivered') => {
    try {
      setSubmitting(true);
      // If delivering, require OTP (simple flow). Pickup optional.
      let otp: string | undefined = undefined;
      if (status === 'delivered') {
        if (!otpValue) {
          setOtpModalVisible(true);
          setSubmitting(false);
          return;
        }
        otp = otpValue;
      }

      // Delivery requires OTP verification first
      if (status === 'delivered') {
        await deliveryAPI.verifyOrderOtp(orderId, otp!);
      } else if (proofPhotos.length > 0) {
        // Optional: attach photos on pickup
        await deliveryAPI.submitOrderProof(orderId, {
          type: 'pickup',
          photos: proofPhotos.map((uri, idx) => ({ uri, name: `proof_${idx}.jpg`, type: 'image/jpeg' })),
        });
      }

      const response = status === 'picked_up' 
        ? await deliveryAPI.pickupOrder(orderId)
        : await deliveryAPI.deliverOrder(orderId);
      if (response.data.success) {
        const updatedOrder = response.data.data;
        const isCashOnDelivery = updatedOrder?.paymentMethod === 'cash_on_delivery';
        const orderAmount = updatedOrder?.pricing?.total || updatedOrder?.totalAmount || 0;
        
        setOtpValue('');
        setProofPhotos([]);
        setOtpModalVisible(false);
        loadOrderDetails();

        // When order picked up, send OTP to customer for delivery confirmation
        if (status === 'picked_up') {
          try {
            const otpResp = await deliveryAPI.sendOrderOtp(orderId);
            if (otpResp.data?.success) {
              // Start cooldown
              setResendAttempts(1);
              setResendCooldown(60);
              Alert.alert('OTP Sent', 'A delivery confirmation OTP was sent to the customer.');
            } else {
              Alert.alert('OTP Not Sent', otpResp.data?.message || 'Server did not confirm OTP dispatch.');
            }
          } catch (e: any) {
            const msg = e?.response?.data?.message || e?.message || 'Failed to send OTP';
            Alert.alert('OTP Not Sent', msg);
          }
        } else if (status === 'delivered') {
          // Show success message for delivered orders
          const deliveryFee = updatedOrder?.pricing?.deliveryFee || 0;
          
          if (isCashOnDelivery) {
            Alert.alert(
              '✅ Order Delivered & Payment Received',
              `You collected Rs. ${orderAmount.toFixed(2)} in cash from customer.\n\n💰 Cash added to Cash in Hand: Rs. ${orderAmount.toFixed(2)}\n💰 Delivery Fee Earned: Rs. ${deliveryFee.toFixed(2)}\n✅ Cash collection automatically recorded\n📊 Check your dashboard for updated cash balance`,
              [
                {
                  text: 'View Dashboard',
                  onPress: () => {
                    // Navigate to dashboard - it will auto-refresh
                    router.push('/(app)/(tabs)/dashboard');
                    // Small delay to ensure navigation completes before alert dismisses
                    setTimeout(() => {
                      // Dashboard will load fresh data automatically
                    }, 100);
                  },
                  style: 'default'
                },
                {
                  text: 'OK',
                  style: 'cancel',
                  onPress: () => {
                    // Reload order data to reflect cash collection
                    loadOrderDetails();
                  }
                }
              ]
            );
          } else {
            Alert.alert(
              '✅ Order Delivered Successfully',
              `Order has been delivered to the customer.\n\n💰 Delivery Fee Earned: Rs. ${deliveryFee.toFixed(2)}\n📊 Your earnings have been updated.`,
              [
                {
                  text: 'View Dashboard',
                  onPress: () => {
                    // Navigate to dashboard - it will auto-refresh
                    router.push('/(app)/(tabs)/dashboard');
                    // Small delay to ensure navigation completes before alert dismisses
                    setTimeout(() => {
                      // Dashboard will load fresh data automatically
                    }, 100);
                  },
                  style: 'default'
                },
                {
                  text: 'OK',
                  style: 'cancel'
                }
              ]
            );
          }
        } else {
          Alert.alert('Success', `Order ${status === 'picked_up' ? 'picked up' : 'delivered'} successfully`);
        }
      }
    } catch (error) {
      Alert.alert('Error', `Failed to ${status === 'picked_up' ? 'pick up' : 'deliver'} order`);
    } finally {
      setSubmitting(false);
    }
  };

  const pickProofPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (res.canceled) return;
    const uri = res.assets[0]?.uri;
    if (uri) setProofPhotos((prev) => [...prev, uri]);
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    if (resendAttempts >= 3) return;
    try {
      await deliveryAPI.resendOrderOtp(orderId);
      setResendAttempts((n) => n + 1);
      setResendCooldown(60);
    } catch {}
  };

  if (loading || !order) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }


  const restaurantCoords = order.restaurant?.coordinates;
  const customerCoords = order.deliveryAddress?.coordinates;
  const hasRestaurantCoords = !!(restaurantCoords && typeof restaurantCoords.latitude === 'number' && typeof restaurantCoords.longitude === 'number');
  const hasCustomerCoords = !!(customerCoords && typeof customerCoords.latitude === 'number' && typeof customerCoords.longitude === 'number');

  // Check if order is assigned to current delivery person
  const orderDeliveryPersonId = 
    order.deliveryPerson?.toString() || 
    (typeof order.deliveryPerson === 'object' && order.deliveryPerson?._id?.toString()) ||
    order.deliveryPersonnel?.toString() || 
    (typeof order.deliveryPersonnel === 'object' && order.deliveryPersonnel?._id?.toString()) ||
    order.assignedDeliveryPerson?.toString() || 
    (typeof order.assignedDeliveryPerson === 'object' && order.assignedDeliveryPerson?._id?.toString());
  
  const currentUserId = user?._id?.toString();
  const isOrderAssignedToMe = orderDeliveryPersonId && currentUserId && orderDeliveryPersonId === currentUserId;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#12151C" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#EDEFF5" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Order #{order.orderNumber}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>

      {/* Map Section (only if we have coordinates) */}
      {(hasRestaurantCoords || hasCustomerCoords) && (
      <View style={styles.mapContainer}>
          <Text style={styles.sectionTitle}>Navigation</Text>
          <View style={styles.map}>
            <MapView
              provider={PROVIDER_DEFAULT}
              style={styles.mapView}
              initialRegion={{
                latitude: (hasCustomerCoords ? customerCoords!.latitude : restaurantCoords!.latitude),
                longitude: (hasCustomerCoords ? customerCoords!.longitude : restaurantCoords!.longitude),
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              {hasRestaurantCoords && (
                <Marker
                  coordinate={{
                    latitude: restaurantCoords!.latitude,
                    longitude: restaurantCoords!.longitude,
                  }}
                  title="Pickup"
                  description={order.restaurant.restaurantName}
                >
                  <View style={styles.pickupMarker}>
                    <Ionicons name="restaurant" size={20} color="#fff" />
                  </View>
                </Marker>
              )}

              {hasCustomerCoords && (
                <Marker
                  coordinate={{
                    latitude: customerCoords!.latitude,
                    longitude: customerCoords!.longitude,
                  }}
                  title="Delivery"
                  description={order.customer.name}
                >
                  <View style={styles.deliveryMarker}>
                    <Ionicons name="location" size={20} color="#fff" />
                  </View>
                </Marker>
              )}
            </MapView>
          </View>

          {/* Navigation Buttons */}
          <View style={styles.navButtons}>
            {hasRestaurantCoords && (
              <TouchableOpacity
                style={[styles.navButton, styles.pickupButton]}
                onPress={() => handleOpenNavigation(
                  restaurantCoords!.latitude,
                  restaurantCoords!.longitude,
                  'Restaurant'
                )}
              >
                <Ionicons name="restaurant" size={20} color="#fff" />
                <Text style={styles.navButtonText}>Navigate to Restaurant</Text>
              </TouchableOpacity>
            )}
            {hasCustomerCoords && (
              <TouchableOpacity
                style={[styles.navButton, styles.deliveryButton]}
                onPress={() => handleOpenNavigation(
                  customerCoords!.latitude,
                  customerCoords!.longitude,
                  'Customer'
                )}
              >
                <Ionicons name="location" size={20} color="#fff" />
                <Text style={styles.navButtonText}>Navigate to Customer</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Order Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Status</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
        </View>
      </View>

      {/* Restaurant Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Restaurant Details</Text>
        <View style={styles.detailRow}>
          <Ionicons name="restaurant" size={20} color="#98A2B3" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Name</Text>
            <Text style={styles.detailValue}>{order.restaurant.restaurantName}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={20} color="#98A2B3" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Address</Text>
            <Text style={styles.detailValue}>{formatAddress(order.restaurant.address)}</Text>
          </View>
        </View>
      </View>

      {/* Customer Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Details</Text>
        <View style={styles.detailRow}>
          <Ionicons name="person" size={20} color="#98A2B3" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Name</Text>
            <Text style={styles.detailValue}>{order.customer.name}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="call" size={20} color="#98A2B3" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.detailValue}>{order.customer.phone}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={20} color="#98A2B3" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Delivery Address</Text>
            <Text style={styles.detailValue}>{getCustomerAddressFromOrder(order)}</Text>
          </View>
        </View>
      </View>

      {/* Order Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        {order.items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.menuItem.name} x{item.quantity}</Text>
            <Text style={styles.itemPrice}>Rs {item.subtotal}</Text>
          </View>
        ))}
      </View>

      {/* Pricing */}
      <View style={styles.section}>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Subtotal</Text>
          <Text style={styles.priceValue}>Rs {order.pricing.subtotal}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Delivery Fee</Text>
          <Text style={styles.priceValue}>Rs {order.pricing.deliveryFee}</Text>
        </View>
        <View style={[styles.priceRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>Rs {order.pricing.total}</Text>
        </View>
        
        {/* Payment Information Section */}
        <View style={[styles.paymentSection, { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#252B36' }]}>
          <View style={styles.paymentHeader}>
            <Ionicons 
              name={order.paymentMethod === 'cash_on_delivery' ? 'cash' : 'card'} 
              size={20} 
              color={order.paymentMethod === 'cash_on_delivery' ? '#FFD700' : '#4ECDC4'} 
            />
            <Text style={styles.paymentTitle}>
              {order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Online Payment'}
            </Text>
          </View>
          
          {order.paymentMethod === 'cash_on_delivery' ? (
            <>
              {order.paymentStatus === 'paid' ? (
                <View style={styles.paymentPaidCard}>
                  <View style={styles.paymentStatusRow}>
                    <Ionicons name="checkmark-circle" size={24} color="#4ECDC4" />
                    <View style={styles.paymentStatusInfo}>
                      <Text style={styles.paymentStatusText}>Payment Received</Text>
                      <Text style={styles.paymentAmountText}>Rs {order.pricing.total.toFixed(2)}</Text>
                    </View>
                  </View>
                  {order.cashCollection && (
                    <View style={styles.cashCollectionInfo}>
                      <Text style={styles.cashCollectionLabel}>
                        Collection Status: 
                        <Text style={[styles.cashCollectionStatus, {
                          color: order.cashCollection.submissionStatus === 'reconciled' ? '#4ECDC4' :
                                 order.cashCollection.submissionStatus === 'submitted' ? '#FFD700' : '#FFE66D'
                        }]}>
                          {' '}{order.cashCollection.submissionStatus === 'reconciled' ? '✓ Reconciled' :
                                 order.cashCollection.submissionStatus === 'submitted' ? '○ Submitted' : 'Pending Submission'}
                        </Text>
                      </Text>
                      <Text style={styles.cashCollectionDate}>
                        Collected: {new Date(order.cashCollection.collectedAt).toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.paymentPendingCard}>
                  <View style={styles.paymentStatusRow}>
                    <Ionicons name="alert-circle" size={24} color="#FFD700" />
                    <View style={styles.paymentStatusInfo}>
                      <Text style={styles.paymentPendingText}>Collect from Customer</Text>
                      <Text style={styles.paymentAmountText}>Rs {order.pricing.total.toFixed(2)}</Text>
                    </View>
                  </View>
                  {order.status === 'delivered' && (
                    <TouchableOpacity 
                      style={styles.recordCashButton}
                      onPress={() => setShowCashCollectionModal(true)}
                    >
                      <Ionicons name="cash" size={18} color="#fff" />
                      <Text style={styles.recordCashButtonText}>Record Cash Collection</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          ) : (
            <View style={styles.paymentPaidCard}>
              <View style={styles.paymentStatusRow}>
                <Ionicons name="checkmark-circle" size={24} color="#4ECDC4" />
                <View style={styles.paymentStatusInfo}>
                  <Text style={styles.paymentStatusText}>
                    {order.paymentStatus === 'paid' ? 'Payment Completed' : 'Payment Pending'}
                  </Text>
                  <Text style={styles.paymentMethodText}>Customer paid online</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        {/* Only show "Mark as Picked Up" button if order is assigned to current user */}
        {(order.status === 'ready' || order.status === 'confirmed') && isOrderAssignedToMe && (
          <TouchableOpacity
            style={[styles.actionButton, styles.pickupButton]}
            onPress={() => handleUpdateStatus('picked_up')}
            disabled={submitting}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>
              {submitting ? 'Processing...' : 'Mark as Picked Up'}
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Show message if order is not assigned to current user */}
        {(order.status === 'ready' || order.status === 'confirmed') && !isOrderAssignedToMe && (
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#FFE66D" />
            <Text style={styles.infoText}>
              {orderDeliveryPersonId 
                ? 'This order is assigned to another delivery person. Please accept the order first.'
                : 'Please accept this order before you can mark it as picked up.'}
            </Text>
          </View>
        )}
        
        {/* Only show "Mark as Delivered" if order is assigned to current user */}
        {order.status === 'picked_up' && isOrderAssignedToMe && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deliveryButton]}
            onPress={() => setOtpModalVisible(true)}
          >
            <Ionicons name="checkmark-done" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Mark as Delivered</Text>
          </TouchableOpacity>
        )}

        {/* Proof controls - Only show if order is assigned to current user */}
        {(order.status === 'ready' || order.status === 'confirmed' || order.status === 'picked_up') && isOrderAssignedToMe && (
          <TouchableOpacity style={[styles.actionButton, styles.proofButton]} onPress={pickProofPhoto}>
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Add Photo Proof</Text>
          </TouchableOpacity>
        )}
        {proofPhotos.length > 0 && (
          <ScrollView horizontal style={{ marginTop: 8 }}>
            {proofPhotos.map((uri, i) => (
              <Image key={i} source={{ uri }} style={{ width: 64, height: 64, borderRadius: 8, marginRight: 8 }} />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Cash Collection Modal */}
      <Modal visible={showCashCollectionModal} animationType="slide" transparent onRequestClose={() => setShowCashCollectionModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Record Cash Collection</Text>
            <Text style={styles.modalSubtitle}>Enter the amount collected from customer</Text>
            
            <View style={styles.amountInputContainer}>
              <Text style={styles.inputLabel}>Amount Collected</Text>
              <TextInput 
                placeholder={`Rs ${order.pricing.total.toFixed(2)}`}
                keyboardType="decimal-pad"
                value={cashAmount}
                onChangeText={setCashAmount}
                style={styles.amountInput}
                placeholderTextColor="#999"
              />
              <Text style={styles.expectedAmount}>
                Expected: Rs {order.pricing.total.toFixed(2)}
              </Text>
            </View>

            <View style={styles.notesContainer}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput 
                placeholder="Add any notes about the payment..."
                value={cashNotes}
                onChangeText={setCashNotes}
                style={styles.notesInput}
                multiline
                numberOfLines={3}
                placeholderTextColor="#999"
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: '#E5E5E5' }]} 
                onPress={() => {
                  setShowCashCollectionModal(false);
                  setCashAmount('');
                  setCashNotes('');
                }}
              >
                <Text style={{ color: '#333', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                disabled={submitting || !cashAmount} 
                style={[styles.modalBtn, { backgroundColor: '#FF6B35', opacity: submitting || !cashAmount ? 0.7 : 1 }]} 
                onPress={async () => {
                  try {
                    setSubmitting(true);
                    const amount = parseFloat(cashAmount) || order.pricing.total;
                    await deliveryAPI.recordCashCollection(order._id, amount, cashNotes);
                    Alert.alert('Success', 'Cash collection recorded successfully');
                    setShowCashCollectionModal(false);
                    setCashAmount('');
                    setCashNotes('');
                    loadOrderDetails();
                  } catch (error: any) {
                    Alert.alert('Error', error?.response?.data?.message || 'Failed to record cash collection');
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>
                  {submitting ? 'Recording...' : 'Record Collection'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* OTP Modal */}
      <Modal visible={otpModalVisible} animationType="slide" transparent onRequestClose={() => setOtpModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Enter Delivery OTP</Text>
            <TextInput 
              placeholder="4-6 digit OTP"
              keyboardType="number-pad"
              value={otpValue}
              onChangeText={setOtpValue}
              style={styles.otpInput}
              maxLength={6}
            />
            <Text style={{ color: '#98A2B3', fontSize: 12, marginTop: 6 }}>OTP is valid for 4 hours.</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <Text style={{ color: '#98A2B3', fontSize: 12 }}>
                {resendAttempts >= 3 ? 'Max resends reached' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'You can resend OTP'}
              </Text>
              <TouchableOpacity disabled={resendCooldown > 0 || resendAttempts >= 3} onPress={handleResendOtp}>
                <Text style={{ color: resendCooldown > 0 || resendAttempts >= 3 ? '#8A8F9A' : '#FF6B35', fontWeight: '600' }}>Resend OTP</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#E5E5E5' }]} onPress={() => { setOtpModalVisible(false); setOtpValue(''); }}>
                <Text style={{ color: '#333', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={submitting || !otpValue} style={[styles.modalBtn, { backgroundColor: '#FF6B35', opacity: submitting || !otpValue ? 0.7 : 1 }]} onPress={() => handleUpdateStatus('delivered')}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{submitting ? 'Submitting...' : 'Confirm Delivery'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </View>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'placed': return '#FFE66D';
    case 'confirmed': return '#4ECDC4';
    case 'ready': return '#A8E6CF';
    case 'picked_up': return '#FF6B35';
    case 'delivered': return '#4ECDC4';
    default: return '#666';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
  },
  scrollContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    backgroundColor: '#12151C',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2430',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EDEFF5',
    textAlign: 'center',
  },
  mapContainer: {
    backgroundColor: '#1A1D24',
    padding: 20,
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#252B36',
  },
  section: {
    backgroundColor: '#1A1D24',
    padding: 20,
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#252B36',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EDEFF5',
    marginBottom: 12,
  },
  map: {
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  mapView: {
    flex: 1,
  },
  pickupMarker: {
    backgroundColor: '#4ECDC4',
    padding: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#1A1D24',
  },
  deliveryMarker: {
    backgroundColor: '#FF6B35',
    padding: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#1A1D24',
  },
  navButtons: {
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  pickupButton: {
    backgroundColor: '#4ECDC4',
  },
  deliveryButton: {
    backgroundColor: '#FF6B35',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#98A2B3',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#EDEFF5',
    fontWeight: '500',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#252B36',
  },
  itemName: {
    fontSize: 14,
    color: '#EDEFF5',
  },
  itemPrice: {
    fontSize: 14,
    color: '#EDEFF5',
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#98A2B3',
  },
  priceValue: {
    fontSize: 14,
    color: '#EDEFF5',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: '#252B36',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EDEFF5',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  actionSection: {
    padding: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  proofButton: {
    backgroundColor: '#3A3F4B',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
  },
  paymentSection: {
    marginTop: 16,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EDEFF5',
  },
  paymentPaidCard: {
    backgroundColor: '#1A3D2E',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A5D4E',
  },
  paymentPendingCard: {
    backgroundColor: '#3D2E1A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#5D4E2A',
  },
  paymentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentStatusInfo: {
    flex: 1,
  },
  paymentStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ECDC4',
    marginBottom: 4,
  },
  paymentPendingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 4,
  },
  paymentAmountText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EDEFF5',
  },
  paymentMethodText: {
    fontSize: 14,
    color: '#98A2B3',
    marginTop: 2,
  },
  cashCollectionInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A5D4E',
  },
  cashCollectionLabel: {
    fontSize: 12,
    color: '#98A2B3',
    marginBottom: 4,
  },
  cashCollectionStatus: {
    fontWeight: '600',
  },
  cashCollectionDate: {
    fontSize: 12,
    color: '#98A2B3',
    fontStyle: 'italic',
  },
  recordCashButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  recordCashButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  amountInputContainer: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  expectedAmount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  notesContainer: {
    marginTop: 16,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2E36',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3F4B',
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#98A2B3',
    lineHeight: 20,
  },
});

