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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { deliveryAPI } from '../services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { TextInput, Image } from 'react-native';

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
}

export default function OrderDetailScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [proofPhotos, setProofPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendAttempts, setResendAttempts] = useState(0);

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
              `You collected Rs. ${orderAmount.toFixed(2)} in cash from customer.\n\n💰 Delivery Fee Earned: Rs. ${deliveryFee.toFixed(2)}\n✅ Payment status updated to Paid\n📊 Earnings updated in dashboard`,
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

  const formatAddress = (addr: any) => {
    if (!addr) return '';
    if (typeof addr === 'string') return addr;
    const parts = [addr.street, addr.city, addr.state, addr.zipCode].filter(Boolean);
    return parts.join(', ');
  };

  const restaurantCoords = order.restaurant?.coordinates;
  const customerCoords = order.deliveryAddress?.coordinates;
  const hasRestaurantCoords = !!(restaurantCoords && typeof restaurantCoords.latitude === 'number' && typeof restaurantCoords.longitude === 'number');
  const hasCustomerCoords = !!(customerCoords && typeof customerCoords.latitude === 'number' && typeof customerCoords.longitude === 'number');

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#EDEFF5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.orderNumber}</Text>
        <View style={{ width: 24 }} />
      </View>

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
            <Text style={styles.detailValue}>{formatAddress(order.deliveryAddress)}</Text>
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
        {order.paymentMethod === 'cash_on_delivery' && (
          <View style={[styles.priceRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#252B36' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="cash" size={18} color="#FFD700" />
              <Text style={[styles.priceLabel, { fontWeight: '600' }]}>Payment Method: Cash on Delivery</Text>
            </View>
            <Text style={[styles.priceValue, { color: order.paymentStatus === 'paid' ? '#4ECDC4' : '#FFD700', fontWeight: 'bold' }]}>
              {order.paymentStatus === 'paid' ? 'Paid ✓' : 'Collect: Rs ' + order.pricing.total.toFixed(2)}
            </Text>
          </View>
        )}
        {order.paymentStatus === 'paid' && order.paymentMethod === 'cash_on_delivery' && (
          <View style={[styles.priceRow, { marginTop: 8, padding: 12, backgroundColor: '#1A3D2E', borderRadius: 8 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
              <Text style={[styles.priceLabel, { color: '#4ECDC4', fontWeight: '600' }]}>
                Payment Received: Rs {order.pricing.total.toFixed(2)}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        {(order.status === 'ready' || order.status === 'confirmed') && (
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
        
        {order.status === 'picked_up' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deliveryButton]}
            onPress={() => setOtpModalVisible(true)}
          >
            <Ionicons name="checkmark-done" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Mark as Delivered</Text>
          </TouchableOpacity>
        )}

        {/* Proof controls */}
        {(order.status === 'ready' || order.status === 'confirmed' || order.status === 'picked_up') && (
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#12151C',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2430',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EDEFF5',
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
});

