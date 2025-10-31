import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { deliveryAPI } from '../services/api';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { notificationService } from '../services/notificationService';
import { socketService } from '../services/socketService';
import EmptyState from '../components/common/EmptyState';

interface Order {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  restaurantName: string;
  restaurantAddress: string;
  status: 'pending' | 'placed' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled' | 'rejected';
  assignedAt?: string;
  pickedUpAt?: string;
  estimatedDelivery?: string;
  orderValue: number;
  deliveryCharge: number;
  totalAmount: number;
  paymentMethod: string;
  specialInstructions?: string;
  distance: number;
  estimatedTimeRemaining?: number;
}

export default function OrdersScreen() {
  const { user, isAuthenticated, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'my-orders' | 'available'>(
    params?.tab === 'available' ? 'available' : 'my-orders'
  );
  const isLoadingRef = useRef(false);
  const lastRefreshRef = useRef(0);

  useEffect(() => {
    // Wait for authentication to load
    if (authLoading) return;
    
    // Check if user is authenticated
    if (!isAuthenticated || !token || !user) {
      console.log('User not authenticated, redirecting to login');
      router.replace('/(auth)/login');
      return;
    }

    // Load orders once authenticated
    loadOrders();
    // Subscribe to instant order ready notifications
    const offReady = socketService.on('order:ready', async (payload: any) => {
      try {
        await notificationService.scheduleLocalNotification(
          payload?.title || 'New Order Ready',
          payload?.message || 'An order is ready for pickup',
          { type: 'new_order', orderId: payload?.order?._id },
          0
        );
      } catch {}
      // Auto refresh available list when on that tab (throttled)
      if (activeTab === 'available') {
        const now = Date.now();
        if (now - lastRefreshRef.current > 3000 && !isLoadingRef.current) {
          loadOrders();
        }
      }
    });
    return () => {
      // Clean up the socket listener when tab changes/unmounts
      offReady && offReady();
    };
  }, [activeTab, isAuthenticated, token, user, authLoading]);

  // Poll for new available orders when user is online
  useEffect(() => {
    // Wait for authentication
    if (!isAuthenticated || !token || !user) return;
    
    // Always allow access to orders screen - just poll when online
    if (!user?.isOnline) {
      // User can still view orders when offline, just won't auto-refresh
      return;
    }

    // Poll every 30 seconds for new orders when online
    const pollInterval = setInterval(() => {
      if (activeTab === 'available' && !isLoadingRef.current) {
        loadOrders();
      }
    }, 30000); // 30 seconds

    return () => {
      clearInterval(pollInterval);
    };
  }, [user?.isOnline, activeTab, isAuthenticated, token, user]);

  const loadOrders = async () => {
    try {
      // Check authentication before loading
      if (!isAuthenticated || !token || !user) {
        console.log('Cannot load orders: User not authenticated');
        setError('Please login to view orders');
        setLoading(false);
        return;
      }

      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setIsRefreshing(true);
      setLoading(true);
      setError(null);
      
      if (activeTab === 'my-orders') {
        const response = await deliveryAPI.getMyOrders();
        console.log('My Orders API response:', response.data);
        if (response.data.success) {
          const mapped = (response.data.data || []).map((o: any) => ({
            id: o._id || o.id,
            orderId: o.orderNumber || o._id,
            customerName: o.customer?.name || 'Customer',
            customerPhone: o.customer?.phone || '',
            customerAddress: typeof o.deliveryAddress === 'string' ? o.deliveryAddress : (
              o.deliveryAddress?.street || ''
            ),
            restaurantName: o.restaurant?.restaurantName || 'Restaurant',
            restaurantAddress: o.restaurant?.address || '',
            status: (o.status || 'pending') as Order['status'],
            assignedAt: o.assignedAt,
            pickedUpAt: o.pickedUpAt,
            estimatedDelivery: o.estimatedDeliveryTime,
            orderValue: o.pricing?.subtotal || 0,
            deliveryCharge: o.pricing?.deliveryFee || 0,
            totalAmount: o.pricing?.total || o.totalAmount || 0,
            paymentMethod: o.paymentMethod || '',
            specialInstructions: o.specialInstructions,
            distance: o.distance || 0,
          }));
          console.log('My Orders (mapped):', mapped);
          setOrders(mapped);
          setError(null);
        } else {
          setError(response.data.message || 'Failed to load orders');
          setOrders([]);
        }
      } else {
        const response = await deliveryAPI.getAvailableOrders();
        console.log('Available Orders API response:', response.data);
        if (response.data.success) {
          const mapped = (response.data.data || []).map((o: any) => ({
            id: o._id || o.id,
            orderId: o.orderNumber || o._id,
            customerName: o.customer?.name || 'Customer',
            customerPhone: o.customer?.phone || '',
            customerAddress: typeof o.deliveryAddress === 'string' ? o.deliveryAddress : (
              o.deliveryAddress?.street || ''
            ),
            restaurantName: o.restaurant?.restaurantName || 'Restaurant',
            restaurantAddress: o.restaurant?.address || '',
            status: (o.status || 'pending') as Order['status'],
            assignedAt: o.assignedAt,
            pickedUpAt: o.pickedUpAt,
            estimatedDelivery: o.estimatedDeliveryTime,
            orderValue: o.pricing?.subtotal || 0,
            deliveryCharge: o.pricing?.deliveryFee || 0,
            totalAmount: o.pricing?.total || o.totalAmount || 0,
            paymentMethod: o.paymentMethod || '',
            specialInstructions: o.specialInstructions,
            distance: o.distance || 0,
          }));
          console.log('Available Orders (mapped):', mapped);
          setAvailableOrders(mapped);
          setError(null);
        } else {
          setError(response.data.message || 'Failed to load available orders');
          setAvailableOrders([]);
        }
      }
    } catch (error: any) {
      console.error('Error loading orders:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
        url: error?.config?.url,
        baseURL: error?.config?.baseURL,
      });
      
      // Handle authentication errors
      if (error?.response?.status === 401) {
        setError('Session expired. Please login again.');
        // Redirect to login after a delay
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 2000);
      } else if (error?.response?.status === 403) {
        setError('You do not have permission to view orders');
      } else if (error?.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else if (error?.message?.includes('Network Error') || error?.code === 'NETWORK_ERROR') {
        setError('Network error. Please check your connection.');
      } else {
        setError(error?.response?.data?.message || error?.message || 'Failed to load orders');
      }
      
      // Gracefully show empty lists on client errors
      if (activeTab === 'my-orders') {
        setOrders([]);
      } else {
        setAvailableOrders([]);
      }
    } finally {
      setIsRefreshing(false);
      setLoading(false);
      isLoadingRef.current = false;
      lastRefreshRef.current = Date.now();
    }
  };

  const onRefresh = async () => {
    await loadOrders();
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const response = await deliveryAPI.acceptOrder(orderId);
      if (response.data.success) {
        Alert.alert('Success', 'Order accepted successfully');
        setModalVisible(false);
        // Navigate straight to active order detail for pickup navigation
        router.push({ pathname: '/order-detail', params: { orderId } });
        // Refresh lists in background
        loadOrders();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to accept order');
    }
  };

  const handlePickupOrder = async (orderId: string) => {
    try {
      const response = await deliveryAPI.pickupOrder(orderId);
      if (response.data.success) {
        Alert.alert('Success', 'Order picked up successfully');
        loadOrders();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pickup order');
    }
  };

  const handleDeliverOrder = async (orderId: string) => {
    try {
      const response = await deliveryAPI.deliverOrder(orderId);
      if (response.data.success) {
        const orderData = response.data.data;
        const deliveryFee = orderData?.pricing?.deliveryFee || 0;
        const isCOD = orderData?.paymentMethod === 'cash_on_delivery';
        const orderAmount = orderData?.pricing?.total || 0;
        
        if (isCOD) {
          Alert.alert(
            '✅ Order Delivered & Payment Received',
            `You collected Rs. ${orderAmount.toFixed(2)} in cash.\n\n💰 Delivery Fee: Rs. ${deliveryFee.toFixed(2)}\n✅ Earnings updated!`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            '✅ Order Delivered',
            `Order delivered successfully.\n\n💰 Delivery Fee Earned: Rs. ${deliveryFee.toFixed(2)}\n📊 Earnings updated!`,
            [{ text: 'OK' }]
          );
        }
        loadOrders();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to deliver order');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deliveryAPI.cancelOrder(orderId, 'Driver cancelled');
              if (response.data.success) {
                Alert.alert('Success', 'Order cancelled successfully');
                loadOrders();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel order');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FFE66D';
      case 'placed': return '#FFE66D';
      case 'confirmed': return '#4ECDC4';
      case 'preparing': return '#FFA500';
      case 'ready': return '#A8E6CF';
      case 'picked_up': return '#FF6B35';
      case 'in_transit': return '#FF6B35';
      case 'delivered': return '#4ECDC4';
      case 'cancelled': return '#FF6B6B';
      case 'rejected': return '#FF6B6B';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'placed': return 'Placed';
      case 'confirmed': return 'Confirmed';
      case 'preparing': return 'Preparing';
      case 'ready': return 'Ready';
      case 'picked_up': return 'Picked Up';
      case 'in_transit': return 'In Transit';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const renderOrderCard = (order: Order, isAvailable: boolean = false) => (
    <TouchableOpacity
      key={order.id}
      style={styles.orderCard}
      onPress={() => {
        // Navigate to order detail screen
        router.push({
          pathname: '/order-detail',
          params: { orderId: order.id }
        });
      }}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{order.orderId}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
        </View>
      </View>

      <View style={styles.orderInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="restaurant-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{String(order.restaurantName ?? '')}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{String(order.customerName ?? '')}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.infoText} numberOfLines={1}>
            {String(order.customerAddress ?? '')}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="cash-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{`Rs. ${Number(order.totalAmount ?? 0)}`}</Text>
        </View>
        {order.distance && (
          <View style={styles.infoRow}>
            <Ionicons name="navigate-outline" size={16} color="#666" />
            <Text style={styles.infoText}>{`${Number(order.distance ?? 0).toFixed(1)} km`}</Text>
          </View>
        )}
      </View>

      {isAvailable && (
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptOrder(order.id)}
        >
          <Text style={styles.acceptButtonText}>Accept Order</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderOrderDetails = () => {
    if (!selectedOrder) return null;

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Order Details</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Order Information</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order ID:</Text>
                <Text style={styles.detailValue}>#{selectedOrder.orderId}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={[styles.detailValue, { color: getStatusColor(selectedOrder.status) }]}>
                  {getStatusText(selectedOrder.status)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Amount:</Text>
                <Text style={styles.detailValue}>Rs. {selectedOrder.totalAmount}</Text>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Restaurant Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name:</Text>
                <Text style={styles.detailValue}>{selectedOrder.restaurantName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address:</Text>
                <Text style={styles.detailValue}>{selectedOrder.restaurantAddress}</Text>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Customer Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name:</Text>
                <Text style={styles.detailValue}>{selectedOrder.customerName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={styles.detailValue}>{selectedOrder.customerPhone}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address:</Text>
                <Text style={styles.detailValue}>{selectedOrder.customerAddress}</Text>
              </View>
            </View>

            {selectedOrder.specialInstructions && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Special Instructions</Text>
                <Text style={styles.detailValue}>{selectedOrder.specialInstructions}</Text>
              </View>
            )}

            <View style={styles.actionButtons}>
              {(selectedOrder.status === 'ready' || selectedOrder.status === 'confirmed') && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handlePickupOrder(selectedOrder.id)}
                >
                  <Text style={styles.actionButtonText}>Mark as Picked Up</Text>
                </TouchableOpacity>
              )}
              {selectedOrder.status === 'picked_up' && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeliverOrder(selectedOrder.id)}
                >
                  <Text style={styles.actionButtonText}>Mark as Delivered</Text>
                </TouchableOpacity>
              )}
              {(selectedOrder.status === 'ready' || selectedOrder.status === 'confirmed' || selectedOrder.status === 'picked_up') && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => handleCancelOrder(selectedOrder.id)}
                >
                  <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                    Cancel Order
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show authentication required message
  if (!isAuthenticated || !token || !user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Ionicons name="lock-closed" size={48} color="#FF6B35" />
        <Text style={styles.errorTitle}>Authentication Required</Text>
        <Text style={styles.errorMessage}>Please login to view orders</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={styles.loginButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'my-orders' && styles.activeTab]}
            onPress={() => setActiveTab('my-orders')}
          >
            <Text style={[styles.tabText, activeTab === 'my-orders' && styles.activeTabText]}>
              My Orders
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'available' && styles.activeTab]}
            onPress={() => setActiveTab('available')}
          >
            <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
              Available
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => { setError(null); loadOrders(); }}>
            <Ionicons name="refresh" size={20} color="#FF6B35" />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {loading && !isRefreshing ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : activeTab === 'my-orders' ? (
          orders.length > 0 ? (
            orders.map((order) => renderOrderCard(order))
          ) : (
            <EmptyState icon="list-outline" title="No orders yet" subtitle="Go online to start receiving delivery orders" />
          )
        ) : (
          availableOrders.length > 0 ? (
            availableOrders.map((order) => renderOrderCard(order, true))
          ) : (
            <EmptyState icon="search-outline" title="No available orders" subtitle="Check back later for new delivery opportunities" />
          )
        )}
      </ScrollView>

      {renderOrderDetails()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FF6B35',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  orderInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  acceptButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  actionButtons: {
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FF6B6B',
  },
  cancelButtonText: {
    color: '#fff',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFEBEE',
    padding: 12,
    margin: 12,
    marginTop: 0,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    color: '#D32F2F',
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
