import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Animated,
  Dimensions,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { deliveryAPI } from '../services/api';
import { locationService } from '../services/locationService';
import { useRouter } from 'expo-router';
import { notificationService } from '../services/notificationService';
import MapView, { Marker } from 'react-native-maps';
// import { LineChart, BarChart } from 'react-native-chart-kit';

interface DashboardStats {
  todayEarnings: number;
  todayDeliveries: number;
  totalEarnings: number;
  totalDeliveries: number;
  completedDeliveries?: number;
  rating: number;
  onlineTime: string;
  hourlyEarnings: number;
  completionRate: number;
  averageDeliveryTime: number;
  weeklyTrend: Array<{ day: string; earnings: number; deliveries: number }>;
  recentOrders?: Array<{
    orderNumber: string;
    status: string;
    earnings?: number;
    deliveryTime?: string;
  }>;
  performanceMetrics: {
    onTimeDeliveries: number;
    customerRating: number;
    totalDistance: number;
    fuelEfficiency: number;
  };
}

interface RealTimeData {
  currentLocation: { latitude: number; longitude: number } | null;
  isTracking: boolean;
  activeOrders: number;
  estimatedEarnings: number;
  nextOrderETA: string | null;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, token, isAuthenticated, toggleOnlineStatus, updateLocation, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [realTimeData, setRealTimeData] = useState<RealTimeData>({
    currentLocation: null,
    isTracking: false,
    activeOrders: 0,
    estimatedEarnings: 0,
    nextOrderETA: null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    // Wait for authentication before hitting APIs or starting tracking
    if (!isAuthenticated || !token) return;

    loadDashboardData();
    startLocationTracking();
    setupNotifications();
    startAnimations();
    
    // Set up real-time updates with error handling
    let updateInterval: ReturnType<typeof setInterval> | null = null;
    let consecutiveFailures = 0;
    const MAX_CONSECUTIVE_FAILURES = 3;
    
    const scheduleUpdate = () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      
      updateInterval = setInterval(() => {
        if (isAuthenticated && token && user?.isOnline) {
          // Only update if user is online - saves unnecessary API calls
          updateRealTimeData().catch((error) => {
            consecutiveFailures++;
            // If we have too many consecutive failures, increase the interval
            if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
              if (updateInterval) {
                clearInterval(updateInterval);
              }
              // Increase interval to 30 seconds if there are too many failures
              updateInterval = setInterval(() => {
                if (isAuthenticated && token && user?.isOnline) {
                  updateRealTimeData().then(() => {
                    consecutiveFailures = 0; // Reset on success
                    // Resume normal interval after successful update
                    if (updateInterval) {
                      clearInterval(updateInterval);
                    }
                    scheduleUpdate();
                  }).catch(() => {
                    // Continue with slow updates
                  });
                }
              }, 30000); // 30 seconds
            }
          }).then(() => {
            consecutiveFailures = 0; // Reset on success
          });
        }
      }, 5000); // Normal interval: Update every 5 seconds
    };
    
    scheduleUpdate();

    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      locationService.stopTracking();
    };
  }, [isAuthenticated, token]);

  // Ensure navigation is available when user goes online
  useEffect(() => {
    // When user goes online, ensure they can navigate to all tabs
    if (user?.isOnline) {
      // No navigation restrictions - all tabs should be accessible
      console.log('User is online - all navigation tabs should be accessible');
    }
  }, [user?.isOnline]);

  const startLocationTracking = () => {
    if (!isAuthenticated || !token) return;
    locationService.startTracking((location) => {
      updateLocation(location.latitude, location.longitude);
      setRealTimeData(prev => ({
        ...prev,
        currentLocation: { latitude: location.latitude, longitude: location.longitude },
        isTracking: true,
      }));
    });
  };

  const setupNotifications = async () => {
    try {
      await notificationService.requestPermissions();
      // Set up notification listeners
      notificationService.addNotificationReceivedListener((notification) => {
        Vibration.vibrate(200);
        // Handle new order notifications
        if (notification.request.content.data?.type === 'new_order') {
          setRealTimeData(prev => ({
            ...prev,
            activeOrders: prev.activeOrders + 1,
          }));
        }
      });
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  const startAnimations = () => {
    // Pulse animation for online status
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Slide in animation for stats
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  const updateRealTimeData = async () => {
    if (!isAuthenticated || !token) return;
    
    // Fetch real-time data from backend
    try {
      const dashboardResponse = await deliveryAPI.getDashboard();
      if (dashboardResponse.data.success) {
        const dashboardData = dashboardResponse.data.data;
        setRealTimeData(prev => ({
          ...prev,
          activeOrders: dashboardData.recentOrders?.length || 0,
          estimatedEarnings: dashboardData.todayStats?.estimatedEarnings || 0,
          nextOrderETA: dashboardData.nextOrderETA || null,
        }));
      }
    } catch (error: any) {
      // Handle network errors gracefully - don't log them as errors since they're expected
      // when the device is offline or server is unreachable
      if (error?.code === 'NETWORK_ERROR' || error?.message === 'Network Error' || 
          error?.response === undefined) {
        // Network error - silently skip this update, will retry on next interval
        // Only log in development
        if (__DEV__) {
          console.log('Network unavailable - skipping real-time update');
        }
      } else if (error?.response?.status === 401) {
        // Authentication error - user might need to re-login
        // Don't spam logs, just log once
        console.warn('Authentication error in real-time update - token may be expired');
      } else if (error?.response?.status >= 500) {
        // Server error - log but don't spam
        if (__DEV__) {
          console.warn('Server error in real-time update:', error?.response?.status);
        }
      } else {
        // Other errors - only log unexpected ones
        if (__DEV__) {
          console.warn('Error updating real-time data:', error?.message || error);
        }
      }
      // Silently fail - the app should continue working even if real-time updates fail
    }
  };

  const loadDashboardData = async () => {
    if (!isAuthenticated || !token) {
      console.log('Cannot load dashboard: User not authenticated');
      return;
    }
    try {
      setIsLoading(true);
      
      // Fetch dashboard data from backend
      const dashboardResponse = await deliveryAPI.getDashboard();
      console.log('Dashboard API response:', dashboardResponse.data);
      
      if (dashboardResponse.data.success) {
        const dashboardData = dashboardResponse.data.data;
        
        setStats({
          todayEarnings: dashboardData.todayStats?.earnings || 0,
          todayDeliveries: dashboardData.todayStats?.deliveries || 0,
          totalEarnings: dashboardData.weeklyStats?.totalEarnings || 0,
          totalDeliveries: dashboardData.weeklyStats?.totalDeliveries || 0,
          completedDeliveries: dashboardData.performance?.completedDeliveries || dashboardData.weeklyStats?.totalDeliveries || 0,
          rating: user?.rating || 0,
          onlineTime: dashboardData.todayStats?.onlineTime || '0h 0m',
          hourlyEarnings: dashboardData.todayStats?.hourlyEarnings || 0,
          completionRate: dashboardData.performance?.completionRate || 0,
          averageDeliveryTime: dashboardData.performance?.averageDeliveryTime || 0,
          weeklyTrend: dashboardData.weeklyStats?.dailyBreakdown || [],
          recentOrders: dashboardData.recentOrders || [],
          performanceMetrics: {
            onTimeDeliveries: dashboardData.performance?.onTimeDeliveries || 0,
            customerRating: dashboardData.performance?.customerRating || 0,
            totalDistance: dashboardData.performance?.totalDistance || 0,
            fuelEfficiency: dashboardData.performance?.fuelEfficiency || 0,
          },
        });

        // Update real-time data
        setRealTimeData(prev => ({
          ...prev,
          activeOrders: dashboardData.recentOrders?.length || 0,
          estimatedEarnings: dashboardData.todayStats?.estimatedEarnings || 0,
          nextOrderETA: dashboardData.nextOrderETA || null,
        }));
      } else {
        const errorMsg = dashboardResponse.data.message || 'Failed to load dashboard data';
        console.error('Dashboard API returned error:', errorMsg);
        setError(errorMsg);
        // Set empty/default values with user data if available
        setStats({
          todayEarnings: 0,
          todayDeliveries: 0,
          totalEarnings: (user as any)?.totalEarnings || user?.earnings || 0,
          totalDeliveries: (user as any)?.totalDeliveries || user?.totalDeliveries || 0,
          completedDeliveries: 0,
          rating: user?.rating || 0,
          onlineTime: '0h 0m',
          hourlyEarnings: 0,
          completionRate: 0,
          averageDeliveryTime: 0,
          weeklyTrend: [],
          recentOrders: [],
          performanceMetrics: {
            onTimeDeliveries: 0,
            customerRating: user?.rating || 0,
            totalDistance: 0,
            fuelEfficiency: 0,
          },
        });
      }
    } catch (error: any) {
      console.error('Error loading dashboard data:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
        url: error?.config?.url,
      });
      
      // Handle specific error types
      if (error?.response?.status === 401) {
        setError('Session expired. Please login again.');
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 2000);
      } else if (error?.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else if (error?.message?.includes('Network Error') || error?.code === 'NETWORK_ERROR') {
        setError('Network error. Please check your connection.');
      } else {
        setError(error?.response?.data?.message || error?.message || 'Failed to load dashboard');
      }
      
      // Set empty/default values instead of mock data
      setStats({
        todayEarnings: 0,
        todayDeliveries: 0,
        totalEarnings: (user as any)?.totalEarnings || user?.earnings || 0,
        totalDeliveries: user?.totalDeliveries || 0,
        completedDeliveries: 0,
        rating: user?.rating || 0,
        onlineTime: '0h 0m',
        hourlyEarnings: 0,
        completionRate: 0,
        averageDeliveryTime: 0,
        weeklyTrend: [],
        recentOrders: [],
        performanceMetrics: {
          onTimeDeliveries: 0,
          customerRating: 0,
          totalDistance: 0,
          fuelEfficiency: 0,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const handleToggleStatus = async () => {
    try {
      setIsLoading(true);
      Vibration.vibrate(100);
      
      // Get current status before toggle
      const currentIsOnline = user?.isOnline || false;
      const newIsOnline = !currentIsOnline;
      
      console.log('Toggling status:', { currentIsOnline, newIsOnline });
      
      const success = await toggleOnlineStatus();
      
      if (success) {
        // Reload dashboard data to get updated stats
        await loadDashboardData();
        
        // Show success notification
        try {
          if (newIsOnline) {
            await notificationService.scheduleLocalNotification(
              'Status Updated',
              'You are now online and ready to receive orders',
              { type: 'status_update' },
              0
            );
          } else {
            await notificationService.scheduleLocalNotification(
              'Status Updated',
              'You are now offline',
              { type: 'status_update' },
              0
            );
          }
        } catch (notificationError) {
          console.error('Error showing notification:', notificationError);
        }
        
        Alert.alert(
          'Status Updated',
          newIsOnline ? 'You are now online and ready to receive orders' : 'You are now offline',
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to update status. Please try again.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error: any) {
      console.error('Error toggling status:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update status. Please check your connection and try again.';
      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    // Debug logging removed
    if (!user?.isOnline) return '#FF6B6B';
    if (user.status === 'on_duty') return '#4ECDC4';
    return '#FFE66D';
  };

  const getStatusText = () => {
    // Debug logging removed
    if (!user?.isOnline) return 'Offline';
    if (user.status === 'on_duty') return 'Online';
    return 'Busy';
  };

  const renderWeeklyChart = () => {
    if (!stats?.weeklyTrend) return null;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Weekly Earnings Trend</Text>
        <View style={styles.chartPlaceholder}>
          <Ionicons name="bar-chart-outline" size={48} color="#FF6B35" />
          <Text style={styles.chartPlaceholderText}>Chart visualization</Text>
          <Text style={styles.chartPlaceholderSubtext}>
            Weekly earnings: Rs. {stats.weeklyTrend.reduce((sum, day) => sum + day.earnings, 0)}
          </Text>
        </View>
      </View>
    );
  };

  const renderPerformanceChart = () => {
    if (!stats?.performanceMetrics) return null;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Performance Metrics</Text>
        <View style={styles.chartPlaceholder}>
          <Ionicons name="analytics-outline" size={48} color="#4ECDC4" />
          <Text style={styles.chartPlaceholderText}>Performance analytics</Text>
          <Text style={styles.chartPlaceholderSubtext}>
            Rating: {stats.performanceMetrics.customerRating}/5.0
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Good {getGreeting()},</Text>
            <Text style={styles.name}>{user?.name || 'Delivery Partner'}</Text>
            <View style={styles.headerStatus}>
              <View style={[styles.headerStatusDot, { backgroundColor: getStatusColor() }]} />
              <Text style={styles.headerStatusText}>{getStatusText()}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={28} color="#FF6B35" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton}>
              <Ionicons name="person-circle-outline" size={40} color="#FF6B35" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Card */}
        <Animated.View 
          style={[
            styles.statusCard,
            {
              transform: [
                { scale: user?.isOnline ? pulseAnim : 1 },
                { translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                })}
              ],
              opacity: slideAnim,
            }
          ]}
        >
          <View style={styles.statusInfo}>
            <Animated.View 
              style={[
                styles.statusIndicator, 
                { 
                  backgroundColor: getStatusColor(),
                  transform: [{ scale: user?.isOnline ? pulseAnim : 1 }]
                }
              ]} 
            />
            <View>
              <Text style={styles.statusText}>{getStatusText()}</Text>
              <Text style={styles.zoneText}>{user?.zoneName || 'No Zone Assigned'}</Text>
              {realTimeData.isTracking && (
                <Text style={styles.trackingText}>Location tracking active</Text>
              )}
              <Text style={styles.statusSubtext}>
                {user?.isOnline ? 'Ready to receive orders' : 'Not available for orders'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.toggleButton, { backgroundColor: getStatusColor() }]}
            onPress={handleToggleStatus}
            disabled={isLoading}
          >
            <Text style={styles.toggleButtonText}>
              {isLoading ? 'Updating...' : (user?.isOnline ? 'Go Offline' : 'Go Online')}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Real-time Data Card */}
        {user?.isOnline && (
          <Animated.View 
            style={[
              styles.realTimeCard,
              {
                transform: [{ translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                })}],
                opacity: slideAnim,
              }
            ]}
          >
            <Text style={styles.realTimeTitle}>Real-time Updates</Text>
            <View style={styles.realTimeGrid}>
              <View style={styles.realTimeItem}>
                <Ionicons name="list-outline" size={20} color="#FF6B35" />
                <Text style={styles.realTimeValue}>{realTimeData.activeOrders}</Text>
                <Text style={styles.realTimeLabel}>Active Orders</Text>
              </View>
              <View style={styles.realTimeItem}>
                <Ionicons name="cash-outline" size={20} color="#4ECDC4" />
                <Text style={styles.realTimeValue}>Rs. {realTimeData.estimatedEarnings.toFixed(0)}</Text>
                <Text style={styles.realTimeLabel}>Est. Earnings</Text>
              </View>
              <View style={styles.realTimeItem}>
                <Ionicons name="time-outline" size={20} color="#FFE66D" />
                <Text style={styles.realTimeValue}>{realTimeData.nextOrderETA || 'N/A'}</Text>
                <Text style={styles.realTimeLabel}>Next Order ETA</Text>
              </View>
            </View>
          </Animated.View>
        )}
      </View>

      {/* Stats Cards */}
      <Animated.View 
        style={[
          styles.statsContainer,
          {
            transform: [{ translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            })}],
            opacity: slideAnim,
          }
        ]}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={24} color="#4ECDC4" />
            <Text style={styles.statValue}>Rs. {stats?.todayEarnings || 0}</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
            <Text style={styles.statSubtext}>+Rs. {stats?.hourlyEarnings || 0}/hr</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="bicycle-outline" size={24} color="#FF6B35" />
            <Text style={styles.statValue}>{stats?.todayDeliveries || 0}</Text>
            <Text style={styles.statLabel}>Today's Deliveries</Text>
            <Text style={styles.statSubtext}>{stats?.averageDeliveryTime || 0}min avg</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="star-outline" size={24} color="#FFE66D" />
            <Text style={styles.statValue}>{stats?.rating?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
            <Text style={styles.statSubtext}>{stats?.completionRate || 0}% completion</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={24} color="#A8E6CF" />
            <Text style={styles.statValue}>{stats?.onlineTime || '0h 0m'}</Text>
            <Text style={styles.statLabel}>Online Time</Text>
            <Text style={styles.statSubtext}>Today</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-done-outline" size={24} color="#4ECDC4" />
            <Text style={styles.statValue}>{stats?.completedDeliveries || 0}</Text>
            <Text style={styles.statLabel}>Completed Orders</Text>
            <Text style={styles.statSubtext}>All time</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="wallet-outline" size={24} color="#A8E6CF" />
            <Text style={styles.statValue}>Rs. {stats?.totalEarnings || 0}</Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
            <Text style={styles.statSubtext}>All time</Text>
          </View>
        </View>
      </Animated.View>

      {/* Map Section */}
      {realTimeData.currentLocation && (
        <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>Your Location</Text>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: realTimeData.currentLocation.latitude,
              longitude: realTimeData.currentLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            region={{
              latitude: realTimeData.currentLocation.latitude,
              longitude: realTimeData.currentLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation
            showsMyLocationButton
          >
            <Marker
              coordinate={{
                latitude: realTimeData.currentLocation.latitude,
                longitude: realTimeData.currentLocation.longitude,
              }}
              title="You"
              description="Current location"
            />
          </MapView>
        </View>
      )}

      {/* Charts Section */}
      <View style={styles.chartsSection}>
        <View style={styles.chartsHeader}>
          <Text style={styles.sectionTitle}>Analytics</Text>
          <TouchableOpacity 
            style={styles.toggleChartsButton}
            onPress={() => setShowCharts(!showCharts)}
          >
            <Ionicons 
              name={showCharts ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color="#FF6B35" 
            />
          </TouchableOpacity>
        </View>
        
        {showCharts && (
          <Animated.View
            style={{
              opacity: slideAnim,
              transform: [{ translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              })}],
            }}
          >
            {renderWeeklyChart()}
            {renderPerformanceChart()}
          </Animated.View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(app)/(tabs)/orders')}>
            <Ionicons name="list-outline" size={24} color="#FF6B35" />
            <Text style={styles.actionText}>View Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(app)/(tabs)/earnings')}>
            <Ionicons name="cash-outline" size={24} color="#4ECDC4" />
            <Text style={styles.actionText}>Earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(app)/(tabs)/profile')}>
            <Ionicons name="person-outline" size={24} color="#FFE66D" />
            <Text style={styles.actionText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(app)/help')}>
            <Ionicons name="help-circle-outline" size={24} color="#95E1D3" />
            <Text style={styles.actionText}>Support</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.recentActivity}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {stats?.recentOrders && stats.recentOrders.length > 0 ? (
          stats.recentOrders.slice(0, 3).map((order: any, index: number) => (
            <View key={index} style={styles.activityCard}>
              <Ionicons 
                name={order.status === 'delivered' ? "checkmark-circle" : "time"} 
                size={20} 
                color={order.status === 'delivered' ? "#4ECDC4" : "#FFE66D"} 
              />
              <View style={styles.activityInfo}>
                <Text style={styles.activityText}>
                  Order #{order.orderNumber} {order.status === 'delivered' ? 'delivered successfully' : 'in progress'}
                </Text>
                <Text style={styles.activityTime}>
                  {order.status === 'delivered' ? `${order.earnings ? `Earned Rs. ${order.earnings}` : 'Completed'} • ${order.deliveryTime || '2 hours ago'}` : 'In progress'}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <>
            <View style={styles.activityCard}>
              <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
              <View style={styles.activityInfo}>
                <Text style={styles.activityText}>No recent orders</Text>
                <Text style={styles.activityTime}>Go online to start receiving orders</Text>
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};

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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  headerStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  headerStatusText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  profileButton: {
    padding: 4,
  },
  iconButton: {
    padding: 6,
    marginRight: 8,
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  zoneText: {
    fontSize: 14,
    color: '#666',
  },
  statusSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    fontStyle: 'italic',
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  recentActivity: {
    padding: 20,
    paddingBottom: 40,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityInfo: {
    marginLeft: 12,
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#333',
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  trackingText: {
    fontSize: 12,
    color: '#4ECDC4',
    marginTop: 2,
  },
  realTimeCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  realTimeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  realTimeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  realTimeItem: {
    alignItems: 'center',
    flex: 1,
  },
  realTimeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  realTimeLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  statSubtext: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
    textAlign: 'center',
  },
  chartsSection: {
    padding: 20,
  },
  mapSection: {
    padding: 20,
    paddingTop: 0,
  },
  map: {
    height: 220,
    borderRadius: 12,
  },
  chartsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleChartsButton: {
    padding: 8,
  },
  chartContainer: {
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
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  chartPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  chartPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  chartPlaceholderSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
