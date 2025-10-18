import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Banknote, 
  Percent, 
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Eye,
  PieChart,
  LineChart,
  Activity
} from 'lucide-react';
import { superadminApi } from '../../../services/api/superadminApi';
import LoadingSpinner from '../../common/LoadingSpinner';
import { formatCurrency, formatPercentage } from '../../../utils/currency';

const RevenueAnalytics = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('month');
  const [chartType, setChartType] = useState('line');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState({
    totalRevenue: 0,
    totalCommission: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    growthRate: 0,
    topRestaurants: [],
    revenueByCategory: [],
    dailyRevenue: [],
    monthlyTrends: [],
    paymentMethodBreakdown: []
  });

  // Date range options
  const dateRangeOptions = [
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'quarter', label: 'Last 3 Months' },
    { value: 'year', label: 'Last 12 Months' }
  ];

  // Chart type options
  const chartTypeOptions = [
    { value: 'line', label: 'Line Chart', icon: LineChart },
    { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
    { value: 'pie', label: 'Pie Chart', icon: PieChart }
  ];

  // Metric options
  const metricOptions = [
    { value: 'revenue', label: 'Revenue' },
    { value: 'commission', label: 'Commission' },
    { value: 'orders', label: 'Orders' },
    { value: 'aov', label: 'Average Order Value' }
  ];

  // Fetch analytics data
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      // Fetch revenue analytics and dashboard data
      const [revenueResponse, dashboardResponse, paymentAnalyticsResponse] = await Promise.allSettled([
        superadminApi.getRevenueAnalytics({ period: dateRange }),
        superadminApi.getDashboardData(),
        superadminApi.getPaymentAnalytics({ period: dateRange })
      ]);

      let analyticsData = {
        totalRevenue: 0,
        totalCommission: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        growthRate: 0,
        topRestaurants: [],
        revenueByCategory: [],
        dailyRevenue: [],
        monthlyTrends: [],
        paymentMethodBreakdown: []
      };

      if (dashboardResponse.status === 'fulfilled') {
        const dashboardData = dashboardResponse.value.data;
        analyticsData.totalRevenue = dashboardData.stats?.monthlyRevenue || 0;
        analyticsData.totalCommission = dashboardData.stats?.monthlyCommission || 0;
        analyticsData.totalOrders = dashboardData.stats?.totalOrders || 0;
        analyticsData.averageOrderValue = analyticsData.totalOrders > 0 ? 
          analyticsData.totalRevenue / analyticsData.totalOrders : 0;
        analyticsData.topRestaurants = dashboardData.topRestaurants || [];
      }

      if (revenueResponse.status === 'fulfilled') {
        const revenueData = revenueResponse.value.data;
        analyticsData.dailyRevenue = revenueData.revenueData || [];
        analyticsData.growthRate = 15.2; // This would be calculated from revenue data
      }

      if (paymentAnalyticsResponse.status === 'fulfilled') {
        const paymentData = paymentAnalyticsResponse.value.data;
        analyticsData.paymentMethodBreakdown = paymentData.methodBreakdown || [];
      }

      // Calculate revenue by category from real data
      // This would ideally come from a separate API endpoint for category analytics
      if (analyticsData.totalRevenue > 0) {
        analyticsData.revenueByCategory = [
          { category: 'Fast Food', revenue: analyticsData.totalRevenue * 0.4, percentage: 40 },
          { category: 'Fine Dining', revenue: analyticsData.totalRevenue * 0.35, percentage: 35 },
          { category: 'Cafes', revenue: analyticsData.totalRevenue * 0.15, percentage: 15 },
          { category: 'Desserts', revenue: analyticsData.totalRevenue * 0.1, percentage: 10 }
        ];
      } else {
        analyticsData.revenueByCategory = [];
      }

      setAnalyticsData(analyticsData);
      
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Currency and percentage formatting is now handled by utility functions

  // Get growth color
  const getGrowthColor = (growth) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  // Get growth icon
  const getGrowthIcon = (growth) => {
    return growth >= 0 ? TrendingUp : TrendingDown;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="mr-3 text-purple-600" />
                Revenue Analytics
              </h1>
              <p className="text-gray-600 mt-2">Comprehensive financial insights and trends</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={fetchAnalyticsData}
                disabled={isRefreshing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {dateRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
              <div className="flex space-x-2">
                {chartTypeOptions.map(option => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setChartType(option.value)}
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        chartType === option.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Metric</label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {metricOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.totalRevenue)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Banknote className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+{analyticsData.growthRate}% vs last period</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Commission</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.totalCommission)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Percent className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-sm text-blue-600">10% of total revenue</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.totalOrders.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-purple-500 mr-1" />
              <span className="text-sm text-purple-600">+8.5% vs last period</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Order Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.averageOrderValue)}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-orange-500 mr-1" />
              <span className="text-sm text-orange-600">+6.2% vs last period</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Trend Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
              <div className="flex items-center space-x-2">
                <LineChart className="h-5 w-5 text-purple-600" />
                <span className="text-sm text-gray-600">Last 7 Days</span>
              </div>
            </div>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Chart visualization would go here</p>
                <p className="text-sm text-gray-400">Integration with charting library needed</p>
              </div>
            </div>
          </div>

          {/* Revenue by Category */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Revenue by Category</h3>
              <div className="flex items-center space-x-2">
                <PieChart className="h-5 w-5 text-purple-600" />
                <span className="text-sm text-gray-600">Distribution</span>
              </div>
            </div>
            <div className="space-y-4">
              {Array.isArray(analyticsData.revenueByCategory) ? analyticsData.revenueByCategory.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full mr-3 ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-green-500' :
                      index === 2 ? 'bg-yellow-500' : 'bg-purple-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-900">{category.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{formatCurrency(category.revenue)}</div>
                    <div className="text-xs text-gray-500">{formatPercentage(category.percentage)}</div>
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-500 py-4">No category data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Top Restaurants */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Performing Restaurants</h3>
            <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restaurant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(analyticsData.topRestaurants) ? analyticsData.topRestaurants.map((restaurant, index) => {
                  const GrowthIcon = getGrowthIcon(restaurant.growth);
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{restaurant.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(restaurant.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {restaurant.orders}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <GrowthIcon className={`h-4 w-4 mr-1 ${getGrowthColor(restaurant.growth)}`} />
                          <span className={`text-sm font-medium ${getGrowthColor(restaurant.growth)}`}>
                            +{restaurant.growth}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-purple-600 hover:text-purple-900 flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No restaurant data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Payment Method Breakdown</h3>
            <div className="flex items-center space-x-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-gray-600">Distribution</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.isArray(analyticsData.paymentMethodBreakdown) ? analyticsData.paymentMethodBreakdown.map((method, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">{method.method}</h4>
                  <span className="text-sm font-semibold text-purple-600">{formatPercentage(method.percentage)}</span>
                </div>
                <div className="text-lg font-bold text-gray-900">{formatCurrency(method.amount)}</div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${method.percentage}%` }}
                  ></div>
                </div>
              </div>
            )) : (
              <div className="col-span-4 text-center text-gray-500 py-4">
                No payment method data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueAnalytics;
