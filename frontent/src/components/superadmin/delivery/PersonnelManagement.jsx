import React, { useState, useEffect, useCallback } from 'react';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Filter,
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
import { personnelApi, zoneApi } from '../../../services/api/deliveryApi';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for adding new personnel
  const [newPersonnel, setNewPersonnel] = useState({
    name: '',
    email: '',
    phone: '',
    employeeId: '',
    zone: '',
    zoneName: '',
    vehicleType: '',
    vehicleNumber: '',
    licenseNumber: '',
    status: 'active',
    password: ''
  });

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

  // Zones state for dropdown
  const [zones, setZones] = useState([]);

  // Filter options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'on_duty', label: 'On Duty' },
    { value: 'off_duty', label: 'Off Duty' },
    { value: 'suspended', label: 'Suspended' }
  ];

  // Zone options will be populated from database
  const zoneOptions = [
    { value: 'all', label: 'All Zones' },
    ...zones.map(zone => ({ value: zone._id || zone.id, label: zone.name }))
  ];

  // Fetch zones from database
  const fetchZones = useCallback(async () => {
    try {
      console.log('Fetching zones for personnel dropdown...');
      const response = await zoneApi.getAllZones({ status: 'active', limit: 100, dropdown: true });
      
      if (response && response.success) {
        // Response from dropdown=true returns simplified format: [{ value, label, id, deliveryCharge }, ...]
        const zonesData = response.data || response.zones || [];
        console.log('Zones fetched for dropdown:', zonesData);
        console.log('Zones count:', zonesData.length);
        
        // Normalize zone data to have consistent structure
        const normalizedZones = zonesData.map(zone => ({
          _id: zone.value || zone.id || zone._id,
          id: zone.id || zone.value || zone._id,
          value: zone.value || zone.id || zone._id,
          name: zone.label || zone.name,
          label: zone.label || zone.name,
          deliveryCharge: zone.deliveryCharge || 0
        }));
        
        setZones(normalizedZones);
      } else {
        // Fallback: try regular API call
        console.log('Dropdown format failed, trying regular API...');
        const fallbackResponse = await zoneApi.getAllZones({ status: 'active', limit: 100 });
        if (fallbackResponse && fallbackResponse.success) {
          const zonesData = fallbackResponse.data || fallbackResponse.zones || [];
          console.log('Zones fetched (fallback):', zonesData.length, 'zones');
          setZones(Array.isArray(zonesData) ? zonesData : []);
        } else {
          console.error('Failed to fetch zones from both endpoints');
          setZones([]);
        }
      }
    } catch (error) {
      console.error('Error fetching zones:', error);
      setZones([]);
    }
  }, []);

  // Fetch personnel data
  const fetchPersonnelData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      console.log('Fetching personnel data...');
      
      // Fetch zones first
      await fetchZones();
      
      // Fetch personnel and stats from API
      const [personnelResponse, statsResponse] = await Promise.allSettled([
        personnelApi.getAllPersonnel(),
        personnelApi.getPersonnelStats()
      ]);

      console.log('Personnel response:', personnelResponse);
      console.log('Stats response:', statsResponse);

      // Handle personnel data
      if (personnelResponse.status === 'fulfilled') {
        console.log('Personnel API call successful');
        console.log('Full response:', personnelResponse.value);
        
        if (personnelResponse.value.success) {
          const responseData = personnelResponse.value.data;
          const personnelData = responseData?.personnel || responseData?.data || responseData || [];
          console.log('Personnel data received:', personnelData);
          console.log('Personnel data length:', personnelData.length);
          console.log('Personnel data type:', typeof personnelData);
          setPersonnel(Array.isArray(personnelData) ? personnelData : []);
        } else {
          console.error('API returned success: false');
          console.error('Error message:', personnelResponse.value.message);
          setPersonnel([]);
        }
      } else {
        console.error('Personnel API call failed');
        console.error('Error:', personnelResponse.reason);
        console.error('Status:', personnelResponse.reason?.response?.status);
        console.error('Status Text:', personnelResponse.reason?.response?.statusText);
        console.error('Data:', personnelResponse.reason?.response?.data);
        setPersonnel([]);
      }

      // Handle stats data
      if (statsResponse.status === 'fulfilled' && statsResponse.value.success) {
        const statsData = statsResponse.value.data || statsResponse.value.stats || {};
        console.log('Stats data received:', statsData);
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
  }, [fetchZones]);

  useEffect(() => {
    fetchPersonnelData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Force refresh when component becomes visible (handles stale data)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !loading) {
        fetchPersonnelData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loading]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPersonnel(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle delete personnel
  const handleDeletePersonnel = async (personnel) => {
    if (!window.confirm(`Are you sure you want to delete ${personnel.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await personnelApi.deletePersonnel(personnel._id || personnel.id);
      
      if (response.success) {
        console.log('Personnel deleted successfully');
        // Refresh data
        await fetchPersonnelData();
        alert('Personnel deleted successfully!');
      } else {
        throw new Error(response.message || 'Failed to delete personnel');
      }
    } catch (err) {
      console.error('Error deleting personnel:', err);
      alert('Failed to delete personnel: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Handle edit personnel
  const handleEditPersonnel = async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setError(null);

      // Ensure zone is properly set
      let zoneId = selectedPersonnel.zone;
      let zoneName = selectedPersonnel.zoneName;
      
      // If zone is not set or is invalid, try to find it from zones list
      if ((!zoneId || zoneId === '' || zoneId === null) && zoneName) {
        const foundZone = zones.find(z => (z.name || z.label) === zoneName);
        if (foundZone) {
          zoneId = foundZone._id || foundZone.id || foundZone.value;
          zoneName = foundZone.name || foundZone.label;
        }
      } else if (zoneId) {
        // Find zone by ID to get the name
        const foundZone = zones.find(z => (z._id || z.id || z.value) === zoneId || (z._id?.toString() || z.id?.toString()) === zoneId.toString());
        if (foundZone) {
          zoneName = foundZone.name || foundZone.label || zoneName;
        }
      }
      
      // If still no zoneId, throw an error
      if (!zoneId) {
        throw new Error('Zone is required. Please select a valid zone.');
      }

      console.log('Zone debugging:', {
        originalZone: selectedPersonnel.zone,
        zoneName: zoneName,
        finalZoneId: zoneId
      });

      const personnelData = {
        name: selectedPersonnel.name.trim(),
        email: selectedPersonnel.email.trim().toLowerCase(),
        phone: selectedPersonnel.phone,
        employeeId: selectedPersonnel.employeeId,
        password: selectedPersonnel.password || '', // Include password if provided
        status: selectedPersonnel.status,
        zone: zoneId,
        zoneName: zoneName,
        vehicleType: selectedPersonnel.vehicleType,
        vehicleNumber: selectedPersonnel.vehicleNumber.trim().toUpperCase(),
        documents: {
          licenseNumber: selectedPersonnel.documents?.licenseNumber?.trim() || ''
        },
        rating: selectedPersonnel.rating,
        totalDeliveries: selectedPersonnel.totalDeliveries,
        totalEarnings: selectedPersonnel.totalEarnings,
        isOnline: selectedPersonnel.isOnline
      };

      // Validate personnel ID
      const personnelId = selectedPersonnel._id || selectedPersonnel.id;
      if (!personnelId) {
        throw new Error('Personnel ID is missing. Please refresh the page and try again.');
      }

      // Check if personnel still exists in current data
      const currentPersonnel = personnel.find(p => (p._id || p.id) === personnelId);
      if (!currentPersonnel) {
        // Try to find by employeeId as fallback
        const fallbackPersonnel = personnel.find(p => p.employeeId === selectedPersonnel.employeeId);
        if (fallbackPersonnel) {
          throw new Error(`Personnel ID mismatch detected. Please refresh the page and try again. (Expected: ${personnelId}, Found: ${fallbackPersonnel._id})`);
        } else {
          throw new Error('Personnel not found in current data. Please refresh the page and try again.');
        }
      }

      // Validate required fields
      if (!personnelData.zone) {
        throw new Error('Zone is required');
      }
      if (!personnelData.vehicleType) {
        throw new Error('Vehicle type is required');
      }
      if (!personnelData.vehicleNumber) {
        throw new Error('Vehicle number is required');
      }
      if (!personnelData.documents?.licenseNumber) {
        throw new Error('License number is required');
      }

      console.log('Updating personnel:', personnelData);
      console.log('Personnel ID being used:', selectedPersonnel._id || selectedPersonnel.id);
      console.log('Full selectedPersonnel object:', selectedPersonnel);

      const response = await personnelApi.updatePersonnel(selectedPersonnel._id || selectedPersonnel.id, personnelData);
      
      if (response.success) {
        console.log('Personnel updated successfully:', response.data);
        
        // Close modal
        setShowEditModal(false);
        setSelectedPersonnel(null);
        
        // Refresh data
        await fetchPersonnelData();
        
        // Show success message
        alert('Personnel updated successfully!');
      } else {
        throw new Error(response.message || 'Failed to update personnel');
      }
      
    } catch (err) {
      console.error('Error updating personnel:', err);
      
      // Handle specific error cases
      if (err.response?.status === 422) {
        const errorMessage = err.response?.data?.message || 'Validation failed';
        const errorDetails = err.response?.data?.errors;
        
        if (errorDetails) {
          // Handle both array and object formats
          let errorList;
          if (Array.isArray(errorDetails)) {
            errorList = errorDetails.join(', ');
          } else {
            errorList = Object.keys(errorDetails).map(key => 
              `${key}: ${errorDetails[key]}`
            ).join(', ');
          }
          setError(`Validation failed: ${errorList}`);
        } else {
          setError(`Validation failed: ${errorMessage}`);
        }
      } else if (err.response?.status === 404) {
        setError('Personnel not found. Refreshing data...');
        // Auto-refresh data when personnel not found
        setTimeout(() => {
          fetchPersonnelData();
          setError(null); // Clear error after refresh
        }, 1000);
      } else if (err.message?.includes('Personnel not found in current data')) {
        setError('Personnel data is outdated. Refreshing data...');
        // Auto-refresh data
        setTimeout(() => {
          fetchPersonnelData();
          setError(null); // Clear error after refresh
        }, 1000);
      } else {
        setError(err.message || 'Failed to update personnel');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form submission
  const handleAddPersonnel = async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setError(null);

      // Generate employee ID if not provided (required field)
      const employeeId = newPersonnel.employeeId || `EMP${Date.now().toString().slice(-6)}`;

      // Get zone from selected zone ID
      let zoneId = newPersonnel.zone;
      let zoneName = '';
      
      // Find zone by ID from the zones list
      if (zoneId) {
        const selectedZone = zones.find(z => {
          const zId = z._id || z.id || z.value;
          const zIdStr = zId?.toString();
          const zoneIdStr = zoneId?.toString();
          return zIdStr === zoneIdStr || zId === zoneId;
        });
        
        if (selectedZone) {
          zoneId = selectedZone._id || selectedZone.id || selectedZone.value;
          zoneName = selectedZone.name || selectedZone.label || '';
          console.log('Zone found:', { zoneId, zoneName, selectedZone });
        } else {
          // If not found, use the zoneId directly (it might already be the ObjectId)
          console.warn('Zone not found in zones list, using provided zoneId:', zoneId);
          console.warn('Available zones:', zones.map(z => ({ id: z._id || z.id || z.value, name: z.name || z.label })));
        }
      }

      if (!zoneId) {
        throw new Error('Please select a zone from the dropdown');
      }

      // Format phone number to match validation regex: /^\+?[1-9]\d{1,14}$/
      let formattedPhone = newPersonnel.phone.trim();
      // Remove any spaces or dashes
      formattedPhone = formattedPhone.replace(/[\s-]/g, '');
      
      if (!formattedPhone.startsWith('+')) {
        // Add country code if not present
        if (formattedPhone.startsWith('977')) {
          formattedPhone = '+' + formattedPhone;
        } else if (formattedPhone.startsWith('98') && formattedPhone.length === 10) {
          // Nepali number without country code
          formattedPhone = '+977' + formattedPhone;
        } else if (/^[1-9]\d{1,14}$/.test(formattedPhone)) {
          // Valid international format without +
          formattedPhone = '+' + formattedPhone;
        } else {
          // Default: assume it's a Nepali number
          formattedPhone = '+977' + formattedPhone;
        }
      }
      
      // Final validation: ensure it matches the regex
      if (!/^\+?[1-9]\d{1,14}$/.test(formattedPhone)) {
        throw new Error('Invalid phone number format. Please use international format (e.g., +9779812345678)');
      }

      // Prepare personnel data with all required fields
      const personnelData = {
        name: newPersonnel.name.trim(),
        email: newPersonnel.email.trim().toLowerCase(),
        phone: formattedPhone,
        employeeId: employeeId.toUpperCase(),
        password: newPersonnel.password || 'defaultPassword123', // Default password if not provided
        status: newPersonnel.status,
        zone: zoneId,
        zoneName,
        vehicleType: newPersonnel.vehicleType,
        vehicleNumber: newPersonnel.vehicleNumber.trim().toUpperCase(),
        documents: {
          licenseNumber: newPersonnel.licenseNumber.trim()
        },
        rating: 0,
        totalDeliveries: 0,
        totalEarnings: 0,
        lastActive: new Date(),
        currentLocation: {
          latitude: 27.7172,
          longitude: 85.3240
        },
        createdBy: '68f5fdfbcc0d839abf55c56c' // Super Admin ObjectId
      };

      console.log('Creating personnel:', personnelData);

      const response = await personnelApi.createPersonnel(personnelData);
      
      if (response.success) {
        console.log('Personnel created successfully:', response.data);
        
        // Reset form
        setNewPersonnel({
          name: '',
          email: '',
          phone: '',
          employeeId: '',
          zone: '',
          zoneName: '',
          vehicleType: '',
          vehicleNumber: '',
          licenseNumber: '',
          status: 'active',
          password: ''
        });
        
        // Close modal
        setShowAddModal(false);
        
        // Refresh data
        await fetchPersonnelData();
        
        // Show success message (you can add a toast notification here)
        alert('Personnel added successfully!');
      } else {
        throw new Error(response.message || 'Failed to create personnel');
      }
      
    } catch (err) {
      console.error('Error creating personnel:', err);
      
      // Handle specific error cases
      if (err.response?.status === 422 || err.response?.status === 400) {
        // Validation error or bad request (usually duplicate fields)
        const errorMessage = err.response?.data?.message || 'Validation failed';
        const errorDetails = err.response?.data?.errors;
        
        if (errorDetails) {
          // Handle both array and object formats
          let errorList;
          if (Array.isArray(errorDetails)) {
            errorList = errorDetails.join(', ');
          } else {
            errorList = Object.keys(errorDetails).map(key => 
              `${key}: ${errorDetails[key]}`
            ).join(', ');
          }
          setError(`Validation failed: ${errorList}`);
        } else {
          // Check for duplicate field messages
          if (errorMessage.includes('already exists')) {
            setError(errorMessage);
          } else {
            setError(`Validation failed: ${errorMessage}`);
          }
        }
      } else if (err.response?.status === 500) {
        // Server error - might be duplicate key error
        const errorMessage = err.response?.data?.message || err.message;
        if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
          setError(errorMessage);
        } else {
          setError('Server error. Please try again or contact support if the problem persists.');
        }
      } else {
        // Generic error
        const errorMessage = err.response?.data?.message || err.message || 'Failed to add personnel';
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setError(null);
    setNewPersonnel({
      name: '',
      email: '',
      phone: '',
      employeeId: '',
      zone: '',
      zoneName: '',
      vehicleType: '',
      vehicleNumber: '',
      licenseNumber: '',
      status: 'active',
      password: ''
    });
  };

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
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                  <UserCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Delivery Personnel</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {loading ? 'Loading personnel...' : `${filteredPersonnel.length} personnel found`}
                  </p>
                </div>
              </div>
              <button
                onClick={fetchPersonnelData}
                disabled={loading}
                className="px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors disabled:opacity-50 flex items-center"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-gray-600">Loading delivery personnel...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-red-500 text-lg font-medium mb-2">Error Loading Personnel</div>
                <div className="text-gray-600 mb-4">{error}</div>
                <button
                  onClick={fetchPersonnelData}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : filteredPersonnel.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <UserCheck className="h-8 w-8 text-gray-400" />
                </div>
                <div className="text-gray-500 text-lg font-medium mb-2">No Personnel Found</div>
                <div className="text-gray-400 mb-4">
                  {searchTerm || statusFilter !== 'all' || zoneFilter !== 'all'
                    ? 'No personnel match your current filters' 
                    : 'No delivery personnel have been added yet'
                  }
                </div>
                {!searchTerm && statusFilter === 'all' && zoneFilter === 'all' && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center mx-auto"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Add First Personnel
                  </button>
                )}
              </div>
            </div>
          ) : (
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
                    <tr key={person._id || person.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-emerald-200 flex items-center justify-center">
                                <UserCheck className="h-5 w-5 text-emerald-800" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 flex items-center">
                                <UserCheck className="h-4 w-4 text-gray-400 mr-2" />
                                {person.name || 'Unknown'}
                              </div>
                              <div className="text-sm text-gray-500">{person.employeeId || 'N/A'}</div>
                              <div className="text-sm text-gray-500">{person.phone || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{person.zoneName || 'Unassigned'}</div>
                        <div className="text-sm text-gray-500">{person.vehicleType || 'N/A'} - {person.vehicleNumber || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-sm font-medium text-gray-900">{person.rating || 0}/5</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPerformanceColor(person.performance || 'average')}`}>
                            {(person.performance || 'average').charAt(0).toUpperCase() + (person.performance || 'average').slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{person.totalDeliveries?.toLocaleString() || '0'}</div>
                        <div className="text-sm text-gray-500">Avg: {person.averageDeliveryTime || 'N/A'}min</div>
                        <div className="text-sm text-gray-500">Earnings: {formatCurrency(person.totalEarnings || 0)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <StatusIcon className={`h-4 w-4 mr-2 ${statusInfo.iconColor}`} />
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                            {(person.status || 'unknown').replace('_', ' ').charAt(0).toUpperCase() + (person.status || 'unknown').replace('_', ' ').slice(1)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {person.status === 'active' && person.isOnline ? (
                            <span className="text-green-600">● Available</span>
                          ) : (
                            <span className="text-gray-400">● Unavailable</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {person.lastActive ? formatDate(person.lastActive) : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={async () => {
                              // Refresh personnel data to ensure we have the latest
                              await fetchPersonnelData();
                              // Find the updated personnel data by employeeId (more stable than ID)
                              const updatedPersonnel = personnel.find(p => p.employeeId === person.employeeId);
                              if (updatedPersonnel) {
                                setSelectedPersonnel(updatedPersonnel);
                                setShowDetailsModal(true);
                              } else {
                                alert('Personnel not found. Please refresh the page.');
                              }
                            }}
                            className="text-emerald-600 hover:text-emerald-900 p-2 rounded-lg hover:bg-emerald-50 transition-colors"
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            onClick={async () => {
                              // Refresh personnel data to ensure we have the latest
                              await fetchPersonnelData();
                              // Find the updated personnel data by employeeId (more stable than ID)
                              const updatedPersonnel = personnel.find(p => p.employeeId === person.employeeId);
                              if (updatedPersonnel) {
                                setSelectedPersonnel(updatedPersonnel);
                                setShowEditModal(true);
                              } else {
                                alert('Personnel not found. Please refresh the page.');
                              }
                            }}
                            className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Edit Personnel"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleDeletePersonnel(person)}
                            className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Remove Personnel"
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
                      <span className="text-sm text-gray-900">{selectedPersonnel.rating || 0}/5</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Deliveries</label>
                    <p className="text-sm text-gray-900">{selectedPersonnel.totalDeliveries?.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Average Delivery Time</label>
                    <p className="text-sm text-gray-900">{selectedPersonnel.averageDeliveryTime || 'N/A'} minutes</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusInfo(selectedPersonnel.status || 'unknown').color}`}>
                      {(selectedPersonnel.status || 'unknown').replace('_', ' ').charAt(0).toUpperCase() + (selectedPersonnel.status || 'unknown').replace('_', ' ').slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Performance</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPerformanceColor(selectedPersonnel.performance || 'average')}`}>
                      {(selectedPersonnel.performance || 'average').charAt(0).toUpperCase() + (selectedPersonnel.performance || 'average').slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Join Date</label>
                    <p className="text-sm text-gray-900">{selectedPersonnel.joinDate ? formatDate(selectedPersonnel.joinDate) : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Earnings</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedPersonnel.totalEarnings)}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Current Location</label>
                  <p className="text-sm text-gray-900">
                    {selectedPersonnel.currentLocation?.address || 
                     `${selectedPersonnel.currentLocation?.latitude || 'N/A'}, ${selectedPersonnel.currentLocation?.longitude || 'N/A'}`}
                  </p>
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

        {/* Edit Personnel Modal */}
        {showEditModal && selectedPersonnel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Edit Personnel</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedPersonnel(null);
                  }}
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
              
              <form onSubmit={handleEditPersonnel} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={selectedPersonnel.name || ''}
                      onChange={(e) => setSelectedPersonnel(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={selectedPersonnel.email || ''}
                      onChange={(e) => setSelectedPersonnel(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={selectedPersonnel.phone || ''}
                      onChange={(e) => setSelectedPersonnel(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID *</label>
                    <input
                      type="text"
                      name="employeeId"
                      value={selectedPersonnel.employeeId || ''}
                      onChange={(e) => setSelectedPersonnel(prev => ({ ...prev, employeeId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Zone</label>
                    <select
                      name="zone"
                      value={selectedPersonnel.zone?._id || selectedPersonnel.zone || ''}
                      onChange={(e) => {
                        const zoneId = e.target.value;
                        const selectedZone = zones.find(z => (z._id || z.id || z.value) === zoneId);
                        setSelectedPersonnel(prev => ({ 
                          ...prev, 
                          zone: zoneId,
                          zoneName: selectedZone ? (selectedZone.name || selectedZone.label) : ''
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      disabled={zones.length === 0}
                    >
                      <option value="">
                        {zones.length === 0 ? 'Loading zones...' : 'Select Zone'}
                      </option>
                      {zones.map((zone) => (
                        <option 
                          key={zone._id || zone.id || zone.value} 
                          value={zone._id || zone.id || zone.value}
                        >
                          {zone.name || zone.label} {zone.deliveryCharge ? `(Rs. ${zone.deliveryCharge})` : ''}
                        </option>
                      ))}
                    </select>
                    {zones.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">No zones available. Please ensure zones are created.</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type *</label>
                    <select
                      name="vehicleType"
                      value={selectedPersonnel.vehicleType || ''}
                      onChange={(e) => setSelectedPersonnel(prev => ({ ...prev, vehicleType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    >
                      <option value="">Select Vehicle Type</option>
                      <option value="Motorcycle">Motorcycle</option>
                      <option value="Bicycle">Bicycle</option>
                      <option value="Car">Car</option>
                      <option value="Scooter">Scooter</option>
                      <option value="E-bike">E-bike</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Number *</label>
                    <input
                      type="text"
                      name="vehicleNumber"
                      value={selectedPersonnel.vehicleNumber || ''}
                      onChange={(e) => setSelectedPersonnel(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">License Number *</label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={selectedPersonnel.documents?.licenseNumber || ''}
                      onChange={(e) => setSelectedPersonnel(prev => ({ 
                        ...prev, 
                        documents: { 
                          ...prev.documents, 
                          licenseNumber: e.target.value 
                        } 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                    <select
                      name="status"
                      value={selectedPersonnel.status || ''}
                      onChange={(e) => setSelectedPersonnel(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="on_duty">On Duty</option>
                      <option value="off_duty">Off Duty</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    <input
                      type="number"
                      name="rating"
                      min="0"
                      max="5"
                      step="0.1"
                      value={selectedPersonnel.rating || 0}
                      onChange={(e) => setSelectedPersonnel(prev => ({ ...prev, rating: parseFloat(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Deliveries</label>
                    <input
                      type="number"
                      name="totalDeliveries"
                      min="0"
                      value={selectedPersonnel.totalDeliveries || 0}
                      onChange={(e) => setSelectedPersonnel(prev => ({ ...prev, totalDeliveries: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Earnings</label>
                    <input
                      type="number"
                      name="totalEarnings"
                      min="0"
                      value={selectedPersonnel.totalEarnings || 0}
                      onChange={(e) => setSelectedPersonnel(prev => ({ ...prev, totalEarnings: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      name="password"
                      value={selectedPersonnel.password || ''}
                      onChange={(e) => setSelectedPersonnel(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Enter new password (leave blank to keep current)"
                      minLength="6"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave blank to keep current password</p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Availability:</span> {selectedPersonnel.status === 'active' && selectedPersonnel.isOnline ? 'Available' : 'Unavailable'}
                      </div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedPersonnel.isOnline || false}
                          onChange={(e) => setSelectedPersonnel(prev => ({ ...prev, isOnline: e.target.checked }))}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">Online</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 mt-8">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedPersonnel(null);
                    }}
                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium min-w-[120px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium min-w-[120px] flex items-center justify-center"
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
                      'Update Personnel'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Personnel Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Add New Personnel</h3>
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
              
              <form onSubmit={handleAddPersonnel} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={newPersonnel.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={newPersonnel.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter email address"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={newPersonnel.phone}
                      onChange={handleInputChange}
                      required
                      pattern="^\+?[1-9]\d{1,14}$"
                      title="Enter a valid phone number (e.g., +9779816878592 or 9816878592)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="e.g., +9779816878592 or 9816878592"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID *</label>
                    <input
                      type="text"
                      name="employeeId"
                      value={newPersonnel.employeeId}
                      onChange={handleInputChange}
                      required
                      pattern="[A-Z0-9]+"
                      title="Employee ID must contain only uppercase letters and numbers"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="e.g., EMP001, RIDER123"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Zone Assignment *</label>
                    <select 
                      name="zone"
                      value={newPersonnel.zone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      disabled={zones.length === 0}
                    >
                      <option value="">
                        {zones.length === 0 ? 'Loading zones...' : 'Select Zone'}
                      </option>
                      {zones.map((zone) => (
                        <option 
                          key={zone._id || zone.id || zone.value} 
                          value={zone._id || zone.id || zone.value}
                        >
                          {zone.name || zone.label} {zone.deliveryCharge ? `(Rs. ${zone.deliveryCharge})` : ''}
                        </option>
                      ))}
                    </select>
                    {zones.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">No zones available. Please ensure zones are created.</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type *</label>
                    <select 
                      name="vehicleType"
                      value={newPersonnel.vehicleType}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="">Select Vehicle Type</option>
                      <option value="Motorcycle">Motorcycle</option>
                      <option value="Bicycle">Bicycle</option>
                      <option value="Car">Car</option>
                      <option value="Scooter">Scooter</option>
                      <option value="E-bike">E-bike</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Number *</label>
                    <input
                      type="text"
                      name="vehicleNumber"
                      value={newPersonnel.vehicleNumber}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter vehicle number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">License Number *</label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={newPersonnel.licenseNumber}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter license number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={newPersonnel.password}
                      onChange={handleInputChange}
                      required
                      minLength="6"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter password (min 6 characters)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select 
                      name="status"
                      value={newPersonnel.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="on_duty">On Duty</option>
                      <option value="off_duty">Off Duty</option>
                    </select>
                  </div>
                </div>
                
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
                    className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium min-w-[120px] flex items-center justify-center"
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
                      'Add Personnel'
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

export default PersonnelManagement;
