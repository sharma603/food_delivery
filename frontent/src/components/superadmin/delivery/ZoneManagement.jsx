import React, { useState, useEffect, useCallback } from 'react';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Eye,
  RefreshCw,
  TrendingUp,
  Calendar,
  Download,
  Send,
  Building,
  Banknote,
  Users,
  Clock
} from 'lucide-react';
import { superadminApi } from '../../../services/api/superadminApi';
import { zoneApi } from '../../../services/api/deliveryApi';
import LoadingSpinner from '../../common/LoadingSpinner';
import { formatCurrency } from '../../../utils/currency';

const ZoneManagement = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedZone, setSelectedZone] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Zone data state
  const [zones, setZones] = useState([]);
  const [zoneStats, setZoneStats] = useState({
    totalZones: 0,
    activeZones: 0,
    totalDeliveryCharges: 0,
    averageCharge: 0,
    totalOrders: 0,
    monthlyGrowth: 0
  });

  // Filter options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'maintenance', label: 'Under Maintenance' }
  ];

  // Fetch zone data
  const fetchZoneData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      // Fetch zones and stats from API
      const [zonesResponse, statsResponse] = await Promise.allSettled([
        zoneApi.getAllZones(),
        zoneApi.getZoneStats()
      ]);

      // Handle zones data
      if (zonesResponse.status === 'fulfilled' && zonesResponse.value.success) {
        const zonesData = zonesResponse.value.data || zonesResponse.value.zones || [];
        setZones(Array.isArray(zonesData) ? zonesData : []);
      } else {
        console.error('Failed to fetch zones:', zonesResponse.reason);
        setZones([]);
      }

      // Handle stats data
      if (statsResponse.status === 'fulfilled' && statsResponse.value.success) {
        const statsData = statsResponse.value.data || statsResponse.value.stats || {};
        setZoneStats({
          totalZones: statsData.totalZones || 0,
          activeZones: statsData.activeZones || 0,
          totalDeliveryCharges: statsData.totalDeliveryCharges || 0,
          averageCharge: statsData.averageCharge || 0,
          totalOrders: statsData.totalOrders || 0,
          monthlyGrowth: statsData.monthlyGrowth || 0
        });
      } else {
        console.error('Failed to fetch zone stats:', statsResponse.reason);
        setZoneStats({
          totalZones: 0,
          activeZones: 0,
          totalDeliveryCharges: 0,
          averageCharge: 0,
          totalOrders: 0,
          monthlyGrowth: 0
        });
      }
      
    } catch (err) {
      console.error('Error fetching zone data:', err);
      setError('Failed to load zone data');
      setZones([]);
      setZoneStats({
        totalZones: 0,
        activeZones: 0,
        totalDeliveryCharges: 0,
        averageCharge: 0,
        totalOrders: 0,
        monthlyGrowth: 0
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchZoneData();
  }, [fetchZoneData]);

  // Filter zones
  const filteredZones = Array.isArray(zones) ? zones.filter(zone => {
    if (!zone) return false;
    
    const matchesSearch = (zone.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (zone.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || zone.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) : [];

  // Get status color and icon
  const getStatusInfo = (status) => {
    switch (status) {
      case 'active':
        return { 
          color: 'text-green-600 bg-green-100', 
          icon: Clock,
          iconColor: 'text-green-600'
        };
      case 'inactive':
        return { 
          color: 'text-red-600 bg-red-100', 
          icon: Clock,
          iconColor: 'text-red-600'
        };
      case 'maintenance':
        return { 
          color: 'text-yellow-600 bg-yellow-100', 
          icon: Clock,
          iconColor: 'text-yellow-600'
        };
      default:
        return { 
          color: 'text-gray-600 bg-gray-100', 
          icon: Clock,
          iconColor: 'text-gray-600'
        };
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
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <MapPin className="mr-3 text-teal-600" />
                Zone Management
              </h1>
              <p className="text-gray-600 mt-2">Manage delivery zones, areas, and delivery charges</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={fetchZoneData}
                disabled={isRefreshing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Zone
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
                <p className="text-sm font-medium text-gray-600">Total Zones</p>
                <p className="text-2xl font-bold text-gray-900">{zoneStats.totalZones}</p>
              </div>
              <div className="p-3 bg-teal-100 rounded-full">
                <MapPin className="h-6 w-6 text-teal-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-teal-500 mr-1" />
              <span className="text-sm text-teal-600">Coverage areas</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Zones</p>
                <p className="text-2xl font-bold text-gray-900">{zoneStats.activeZones}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">Currently operational</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Delivery Charges</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(zoneStats.totalDeliveryCharges)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Banknote className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-sm text-blue-600">+{zoneStats.monthlyGrowth}% this month</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Charge</p>
                <p className="text-2xl font-bold text-gray-900">Rs. {zoneStats.averageCharge}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Banknote className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-purple-500 mr-1" />
              <span className="text-sm text-purple-600">Per delivery</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{zoneStats.totalOrders.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-orange-500 mr-1" />
              <span className="text-sm text-orange-600">All time</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Restaurants</p>
                <p className="text-2xl font-bold text-gray-900">
                  {zones.reduce((sum, zone) => sum + (zone.restaurantCount || 0), 0)}
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <Building className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-indigo-500 mr-1" />
              <span className="text-sm text-indigo-600">Across all zones</span>
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
                  placeholder="Search by zone name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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

        {/* Zones Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Delivery Zones</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Areas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Charge</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restaurants</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredZones.map((zone) => {
                  const statusInfo = getStatusInfo(zone.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <tr key={zone.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{zone.name}</div>
                          <div className="text-sm text-gray-500">{zone.coverage}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {zone.areas?.slice(0, 2).join(', ')}
                          {zone.areas?.length > 2 && ` +${zone.areas.length - 2} more`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {zone.estimatedDeliveryTime}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(zone.deliveryCharge)}</div>
                        <div className="text-sm text-gray-500">Revenue: {formatCurrency(zone.totalRevenue)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {zone.restaurantCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {zone.orderCount?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <StatusIcon className={`h-4 w-4 mr-2 ${statusInfo.iconColor}`} />
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                            {zone.status.charAt(0).toUpperCase() + zone.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedZone(zone);
                              setShowDetailsModal(true);
                            }}
                            className="text-teal-600 hover:text-teal-900 flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => {
                              setSelectedZone(zone);
                              setShowEditModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </button>
                          <button className="text-red-600 hover:text-red-900 flex items-center">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
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

        {/* Zone Details Modal */}
        {showDetailsModal && selectedZone && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Zone Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Zone ID</label>
                    <p className="text-sm text-gray-900">{selectedZone.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Zone Name</label>
                    <p className="text-sm text-gray-900">{selectedZone.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="text-sm text-gray-900">{selectedZone.description}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Coverage</label>
                    <p className="text-sm text-gray-900">{selectedZone.coverage}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Delivery Time</label>
                    <p className="text-sm text-gray-900">{selectedZone.estimatedDeliveryTime}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Delivery Charge</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedZone.deliveryCharge)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Restaurants</label>
                    <p className="text-sm text-gray-900">{selectedZone.restaurantCount}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Orders</label>
                    <p className="text-sm text-gray-900">{selectedZone.orderCount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Revenue</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedZone.totalRevenue)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusInfo(selectedZone.status).color}`}>
                      {selectedZone.status.charAt(0).toUpperCase() + selectedZone.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Areas Covered</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedZone.areas?.map((area, index) => (
                      <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-teal-100 text-teal-800 rounded-full">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pincodes</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedZone.pincodes?.map((pincode, index) => (
                      <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {pincode}
                      </span>
                    ))}
                  </div>
                </div>
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

        {/* Add Zone Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Zone</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="e.g., Zone A - West Bay"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Describe the zone coverage"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Charge (Rs.)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter delivery charge"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coverage Radius</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="e.g., 5km radius"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Delivery Time</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="e.g., 25-35 minutes"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                  Add Zone
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZoneManagement;
