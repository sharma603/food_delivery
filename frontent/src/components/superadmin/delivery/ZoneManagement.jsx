import React, { useState, useEffect, useCallback } from 'react';
import { 
  MapPin, 
  Plus, 
  Search, 
  Filter,
  RefreshCw,
  TrendingUp,
  Download,
  Building,
  Banknote,
  Users,
  Clock
} from 'lucide-react';
import { zoneApi } from '../../../services/api/deliveryApi';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for adding new zone
  const [newZone, setNewZone] = useState({
    name: '',
    description: '',
    areas: '',
    pincodes: '',
    deliveryCharge: '',
    coverage: '',
    estimatedDeliveryTime: ''
  });

  // Form state for editing zone
  const [editZone, setEditZone] = useState({
    name: '',
    description: '',
    areas: '',
    pincodes: '',
    deliveryCharge: '',
    coverage: '',
    estimatedDeliveryTime: '',
    status: 'active'
  });

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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    itemsPerPage: 10
  });

  // Filter options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'maintenance', label: 'Under Maintenance' }
  ];

  // Fetch zone data
  const fetchZoneData = useCallback(async (page = currentPage) => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      console.log('Fetching zone data for page:', page);
      
      // Fetch zones and stats from API with pagination
      const [zonesResponse, statsResponse] = await Promise.allSettled([
        zoneApi.getAllZones({ 
          status: statusFilter === 'all' ? undefined : statusFilter, 
          limit: itemsPerPage, 
          page: page,
          search: searchTerm || undefined
        }),
        zoneApi.getZoneStats()
      ]);

      console.log('Zones response:', zonesResponse);
      console.log('Stats response:', statsResponse);

      // Handle zones data first
      let fetchedZones = [];
      if (zonesResponse.status === 'fulfilled') {
        // zoneApi.getAllZones() already returns response.data (unwrapped)
        // So zonesResponse.value is: { success: true, data: zones, zones: zones, ... }
        const responseData = zonesResponse.value;
        
        console.log('=== ZONES RESPONSE DEBUG ===');
        console.log('Response data:', responseData);
        console.log('Response success:', responseData?.success);
        console.log('Has data field:', !!responseData?.data);
        console.log('Data type:', typeof responseData?.data);
        console.log('Data is array:', Array.isArray(responseData?.data));
        console.log('Has zones field:', !!responseData?.zones);
        console.log('Zones is array:', Array.isArray(responseData?.zones));
        
        // Check if response is successful
        if (responseData?.success === true) {
          // Backend returns: { success: true, data: zones, zones: zones, ... }
          // Since zoneApi returns response.data, we already have the unwrapped object
          let zonesData = [];
          
          // Try different possible locations for zones data
          if (Array.isArray(responseData.data)) {
            zonesData = responseData.data;
            console.log('✓ Found zones in responseData.data - count:', zonesData.length);
          } else if (Array.isArray(responseData.zones)) {
            zonesData = responseData.zones;
            console.log('✓ Found zones in responseData.zones - count:', zonesData.length);
          } else {
            console.error('❌ Could not find zones array in response!');
            console.error('Response structure:', {
              keys: Object.keys(responseData || {}),
              dataType: typeof responseData?.data,
              dataValue: responseData?.data,
              zonesType: typeof responseData?.zones,
              zonesValue: responseData?.zones
            });
          }
          
          fetchedZones = Array.isArray(zonesData) ? zonesData : [];
          console.log('Final zones count:', fetchedZones.length);
          console.log('First zone sample:', fetchedZones[0]);
          
          // Update pagination info from response
          if (responseData.pagination) {
            setPagination({
              totalItems: responseData.pagination.totalItems || fetchedZones.length,
              totalPages: responseData.pagination.totalPages || 1,
              currentPage: responseData.pagination.currentPage || page,
              itemsPerPage: responseData.pagination.itemsPerPage || itemsPerPage
            });
            setCurrentPage(responseData.pagination.currentPage || page);
          } else {
            // Fallback pagination calculation
            const totalPages = Math.ceil((responseData.pagination?.totalItems || fetchedZones.length) / itemsPerPage);
            setPagination({
              totalItems: responseData.pagination?.totalItems || fetchedZones.length,
              totalPages: totalPages,
              currentPage: page,
              itemsPerPage: itemsPerPage
            });
          }
          
          setZones(fetchedZones);
        } else {
          console.error('❌ Response success is false:', responseData);
          setZones([]);
        }
      } else {
        console.error('❌ Promise rejected:', zonesResponse.reason);
        setZones([]);
      }

      // Handle stats data - calculate from zones if stats API fails
      // Calculate stats from fetched zones (more reliable than API)
      const totalZones = fetchedZones.length;
      const activeZones = fetchedZones.filter(z => z && z.status === 'active').length;
      const totalDeliveryCharges = fetchedZones.reduce((sum, z) => sum + (z?.deliveryCharge || 0), 0);
      // Round average charge to 2 decimal places
      const averageCharge = totalZones > 0 
        ? Math.round((totalDeliveryCharges / totalZones + Number.EPSILON) * 100) / 100 
        : 0;
      
      if (statsResponse.status === 'fulfilled') {
        const responseData = statsResponse.value; // Already unwrapped
        if (responseData?.success === true) {
          const statsData = responseData.data || responseData.stats || {};
          console.log('Stats data received:', statsData);
          // Round average charge if it comes from API
          const apiAverageCharge = statsData.averageCharge 
            ? Math.round((statsData.averageCharge + Number.EPSILON) * 100) / 100 
            : averageCharge;
          
          setZoneStats({
            totalZones: statsData.totalZones || totalZones,
            activeZones: statsData.activeZones || activeZones,
            totalDeliveryCharges: statsData.totalDeliveryCharges || totalDeliveryCharges,
            averageCharge: apiAverageCharge,
            totalOrders: statsData.totalOrders || 0,
            monthlyGrowth: statsData.monthlyGrowth || 0
          });
        } else {
          // Use calculated stats from zones
          setZoneStats({
            totalZones,
            activeZones,
            totalDeliveryCharges,
            averageCharge,
            totalOrders: 0,
            monthlyGrowth: 0
          });
        }
      } else {
        // Use calculated stats from zones
        setZoneStats({
          totalZones,
          activeZones,
          totalDeliveryCharges,
          averageCharge,
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
  }, [statusFilter, searchTerm, itemsPerPage, currentPage]);

  useEffect(() => {
    fetchZoneData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch data when status filter or search changes (reset to page 1)
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  // Refetch data when page changes
  useEffect(() => {
    fetchZoneData(currentPage);
  }, [currentPage, fetchZoneData]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewZone(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleAddZone = async (e) => {
    e.preventDefault();
    
    if (!newZone.name || !newZone.areas || !newZone.deliveryCharge) {
      setError('Please fill in all required fields (Name, Areas, Delivery Charge)');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Prepare zone data
      const zoneData = {
        name: newZone.name.trim(),
        description: newZone.description.trim(),
        areas: newZone.areas.split(',').map(area => area.trim()).filter(area => area),
        pincodes: newZone.pincodes ? newZone.pincodes.split(',').map(pin => pin.trim()).filter(pin => pin) : [],
        deliveryCharge: parseFloat(newZone.deliveryCharge),
        coverage: newZone.coverage.trim() || '5km radius',
        estimatedDeliveryTime: newZone.estimatedDeliveryTime.trim() || '30-45 minutes'
      };

      const response = await zoneApi.createZone(zoneData);
      
      if (response.success) {
        // Reset form
        setNewZone({
          name: '',
          description: '',
          areas: '',
          pincodes: '',
          deliveryCharge: '',
          coverage: '',
          estimatedDeliveryTime: ''
        });
        
        // Close modal
        setShowAddModal(false);
        
        // Refresh data
        await fetchZoneData();
        
        // Show success message (you can add a toast notification here)
        console.log('Zone created successfully');
      } else {
        setError(response.message || 'Failed to create zone');
      }
    } catch (err) {
      console.error('Error creating zone:', err);
      setError(err.response?.data?.message || 'Failed to create zone');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when modal closes
  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setNewZone({
      name: '',
      description: '',
      areas: '',
      pincodes: '',
      deliveryCharge: '',
      coverage: '',
      estimatedDeliveryTime: ''
    });
    setError(null);
  };

  // Handle edit zone - populate form with selected zone data
  const handleEditClick = (zone) => {
    setSelectedZone(zone);
    setEditZone({
      name: zone.name || '',
      description: zone.description || '',
      areas: Array.isArray(zone.areas) ? zone.areas.join(', ') : zone.areas || '',
      pincodes: Array.isArray(zone.pincodes) ? zone.pincodes.join(', ') : zone.pincodes || '',
      deliveryCharge: zone.deliveryCharge || '',
      coverage: zone.coverage || '',
      estimatedDeliveryTime: zone.estimatedDeliveryTime || '',
      status: zone.status || 'active'
    });
    setShowEditModal(true);
    setError(null);
  };

  // Handle edit form input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditZone(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle edit zone submission
  const handleEditZone = async (e) => {
    e.preventDefault();
    
    if (!editZone.name || !editZone.areas || !editZone.deliveryCharge) {
      setError('Please fill in all required fields (Name, Areas, Delivery Charge)');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Prepare zone data
      const zoneData = {
        name: editZone.name.trim(),
        description: editZone.description.trim(),
        areas: editZone.areas.split(',').map(area => area.trim()).filter(area => area),
        pincodes: editZone.pincodes ? editZone.pincodes.split(',').map(pin => pin.trim()).filter(pin => pin) : [],
        deliveryCharge: parseFloat(editZone.deliveryCharge),
        coverage: editZone.coverage.trim() || '5km radius',
        estimatedDeliveryTime: editZone.estimatedDeliveryTime.trim() || '30-45 minutes',
        status: editZone.status
      };

      const zoneId = selectedZone._id || selectedZone.id;
      const response = await zoneApi.updateZone(zoneId, zoneData);
      
      if (response.success) {
        // Close modal
        setShowEditModal(false);
        setSelectedZone(null);
        
        // Refresh data
        await fetchZoneData();
        
        console.log('Zone updated successfully');
      } else {
        setError(response.message || 'Failed to update zone');
      }
    } catch (err) {
      console.error('Error updating zone:', err);
      setError(err.response?.data?.message || 'Failed to update zone');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close edit modal
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedZone(null);
    setEditZone({
      name: '',
      description: '',
      areas: '',
      pincodes: '',
      deliveryCharge: '',
      coverage: '',
      estimatedDeliveryTime: '',
      status: 'active'
    });
    setError(null);
  };

  // Handle delete zone
  const handleDeleteZone = async (zone) => {
    if (!window.confirm(`Are you sure you want to delete zone "${zone.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const zoneId = zone._id || zone.id;
      const response = await zoneApi.deleteZone(zoneId);
      
      if (response.success) {
        // Refresh data
        await fetchZoneData();
        console.log('Zone deleted successfully');
      } else {
        setError(response.message || 'Failed to delete zone');
      }
    } catch (err) {
      console.error('Error deleting zone:', err);
      setError(err.response?.data?.message || 'Failed to delete zone');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Zones are already filtered server-side based on statusFilter and searchTerm
  // No need for client-side filtering since we're using server-side pagination
  const displayedZones = zones;

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
              <span className="text-sm text-blue-600">
                {zoneStats.monthlyGrowth > 0 ? '+' : ''}{zoneStats.monthlyGrowth.toFixed(2)}% this month
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Charge</p>
                <p className="text-2xl font-bold text-gray-900">
                  {zoneStats.averageCharge > 0 
                    ? formatCurrency(zoneStats.averageCharge) 
                    : 'Rs. 0'}
                </p>
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
            <p className="text-sm text-gray-500 mt-1">
              {loading ? 'Loading zones...' : `Showing ${displayedZones.length} of ${pagination.totalItems} zones`}
            </p>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-gray-600">Loading delivery zones...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-red-500 text-lg font-medium mb-2">Error Loading Zones</div>
                <div className="text-gray-600 mb-4">{error}</div>
                <button
                  onClick={fetchZoneData}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : displayedZones.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-500 text-lg font-medium mb-2">No Zones Found</div>
                <div className="text-gray-400 mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No zones match your current filters' 
                    : 'No delivery zones have been created yet'
                  }
                </div>
                {!searchTerm && statusFilter === 'all' && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center mx-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Zone
                  </button>
                )}
              </div>
            </div>
          ) : (
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
                  {displayedZones.map((zone) => {
                    const statusInfo = getStatusInfo(zone.status);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <tr key={zone._id || zone.id} className="hover:bg-gray-50">
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
                          <div className="text-sm text-gray-500">Revenue: {formatCurrency(zone.totalRevenue || 0)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {zone.restaurantCount || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {zone.orderCount?.toLocaleString() || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <StatusIcon className={`h-4 w-4 mr-2 ${statusInfo.iconColor}`} />
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                              {zone.status?.charAt(0).toUpperCase() + zone.status?.slice(1) || 'Unknown'}
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
                              className="text-teal-600 hover:text-teal-900 p-2 rounded-lg hover:bg-teal-50 transition-colors"
                              title="View Details"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              onClick={() => handleEditClick(zone)}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Edit Zone"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteZone(zone)}
                              disabled={isSubmitting}
                              className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete Zone"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && pagination.totalPages > 1 && (
            <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, pagination.totalItems)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.totalItems}</span> zones
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-teal-50 border-teal-500 text-teal-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                      disabled={currentPage === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Zone Details Modal */}
        {showDetailsModal && selectedZone && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Zone Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Zone ID</label>
                    <p className="text-sm text-gray-900">{selectedZone._id || selectedZone.id}</p>
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
              <div className="flex justify-end pt-6 border-t border-gray-200 mt-8">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium min-w-[120px]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Zone Modal */}
        {showEditModal && selectedZone && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Edit Zone</h3>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleEditZone} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zone Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editZone.name}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                      placeholder="e.g., Zone A - West Bay"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Charge (Rs.) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="deliveryCharge"
                      value={editZone.deliveryCharge}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                      placeholder="Enter delivery charge"
                      min="0"
                      max="1000"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={editZone.description}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                    placeholder="Describe the zone coverage"
                    rows="3"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Areas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="areas"
                    value={editZone.areas}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                    placeholder="e.g., Thamel, Durbar Marg, New Road (comma separated)"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">Separate multiple areas with commas</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pincodes</label>
                  <input
                    type="text"
                    name="pincodes"
                    value={editZone.pincodes}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                    placeholder="e.g., 44600, 44601, 44602 (comma separated)"
                  />
                  <p className="text-xs text-gray-500 mt-2">Separate multiple pincodes with commas</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Coverage Radius</label>
                    <input
                      type="text"
                      name="coverage"
                      value={editZone.coverage}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                      placeholder="e.g., 5km radius"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Delivery Time</label>
                    <input
                      type="text"
                      name="estimatedDeliveryTime"
                      value={editZone.estimatedDeliveryTime}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                      placeholder="e.g., 25-35 minutes"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    name="status"
                    value={editZone.status}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Under Maintenance</option>
                  </select>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 mt-8">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium min-w-[120px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium min-w-[120px] flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </>
                    ) : (
                      'Update Zone'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Zone Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Add New Zone</h3>
                <button
                  onClick={handleCloseAddModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleAddZone} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zone Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newZone.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                      placeholder="e.g., Zone A - West Bay"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Charge (Rs.) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="deliveryCharge"
                      value={newZone.deliveryCharge}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                      placeholder="Enter delivery charge"
                      min="0"
                      max="1000"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={newZone.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                    placeholder="Describe the zone coverage"
                    rows="3"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Areas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="areas"
                    value={newZone.areas}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                    placeholder="e.g., Thamel, Durbar Marg, New Road (comma separated)"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">Separate multiple areas with commas</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pincodes</label>
                  <input
                    type="text"
                    name="pincodes"
                    value={newZone.pincodes}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                    placeholder="e.g., 44600, 44601, 44602 (comma separated)"
                  />
                  <p className="text-xs text-gray-500 mt-2">Separate multiple pincodes with commas</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Coverage Radius</label>
                    <input
                      type="text"
                      name="coverage"
                      value={newZone.coverage}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                      placeholder="e.g., 5km radius"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Delivery Time</label>
                    <input
                      type="text"
                      name="estimatedDeliveryTime"
                      value={newZone.estimatedDeliveryTime}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                      placeholder="e.g., 25-35 minutes"
                    />
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 mt-8">
                  <button
                    type="button"
                    onClick={handleCloseAddModal}
                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium min-w-[120px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium min-w-[120px] flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding...
                      </>
                    ) : (
                      'Add Zone'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZoneManagement;
