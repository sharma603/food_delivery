import React, { useState, useEffect, useCallback } from 'react';
import { 
  UserCheck, 
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
  Clock,
  MapPin,
  Phone,
  Mail,
  Star,
  Award,
  AlertCircle
} from 'lucide-react';
import { superadminApi } from '../../../services/api/superadminApi';
import { personnelApi } from '../../../services/api/deliveryApi';
import LoadingSpinner from '../../common/LoadingSpinner';

const PersonnelManagement = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Personnel data state
  const [personnel, setPersonnel] = useState([]);
  const [personnelStats, setPersonnelStats] = useState({
    totalPersonnel: 0,
    activePersonnel: 0,
    onDutyPersonnel: 0,
    averageRating: 0,
    totalDeliveries: 0,
    monthlyGrowth: 0
  });

  // Filter options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'on_duty', label: 'On Duty' },
    { value: 'off_duty', label: 'Off Duty' },
    { value: 'suspended', label: 'Suspended' }
  ];

  const zoneOptions = [
    { value: 'all', label: 'All Zones' },
    { value: 'zone_a', label: 'Zone A - West Bay' },
    { value: 'zone_b', label: 'Zone B - Al Sadd' },
    { value: 'zone_c', label: 'Zone C - Lusail' },
    { value: 'zone_d', label: 'Zone D - City Center' }
  ];

  // Fetch personnel data
  const fetchPersonnelData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      // Fetch personnel and stats from API
      const [personnelResponse, statsResponse] = await Promise.allSettled([
        personnelApi.getAllPersonnel(),
        personnelApi.getPersonnelStats()
      ]);

      // Handle personnel data
      if (personnelResponse.status === 'fulfilled' && personnelResponse.value.success) {
        const personnelData = personnelResponse.value.data || personnelResponse.value.personnel || [];
        setPersonnel(Array.isArray(personnelData) ? personnelData : []);
      } else {
        console.error('Failed to fetch personnel:', personnelResponse.reason);
        setPersonnel([]);
      }

      // Handle stats data
      if (statsResponse.status === 'fulfilled' && statsResponse.value.success) {
        const statsData = statsResponse.value.data || statsResponse.value.stats || {};
        setPersonnelStats({
          totalPersonnel: statsData.totalPersonnel || 0,
          activePersonnel: statsData.activePersonnel || 0,
          onDutyPersonnel: statsData.onDutyPersonnel || 0,
          averageRating: statsData.averageRating || 0,
          totalDeliveries: statsData.totalDeliveries || 0,
          monthlyGrowth: statsData.monthlyGrowth || 0
        });
      } else {
        console.error('Failed to fetch personnel stats:', statsResponse.reason);
        setPersonnelStats({
          totalPersonnel: 0,
          activePersonnel: 0,
          onDutyPersonnel: 0,
          averageRating: 0,
          totalDeliveries: 0,
          monthlyGrowth: 0
        });
      }
      
    } catch (err) {
      console.error('Error fetching personnel data:', err);
      setError('Failed to load personnel data');
      setPersonnel([]);
      setPersonnelStats({
        totalPersonnel: 0,
        activePersonnel: 0,
        onDutyPersonnel: 0,
        averageRating: 0,
        totalDeliveries: 0,
        monthlyGrowth: 0
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPersonnelData();
  }, [fetchPersonnelData]);

  // Filter personnel
  const filteredPersonnel = Array.isArray(personnel) ? personnel.filter(person => {
    if (!person) return false;
    
    const matchesSearch = (person.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (person.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (person.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || person.status === statusFilter;
    const matchesZone = zoneFilter === 'all' || person.zone === zoneFilter;
    
    return matchesSearch && matchesStatus && matchesZone;
  }) : [];

  // Get status color and icon
  const getStatusInfo = (status) => {
    switch (status) {
      case 'on_duty':
        return { 
          color: 'text-green-600 bg-green-100', 
          icon: Clock,
          iconColor: 'text-green-600'
        };
      case 'active':
        return { 
          color: 'text-blue-600 bg-blue-100', 
          icon: UserCheck,
          iconColor: 'text-blue-600'
        };
      case 'inactive':
        return { 
          color: 'text-gray-600 bg-gray-100', 
          icon: Clock,
          iconColor: 'text-gray-600'
        };
      case 'off_duty':
        return { 
          color: 'text-yellow-600 bg-yellow-100', 
          icon: Clock,
          iconColor: 'text-yellow-600'
        };
      case 'suspended':
        return { 
          color: 'text-red-600 bg-red-100', 
          icon: AlertCircle,
          iconColor: 'text-red-600'
        };
      default:
        return { 
          color: 'text-gray-600 bg-gray-100', 
          icon: UserCheck,
          iconColor: 'text-gray-600'
        };
    }
  };

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

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `Rs. ${amount?.toLocaleString() || '0'}`;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <UserCheck className="mr-3 text-emerald-600" />
                Personnel Management
              </h1>
              <p className="text-gray-600 mt-2">Manage delivery personnel, riders, and their performance</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={fetchPersonnelData}
                disabled={isRefreshing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Personnel
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
                <p className="text-sm font-medium text-gray-600">Total Personnel</p>
                <p className="text-2xl font-bold text-gray-900">{personnelStats.totalPersonnel}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <UserCheck className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-emerald-500 mr-1" />
              <span className="text-sm text-emerald-600">+{personnelStats.monthlyGrowth}% this month</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Personnel</p>
                <p className="text-2xl font-bold text-gray-900">{personnelStats.activePersonnel}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">Currently working</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">On Duty</p>
                <p className="text-2xl font-bold text-gray-900">{personnelStats.onDutyPersonnel}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-sm text-blue-600">Available for delivery</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{personnelStats.averageRating}/5</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Award className="h-4 w-4 text-yellow-500 mr-1" />
              <span className="text-sm text-yellow-600">Customer satisfaction</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">{personnelStats.totalDeliveries.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Building className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-purple-500 mr-1" />
              <span className="text-sm text-purple-600">All time</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Online Now</p>
                <p className="text-2xl font-bold text-gray-900">
                  {personnel.filter(p => p.isOnline).length}
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <MapPin className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-indigo-500 mr-1" />
              <span className="text-sm text-indigo-600">Currently online</span>
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
                  placeholder="Search by name, email, or employee ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {zoneOptions.map(option => (
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

        {/* Personnel Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Delivery Personnel</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personnel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deliveries</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPersonnel.map((person) => {
                  const statusInfo = getStatusInfo(person.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <tr key={person.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-emerald-200 flex items-center justify-center">
                              <span className="text-sm font-medium text-emerald-800">
                                {person.name?.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{person.name}</div>
                            <div className="text-sm text-gray-500">{person.employeeId}</div>
                            <div className="text-sm text-gray-500">{person.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{person.zoneName}</div>
                        <div className="text-sm text-gray-500">{person.vehicleType} - {person.vehicleNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-sm font-medium text-gray-900">{person.rating}/5</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPerformanceColor(person.performance)}`}>
                            {person.performance.charAt(0).toUpperCase() + person.performance.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{person.totalDeliveries?.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">Avg: {person.averageDeliveryTime}min</div>
                        <div className="text-sm text-gray-500">Earnings: {formatCurrency(person.earnings)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <StatusIcon className={`h-4 w-4 mr-2 ${statusInfo.iconColor}`} />
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                            {person.status.replace('_', ' ').charAt(0).toUpperCase() + person.status.replace('_', ' ').slice(1)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {person.isOnline ? (
                            <span className="text-green-600">● Online</span>
                          ) : (
                            <span className="text-gray-400">● Offline</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(person.lastActive)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedPersonnel(person);
                              setShowDetailsModal(true);
                            }}
                            className="text-emerald-600 hover:text-emerald-900 flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPersonnel(person);
                              setShowEditModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </button>
                          <button className="text-red-600 hover:text-red-900 flex items-center">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
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

        {/* Personnel Details Modal */}
        {showDetailsModal && selectedPersonnel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personnel Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                    <p className="text-sm text-gray-900">{selectedPersonnel.employeeId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="text-sm text-gray-900">{selectedPersonnel.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{selectedPersonnel.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-sm text-gray-900">{selectedPersonnel.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Zone</label>
                    <p className="text-sm text-gray-900">{selectedPersonnel.zoneName}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                    <p className="text-sm text-gray-900">{selectedPersonnel.vehicleType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vehicle Number</label>
                    <p className="text-sm text-gray-900">{selectedPersonnel.vehicleNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rating</label>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="text-sm text-gray-900">{selectedPersonnel.rating}/5</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Deliveries</label>
                    <p className="text-sm text-gray-900">{selectedPersonnel.totalDeliveries?.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Average Delivery Time</label>
                    <p className="text-sm text-gray-900">{selectedPersonnel.averageDeliveryTime} minutes</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusInfo(selectedPersonnel.status).color}`}>
                      {selectedPersonnel.status.replace('_', ' ').charAt(0).toUpperCase() + selectedPersonnel.status.replace('_', ' ').slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Performance</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPerformanceColor(selectedPersonnel.performance)}`}>
                      {selectedPersonnel.performance.charAt(0).toUpperCase() + selectedPersonnel.performance.slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Join Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedPersonnel.joinDate)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Earnings</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedPersonnel.earnings)}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Current Location</label>
                  <p className="text-sm text-gray-900">{selectedPersonnel.currentLocation}</p>
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

        {/* Add Personnel Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Personnel</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zone Assignment</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                    <option>Select Zone</option>
                    <option>Zone A - West Bay</option>
                    <option>Zone B - Al Sadd</option>
                    <option>Zone C - Lusail</option>
                    <option>Zone D - City Center</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                    <option>Select Vehicle Type</option>
                    <option>Motorcycle</option>
                    <option>Bicycle</option>
                    <option>Car</option>
                    <option>Scooter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter vehicle number"
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
                <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                  Add Personnel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonnelManagement;
