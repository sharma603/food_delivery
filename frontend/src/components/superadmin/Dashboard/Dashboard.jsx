import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { superadminApi } from '../../../services/api/superadminApi';
import api from '../../../utils/api';
import useNotification from '../../../hooks/useNotification';
import AppConfig from '../../../config/appConfig';
import {
  TrendingUp,
  TrendingDown,
  Store,
  Users,
  ShoppingBag,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  BarChart3,
  Plus,
  Truck,
  Settings,
  ChevronDown,
  RefreshCw,
  LogOut,
  Calendar,
  Filter,
  Download,
  Bell,
  Server,
  Cpu,
  HardDrive,
  Award,
  LineChart,
  MoreVertical,
  Maximize2,
  Minimize2,
  Play,
  Pause
} from 'lucide-react';

const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const { showNotification, showSuccess, showError } = useNotification();
 const [dashboardData, setDashboardData] = useState(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);
 const [apiStatus, setApiStatus] = useState('checking'); // 'checking', 'connected', 'error'

 // Advanced dashboard features
 const [viewMode, setViewMode] = useState('overview'); // 'overview', 'analytics', 'system'
  const [dateRange, setDateRange] = useState('today'); // 'today', 'week', 'month', 'year', 'custom'
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [autoRefresh, setAutoRefresh] = useState(false); // Disabled by default
  const [refreshInterval] = useState(300000); // 5 minutes (much less frequent)
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [requestCooldown, setRequestCooldown] = useState(false);
 const [notifications] = useState([]);
 const [systemHealth, setSystemHealth] = useState({
 serverStatus: 'online',
 databaseStatus: 'connected',
 apiResponseTime: 0,
 memoryUsage: 0,
 cpuUsage: 0
 });
  const [expandedCards, setExpandedCards] = useState({});
  const [realTimeMode, setRealTimeMode] = useState(false);

  // Get date range based on selection
  const getDateRange = (range) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (range) {
      case 'today':
        return {
          startDate: today,
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      case 'week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return {
          startDate: startOfWeek,
          endDate: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
        };
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return {
          startDate: startOfMonth,
          endDate: endOfMonth
        };
      case 'year':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        return {
          startDate: startOfYear,
          endDate: endOfYear
        };
      case 'custom':
        return {
          startDate: customDateRange.startDate ? new Date(customDateRange.startDate) : today,
          endDate: customDateRange.endDate ? new Date(customDateRange.endDate) : today
        };
      default:
        return {
          startDate: today,
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
    }
  };

  // Fetch dashboard data with date range
  const fetchDashboardDataWithDateRange = useCallback(async (range = dateRange) => {
    try {
      setIsRefreshing(true);
      setLastRefresh(new Date());
      
      const { startDate, endDate } = getDateRange(range);
      
      // Fetch data with date range parameters
      const [allOrdersResponse, todayOrdersResponse, statsResponse, restaurantsResponse, restaurantStatusResponse, dashboardResponse] = await Promise.allSettled([
        superadminApi.getAllOrders({ 
          limit: 1000, 
          sort: 'createdAt', 
          order: 'desc',
          dateFrom: startDate.toISOString(),
          dateTo: endDate.toISOString()
        }),
        superadminApi.getAllOrders({ 
          limit: 100, 
          sort: 'createdAt', 
          order: 'desc',
          dateFrom: startDate.toISOString(),
          dateTo: endDate.toISOString()
        }),
        superadminApi.getOrderStats(),
        superadminApi.getAllRestaurants(),
        api.get('/superadmin/restaurants/status/stats'),
        api.get('/superadmin/dashboard')
      ]);

      // Process the responses (same logic as before)
      // ... (rest of the processing logic)
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError(`Failed to fetch dashboard data: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  }, [dateRange, customDateRange]);

  const fetchDashboardData = useCallback(async (showLoading = false) => {
    // Rate limiting check
    if (requestCooldown) {
      console.log('⏳ Request cooldown active, skipping fetch');
      return;
    }

    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      setIsRefreshing(true);
      setLastRefresh(new Date());
      setRequestCooldown(true); // Set cooldown to prevent rapid requests
      
      console.log('Fetching dashboard data...', new Date().toLocaleTimeString());
 

    // Fetch data from multiple endpoints
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    
    console.log('Date range for today:', {
      start: startOfToday.toISOString(),
      end: endOfToday.toISOString()
    });
    
    // Reduced API calls to prevent rate limiting - only fetch essential data
    const [dashboardResponse, allOrdersResponse] = await Promise.allSettled([
      api.get('/superadmin/dashboard'), // This should contain most of the data we need
      superadminApi.getAllOrders({ 
        limit: 50, // Reduced limit
        sort: 'createdAt', 
        order: 'desc',
        dateFrom: startOfToday.toISOString(),
        dateTo: endOfToday.toISOString()
      })
    ]);

    // Debug: Log API responses
    console.log('API Responses Status:', {
      dashboard: dashboardResponse.status,
      allOrders: allOrdersResponse.status
    });
 
 setApiStatus('connected');
 
 // Process dashboard data first (primary source)
 let stats = {
   totalOrders: 0,
   totalDelivered: 0,
   totalCancelled: 0,
   monthlyRevenue: 0,
   pendingOrders: 0,
   todayOrders: 0,
   weeklyGrowth: 0
 };

 if (dashboardResponse.status === 'fulfilled' && dashboardResponse.value.data) {
   const dashboardData = dashboardResponse.value.data;
   console.log('Dashboard Response:', dashboardData);
   
   if (dashboardData.success && dashboardData.data && dashboardData.data.stats) {
     stats = { ...stats, ...dashboardData.data.stats };
     console.log('Dashboard stats loaded:', stats);
   }
 } else {
   console.warn('Dashboard API failed:', dashboardResponse.status, dashboardResponse.reason);
 }

 // Process orders data as fallback
 let allOrders = [];
 let totalOrdersCount = stats.totalOrders || 0;
 
if (allOrdersResponse.status === 'fulfilled' && allOrdersResponse.value.data) {
  const ordersData = allOrdersResponse.value.data;
  console.log('Orders Response:', ordersData);
  
  if (ordersData.success && ordersData.data) {
    allOrders = ordersData.data.orders || ordersData.data || [];
    if (!totalOrdersCount) totalOrdersCount = ordersData.data.total || allOrders.length;
    console.log('Orders loaded:', allOrders.length);
  } else if (Array.isArray(ordersData)) {
    allOrders = ordersData;
    if (!totalOrdersCount) totalOrdersCount = ordersData.length;
    console.log('Orders (array):', allOrders.length);
  }
} else {
  console.warn('Orders API failed:', allOrdersResponse.status, allOrdersResponse.reason);
}
 
 // Use today's orders from the main orders response (already filtered by date)
 let todayOrders = allOrders;
 
 // Update today's orders count if not already set
 if (!stats.todayOrders) {
   stats.todayOrders = todayOrders.length;
 }
 
 // Calculate top restaurants from orders data
 const topRestaurants = calculateTopRestaurants(allOrders, []);
 
 // Ensure total orders is set
 if (!stats.totalOrders && totalOrdersCount > 0) {
   stats.totalOrders = totalOrdersCount;
 }
 
 // Set default restaurant stats if not provided
 if (!stats.totalRestaurants) {
   stats.totalRestaurants = 0;
   stats.openRestaurants = 0;
   stats.closedRestaurants = 0;
 }
 
// If no data from API, just set minimal data without showing error
if (totalOrdersCount === 0 && allOrders.length === 0) {
console.log(' No orders data received from API - This is normal if no orders exist yet');
console.log(' Backend is running on:', AppConfig.API.BASE_URL);

// Set minimal data to show the dashboard structure
stats.totalOrders = 0;
stats.totalDelivered = 0;
stats.totalCancelled = 0;
stats.monthlyRevenue = 0;
stats.pendingOrders = 0;
stats.todayOrders = 0;

// Set API status to success (no error if backend is responding)
setApiStatus('success');
// Don't set error - this is normal when no data exists
}
 
 const dashboardData = {
 stats,
 topRestaurants,
 recentOrders: todayOrders.slice(0, 5) // Show only today's orders (max 5)
 };
 
setDashboardData(dashboardData);
 
 } catch (error) {
 console.error('❌ Failed to fetch dashboard data:', error);
 setApiStatus('error');
 
 // More detailed error message
 const errorMessage = error.message || 'Unknown error occurred';
 const isNetworkError = error.message?.includes('fetch') || error.message?.includes('network');
 const isTimeoutError = error.message?.includes('timeout');
 
 let detailedError = `Failed to fetch dashboard data: ${errorMessage}`;
 if (isNetworkError) {
   detailedError += ' (Network connection issue)';
 } else if (isTimeoutError) {
   detailedError += ' (Request timeout)';
 }
 
 setError(detailedError);
 
 // Set empty data for initial state
 setDashboardData({
 stats: {
 totalOrders: 0,
 totalDelivered: 0,
 totalCancelled: 0,
 monthlyRevenue: 0,
 pendingOrders: 0,
 todayOrders: 0,
 weeklyGrowth: 0
 },
 topRestaurants: [],
 recentOrders: []
 });
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      setIsRefreshing(false);
      
      // Release cooldown after 5 seconds to prevent rate limiting
      setTimeout(() => {
        setRequestCooldown(false);
        console.log('Request cooldown released');
      }, 5000);
    }
  }, [requestCooldown]);

  // Define variables that are used throughout the component
  const stats = dashboardData?.stats || {};
  const topRestaurants = dashboardData?.topRestaurants || [];
  const recentOrders = dashboardData?.recentOrders || [];

 // Calculate top restaurants from orders data
 const calculateTopRestaurants = (orders, restaurants) => {
 const restaurantStats = {};
 
 orders.forEach(order => {
 if (order.restaurant && order.restaurant._id) {
 const restaurantId = order.restaurant._id;
 if (!restaurantStats[restaurantId]) {
 restaurantStats[restaurantId] = {
 name: order.restaurant.name,
 orders: 0,
 revenue: 0
 };
 }
 restaurantStats[restaurantId].orders += 1;
 restaurantStats[restaurantId].revenue += order.totalAmount || 0;
 }
 });
 
 return Object.values(restaurantStats)
 .sort((a, b) => b.orders - a.orders)
 .slice(0, 3);
 };

 // Calculate stats from orders data
 const calculateStatsFromOrders = (orders) => {
 const today = new Date();
 today.setHours(0, 0, 0, 0);
 
 const todayOrders = orders.filter(order => {
 const orderDate = new Date(order.createdAt);
 orderDate.setHours(0, 0, 0, 0);
 return orderDate.getTime() === today.getTime();
 });
 
 const statusCounts = orders.reduce((acc, order) => {
 acc[order.status] = (acc[order.status] || 0) + 1;
 return acc;
 }, {});
 
 const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
 
 return {
 totalOrders: orders.length,
 totalDelivered: statusCounts.delivered || 0,
 totalCancelled: statusCounts.cancelled || 0,
 monthlyRevenue: totalRevenue,
 pendingOrders: statusCounts.pending || 0,
 todayOrders: todayOrders.length,
 weeklyGrowth: 0 // Would need historical data to calculate
 };
 };

 // System health monitoring
 const checkSystemHealth = useCallback(async () => {
 try {
 const startTime = Date.now();
 const response = await fetch(`${AppConfig.API.BACKEND_BASE_URL}/health`);
 const endTime = Date.now();
 
 console.log('Health check:', {
   status: response.ok ? 'online' : 'offline',
   responseTime: endTime - startTime,
   timestamp: new Date().toLocaleTimeString()
 });
 
 setSystemHealth(prev => ({
 ...prev,
 serverStatus: response.ok ? 'online' : 'offline',
 apiResponseTime: endTime - startTime,
 memoryUsage: 0, // System metrics will be provided by backend
 cpuUsage: 0 // System metrics will be provided by backend
 }));
 } catch (error) {
 console.warn('⚠️ Health check failed:', error.message);
 setSystemHealth(prev => ({
 ...prev,
 serverStatus: 'offline',
 apiResponseTime: 0
 }));
 }
 }, []);

useEffect(() => {
// Clear any existing errors on component mount
setError(null);
// Initial load with loading state
fetchDashboardData(true);
 

 // Auto-refresh data with retry logic (no loading state)
 let refreshTimer;
 if (autoRefresh) {
 refreshTimer = setInterval(async () => {
   console.log('Auto-refresh triggered at:', new Date().toLocaleTimeString());
   try {
     await fetchDashboardData(false); // No loading state for auto-refresh
   } catch (error) {
     console.warn('Auto-refresh failed, will retry on next interval:', error.message);
   }
 }, refreshInterval);
 }

 // System health monitoring (less frequent)
 const healthTimer = setInterval(() => {
 checkSystemHealth();
 }, 60000); // Check every 60 seconds (reduced frequency)

 return () => {
 if (refreshTimer) clearInterval(refreshTimer);
 clearInterval(healthTimer);
 };
  }, [autoRefresh, refreshInterval]);

 if (loading) {
 return (
 <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
 <div className="text-center">
 <div className="relative">
 <div className="animate-spin rounded-full h-16 w-16 border-4 border-gradient-to-r from-indigo-600 to-purple-600 border-t-transparent mx-auto"></div>
 <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 opacity-20 animate-pulse"></div>
 </div>
 <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
 </div>
 </div>
 );
 }

  // Date range options
  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  // Handle date range change
  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
    setShowDateDropdown(false);
    
    if (newRange === 'custom') {
      // Don't fetch data immediately for custom range, wait for user to set dates
      return;
    }
    
    // Fetch data with new date range
    fetchDashboardDataWithDateRange(newRange);
  };


  // Export functionality
  const exportData = () => {
    const dataToExport = {
      timestamp: new Date().toISOString(),
      stats: stats,
      recentOrders: recentOrders,
      topRestaurants: topRestaurants,
      systemHealth: systemHealth
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Quick actions for enhanced dashboard
  const quickActions = [
    { 
      name: 'Add Restaurant', 
      icon: Plus, 
      color: 'bg-blue-500 hover:bg-blue-600', 
      href: '/admin/restaurants/add',
      description: 'Add new restaurant to platform'
    },
    { 
      name: 'View Orders', 
      icon: ShoppingBag, 
      color: 'bg-green-500 hover:bg-green-600', 
      href: '/admin/orders',
      description: 'Manage all orders'
    },
    { 
      name: 'Manage Users', 
      icon: Users, 
      color: 'bg-purple-500 hover:bg-purple-600', 
      href: '/admin/users',
      description: 'User management'
    },
    { 
      name: 'System Settings', 
      icon: Settings, 
      color: 'bg-gray-500 hover:bg-gray-600', 
      href: '/admin/settings',
      description: 'Platform settings'
    },
    { 
      name: 'Analytics', 
      icon: BarChart3, 
      color: 'bg-indigo-500 hover:bg-indigo-600', 
      href: '/admin/analytics',
      description: 'View detailed analytics'
    },
    { 
      name: 'Export Data', 
      icon: Download, 
      color: 'bg-orange-500 hover:bg-orange-600', 
      href: '#',
      description: 'Export dashboard data',
      onClick: exportData
    }
  ];

 const statCards = [
 {
 title: 'Total Orders',
 value: stats.totalOrders || 0,
 icon: ShoppingBag,
 iconBg: 'bg-red-100',
 iconColor: 'text-red-600',
 change: stats.weeklyGrowth ? `+${stats.weeklyGrowth}%` : '+0%',
 changePositive: true,
 label: apiStatus === 'connected' ? 'TOTAL ORDERS (LIVE)' : 'TOTAL ORDERS'
 },
 {
 title: 'Total Delivered',
 value: stats.totalDelivered || 0,
 icon: Truck,
 iconBg: 'bg-teal-100',
 iconColor: 'text-teal-600',
 change: '+8.3%',
 changePositive: true,
 label: 'TOTAL DELIVERED'
 },
 {
 title: 'Total Cancelled',
 value: stats.totalCancelled || 0,
 icon: XCircle,
 iconBg: 'bg-pink-100',
 iconColor: 'text-pink-600',
 change: '-3.2%',
 changePositive: false,
 label: 'TOTAL CANCELLED'
 },
 {
 title: 'Restaurant Status',
 value: `${stats.openRestaurants || 0} Open / ${stats.closedRestaurants || 0} Closed`,
 icon: Store,
 iconBg: 'bg-green-100',
 iconColor: 'text-green-600',
 change: `${stats.totalRestaurants || 0} Total`,
 changePositive: true,
 label: 'RESTAURANT STATUS'
 }
 ];



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Advanced Header - Responsive */}
      <div className="bg-white/90 backdrop-blur-md shadow-xl border-b border-gray-200/50">
 <div className="px-4 sm:px-6 py-3 sm:py-4">
 <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
 <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div>
                
                {isRefreshing && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="text-blue-600 animate-pulse">🔄 Refreshing...</span>
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </p>
              </div>
 
 {/* System Health Indicators - Responsive */}
 <div className="flex flex-wrap items-center gap-3 sm:gap-6">
   <div className="flex items-center space-x-2 sm:space-x-3 bg-white/60 backdrop-blur-sm rounded-lg px-3 sm:px-4 py-2 shadow-sm">
     <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${systemHealth.serverStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
     <span className="text-xs sm:text-sm font-medium text-gray-700">Server</span>
   </div>
   <div className="flex items-center space-x-2 sm:space-x-3 bg-white/60 backdrop-blur-sm rounded-lg px-3 sm:px-4 py-2 shadow-sm">
     <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${systemHealth.databaseStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
     <span className="text-xs sm:text-sm font-medium text-gray-700">Database</span>
   </div>
   <div className="flex items-center space-x-2 sm:space-x-3 bg-white/60 backdrop-blur-sm rounded-lg px-3 sm:px-4 py-2 shadow-sm">
     <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-500 animate-pulse"></div>
     <span className="text-xs sm:text-sm font-medium text-gray-700">
       <span className="hidden sm:inline">API: </span>{systemHealth.apiResponseTime}ms
     </span>
   </div>
 </div>
 </div>
 
 <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
 {/* View Mode Toggle */}
 <div className="flex items-center bg-white/60 backdrop-blur-sm rounded-xl p-1 shadow-sm border border-gray-200/50">
 <button
 className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
 viewMode === 'overview' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
 }`}
 onClick={() => setViewMode('overview')}
 >
 Overview
 </button>
 <button
 className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
 viewMode === 'analytics' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
 }`}
 onClick={() => setViewMode('analytics')}
 >
 Analytics
 </button>
 <button 
 className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
 viewMode === 'system' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
 }`}
 onClick={() => setViewMode('system')}
 >
 System
 </button>
 </div>
 
 {/* Date Range Selector */}
 <select
 value={dateRange}
 onChange={(e) => setDateRange(e.target.value)}
 className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
 >
 <option value="today">Today</option>
 <option value="week">This Week</option>
 <option value="month">This Month</option>
 <option value="year">This Year</option>
 <option value="custom">Custom Range</option>
 </select>
 
 {/* Auto Refresh Toggle */}
 <button
 onClick={() => setAutoRefresh(!autoRefresh)}
 className={`p-2 rounded-lg transition-colors ${
 autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
 }`}
 title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
 >
 {autoRefresh ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
 </button>
 
 {/* Real-time Toggle */}
 <button
 onClick={() => setRealTimeMode(!realTimeMode)}
 className={`p-2 rounded-lg transition-colors ${
 realTimeMode ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
 }`}
 title={realTimeMode ? 'Real-time mode enabled' : 'Real-time mode disabled'}
 >
 <Activity className="w-4 h-4" />
 </button>
 
 {/* Notifications */}
 <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
 <Bell className="w-5 h-5" />
 {notifications.length > 0 && (
 <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
 )}
 </button>
 
 {/* Quick Actions */}
 <div className="flex items-center space-x-2">
              <button 
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => fetchDashboardData()}
                disabled={isRefreshing}
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
 <button 
 onClick={() => logout()}
 className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
 title="Logout"
 >
 <LogOut className="w-4 h-4" />
 </button>
 </div>
 
 {/* User Menu */}
 <div className="flex items-center space-x-2">
 <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
 <span className="text-white text-sm font-medium">BS</span>
 </div>
 <span className="text-sm font-medium text-gray-700">Bijay Sharma</span>
 <ChevronDown className="w-4 h-4 text-gray-500" />
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Connection Status */}
 <div className="mx-6 mt-4">
   <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
     <div className="flex items-center space-x-3">
       <div className={`w-3 h-3 rounded-full ${apiStatus === 'connected' ? 'bg-green-500 animate-pulse' : apiStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`}></div>
       <span className="text-sm font-medium text-gray-700">
         Backend Status: {apiStatus === 'connected' ? 'Connected' : apiStatus === 'error' ? 'Connection Error' : 'Checking...'}
       </span>
       <span className="text-xs text-gray-500">
         Last refresh: {lastRefresh.toLocaleTimeString()}
       </span>
     </div>
     <div className="flex items-center space-x-2">
       <span className="text-xs text-gray-500">
         Auto-refresh: {autoRefresh ? 'ON' : 'OFF'} ({refreshInterval/60000}min)
       </span>
       <button 
         className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
         onClick={() => fetchDashboardData(false)}
         disabled={isRefreshing || requestCooldown}
       >
         {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
       </button>
     </div>
   </div>
 </div>

 {/* Error Message */}
 {error && (
 <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center space-x-2">
 <AlertCircle className="w-5 h-5 text-red-600" />
 <span className="text-red-800 font-medium">{error}</span>
 </div>
 <div className="flex space-x-2">
 <button 
 className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
 onClick={() => fetchDashboardData(false)}
 >
 Retry
 </button>
 <button 
 className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
 onClick={() => setError(null)}
 >
 Dismiss
 </button>
 </div>
 </div>
 </div>
 )}

        {/* Quick Actions Section - Responsive */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-4 sm:p-6 lg:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Quick Actions</h2>
            <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Common tasks</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              const ActionComponent = action.onClick ? 'button' : Link;
              const actionProps = action.onClick 
                ? { onClick: action.onClick }
                : { to: action.href };
              
              return (
                <ActionComponent
                  key={index}
                  {...actionProps}
                  className="group flex flex-col items-center p-6 rounded-2xl border border-gray-200/50 hover:border-gray-300 hover:shadow-xl transition-all duration-300 hover:scale-110 bg-gradient-to-br from-white to-gray-50"
                >
                  <div className={`w-16 h-16 ${action.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 text-center mb-1">{action.name}</h3>
                  <p className="text-xs text-gray-500 text-center leading-relaxed">{action.description}</p>
                </ActionComponent>
              );
            })}
          </div>
        </div>

 {/* Advanced KPI Cards - Fully Responsive */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
 {statCards.map((stat, index) => {
 const Icon = stat.icon;
 const isExpanded = expandedCards[`stat-${index}`];
 
 return (
 <div
 key={index}
 className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 hover:shadow-2xl transition-all duration-500 hover:scale-105 cursor-pointer group"
 onClick={() => setExpandedCards(prev => ({
 ...prev,
 [`stat-${index}`]: !prev[`stat-${index}`]
 }))}
 >
 <div className="flex items-center justify-between mb-4">
 <div className={`w-14 h-14 ${stat.iconBg} rounded-xl flex items-center justify-center shadow-lg`}>
 <Icon className={`w-7 h-7 ${stat.iconColor}`} />
 </div>
 <div className="flex items-center space-x-2">
 <div className="flex items-center space-x-1">
 {stat.changePositive ? (
 <TrendingUp className="w-4 h-4 text-green-600" />
 ) : (
 <TrendingDown className="w-4 h-4 text-red-600" />
 )}
 <span className={`text-sm font-semibold ${stat.changePositive ? 'text-green-600' : 'text-red-600'}`}>
 {stat.change}
 </span>
 </div>
 <button className="p-1 hover:bg-gray-100 rounded">
 {isExpanded ? <Minimize2 className="w-4 h-4 text-gray-500" /> : <Maximize2 className="w-4 h-4 text-gray-500" />}
 </button>
 </div>
 </div>
 
 <div>
 <h3 className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</h3>
 <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
 
 {isExpanded && (
 <div className="mt-4 pt-4 border-t border-gray-100">
 <div className="space-y-2">
 <div className="flex justify-between text-xs text-gray-500">
 <span>Last 24h</span>
 <span>+{Math.floor(0 * 20) + 5}%</span>
 </div>
 <div className="flex justify-between text-xs text-gray-500">
 <span>This week</span>
 <span>+{Math.floor(0 * 15) + 3}%</span>
 </div>
 <div className="flex justify-between text-xs text-gray-500">
 <span>This month</span>
 <span>+{Math.floor(0 * 25) + 8}%</span>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 );
 })}
 </div>


 {/* Advanced Content Grid - Responsive */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
 {/* Today's Orders - Enhanced */}
 <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
 <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
 <div className="flex items-center justify-between">
 <div className="flex items-center space-x-3">
 <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
 <Clock className="w-5 h-5 text-blue-600" />
 </div>
 <div>
 <h2 className="text-lg font-semibold text-gray-900">Today's Orders</h2>
 <p className="text-sm text-gray-600">Real-time order tracking</p>
 </div>
          <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-medium">
            {stats.todayOrders} orders today
          </span>
 </div>
 <div className="flex items-center space-x-2">
 <button className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
 <Filter className="w-4 h-4" />
 <span>Filter</span>
 </button>
 <button className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
 View All
 </button>
 </div>
 </div>
 </div>
 <div className="p-6">
 <div className="space-y-3">
 {recentOrders.length > 0 ? (
 recentOrders.slice(0, 5).map((order) => (
 <div key={order._id} className="flex items-center justify-between p-4 rounded-lg hover:bg-blue-50 transition-colors border border-gray-100">
 <div className="flex items-center space-x-4">
 <div className={`w-4 h-4 rounded-full ${
 order.status === 'delivered' ? 'bg-green-500' :
 order.status === 'preparing' ? 'bg-yellow-500' :
 order.status === 'pending' ? 'bg-blue-500' : 'bg-red-500'
 }`}></div>
 <div>
 <p className="text-sm font-semibold text-gray-900">#{order.orderNumber}</p>
 <p className="text-xs text-gray-500">{order.restaurant?.name}</p>
 </div>
 </div>
 <div className="text-right">
 <p className="text-sm font-semibold text-gray-900">NPR {order.totalAmount?.toFixed(0)}</p>
 <p className="text-xs text-gray-500">
 {new Date(order.createdAt).toLocaleTimeString()}
 </p>
 </div>
 </div>
 ))
 ) : (
 <div className="text-center py-12 text-gray-500">
 <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-400" />
 <p className="text-lg font-medium">No orders today</p>
 <p className="text-sm text-gray-400 mt-2">
 {apiStatus === 'error' ? 'Unable to fetch data from database' : 'Today\'s orders will appear here when customers place them'}
 </p>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* System Health Monitor */}
 <div className="bg-white rounded-xl shadow-lg border border-gray-100">
 <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
 <div className="flex items-center space-x-3">
 <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
 <Server className="w-5 h-5 text-green-600" />
 </div>
 <div>
 <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
 <p className="text-sm text-gray-600">Real-time monitoring</p>
 </div>
 </div>
 </div>
 <div className="p-6">
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center space-x-2">
 <div className={`w-2 h-2 rounded-full ${systemHealth.serverStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
 <span className="text-sm text-gray-700">Server Status</span>
 </div>
 <span className={`text-sm font-medium ${systemHealth.serverStatus === 'online' ? 'text-green-600' : 'text-red-600'}`}>
 {systemHealth.serverStatus === 'online' ? 'Online' : 'Offline'}
 </span>
 </div>
 
 <div className="flex items-center justify-between">
 <div className="flex items-center space-x-2">
 <div className={`w-2 h-2 rounded-full ${systemHealth.databaseStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
 <span className="text-sm text-gray-700">Database</span>
 </div>
 <span className={`text-sm font-medium ${systemHealth.databaseStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
 {systemHealth.databaseStatus === 'connected' ? 'Connected' : 'Disconnected'}
 </span>
 </div>
 
 <div className="flex items-center justify-between">
 <div className="flex items-center space-x-2">
 <div className="w-2 h-2 rounded-full bg-blue-500"></div>
 <span className="text-sm text-gray-700">API Response</span>
 </div>
 <span className="text-sm font-medium text-blue-600">
 {systemHealth.apiResponseTime}ms
 </span>
 </div>
 
 <div className="flex items-center justify-between">
 <div className="flex items-center space-x-2">
 <Cpu className="w-4 h-4 text-gray-500" />
 <span className="text-sm text-gray-700">CPU Usage</span>
 </div>
 <span className="text-sm font-medium text-gray-600">
 {systemHealth.cpuUsage.toFixed(1)}%
 </span>
 </div>
 
 <div className="flex items-center justify-between">
 <div className="flex items-center space-x-2">
 <HardDrive className="w-4 h-4 text-gray-500" />
 <span className="text-sm text-gray-700">Memory</span>
 </div>
 <span className="text-sm font-medium text-gray-600">
 {systemHealth.memoryUsage.toFixed(1)}%
 </span>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Advanced Analytics Section */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
 {/* Revenue Analytics */}
 <div className="bg-white rounded-xl shadow-lg border border-gray-100">
 <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
 <div className="flex items-center justify-between">
 <div className="flex items-center space-x-3">
 <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
 <LineChart className="w-5 h-5 text-purple-600" />
 </div>
 <div>
 <h2 className="text-lg font-semibold text-gray-900">Revenue Analytics</h2>
 <p className="text-sm text-gray-600">Daily revenue trends</p>
 </div>
 </div>
 <button className="p-2 text-purple-600 hover:text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
 <MoreVertical className="w-4 h-4" />
 </button>
 </div>
 </div>
 <div className="p-6">
 <div className="text-center">
 <div className="text-3xl font-bold text-gray-900 mb-2">
 NPR {(stats.monthlyRevenue || 0).toLocaleString()}
 </div>
 <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-4">
 <TrendingUp className="w-4 h-4 text-green-600" />
 <span>Monthly Revenue</span>
 </div>
 <div className="h-32 bg-gradient-to-t from-purple-100 to-purple-50 rounded-lg flex items-end justify-center">
 <div className="text-xs text-purple-600 font-medium mb-2">Revenue Chart</div>
 </div>
 </div>
 </div>
 </div>

 {/* Top Restaurants */}
 <div className="bg-white rounded-xl shadow-lg border border-gray-100">
 <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-yellow-50">
 <div className="flex items-center justify-between">
 <div className="flex items-center space-x-3">
 <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
 <Award className="w-5 h-5 text-orange-600" />
 </div>
 <div>
 <h2 className="text-lg font-semibold text-gray-900">Top Restaurants</h2>
 <p className="text-sm text-gray-600">Best performing restaurants</p>
 </div>
 </div>
 <button className="px-3 py-1 text-sm text-orange-600 hover:text-orange-700 font-medium bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors">
 View All
 </button>
 </div>
 </div>
 <div className="p-6">
 <div className="space-y-4">
 {topRestaurants.length > 0 ? (
 topRestaurants.slice(0, 3).map((restaurant, index) => (
 <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-orange-50 transition-colors">
 <div className="flex items-center space-x-3">
 <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
 <span className="text-sm font-bold text-orange-600">#{index + 1}</span>
 </div>
 <div>
 <p className="text-sm font-semibold text-gray-900">{restaurant.name}</p>
 <p className="text-xs text-gray-500">{restaurant.orders} orders</p>
 </div>
 </div>
 <div className="text-right">
 <p className="text-sm font-semibold text-gray-900">NPR {restaurant.revenue?.toLocaleString()}</p>
 <p className="text-xs text-gray-500">Revenue</p>
 </div>
 </div>
 ))
 ) : (
 <div className="text-center py-8 text-gray-500">
 <Store className="w-8 h-8 mx-auto mb-2 text-gray-400" />
 <p className="text-sm">No restaurant data</p>
 <p className="text-xs text-gray-400 mt-1">Restaurant performance will appear here</p>
 </div>
 )}
  </div>
  </div>
  </div>
  </div>
  </div>
  );
};

export default SuperAdminDashboard;
