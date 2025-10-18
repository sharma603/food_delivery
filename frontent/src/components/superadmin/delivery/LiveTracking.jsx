import React, { useState, useEffect, useCallback } from 'react';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search, 
  Filter,
  Eye,
  RefreshCw,
  TrendingUp,
  Calendar,
  Download,
  Send,
  Building,
  User,
  Phone,
  Mail,
  Star,
  Award,
  Truck,
  Route
} from 'lucide-react';
import { superadminApi } from '../../../services/api/superadminApi';
import { trackingApi } from '../../../services/api/deliveryApi';
import LoadingSpinner from '../../common/LoadingSpinner';
import { formatCurrency } from '../../../utils/currency';

const LiveTracking = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Tracking data state
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [trackingStats, setTrackingStats] = useState({
    activeDeliveries: 0,
    completedToday: 0,
    averageDeliveryTime: 0,
    onTimeDeliveries: 0,
    delayedDeliveries: 0,
    totalDistance: 0
  });

  // Filter options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'picked_up', label: 'Picked Up' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'delayed', label: 'Delayed' }
  ];

  // Fetch tracking data
  const fetchTrackingData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      // Fetch active deliveries and stats from API
      const [deliveriesResponse, statsResponse] = await Promise.allSettled([
        trackingApi.getActiveDeliveries(),
        trackingApi.getTrackingStats()
      ]);

      // Handle deliveries data
      if (deliveriesResponse.status === 'fulfilled' && deliveriesResponse.value.success) {
        const deliveriesData = deliveriesResponse.value.data || deliveriesResponse.value.deliveries || [];
        setActiveDeliveries(Array.isArray(deliveriesData) ? deliveriesData : []);
      } else {
        console.error('Failed to fetch active deliveries:', deliveriesResponse.reason);
        setActiveDeliveries([]);
      }

      // Handle stats data
      if (statsResponse.status === 'fulfilled' && statsResponse.value.success) {
        const statsData = statsResponse.value.data || statsResponse.value.stats || {};
        setTrackingStats({
          activeDeliveries: statsData.activeDeliveries || 0,
          completedToday: statsData.completedToday || 0,
          averageDeliveryTime: statsData.averageDeliveryTime || 0,
          onTimeDeliveries: statsData.onTimeDeliveries || 0,
          delayedDeliveries: statsData.delayedDeliveries || 0,
          totalDistance: statsData.totalDistance || 0
        });
      } else {
        console.error('Failed to fetch tracking stats:', statsResponse.reason);
        setTrackingStats({
          activeDeliveries: 0,
          completedToday: 0,
          averageDeliveryTime: 0,
          onTimeDeliveries: 0,
          delayedDeliveries: 0,
          totalDistance: 0
        });
      }
      
    } catch (err) {
      console.error('Error fetching tracking data:', err);
      setError('Failed to load tracking data');
      setActiveDeliveries([]);
      setTrackingStats({
        activeDeliveries: 0,
        completedToday: 0,
        averageDeliveryTime: 0,
        onTimeDeliveries: 0,
        delayedDeliveries: 0,
        totalDistance: 0
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTrackingData();
    
    // Auto-refresh every 30 seconds if enabled
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchTrackingData();
      }, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchTrackingData, autoRefresh]);

  // Filter deliveries
  const filteredDeliveries = Array.isArray(activeDeliveries) ? activeDeliveries.filter(delivery => {
    if (!delivery) return false;
    
    const matchesSearch = (delivery.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (delivery.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (delivery.restaurantName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (delivery.deliveryPersonnel || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) : [];

  // Get status color and icon
  const getStatusInfo = (status) => {
    switch (status) {
      case 'assigned':
        return { 
          color: 'text-blue-600 bg-blue-100', 
          icon: User,
          iconColor: 'text-blue-600'
        };
      case 'picked_up':
        return { 
          color: 'text-purple-600 bg-purple-100', 
          icon: Truck,
          iconColor: 'text-purple-600'
        };
      case 'in_transit':
        return { 
          color: 'text-orange-600 bg-orange-100', 
          icon: Navigation,
          iconColor: 'text-orange-600'
        };
      case 'delivered':
        return { 
          color: 'text-green-600 bg-green-100', 
          icon: CheckCircle,
          iconColor: 'text-green-600'
        };
      case 'delayed':
        return { 
          color: 'text-red-600 bg-red-100', 
          icon: AlertCircle,
          iconColor: 'text-red-600'
        };
      default:
        return { 
          color: 'text-gray-600 bg-gray-100', 
          icon: Clock,
          iconColor: 'text-gray-600'
        };
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'normal': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Navigation className="mr-3 text-cyan-600" />
                Live Tracking
              </h1>
              <p className="text-gray-600 mt-2">Monitor active deliveries and track delivery personnel in real-time</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                  autoRefresh 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                <Clock className="mr-2 h-4 w-4" />
                Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={fetchTrackingData}
                disabled={isRefreshing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center">
                <Download className="mr-2 h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">{trackingStats.activeDeliveries}</p>
              </div>
              <div className="p-3 bg-cyan-100 rounded-full">
                <Navigation className="h-6 w-6 text-cyan-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-cyan-500 mr-1" />
              <span className="text-sm text-cyan-600">Currently in progress</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-gray-900">{trackingStats.completedToday}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">Successful deliveries</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Delivery Time</p>
                <p className="text-2xl font-bold text-gray-900">{trackingStats.averageDeliveryTime}min</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-sm text-blue-600">Today's average</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">On Time</p>
                <p className="text-2xl font-bold text-gray-900">{trackingStats.onTimeDeliveries}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">Delivered on time</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Delayed</p>
                <p className="text-2xl font-bold text-gray-900">{trackingStats.delayedDeliveries}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-sm text-red-600">Requires attention</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Distance</p>
                <p className="text-2xl font-bold text-gray-900">{trackingStats.totalDistance}km</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Route className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-purple-500 mr-1" />
              <span className="text-sm text-purple-600">Today's coverage</span>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by order ID, customer, restaurant, or personnel..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Active Deliveries Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Active Deliveries</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restaurant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personnel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ETA</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDeliveries.map((delivery) => {
                  const statusInfo = getStatusInfo(delivery.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <tr key={delivery.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{delivery.orderId}</div>
                          <div className="text-sm text-gray-500">{delivery.zone}</div>
                          <div className="text-sm text-gray-500">{formatCurrency(delivery.totalAmount)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{delivery.customerName}</div>
                          <div className="text-sm text-gray-500">{delivery.customerPhone}</div>
                          <div className="text-sm text-gray-500">{delivery.customerAddress}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{delivery.restaurantName}</div>
                          <div className="text-sm text-gray-500">{delivery.restaurantAddress}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{delivery.deliveryPersonnel}</div>
                          <div className="text-sm text-gray-500">{delivery.personnelPhone}</div>
                          <div className="text-sm text-gray-500">Location: {delivery.currentLocation}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <StatusIcon className={`h-4 w-4 mr-2 ${statusInfo.iconColor}`} />
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                            {delivery.status.replace('_', ' ').charAt(0).toUpperCase() + delivery.status.replace('_', ' ').slice(1)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(delivery.priority)}`}>
                            {delivery.priority.charAt(0).toUpperCase() + delivery.priority.slice(1)} Priority
                          </span>
                        </div>
                        {delivery.isDelayed && (
                          <div className="text-sm text-red-600 mt-1">
                            ⚠️ Delayed: {delivery.delayReason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{delivery.estimatedTimeRemaining} min</div>
                        <div className="text-sm text-gray-500">{formatDate(delivery.estimatedDelivery)}</div>
                        <div className="text-sm text-gray-500">{delivery.distance}km</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(delivery);
                              setShowDetailsModal(true);
                            }}
                            className="text-cyan-600 hover:text-cyan-900 flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Track
                          </button>
                          <button className="text-blue-600 hover:text-blue-900 flex items-center">
                            <Phone className="h-4 w-4 mr-1" />
                            Call
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delivery Details Modal */}
        {showDetailsModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Tracking Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Order ID</label>
                    <p className="text-sm text-gray-900">{selectedOrder.orderId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Customer</label>
                    <p className="text-sm text-gray-900">{selectedOrder.customerName}</p>
                    <p className="text-sm text-gray-500">{selectedOrder.customerPhone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Delivery Address</label>
                    <p className="text-sm text-gray-900">{selectedOrder.customerAddress}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Restaurant</label>
                    <p className="text-sm text-gray-900">{selectedOrder.restaurantName}</p>
                    <p className="text-sm text-gray-500">{selectedOrder.restaurantAddress}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Zone</label>
                    <p className="text-sm text-gray-900">{selectedOrder.zone}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Delivery Personnel</label>
                    <p className="text-sm text-gray-900">{selectedOrder.deliveryPersonnel}</p>
                    <p className="text-sm text-gray-500">{selectedOrder.personnelPhone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current Location</label>
                    <p className="text-sm text-gray-900">{selectedOrder.currentLocation}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusInfo(selectedOrder.status).color}`}>
                      {selectedOrder.status.replace('_', ' ').charAt(0).toUpperCase() + selectedOrder.status.replace('_', ' ').slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estimated Time Remaining</label>
                    <p className="text-sm text-gray-900">{selectedOrder.estimatedTimeRemaining} minutes</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Distance</label>
                    <p className="text-sm text-gray-900">{selectedOrder.distance} km</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Order Value</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedOrder.orderValue)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Delivery Charge</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedOrder.deliveryCharge)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(selectedOrder.totalAmount)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <p className="text-sm text-gray-900">{selectedOrder.paymentMethod}</p>
                  </div>
                </div>
                {selectedOrder.specialInstructions && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Special Instructions</label>
                    <p className="text-sm text-gray-900">{selectedOrder.specialInstructions}</p>
                  </div>
                )}
                {selectedOrder.isDelayed && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Delay Reason</label>
                    <p className="text-sm text-red-600">{selectedOrder.delayReason}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTracking;
