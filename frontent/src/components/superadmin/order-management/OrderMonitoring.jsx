import React, { useState, useEffect, useCallback } from 'react';
import { superadminApi } from '../../../services/api/superadminApi';
import WebSocketService from '../../../services/webSocketService';
import LoadingSpinner from '../../common/LoadingSpinner';
import './OrderMonitoring.css';

const OrderMonitoring = ({ user, onLogout }) => {
  // State management
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Real-time monitoring stats
  const [monitoringStats, setMonitoringStats] = useState({
    activeOrders: 0,
    preparingOrders: 0,
    readyOrders: 0,
    outForDelivery: 0,
    completedToday: 0,
    averageDeliveryTime: 0,
    onTimeDelivery: 0
  });

  // Fetch monitoring data
  const fetchMonitoringData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch order statistics
      const statsResponse = await superadminApi.getOrderStats();
      console.log('Stats response:', statsResponse);
      
      if (statsResponse.data?.success) {
        const statsData = statsResponse.data.data;
        setMonitoringStats({
          activeOrders: statsData.activeOrders || 0,
          preparingOrders: statsData.preparingOrders || 0,
          readyOrders: statsData.readyOrders || 0,
          outForDelivery: statsData.outForDelivery || 0,
          completedToday: statsData.completedToday || 0,
          averageDeliveryTime: statsData.averageDeliveryTime || 0,
          onTimeDelivery: statsData.onTimeDelivery || 0
        });
      } else {
        throw new Error('Invalid response format');
      }

      // Fetch recent orders with filters
      const ordersResponse = await superadminApi.getAllOrders({ 
        page: 1, 
        limit: 50,
        status: filterStatus === 'all' ? undefined : filterStatus,
        sort: sortBy,
        order: sortOrder
      });
      
      console.log('Orders response:', ordersResponse);
      
      if (ordersResponse.data?.success) {
        setOrders(ordersResponse.data.data?.orders || []);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      setError('Failed to fetch monitoring data. Please check your connection.');
      
      // Clear data when API fails
      setMonitoringStats({
        activeOrders: 0,
        preparingOrders: 0,
        readyOrders: 0,
        outForDelivery: 0,
        completedToday: 0,
        averageDeliveryTime: 0,
        onTimeDelivery: 0
      });
      
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, sortBy, sortOrder]);

  // Real-time WebSocket setup
  useEffect(() => {
    if (realTimeUpdates) {
      // Connect to WebSocket for real-time updates
      WebSocketService.connect('ws://localhost:5000', localStorage.getItem('token'));
      
      // Listen for order updates
      WebSocketService.on('orderUpdate', (data) => {
        console.log('Real-time order update:', data);
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === data.orderId 
              ? { ...order, ...data.updates }
              : order
          )
        );
      });

      // Listen for new orders
      WebSocketService.on('newOrder', (data) => {
        console.log('New order received:', data);
        setOrders(prevOrders => [data.order, ...prevOrders.slice(0, 19)]);
        setMonitoringStats(prev => ({
          ...prev,
          activeOrders: prev.activeOrders + 1
        }));
        
        // Add alert for new order
        setAlerts(prev => [{
          id: Date.now(),
          type: 'new_order',
          message: `New order #${data.order.orderNumber} from ${data.order.customer?.name}`,
          timestamp: new Date(),
          orderId: data.order._id
        }, ...prev.slice(0, 9)]);
      });

      // Listen for status changes
      WebSocketService.on('orderStatusChange', (data) => {
        console.log('Order status changed:', data);
        
        // Update monitoring stats
        setMonitoringStats(prev => {
          const newStats = { ...prev };
          // Decrease old status count
          if (data.oldStatus === 'preparing') newStats.preparingOrders--;
          if (data.oldStatus === 'ready') newStats.readyOrders--;
          if (data.oldStatus === 'picked_up') newStats.outForDelivery--;
          
          // Increase new status count
          if (data.newStatus === 'preparing') newStats.preparingOrders++;
          if (data.newStatus === 'ready') newStats.readyOrders++;
          if (data.newStatus === 'picked_up') newStats.outForDelivery++;
          if (data.newStatus === 'delivered') {
            newStats.completedToday++;
            newStats.activeOrders--;
          }
          
          return newStats;
        });

        // Update orders list
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === data.orderId 
              ? { ...order, status: data.newStatus }
              : order
          )
        );

        // Add alert for status change
        setAlerts(prev => [{
          id: Date.now(),
          type: 'status_change',
          message: `Order #${data.orderNumber} status changed to ${data.newStatus}`,
          timestamp: new Date(),
          orderId: data.orderId
        }, ...prev.slice(0, 9)]);
      });

      // Listen for delivery updates
      WebSocketService.on('deliveryUpdate', (data) => {
        console.log('Delivery update:', data);
        setAlerts(prev => [{
          id: Date.now(),
          type: 'delivery_update',
          message: `Delivery update for order #${data.orderNumber}`,
          timestamp: new Date(),
          orderId: data.orderId
        }, ...prev.slice(0, 9)]);
      });

      return () => {
        WebSocketService.disconnect();
      };
    }
  }, [realTimeUpdates]);

  // Load initial data
  useEffect(() => {
    fetchMonitoringData();
  }, [fetchMonitoringData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (realTimeUpdates) {
        fetchMonitoringData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchMonitoringData, realTimeUpdates]);

  // Toggle real-time updates
  const toggleRealTimeUpdates = () => {
    setRealTimeUpdates(!realTimeUpdates);
  };

  // Clear alerts
  const clearAlerts = () => {
    setAlerts([]);
  };

  // Toggle pause/play
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // Handle sorting
  const handleSort = () => {
    const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newOrder);
  };

  // Handle filter
  const handleFilter = () => {
    setShowFilterModal(!showFilterModal);
  };

  // Apply status filter
  const applyStatusFilter = (status) => {
    setFilterStatus(status);
    setShowFilterModal(false);
  };

  // View order details
  const viewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  // Call customer
  const callCustomer = (order) => {
    if (order.customer?.phone) {
      window.open(`tel:${order.customer.phone}`, '_self');
    } else {
      alert('Customer phone number not available');
    }
  };

  // Track order
  const trackOrder = (order) => {
    console.log('Tracking order:', order.orderNumber);
    // Implement tracking functionality
    alert(`Tracking order #${order.orderNumber}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'placed': return '#3498db';
      case 'confirmed': return '#f39c12';
      case 'preparing': return '#e67e22';
      case 'ready': return '#9b59b6';
      case 'picked_up': return '#34495e';
      case 'delivered': return '#27ae60';
      case 'cancelled': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'placed': return 'fas fa-shopping-cart';
      case 'confirmed': return 'fas fa-check-circle';
      case 'preparing': return 'fas fa-utensils';
      case 'ready': return 'fas fa-clock';
      case 'picked_up': return 'fas fa-truck';
      case 'delivered': return 'fas fa-check-double';
      case 'cancelled': return 'fas fa-times-circle';
      default: return 'fas fa-question-circle';
    }
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading && orders.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="order-monitoring">
      <div className="monitoring-header">
        <div className="header-content">
          <h1>Order Monitoring</h1>
          <p>Real-time monitoring of all active orders across the platform</p>
        </div>
        <div className="header-actions">
          <div className="real-time-toggle">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={realTimeUpdates}
                onChange={toggleRealTimeUpdates}
              />
              <span className="toggle-slider"></span>
            </label>
            <span className="toggle-label">
              {realTimeUpdates ? 'Live Updates On' : 'Live Updates Off'}
            </span>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              console.log('Manual refresh triggered');
              fetchMonitoringData();
            }}
            disabled={loading}
          >
            <i className={`fas fa-refresh ${loading ? 'fa-spin' : ''}`}></i> 
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Real-time Status Indicator */}
      {realTimeUpdates && (
        <div className="real-time-indicator">
          <div className="live-dot"></div>
          <span>
            <i className="fas fa-broadcast-tower"></i> Live Monitoring Active - 
            Auto-updating every 30 seconds
          </span>
        </div>
      )}

      {/* Monitoring Statistics - Compact */}
      <div className="monitoring-stats compact">
        <div className="stats-grid-compact">
          <div className="stat-compact active">
            <i className="fas fa-shopping-bag"></i>
            <span className="stat-value">{monitoringStats.activeOrders}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-compact preparing">
            <i className="fas fa-utensils"></i>
            <span className="stat-value">{monitoringStats.preparingOrders}</span>
            <span className="stat-label">Prep</span>
          </div>
          <div className="stat-compact ready">
            <i className="fas fa-clock"></i>
            <span className="stat-value">{monitoringStats.readyOrders}</span>
            <span className="stat-label">Ready</span>
          </div>
          <div className="stat-compact delivery">
            <i className="fas fa-truck"></i>
            <span className="stat-value">{monitoringStats.outForDelivery}</span>
            <span className="stat-label">Deliver</span>
          </div>
          <div className="stat-compact completed">
            <i className="fas fa-check-circle"></i>
            <span className="stat-value">{monitoringStats.completedToday}</span>
            <span className="stat-label">Done</span>
          </div>
          <div className="stat-compact performance">
            <i className="fas fa-tachometer-alt"></i>
            <span className="stat-value">{monitoringStats.averageDeliveryTime}m</span>
            <span className="stat-label">Avg</span>
          </div>
          <div className="stat-compact success">
            <i className="fas fa-percentage"></i>
            <span className="stat-value">{monitoringStats.onTimeDelivery}%</span>
            <span className="stat-label">On-Time</span>
          </div>
        </div>
      </div>

      {/* Real-time Alerts */}
      {alerts.length > 0 && (
        <div className="alerts-section">
          <div className="alerts-header">
            <h3>Real-time Alerts</h3>
            <button onClick={clearAlerts} className="btn btn-sm btn-secondary">
              Clear All
            </button>
          </div>
          <div className="alerts-list">
            {alerts.map((alert) => (
              <div key={alert.id} className={`alert-item alert-${alert.type}`}>
                <div className="alert-icon">
                  <i className={`fas fa-${alert.type === 'new_order' ? 'plus' : alert.type === 'status_change' ? 'exchange-alt' : 'truck'}`}></i>
                </div>
                <div className="alert-content">
                  <p>{alert.message}</p>
                  <span className="alert-time">{getTimeAgo(alert.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Orders Feed - Compact */}
      <div className="live-orders-feed compact">
        <div className="feed-header-compact">
          <div className="feed-title-compact">
            <h3><i className="fas fa-stream"></i> Orders ({orders.length})</h3>
          </div>
          <div className="feed-controls-compact">
            <button 
              className={`btn-compact ${showFilterModal ? 'active' : ''}`} 
              title="Filter"
              onClick={handleFilter}
            >
              <i className="fas fa-filter"></i>
            </button>
            <button 
              className="btn-compact" 
              title={`Sort ${sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}`}
              onClick={handleSort}
            >
              <i className={`fas fa-sort-${sortOrder === 'desc' ? 'amount-down' : 'amount-up'}`}></i>
            </button>
            <button 
              className={`btn-compact ${isPaused ? 'paused' : ''}`} 
              title={isPaused ? 'Resume' : 'Pause'}
              onClick={togglePause}
            >
              <i className={`fas fa-${isPaused ? 'play' : 'pause'}`}></i>
            </button>
          </div>
        </div>
        
        <div className="orders-feed">
          {loading ? (
            <div className="loading-container">
              <LoadingSpinner />
              <p>Loading orders...</p>
            </div>
          ) : (
            <div className="feed-items-compact">
              {(orders || []).map((order, index) => (
                <div key={order._id} className="feed-item-compact" style={{ animationDelay: `${index * 0.03}s` }}>
                  <div className="order-info">
                    <span className="order-number-compact">#{order.orderNumber}</span>
                    <span className="order-time-compact">{getTimeAgo(order.createdAt)}</span>
                  </div>
                  
                  <div className="order-details-compact">
                    <div className="customer-info-compact">
                      <i className="fas fa-user"></i>
                      <span>{order.customer?.name || 'Guest'}</span>
                    </div>
                    <div className="restaurant-info-compact">
                      <i className="fas fa-store"></i>
                      <span>{order.restaurant?.name || order.restaurant?.restaurantName || 'Restaurant'}</span>
                    </div>
                  </div>

                  <div className="order-summary-compact">
                    <span className="amount-compact">
                      RS {order.pricing?.total?.toFixed(2) || order.totalAmount?.toFixed(2) || '0.00'}
                    </span>
                    <span 
                      className="status-compact"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="actions-compact">
                    <button 
                      className="action-compact" 
                      title="View Details"
                      onClick={() => viewOrder(order)}
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button 
                      className="action-compact" 
                      title="Call Customer"
                      onClick={() => callCustomer(order)}
                    >
                      <i className="fas fa-phone"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="performance-metrics">
        <h3>Performance Metrics</h3>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div className="metric-content">
              <h4>Average Preparation Time</h4>
              <p>15 minutes</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">
              <i className="fas fa-truck"></i>
            </div>
            <div className="metric-content">
              <h4>Average Delivery Time</h4>
              <p>28 minutes</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">
              <i className="fas fa-percentage"></i>
            </div>
            <div className="metric-content">
              <h4>On-Time Delivery Rate</h4>
              <p>94.2%</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">
              <i className="fas fa-star"></i>
            </div>
            <div className="metric-content">
              <h4>Customer Satisfaction</h4>
              <p>4.8/5</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Filter Orders</h3>
              <button onClick={() => setShowFilterModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="filter-options">
                <button 
                  className={`filter-option ${filterStatus === 'all' ? 'active' : ''}`}
                  onClick={() => applyStatusFilter('all')}
                >
                  All Orders
                </button>
                <button 
                  className={`filter-option ${filterStatus === 'placed' ? 'active' : ''}`}
                  onClick={() => applyStatusFilter('placed')}
                >
                  Placed
                </button>
                <button 
                  className={`filter-option ${filterStatus === 'preparing' ? 'active' : ''}`}
                  onClick={() => applyStatusFilter('preparing')}
                >
                  Preparing
                </button>
                <button 
                  className={`filter-option ${filterStatus === 'ready' ? 'active' : ''}`}
                  onClick={() => applyStatusFilter('ready')}
                >
                  Ready
                </button>
                <button 
                  className={`filter-option ${filterStatus === 'picked_up' ? 'active' : ''}`}
                  onClick={() => applyStatusFilter('picked_up')}
                >
                  Out for Delivery
                </button>
                <button 
                  className={`filter-option ${filterStatus === 'delivered' ? 'active' : ''}`}
                  onClick={() => applyStatusFilter('delivered')}
                >
                  Delivered
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order #{selectedOrder.orderNumber}</h3>
              <button onClick={() => setShowOrderModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="order-details">
                <div className="detail-row">
                  <span className="label">Customer:</span>
                  <span className="value">{selectedOrder.customer?.name || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Restaurant:</span>
                  <span className="value">{selectedOrder.restaurant?.name || selectedOrder.restaurant?.restaurantName || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Status:</span>
                  <span 
                    className="value status-badge"
                    style={{ backgroundColor: getStatusColor(selectedOrder.status) }}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Total:</span>
                  <span className="value">RS {selectedOrder.pricing?.total?.toFixed(2) || selectedOrder.totalAmount?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Ordered:</span>
                  <span className="value">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <div className="modal-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => callCustomer(selectedOrder)}
                >
                  <i className="fas fa-phone"></i> Call Customer
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => trackOrder(selectedOrder)}
                >
                  <i className="fas fa-map-marker-alt"></i> Track Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Error Display */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
    </div>
  );
};

export default OrderMonitoring;
