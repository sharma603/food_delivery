import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search, 
  Filter,
  Eye,
  RefreshCw,
  Calendar,
  Download,
  Send,
  Building,
  User,
  MapPin,
  Star,
  Award,
  Truck,
  Route,
  Target
} from 'lucide-react';
import { superadminApi } from '../../../services/api/superadminApi';
import { analyticsApi } from '../../../services/api/deliveryApi';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { formatCurrency } from '../../../utils/currency';

const PerformanceAnalytics = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState('delivery_time');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Performance data state
  const [performanceData, setPerformanceData] = useState({
    overallStats: {
      totalDeliveries: 0,
      completedDeliveries: 0,
      cancelledDeliveries: 0,
      averageDeliveryTime: 0,
      onTimeRate: 0,
      customerSatisfaction: 0,
      totalRevenue: 0,
      averageOrderValue: 0
    },
    zonePerformance: [],
    personnelPerformance: [],
    timeAnalytics: [],
    deliveryTrends: [],
    topPerformingZones: [],
    topPerformingPersonnel: []
  });

  // Date range options
  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'quarter', label: 'Last 3 Months' },
    { value: 'year', label: 'Last 12 Months' }
  ];

  // Metric options
  const metricOptions = [
    { value: 'delivery_time', label: 'Delivery Time' },
    { value: 'completion_rate', label: 'Completion Rate' },
    { value: 'customer_satisfaction', label: 'Customer Satisfaction' },
    { value: 'revenue', label: 'Revenue' }
  ];

  // Fetch performance data
  const fetchPerformanceData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      // Fetch all analytics data from API
      const [
        overallStatsResponse,
        zonePerformanceResponse,
        personnelPerformanceResponse,
        timeAnalyticsResponse,
        deliveryTrendsResponse,
        topZonesResponse,
        topPersonnelResponse
      ] = await Promise.allSettled([
        analyticsApi.getOverallStats(dateRange),
        analyticsApi.getZonePerformance(dateRange),
        analyticsApi.getPersonnelPerformance(dateRange),
        analyticsApi.getTimeAnalytics(dateRange),
        analyticsApi.getDeliveryTrends(dateRange),
        analyticsApi.getTopZones(10),
        analyticsApi.getTopPersonnel(10)
      ]);

      // Combine all data
      const combinedData = {
        overallStats: {
          totalDeliveries: 0,
          completedDeliveries: 0,
          cancelledDeliveries: 0,
          averageDeliveryTime: 0,
          onTimeRate: 0,
          customerSatisfaction: 0,
          totalRevenue: 0,
          averageOrderValue: 0
        },
        zonePerformance: [],
        personnelPerformance: [],
        timeAnalytics: [],
        deliveryTrends: [],
        topPerformingZones: [],
        topPerformingPersonnel: []
      };

      // Handle overall stats
      if (overallStatsResponse.status === 'fulfilled' && overallStatsResponse.value.success) {
        const statsData = overallStatsResponse.value.data || overallStatsResponse.value.stats || {};
        combinedData.overallStats = {
          totalDeliveries: statsData.totalDeliveries || 0,
          completedDeliveries: statsData.completedDeliveries || 0,
          cancelledDeliveries: statsData.cancelledDeliveries || 0,
          averageDeliveryTime: statsData.averageDeliveryTime || 0,
          onTimeRate: statsData.onTimeRate || 0,
          customerSatisfaction: statsData.customerSatisfaction || 0,
          totalRevenue: statsData.totalRevenue || 0,
          averageOrderValue: statsData.averageOrderValue || 0
        };
      }

      // Handle zone performance
      if (zonePerformanceResponse.status === 'fulfilled' && zonePerformanceResponse.value.success) {
        const zoneData = zonePerformanceResponse.value.data || zonePerformanceResponse.value.zones || [];
        combinedData.zonePerformance = Array.isArray(zoneData) ? zoneData : [];
      }

      // Handle personnel performance
      if (personnelPerformanceResponse.status === 'fulfilled' && personnelPerformanceResponse.value.success) {
        const personnelData = personnelPerformanceResponse.value.data || personnelPerformanceResponse.value.personnel || [];
        combinedData.personnelPerformance = Array.isArray(personnelData) ? personnelData : [];
      }

      // Handle time analytics
      if (timeAnalyticsResponse.status === 'fulfilled' && timeAnalyticsResponse.value.success) {
        const timeData = timeAnalyticsResponse.value.data || timeAnalyticsResponse.value.analytics || [];
        combinedData.timeAnalytics = Array.isArray(timeData) ? timeData : [];
      }

      // Handle delivery trends
      if (deliveryTrendsResponse.status === 'fulfilled' && deliveryTrendsResponse.value.success) {
        const trendsData = deliveryTrendsResponse.value.data || deliveryTrendsResponse.value.trends || [];
        combinedData.deliveryTrends = Array.isArray(trendsData) ? trendsData : [];
      }

      // Handle top zones
      if (topZonesResponse.status === 'fulfilled' && topZonesResponse.value.success) {
        const topZonesData = topZonesResponse.value.data || topZonesResponse.value.zones || [];
        combinedData.topPerformingZones = Array.isArray(topZonesData) ? topZonesData : [];
      }

      // Handle top personnel
      if (topPersonnelResponse.status === 'fulfilled' && topPersonnelResponse.value.success) {
        const topPersonnelData = topPersonnelResponse.value.data || topPersonnelResponse.value.personnel || [];
        combinedData.topPerformingPersonnel = Array.isArray(topPersonnelData) ? topPersonnelData : [];
      }

      setPerformanceData(combinedData);
      
    } catch (err) {
      console.error('Error fetching performance data:', err);
      setError('Failed to load performance data');
      setPerformanceData({
        overallStats: {
          totalDeliveries: 0,
          completedDeliveries: 0,
          cancelledDeliveries: 0,
          averageDeliveryTime: 0,
          onTimeRate: 0,
          customerSatisfaction: 0,
          totalRevenue: 0,
          averageOrderValue: 0
        },
        zonePerformance: [],
        personnelPerformance: [],
        timeAnalytics: [],
        deliveryTrends: [],
        topPerformingZones: [],
        topPerformingPersonnel: []
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  // Get performance color
  const getPerformanceColor = (performance) => {
    switch (performance) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'average': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="mr-3 text-violet-600" />
                Performance Analytics
              </h1>
              <p className="text-gray-600 mt-2">Comprehensive delivery performance metrics and insights</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={fetchPerformanceData}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                {dateRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Metric</label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                {metricOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">{performanceData.overallStats.totalDeliveries.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-violet-100 rounded-full">
                <Truck className="h-6 w-6 text-violet-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-violet-500 mr-1" />
              <span className="text-sm text-violet-600">All time</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPercentage((performanceData.overallStats.completedDeliveries / performanceData.overallStats.totalDeliveries) * 100)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">Excellent performance</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Delivery Time</p>
                <p className="text-2xl font-bold text-gray-900">{performanceData.overallStats.averageDeliveryTime}min</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-sm text-blue-600">Industry standard</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Customer Satisfaction</p>
                <p className="text-2xl font-bold text-gray-900">{performanceData.overallStats.customerSatisfaction}/5</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-yellow-500 mr-1" />
              <span className="text-sm text-yellow-600">High satisfaction</span>
            </div>
          </div>
        </div>

        {/* Zone Performance */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Zone Performance</h3>
            <button className="text-violet-600 hover:text-violet-700 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deliveries</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">On Time Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efficiency</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(performanceData.zonePerformance) ? performanceData.zonePerformance.map((zone, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{zone.zone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {zone.totalDeliveries.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {zone.averageTime}min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPercentage(zone.onTimeRate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-sm text-gray-900">{zone.customerRating}/5</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(zone.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Target className="h-4 w-4 text-violet-500 mr-1" />
                        <span className="text-sm font-medium text-gray-900">{formatPercentage(zone.efficiency)}</span>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No zone performance data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Personnel Performance */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Personnel Performance</h3>
            <button className="text-violet-600 hover:text-violet-700 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personnel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deliveries</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(performanceData.personnelPerformance) ? performanceData.personnelPerformance.map((person, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-violet-200 flex items-center justify-center">
                            <span className="text-xs font-medium text-violet-800">
                              {person.name?.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{person.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {person.zone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {person.totalDeliveries.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {person.averageTime}min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-sm text-gray-900">{person.customerRating}/5</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(person.earnings)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPerformanceColor(person.performance)}`}>
                        {person.performance.charAt(0).toUpperCase() + person.performance.slice(1)}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No personnel performance data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Time Analytics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Hourly Delivery Analytics</h3>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-violet-600" />
              <span className="text-sm text-gray-600">Today's Performance</span>
            </div>
          </div>
          <div className="space-y-4">
            {Array.isArray(performanceData.timeAnalytics) ? performanceData.timeAnalytics.map((hour, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-16 text-sm font-medium text-gray-900">{hour.hour}</div>
                  <div className="ml-4">
                    <div className="text-sm text-gray-900">{hour.deliveries} deliveries</div>
                    <div className="text-sm text-gray-500">Avg time: {hour.averageTime}min</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-4">
                    <div 
                      className="bg-violet-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(hour.deliveries / 200) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{hour.deliveries}</span>
                </div>
              </div>
            )) : (
              <div className="text-center text-gray-500 py-4">
                No time analytics data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;
