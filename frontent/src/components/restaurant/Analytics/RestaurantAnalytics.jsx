import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  ShoppingBag,
  Star,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Package,
  UtensilsCrossed
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';

const RestaurantAnalytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    overview: {},
    sales: [],
    orders: [],
    customers: [],
    menuItems: [],
    revenue: {},
    performance: {}
  });
  const [dateRange, setDateRange] = useState('7d');
  // const [selectedMetric, setSelectedMetric] = useState('revenue'); // Unused for now

  // Fetch analytics data from API
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching analytics data...');
      
      // Get current restaurant ID from user data
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const restaurantId = userData._id;
      
      console.log('User data:', userData);
      console.log('Restaurant ID:', restaurantId);
      
      if (!restaurantId) {
        console.error('No restaurant ID found in user data');
        setLoading(false);
        return;
      }
      
      // Fetch different analytics endpoints
      const [overviewRes, salesRes, ordersRes, customersRes, menuItemsRes] = await Promise.all([
        api.get(`/restaurant/analytics/overview?period=${dateRange}`),
        api.get(`/restaurant/analytics/sales?period=${dateRange}`),
        api.get(`/restaurant/analytics/orders?period=${dateRange}`),
        api.get(`/restaurant/analytics/customers?period=${dateRange}`),
        api.get(`/restaurant/analytics/menu-items?period=${dateRange}`)
      ]);
      
      console.log('Analytics API Responses:', {
        overview: overviewRes.data,
        sales: salesRes.data,
        orders: ordersRes.data,
        customers: customersRes.data,
        menuItems: menuItemsRes.data
      });
      
      // Transform and combine the data
      const transformedData = {
        overview: overviewRes.data.success ? overviewRes.data.data : {},
        sales: salesRes.data.success ? salesRes.data.data : [],
        orders: ordersRes.data.success ? ordersRes.data.data : [],
        customers: customersRes.data.success ? customersRes.data.data : [],
        menuItems: menuItemsRes.data.success ? menuItemsRes.data.data : [],
        revenue: calculateRevenueMetrics(salesRes.data.success ? salesRes.data.data : []),
        performance: calculatePerformanceMetrics(ordersRes.data.success ? ordersRes.data.data : [])
      };
      
      console.log('Transformed analytics data:', transformedData);
      setAnalyticsData(transformedData);
      
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set fallback data structure
      setAnalyticsData({
        overview: {},
        sales: [],
        orders: [],
        customers: [],
        menuItems: [],
        revenue: {},
        performance: {}
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // Calculate revenue metrics
  const calculateRevenueMetrics = (salesData) => {
    if (!salesData || salesData.length === 0) {
      return {
        total: 0,
        growth: 0,
        average: 0,
        daily: []
      };
    }

    const total = salesData.reduce((sum, sale) => sum + (sale.amount || 0), 0);
    const average = total / salesData.length;
    
    // Calculate growth (compare with previous period)
    const currentPeriod = salesData.slice(-7); // Last 7 days
    const previousPeriod = salesData.slice(-14, -7); // Previous 7 days
    const currentTotal = currentPeriod.reduce((sum, sale) => sum + (sale.amount || 0), 0);
    const previousTotal = previousPeriod.reduce((sum, sale) => sum + (sale.amount || 0), 0);
    const growth = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

    return {
      total,
      growth,
      average,
      daily: salesData
    };
  };

  // Calculate performance metrics
  const calculatePerformanceMetrics = (ordersData) => {
    if (!ordersData || ordersData.length === 0) {
      return {
        totalOrders: 0,
        completedOrders: 0,
        averageRating: 0,
        completionRate: 0
      };
    }

    const totalOrders = ordersData.length;
    const completedOrders = ordersData.filter(order => order.status === 'delivered').length;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    
    const ratings = ordersData.filter(order => order.rating).map(order => order.rating);
    const averageRating = ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;

    return {
      totalOrders,
      completedOrders,
      averageRating,
      completionRate
    };
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, fetchAnalytics]);

  // Get date range label
  const getDateRangeLabel = (range) => {
    switch (range) {
      case '1d': return 'Today';
      case '7d': return 'Last 7 days';
      case '30d': return 'Last 30 days';
      case '90d': return 'Last 90 days';
      default: return 'Last 7 days';
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full">
        <div className="p-4 lg:p-6">
          {/* Header */}
          <div className="mb-6 lg:mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Restaurant Analytics</h1>
                <p className="text-gray-600">Track your restaurant's performance and insights</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="1d">Today</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
                <button
                  onClick={fetchAnalytics}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Revenue */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analyticsData.revenue.total || 0)}
                  </p>
                  <div className="flex items-center mt-1">
                    {analyticsData.revenue.growth >= 0 ? (
                      <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${analyticsData.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(analyticsData.revenue.growth || 0)}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsData.performance.totalOrders || 0}
                  </p>
                  <div className="flex items-center mt-1">
                    <span className="text-sm text-gray-500">
                      {analyticsData.performance.completionRate?.toFixed(1) || 0}% completed
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Average Rating */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsData.performance.averageRating?.toFixed(1) || 0}
                  </p>
                  <div className="flex items-center mt-1">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="text-sm text-gray-500">out of 5.0</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Active Customers */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Customers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsData.customers?.length || 0}
                  </p>
                  <div className="flex items-center mt-1">
                    <span className="text-sm text-gray-500">
                      {getDateRangeLabel(dateRange)}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
              <div className="h-64 flex items-center justify-center">
                {analyticsData.sales.length > 0 ? (
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Revenue data available</p>
                    <p className="text-xs text-gray-500">{analyticsData.sales.length} data points</p>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                    <p>No revenue data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Orders Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Orders Overview</h3>
                <PieChart className="w-5 h-5 text-gray-400" />
              </div>
              <div className="h-64 flex items-center justify-center">
                {analyticsData.orders.length > 0 ? (
                  <div className="text-center">
                    <Activity className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Orders data available</p>
                    <p className="text-xs text-gray-500">{analyticsData.orders.length} orders</p>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <PieChart className="w-12 h-12 mx-auto mb-2" />
                    <p>No orders data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Menu Items */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Top Menu Items</h3>
              <UtensilsCrossed className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {analyticsData.menuItems.length > 0 ? (
                analyticsData.menuItems.slice(0, 5).map((item, index) => (
                  <div key={item._id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-medium text-orange-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name || item.itemName || 'Unknown Item'}</p>
                        <p className="text-sm text-gray-500">{item.category || 'No category'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{item.orderCount || 0} orders</p>
                      <p className="text-sm text-gray-500">{formatCurrency(item.revenue || 0)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <UtensilsCrossed className="w-12 h-12 mx-auto mb-2" />
                  <p>No menu items data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              <button
                onClick={() => navigate('/restaurant/orders')}
                className="text-orange-600 hover:text-orange-700 text-sm font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {analyticsData.orders.length > 0 ? (
                analyticsData.orders.slice(0, 5).map((order, index) => (
                  <div key={order._id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Order #{order._id?.slice(-6) || order.orderId || 'N/A'}</p>
                        <p className="text-sm text-gray-500">
                          {order.customer?.name || order.customerName || 'Unknown Customer'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(order.totalAmount || 0)}</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-2" />
                  <p>No recent orders available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantAnalytics;
