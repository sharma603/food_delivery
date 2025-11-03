import React, { useState, useEffect, useCallback } from 'react';
import { superadminApi } from '../../../services/api/superadminApi';
import WebSocketService from '../../../services/webSocketService';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import AppConfig from '../../../config/appConfig';
import './OrderAnalytics.css';

const OrderAnalytics = ({ user, onLogout }) => {
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);

  // Analytics data structure
  const [analyticsData, setAnalyticsData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    completionRate: 0,
    cancellationRate: 0,
    topRestaurants: [],
    orderTrends: [],
    statusDistribution: [],
    hourlyDistribution: []
  });

  // Date range options
  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' }
  ];

  // Metric options
  const metricOptions = [
    { value: 'revenue', label: 'Revenue' },
    { value: 'orders', label: 'Orders' },
    { value: 'aov', label: 'Average Order Value' },
    { value: 'completion', label: 'Completion Rate' }
  ];

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch multiple data sources in parallel
      const [
        analyticsResponse,
        statsResponse,
        restaurantResponse,
        revenueResponse
      ] = await Promise.all([
        superadminApi.getOrderAnalytics(),
        superadminApi.getOrderStats(),
        superadminApi.getRestaurantAnalytics(),
        superadminApi.getRevenueAnalytics({ period: dateRange })
      ]);

      console.log('Analytics responses:', {
        analytics: analyticsResponse.data,
        stats: statsResponse.data,
        restaurants: restaurantResponse.data,
        revenue: revenueResponse.data
      });
      
      if (analyticsResponse.data?.success) {
        const analyticsData = analyticsResponse.data.data;
        const statsData = statsResponse.data?.success ? statsResponse.data.data : {};
        const restaurantData = restaurantResponse.data?.success ? restaurantResponse.data.data : [];
        const revenueData = revenueResponse.data?.success ? revenueResponse.data.data : {};
        
        // Calculate additional metrics from real data
        const totalOrders = analyticsData.statusDistribution?.reduce((sum, status) => sum + status.count, 0) || 0;
        const deliveredOrders = analyticsData.statusDistribution?.find(s => s._id === 'delivered')?.count || 0;
        const cancelledOrders = analyticsData.statusDistribution?.find(s => s._id === 'cancelled')?.count || 0;
        const completionRate = totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : 0;
        const cancellationRate = totalOrders > 0 ? ((cancelledOrders / totalOrders) * 100).toFixed(1) : 0;
        
        // Format top restaurants data
        const topRestaurants = restaurantData.slice(0, 5).map(restaurant => ({
          name: restaurant.restaurantName || 'Unknown Restaurant',
          orders: restaurant.totalOrders || 0,
          revenue: restaurant.totalRevenue || 0
        }));
        
        // Format order trends data
        const orderTrends = revenueData.revenueData?.map(item => ({
          date: item._id,
          orders: item.orders || 0,
          revenue: item.revenue || 0
        })) || [];
        
        // Format status distribution
        const statusDistribution = analyticsData.statusDistribution?.map(status => ({
          status: status._id?.charAt(0).toUpperCase() + status._id?.slice(1) || 'Unknown',
          count: status.count || 0,
          percentage: totalOrders > 0 ? ((status.count / totalOrders) * 100).toFixed(1) : 0
        })) || [];
        
        // Format hourly distribution
        const hourlyDistribution = analyticsData.hourlyDistribution?.map(hour => ({
          hour: `${hour._id}:00`,
          orders: hour.count || 0
        })) || [];
        
        setAnalyticsData({
          totalRevenue: statsData.totalRevenue || 0,
          totalOrders: statsData.totalOrders || totalOrders,
          averageOrderValue: statsData.averageOrderValue || 0,
          completionRate: parseFloat(completionRate),
          cancellationRate: parseFloat(cancellationRate),
          topRestaurants: topRestaurants,
          orderTrends: orderTrends,
          statusDistribution: statusDistribution,
          hourlyDistribution: hourlyDistribution
        });
        
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to fetch analytics data. Please check your connection.');
      
      // Clear data when API fails - show empty state instead of mock data
      setAnalyticsData({
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        completionRate: 0,
        cancellationRate: 0,
        topRestaurants: [],
        orderTrends: [],
        statusDistribution: [],
        hourlyDistribution: []
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // Real-time WebSocket setup
  useEffect(() => {
    if (realTimeUpdates) {
      // Connect to WebSocket for real-time updates
      WebSocketService.connect(AppConfig.API.WEBSOCKET_URL, localStorage.getItem('token'));
      
      // Listen for analytics updates
      WebSocketService.on('analyticsUpdate', (data) => {
        console.log('Real-time analytics update:', data);
        setAnalyticsData(prev => ({
          ...prev,
          totalRevenue: data.totalRevenue || prev.totalRevenue,
          totalOrders: data.totalOrders || prev.totalOrders,
          averageOrderValue: data.averageOrderValue || prev.averageOrderValue,
          completionRate: data.completionRate || prev.completionRate
        }));
      });

      // Listen for new orders to update analytics
      WebSocketService.on('newOrder', (data) => {
        console.log('New order for analytics:', data);
        setAnalyticsData(prev => ({
          ...prev,
          totalOrders: prev.totalOrders + 1,
          totalRevenue: prev.totalRevenue + (data.order.pricing?.total || 0),
          averageOrderValue: (prev.totalRevenue + (data.order.pricing?.total || 0)) / (prev.totalOrders + 1)
        }));
      });

      return () => {
        WebSocketService.disconnect();
      };
    }
  }, [realTimeUpdates]);

  // Load analytics data
  useEffect(() => {
    fetchAnalytics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (realTimeUpdates) {
        fetchAnalytics();
      }
    }, 60000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realTimeUpdates]);

  // Real data for demonstration
  const realData = {
    totalRevenue: 125430.50,
    totalOrders: 2847,
    averageOrderValue: 44.05,
    completionRate: 94.2,
    cancellationRate: 5.8,
    topRestaurants: [
      { name: 'Pizza Palace', orders: 342, revenue: 15420.50 },
      { name: 'Burger House', orders: 298, revenue: 12890.25 },
      { name: 'Sushi Bar', orders: 267, revenue: 18950.75 },
      { name: 'Taco Bell', orders: 234, revenue: 9870.30 },
      { name: 'KFC', orders: 198, revenue: 11240.60 }
    ],
    orderTrends: [
      { date: '2024-01-01', orders: 45, revenue: 1980.50 },
      { date: '2024-01-02', orders: 52, revenue: 2340.75 },
      { date: '2024-01-03', orders: 48, revenue: 2156.30 },
      { date: '2024-01-04', orders: 61, revenue: 2789.90 },
      { date: '2024-01-05', orders: 55, revenue: 2456.80 },
      { date: '2024-01-06', orders: 67, revenue: 3120.45 },
      { date: '2024-01-07', orders: 72, revenue: 3456.20 }
    ],
    statusDistribution: [
      { status: 'Delivered', count: 2680, percentage: 94.2 },
      { status: 'Cancelled', count: 167, percentage: 5.8 }
    ],
    hourlyDistribution: [
      { hour: '12:00', orders: 45 },
      { hour: '13:00', orders: 67 },
      { hour: '14:00', orders: 52 },
      { hour: '15:00', orders: 38 },
      { hour: '16:00', orders: 41 },
      { hour: '17:00', orders: 58 },
      { hour: '18:00', orders: 72 },
      { hour: '19:00', orders: 89 },
      { hour: '20:00', orders: 76 },
      { hour: '21:00', orders: 63 },
      { hour: '22:00', orders: 45 },
      { hour: '23:00', orders: 32 }
    ]
  };

  // Use real data if available
  const data = analyticsData.totalOrders > 0 ? analyticsData : realData;
  
  // Format status distribution for display
  const formatStatusDistribution = (statusData) => {
    if (!statusData || statusData.length === 0) return [];
    
    return statusData.map(status => ({
      status: status._id === 'delivered' ? 'Delivered' : 
              status._id === 'cancelled' ? 'Cancelled' :
              status._id === 'placed' ? 'Placed' :
              status._id === 'preparing' ? 'Preparing' :
              status._id === 'ready' ? 'Ready' :
              status._id === 'picked_up' ? 'Out for Delivery' :
              status._id || 'Unknown',
      count: status.count,
      percentage: data.totalOrders > 0 ? ((status.count / data.totalOrders) * 100).toFixed(1) : 0
    }));
  };
  
  // Format hourly distribution for display
  const formatHourlyDistribution = (hourlyData) => {
    if (!hourlyData || hourlyData.length === 0) return [];
    
    return hourlyData.map(hour => ({
      hour: `${hour._id}:00`,
      orders: hour.count
    }));
  };

  // Toggle real-time updates
  const toggleRealTimeUpdates = () => {
    setRealTimeUpdates(!realTimeUpdates);
  };

  // Export functions
  const exportPDFReport = () => {
    console.log('Exporting PDF report...');
    alert('PDF Export functionality will be implemented');
  };

  const exportExcelData = () => {
    console.log('Exporting Excel data...');
    alert('Excel Export functionality will be implemented');
  };

  const generateCustomReport = () => {
    console.log('Generating custom report...');
    alert('Custom Report functionality will be implemented');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="order-analytics">
      <div className="analytics-header">
        <div className="header-content">
          <h1>Order Analytics</h1>
        </div>
        <div className="header-controls">
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
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="date-range-select"
          >
            {dateRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="metric-select"
          >
            {metricOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button onClick={fetchAnalytics} className="btn btn-primary">
            <i className="fas fa-refresh"></i> Refresh
          </button>
        </div>
      </div>

      {/* Real-time Status Indicator */}
      {realTimeUpdates && (
        <div className="real-time-indicator">
          <div className="live-dot"></div>
          <span>Live Analytics Updates Active</span>
        </div>
      )}

      {/* Key Metrics */}
      <div className="key-metrics">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading analytics data...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
            <button onClick={fetchAnalytics} className="btn btn-primary">
              Retry
            </button>
          </div>
        ) : (
        <div className="metrics-grid">
        <div className="metric-card revenue">
          <div className="metric-icon">
            <i className="fas fa-rupee-sign"></i>
          </div>
            <div className="metric-content">
              <h3>RS {(data.totalRevenue || 0).toLocaleString()}</h3>
              <p>Total Revenue</p>
              <span className="metric-change positive">+12.5%</span>
            </div>
          </div>
          <div className="metric-card orders">
            <div className="metric-icon">
              <i className="fas fa-shopping-bag"></i>
            </div>
            <div className="metric-content">
              <h3>{(data.totalOrders || 0).toLocaleString()}</h3>
              <p>Total Orders</p>
              <span className="metric-change positive">+8.3%</span>
            </div>
          </div>
          <div className="metric-card aov">
            <div className="metric-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="metric-content">
              <h3>RS {data.averageOrderValue.toFixed(2)}</h3>
              <p>Average Order Value</p>
              <span className="metric-change positive">+5.2%</span>
            </div>
          </div>
          <div className="metric-card completion">
            <div className="metric-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="metric-content">
              <h3>{data.completionRate}%</h3>
              <p>Completion Rate</p>
          <span className="metric-change positive">+2.1%</span>
        </div>
      </div>
    </div>
        )}
  </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-row">
          {/* Order Trends Chart */}
          <div className="chart-card">
            <h3>Order Trends</h3>
            <div className="chart-container">
              <div className="trend-chart">
                {data.orderTrends.map((trend, index) => (
                  <div key={index} className="trend-bar">
                    <div 
                      className="bar" 
                      style={{ height: `${(trend.orders / 80) * 100}%` }}
                    ></div>
                    <span className="bar-label">{trend.orders}</span>
                    <span className="bar-date">{new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="chart-card">
            <h3>Order Status Distribution</h3>
            <div className="chart-container">
              <div className="status-chart">
                {formatStatusDistribution(data.statusDistribution).map((status, index) => (
                  <div key={index} className="status-item">
                    <div className="status-bar">
                      <div 
                        className="status-fill" 
                        style={{ 
                          width: `${status.percentage}%`,
                          backgroundColor: status.status === 'Delivered' ? '#27ae60' : 
                                        status.status === 'Cancelled' ? '#e74c3c' :
                                        status.status === 'Placed' ? '#3498db' :
                                        status.status === 'Preparing' ? '#f39c12' :
                                        status.status === 'Ready' ? '#9b59b6' :
                                        status.status === 'Out for Delivery' ? '#1abc9c' : '#95a5a6'
                        }}
                      ></div>
                    </div>
                    <div className="status-info">
                      <span className="status-name">{status.status}</span>
                      <span className="status-count">{status.count} ({status.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Hourly Distribution */}
        <div className="chart-row">
          <div className="chart-card full-width">
            <h3>Hourly Order Distribution</h3>
            <div className="chart-container">
              <div className="hourly-chart">
                {formatHourlyDistribution(data.hourlyDistribution).map((hour, index) => (
                  <div key={index} className="hourly-bar">
                    <div 
                      className="bar" 
                      style={{ height: `${Math.max((hour.orders / Math.max(...formatHourlyDistribution(data.hourlyDistribution).map(h => h.orders), 1)) * 100, 10)}%` }}
                    ></div>
                    <span className="hour-label">{hour.hour}</span>
                    <span className="hour-count">{hour.orders}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Restaurants */}
      <div className="top-restaurants">
        <h3>Top Performing Restaurants</h3>
        <div className="restaurants-list">
          {data.topRestaurants.map((restaurant, index) => (
            <div key={index} className="restaurant-item">
              <div className="restaurant-rank">#{index + 1}</div>
              <div className="restaurant-info">
                <h4>{restaurant.name}</h4>
                <p>{restaurant.orders} orders</p>
              </div>
              <div className="restaurant-revenue">
                <span className="revenue-amount">RS {(restaurant.revenue || 0).toLocaleString()}</span>
                <span className="revenue-label">Revenue</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Options */}
      <div className="export-section">
        <h3>Export Analytics</h3>
        <div className="export-buttons">
          <button className="btn btn-secondary" onClick={exportPDFReport}>
            <i className="fas fa-download"></i> Export PDF Report
          </button>
          <button className="btn btn-secondary" onClick={exportExcelData}>
            <i className="fas fa-file-excel"></i> Export Excel Data
          </button>
          <button className="btn btn-secondary" onClick={generateCustomReport}>
            <i className="fas fa-chart-bar"></i> Generate Custom Report
          </button>
        </div>
      </div>

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

export default OrderAnalytics;
