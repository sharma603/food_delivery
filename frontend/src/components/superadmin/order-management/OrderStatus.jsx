import React, { useState, useEffect, useCallback } from 'react';
import { superadminApi } from '../../../services/api/superadminApi';
import WebSocketService from '../../../services/webSocketService';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import AppConfig from '../../../config/appConfig';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Package,
  Truck,
  Store,
  User
} from 'lucide-react';
import './OrderStatus.css';

const OrderStatus = ({ user, onLogout }) => {
  // State management
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'card' or 'list'

  // Real-time order status tracking
  const [statusCounts, setStatusCounts] = useState({
    placed: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    picked_up: 0,
    delivered: 0,
    cancelled: 0
  });

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Orders', color: '#6c757d' },
    { value: 'placed', label: 'Placed', color: '#3498db' },
    { value: 'confirmed', label: 'Confirmed', color: '#f39c12' },
    { value: 'preparing', label: 'Preparing', color: '#e67e22' },
    { value: 'ready', label: 'Ready', color: '#9b59b6' },
    { value: 'picked_up', label: 'Picked Up', color: '#34495e' },
    { value: 'delivered', label: 'Delivered', color: '#27ae60' },
    { value: 'cancelled', label: 'Cancelled', color: '#e74c3c' }
  ];

  // Fetch orders by status
  const fetchOrdersByStatus = useCallback(async (status = 'all') => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        limit: 50,
        status: status === 'all' ? '' : status
      };
      
      const response = await superadminApi.getAllOrders(params);
      setOrders(response.data?.data?.orders || []);
    } catch (error) {
      setError('Failed to fetch orders');
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch status counts
  const fetchStatusCounts = useCallback(async () => {
    try {
      const response = await superadminApi.getOrderStats();
      setStatusCounts(response.data?.data?.statusCounts || {
        placed: 0,
        confirmed: 0,
        preparing: 0,
        ready: 0,
        picked_up: 0,
        delivered: 0,
        cancelled: 0
      });
    } catch (error) {
      console.error('Error fetching status counts:', error);
      // Set default empty counts on error
      setStatusCounts({
        placed: 0,
        confirmed: 0,
        preparing: 0,
        ready: 0,
        picked_up: 0,
        delivered: 0,
        cancelled: 0
      });
    }
  }, []);

  // Real-time WebSocket setup
  useEffect(() => {
    if (realTimeUpdates) {
      // Connect to WebSocket for real-time updates
      WebSocketService.connect(AppConfig.API.WEBSOCKET_URL, localStorage.getItem('token'));
      
      // Listen for order status changes
      WebSocketService.on('orderStatusChange', (data) => {
        console.log('Real-time status change:', data);
        
        // Update status counts
        setStatusCounts(prev => {
          const newCounts = { ...prev };
          // Decrease old status count
          if (data.oldStatus && newCounts[data.oldStatus] > 0) {
            newCounts[data.oldStatus]--;
          }
          // Increase new status count
          if (data.newStatus) {
            newCounts[data.newStatus] = (newCounts[data.newStatus] || 0) + 1;
          }
          return newCounts;
        });

        // Update orders list if it matches current filter
        if (selectedStatus === 'all' || selectedStatus === data.newStatus) {
          setOrders(prevOrders => 
            prevOrders.map(order => 
              order._id === data.orderId 
                ? { ...order, status: data.newStatus }
                : order
            )
          );
        }
      });

      // Listen for new orders
      WebSocketService.on('newOrder', (data) => {
        console.log('New order received:', data);
        
        // Update status counts
        setStatusCounts(prev => ({
          ...prev,
          placed: prev.placed + 1
        }));

        // Add to orders list if showing all or placed orders
        if (selectedStatus === 'all' || selectedStatus === 'placed') {
          setOrders(prevOrders => [data.order, ...prevOrders]);
        }
      });

      return () => {
        WebSocketService.disconnect();
      };
    }
  }, [realTimeUpdates, selectedStatus]);

  // Load initial data
  useEffect(() => {
    fetchOrdersByStatus(selectedStatus);
    fetchStatusCounts();
  }, [selectedStatus]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (realTimeUpdates) {
        fetchOrdersByStatus(selectedStatus);
        fetchStatusCounts();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedStatus, realTimeUpdates]);

  // Handle status filter change
  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
    fetchOrdersByStatus(status);
  };

  // Handle order status update
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await superadminApi.updateOrderStatus(orderId, newStatus);
      // Real-time update will be handled by WebSocket
    } catch (error) {
      setError('Failed to update order status');
      console.error('Error updating order status:', error);
    }
  };

  // Toggle real-time updates
  const toggleRealTimeUpdates = () => {
    setRealTimeUpdates(!realTimeUpdates);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'placed': return Package;
      case 'confirmed': return CheckCircle;
      case 'preparing': return Clock;
      case 'ready': return AlertCircle;
      case 'picked_up': return Truck;
      case 'delivered': return CheckCircle;
      case 'cancelled': return XCircle;
      default: return AlertCircle;
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

  if (loading && (orders || []).length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="order-status">
      {/* Header */}
      <div className="order-status-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="page-title">Order Status Tracking</h1>
            <p className="page-subtitle">Real-time monitoring of order statuses across the platform</p>
          </div>
          <div className="header-actions">
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'card' ? 'active' : ''}`}
                onClick={() => setViewMode('card')}
                title="Card View"
              >
                <div className="grid-icon"></div>
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <div className="list-icon"></div>
              </button>
            </div>
            <div className="real-time-toggle">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={realTimeUpdates}
                  onChange={toggleRealTimeUpdates}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">Real-time</span>
              </label>
            </div>
            <button 
              className="btn btn-secondary"
              onClick={() => fetchOrdersByStatus(selectedStatus)}
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Status Indicator */}
      {realTimeUpdates && (
        <div className="real-time-indicator">
          <div className="live-dot"></div>
          <span>Live Status Updates Active</span>
        </div>
      )}

      {/* Status Overview Cards */}
      <div className="status-overview">
        <div className="status-cards-grid">
          {statusOptions.slice(1).map((status) => {
            const StatusIcon = getStatusIcon(status.value);
            return (
              <div 
                key={status.value}
                className={`status-card ${selectedStatus === status.value ? 'active' : ''}`}
                onClick={() => handleStatusFilter(status.value)}
              >
                <div className="status-icon">
                  <StatusIcon className="w-6 h-6" style={{ color: status.color }} />
                </div>
                <div className="status-info">
                  <h3 className="status-count">{statusCounts[status.value] || 0}</h3>
                  <p className="status-label">{status.label}</p>
                </div>
                <div className="status-indicator" style={{ backgroundColor: status.color }}></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="status-tabs">
        {statusOptions.map((status) => {
          const StatusIcon = getStatusIcon(status.value);
          return (
            <button
              key={status.value}
              className={`status-tab ${selectedStatus === status.value ? 'active' : ''}`}
              onClick={() => handleStatusFilter(status.value)}
              style={{ 
                borderBottomColor: selectedStatus === status.value ? status.color : 'transparent' 
              }}
            >
              <StatusIcon className="w-4 h-4" />
              <span>{status.label}</span>
              {status.value !== 'all' && (
                <span className="status-count">{statusCounts[status.value] || 0}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      <div className="orders-list">
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <LoadingSpinner />
            <p>Loading orders...</p>
          </div>
        ) : (
          <div className={`orders-container ${viewMode === 'list' ? 'list-view' : 'card-view'}`}>
            {(orders || []).map((order) => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-id">#{order.orderNumber}</div>
                  <div className="order-time">{getTimeAgo(order.createdAt)}</div>
                </div>
                
                <div className="order-info">
                  <div className="customer-info">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <strong>{order.customer?.name || 'N/A'}</strong>
                      <span>{order.customer?.email || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="restaurant-info">
                    <Store className="w-4 h-4 text-gray-500" />
                    <span>{order.restaurant?.name || 'N/A'}</span>
                  </div>
                  <div className="order-amount">
                    <span className="text-purple-600 font-bold text-sm">RS</span>
                    <strong>{order.pricing?.total?.toFixed(2) || '0.00'}</strong>
                  </div>
                </div>

                <div className="order-status-section">
                  <div className="current-status">
                    <span 
                      className="status-badge"
                      style={{ 
                        backgroundColor: statusOptions.find(s => s.value === order.status)?.color || '#6c757d' 
                      }}
                    >
                      {(() => {
                        const StatusIcon = getStatusIcon(order.status);
                        return <StatusIcon className="w-4 h-4" />;
                      })()}
                      {statusOptions.find(s => s.value === order.status)?.label || order.status}
                    </span>
                  </div>
                  
                  <div className="status-actions">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                      className="status-select"
                    >
                      {statusOptions.slice(1).map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="order-items">
                  <strong>Items:</strong>
                  <div className="items-list">
                    {order.items?.slice(0, 2).map((item, index) => {
                      // Construct image URL for static files
                      const baseUrl = AppConfig.API.BACKEND_BASE_URL;
                      const imageUrl = item?.menuItem?.image ? `${baseUrl}${item.menuItem.image}` : null;
                      
                      return (
                        <div key={index} className="item-card">
                          <div className="item-image">
                            {item?.menuItem?.image ? (
                              <img
                                src={imageUrl}
                                alt={item?.menuItem?.name || item?.name || 'Item'}
                                className="item-img"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className="item-placeholder" style={{ display: item?.menuItem?.image ? 'none' : 'flex' }}>
                              <Package className="w-3 h-3 text-gray-400" />
                            </div>
                          </div>
                          <div className="item-details">
                            <span className="item-name">{item.menuItem?.name || item?.name || 'Unknown Item'}</span>
                            <span className="item-quantity">{item.quantity || 1}x</span>
                          </div>
                        </div>
                      );
                    })}
                    {order.items?.length > 2 && (
                      <div className="item-card more">
                        <div className="item-image">
                          <div className="item-placeholder">
                            <Package className="w-3 h-3 text-gray-400" />
                          </div>
                        </div>
                        <div className="item-details">
                          <span className="item-name">+{order.items.length - 2} more items</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && (orders || []).length === 0 && (
          <div className="empty-state">
            <Package className="w-16 h-16 text-gray-400" />
            <h3>No orders found</h3>
            <p>No orders match the selected status filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderStatus;
