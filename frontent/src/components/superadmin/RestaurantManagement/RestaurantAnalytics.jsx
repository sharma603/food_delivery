import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Clock, 
  Download,
  Calendar,
  RefreshCw,
  Building2,
  Search
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format, subDays } from 'date-fns';
import api from '../../../utils/api';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const RestaurantAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [dashboardData, setDashboardData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [menuData, setMenuData] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [operationsData, setOperationsData] = useState(null);
  
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestaurant) {
      fetchRestaurantAnalytics();
    }
  }, [selectedRestaurant, dateRange]);

  const fetchRestaurants = async () => {
    try {
      const response = await api.get('/superadmin/restaurants');
      setRestaurants(response.data.data || []);
      if (response.data.data && response.data.data.length > 0) {
        setSelectedRestaurant(response.data.data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurantAnalytics = async () => {
    if (!selectedRestaurant) return;
    
    try {
      setLoading(true);
      const [dashboard, sales, menu, customer, operations] = await Promise.all([
        api.get(`/restaurant/analytics/dashboard?restaurantId=${selectedRestaurant}&startDate=${dateRange.start}&endDate=${dateRange.end}`),
        api.get(`/restaurant/analytics/sales?restaurantId=${selectedRestaurant}&startDate=${dateRange.start}&endDate=${dateRange.end}&groupBy=day`),
        api.get(`/restaurant/analytics/menu?restaurantId=${selectedRestaurant}&startDate=${dateRange.start}&endDate=${dateRange.end}`),
        api.get(`/restaurant/analytics/customers?restaurantId=${selectedRestaurant}&startDate=${dateRange.start}&endDate=${dateRange.end}`),
        api.get(`/restaurant/analytics/operations?restaurantId=${selectedRestaurant}&startDate=${dateRange.start}&endDate=${dateRange.end}`)
      ]);

      setDashboardData(dashboard.data.data);
      setSalesData(sales.data.data);
      setMenuData(menu.data.data);
      setCustomerData(customer.data.data);
      setOperationsData(operations.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    try {
      const response = await api.get(
        `/restaurant/analytics/export?restaurantId=${selectedRestaurant}&type=${type}&startDate=${dateRange.start}&endDate=${dateRange.end}`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const restaurantName = restaurants.find(r => r._id === selectedRestaurant)?.restaurantName || 'restaurant';
      link.setAttribute('download', `${restaurantName}-analytics-${type}-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const handleQuickDateRange = (days) => {
    setDateRange({
      start: format(subDays(new Date(), days), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd')
    });
  };

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedRestaurantData = restaurants.find(r => r._id === selectedRestaurant);

  if (loading && !selectedRestaurant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading restaurants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Restaurant Analytics</h1>
            <p className="text-gray-500 mt-1">View comprehensive analytics for all restaurants</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => fetchRestaurantAnalytics()}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Restaurant Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center space-x-4">
          <Building2 className="w-6 h-6 text-blue-600" />
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Restaurant
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search restaurants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-2"
              />
            </div>
            <select
              value={selectedRestaurant || ''}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a restaurant...</option>
              {filteredRestaurants.map((restaurant) => (
                <option key={restaurant._id} value={restaurant._id}>
                  {restaurant.restaurantName} - {restaurant.email}
                </option>
              ))}
            </select>
          </div>
          {selectedRestaurantData && (
            <div className="bg-blue-50 px-4 py-3 rounded-lg">
              <p className="text-sm text-gray-600">Status</p>
              <p className={`text-lg font-semibold ${selectedRestaurantData.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                {selectedRestaurantData.isVerified ? 'Verified' : 'Pending'}
              </p>
            </div>
          )}
        </div>
      </div>

      {!selectedRestaurant ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Restaurant</h3>
          <p className="text-gray-500">Choose a restaurant from the dropdown above to view analytics</p>
        </div>
      ) : (
        <>
          {/* Date Range Filter */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <label className="text-sm font-medium text-gray-700">Date Range:</label>
                </div>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleQuickDateRange(7)}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => handleQuickDateRange(30)}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => handleQuickDateRange(90)}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Last 90 Days
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading analytics...</p>
              </div>
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              {dashboardData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                          ${dashboardData.revenue.total}
                        </p>
                        <div className="flex items-center mt-2">
                          <TrendingUp className={`w-4 h-4 ${dashboardData.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                          <span className={`text-sm ml-1 ${dashboardData.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {dashboardData.revenue.growth}%
                          </span>
                        </div>
                      </div>
                      <div className="bg-blue-100 p-3 rounded-full">
                        <DollarSign className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 font-medium">Total Orders</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                          {dashboardData.summary.totalOrders}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          {dashboardData.summary.completedOrders} completed
                        </p>
                      </div>
                      <div className="bg-green-100 p-3 rounded-full">
                        <ShoppingBag className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 font-medium">Avg Order Value</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                          ${dashboardData.revenue.averageOrderValue}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          {dashboardData.summary.completionRate}% completion
                        </p>
                      </div>
                      <div className="bg-yellow-100 p-3 rounded-full">
                        <TrendingUp className="w-6 h-6 text-yellow-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 font-medium">Customers</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                          {customerData?.summary.totalCustomers || 0}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          {customerData?.summary.retentionRate}% retention
                        </p>
                      </div>
                      <div className="bg-purple-100 p-3 rounded-full">
                        <Users className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Tabs */}
              <div className="bg-white rounded-lg shadow-sm mb-6">
                <div className="flex border-b border-gray-200 overflow-x-auto">
                  {['overview', 'sales', 'menu', 'customers', 'operations'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                        activeTab === tab
                          ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content - Same as RestaurantAnalyticsDashboard */}
              {activeTab === 'overview' && salesData && (
                <div className="space-y-6">
                  {/* Sales Trend Chart */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
                      <button
                        onClick={() => handleExport('sales')}
                        className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </button>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={salesData.salesTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="_id.day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#3B82F6" 
                          fill="#3B82F6" 
                          fillOpacity={0.6} 
                          name="Revenue ($)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Peak Hours */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Hours</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={salesData.peakHours}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="_id" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="orderCount" fill="#10B981" name="Orders" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Sales by Meal Time */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Meal Time</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={salesData.salesByMealTime}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry._id}: $${entry.revenue.toFixed(0)}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="revenue"
                          >
                            {salesData.salesByMealTime.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Sales Tab */}
              {activeTab === 'sales' && salesData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Payment Methods */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={salesData.paymentMethods}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry._id}: ${entry.count}`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="amount"
                          >
                            {salesData.paymentMethods.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Orders Trend */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders Trend</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={salesData.salesTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="_id.day" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="orders" stroke="#3B82F6" name="Orders" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Menu Tab */}
              {activeTab === 'menu' && menuData && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Top Selling Items</h3>
                    <button
                      onClick={() => handleExport('menu')}
                      className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Price</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {menuData.topSellingItems.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{item._id}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{item.totalQuantity}</td>
                            <td className="px-6 py-4 text-sm text-green-600 font-semibold">${item.totalRevenue.toFixed(2)}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">${item.avgPrice.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Category Performance */}
                  {menuData.categoryPerformance && menuData.categoryPerformance.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={menuData.categoryPerformance}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="category" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="totalRevenue" fill="#3B82F6" name="Revenue ($)" />
                          <Bar dataKey="totalQuantity" fill="#10B981" name="Quantity Sold" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {/* Customers Tab */}
              {activeTab === 'customers' && customerData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-sm font-medium text-gray-500">Total Customers</h3>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{customerData.summary.totalCustomers}</p>
                      <div className="mt-4">
                        <div className="flex items-center text-sm">
                          <span className="text-green-600 font-medium">+{customerData.summary.newCustomers}</span>
                          <span className="text-gray-500 ml-1">new customers</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-sm font-medium text-gray-500">Retention Rate</h3>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{customerData.summary.retentionRate}%</p>
                      <div className="mt-4">
                        <div className="flex items-center text-sm">
                          <span className="text-gray-600">{customerData.summary.returningCustomers} returning</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-sm font-medium text-gray-500">Avg Check Size</h3>
                      <p className="text-3xl font-bold text-gray-900 mt-2">${customerData.summary.avgCheckSize}</p>
                      <div className="mt-4">
                        <div className="flex items-center text-sm">
                          <span className="text-gray-500">per order</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rank
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Orders
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Spent
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Avg Order
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {customerData.topCustomers.slice(0, 10).map((customer, index) => (
                            <tr key={customer._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                #{index + 1}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {customer.orderCount}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                                ${customer.totalSpent.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                ${customer.avgOrderValue.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Operations Tab */}
              {activeTab === 'operations' && operationsData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-500">Avg Delivery Time</h3>
                        <Clock className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-3xl font-bold text-gray-900">
                        {operationsData.delivery.avgDeliveryTimeMinutes} min
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {operationsData.delivery.onTimeRate}% on-time rate
                      </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Food Cost</h3>
                      <p className="text-3xl font-bold text-gray-900">
                        {operationsData.costs.foodCostPercentage}%
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        ${operationsData.costs.estimatedFoodCost} total
                      </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Labor Cost</h3>
                      <p className="text-3xl font-bold text-gray-900">
                        {operationsData.costs.laborCostPercentage}%
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        ${operationsData.costs.estimatedLaborCost} total
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Performance</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">
                          {operationsData.delivery.totalDeliveries}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Total Deliveries</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {operationsData.delivery.onTimeDeliveries}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">On-Time</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">
                          {operationsData.delivery.lateDeliveries}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Late</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {operationsData.preparation.avgPreparationTimeMinutes} min
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Avg Prep Time</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> {operationsData.costs.note}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default RestaurantAnalytics;

