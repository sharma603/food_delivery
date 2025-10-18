import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  MoreVertical,
  Eye,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  Star,
  ShoppingBag,
  X
} from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCheck, faUserTimes, faTrash } from '@fortawesome/free-solid-svg-icons';

const AllCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalOrders: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    segment: '',
    registrationDate: ''
  });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && !event.target.closest('.relative')) {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  // Fetch customers from API
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        
        // Get auth token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          setLoading(false);
          return;
        }

        // Build query parameters
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (filters.status) params.append('status', filters.status);
        if (filters.segment) params.append('segment', filters.segment);
        
        const response = await fetch(`http://localhost:5000/api/v1/superadmin/customers?${params}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        

        const data = await response.json();
        
        if (data.success) {
          setCustomers(data.data || []);
        } else {
          console.error('Failed to fetch customers:', data.message);
          setCustomers([]);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [searchTerm, filters.status, filters.segment]);

  // Fetch analytics data on component mount
  useEffect(() => {
    fetchAnalytics();
  }, []);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filters.status || customer.status === filters.status;
    const matchesSegment = !filters.segment || customer.segment === filters.segment;
    
    return matchesSearch && matchesStatus && matchesSegment;
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'email':
        aValue = a.email.toLowerCase();
        bValue = b.email.toLowerCase();
        break;
      case 'totalOrders':
        aValue = a.totalOrders;
        bValue = b.totalOrders;
        break;
      case 'totalSpent':
        aValue = a.totalSpent;
        bValue = b.totalSpent;
        break;
      case 'registrationDate':
        aValue = new Date(a.registrationDate);
        bValue = new Date(b.registrationDate);
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
    closeDropdown(); // Close any open dropdown when opening modal
  };

  const toggleDropdown = (customerId) => {
    setOpenDropdownId(openDropdownId === customerId ? null : customerId);
  };

  const closeDropdown = () => {
    setOpenDropdownId(null);
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch('http://localhost:5000/api/v1/superadmin/customers/analytics', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setAnalytics({
          totalCustomers: data.data.totalCustomers || 0,
          activeCustomers: data.data.activeCustomers || 0,
          totalOrders: data.data.totalOrders || 0
        });
      } else {
        console.error('Failed to fetch analytics:', data.message);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleUpdateCustomerStatus = async (customerId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/v1/superadmin/customers/${customerId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Update the customer in the local state
        setCustomers(prev => prev.map(customer => 
          customer._id === customerId 
            ? { ...customer, status: newStatus }
            : customer
        ));
        
        // Refresh analytics data
        fetchAnalytics();
        console.log('Customer status updated successfully');
      } else {
        console.error('Failed to update customer status:', data.message);
      }
    } catch (error) {
      console.error('Error updating customer status:', error);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/v1/superadmin/customers/${customerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Remove the customer from the local state
        setCustomers(prev => prev.filter(customer => customer._id !== customerId));
        
        // Refresh analytics data
        fetchAnalytics();
        console.log('Customer deleted successfully');
      } else {
        console.error('Failed to delete customer:', data.message);
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSegmentColor = (segment) => {
    switch (segment) {
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'regular': return 'bg-blue-100 text-blue-800';
      case 'new': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Customer Management</h1>
        <p className="text-sm text-gray-600">Manage and monitor all customer accounts</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Total Customers</p>
              <p className="text-xl font-bold text-gray-900">{analytics.totalCustomers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Active Customers</p>
              <p className="text-xl font-bold text-gray-900">
                {analytics.activeCustomers}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Total Orders</p>
              <p className="text-xl font-bold text-gray-900">
                {analytics.totalOrders}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>

            <select
              value={filters.segment}
              onChange={(e) => setFilters(prev => ({ ...prev, segment: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Segments</option>
              <option value="premium">Premium</option>
              <option value="regular">Regular</option>
              <option value="new">New</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="email">Sort by Email</option>
              <option value="totalOrders">Sort by Orders</option>
              <option value="totalSpent">Sort by Spent</option>
              <option value="registrationDate">Sort by Registration</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sortedCustomers.map((customer) => (
          <div key={customer._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            {/* Customer Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 text-sm truncate">{customer.name}</h3>
                  <p className="text-xs text-gray-500 truncate">{customer.email}</p>
                </div>
              </div>
              <div className="flex flex-col space-y-1">
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                  {customer.status}
                </span>
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getSegmentColor(customer.segment)}`}>
                  {customer.segment}
                </span>
              </div>
            </div>

            {/* Customer Info - Compact */}
            <div className="space-y-1 mb-3">
              <div className="flex items-center text-xs text-gray-600">
                <Phone className="w-3 h-3 mr-1" />
                <span className="truncate">{customer.phone}</span>
              </div>
              <div className="flex items-center text-xs text-gray-600">
                <MapPin className="w-3 h-3 mr-1" />
                <span className="truncate">{customer.address}</span>
              </div>
            </div>

            {/* Customer Stats - Compact */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="text-center p-2 bg-gray-50 rounded">
                <p className="text-lg font-bold text-gray-900">{customer.totalOrders}</p>
                <p className="text-xs text-gray-600">Orders</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <p className="text-lg font-bold text-gray-900">₹{customer.totalSpent}</p>
                <p className="text-xs text-gray-600">Spent</p>
              </div>
            </div>

            {/* Rating - Compact */}
            <div className="flex items-center justify-center mb-3">
              <div className="flex items-center">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <span className="ml-1 text-xs font-medium text-gray-900">{customer.rating}</span>
              </div>
            </div>

            {/* Actions - Compact */}
            <div className="flex space-x-1">
              <button
                onClick={() => handleViewCustomer(customer)}
                className="flex-1 bg-blue-500 text-white px-2 py-1.5 rounded text-xs font-medium hover:bg-blue-600 transition-colors"
              >
                <Eye className="w-3 h-3 inline mr-1" />
                View
              </button>
              <div className="relative">
                <button 
                  onClick={() => toggleDropdown(customer._id)}
                  className="px-2 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  <MoreVertical className="w-3 h-3" />
                </button>
                {/* Dropdown menu - only show when this customer's dropdown is open */}
                {openDropdownId === customer._id && (
                  <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          handleUpdateCustomerStatus(customer._id, customer.status === 'active' ? 'inactive' : 'active');
                          closeDropdown();
                        }}
                        className="flex items-center w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                      >
                        <FontAwesomeIcon 
                          icon={customer.status === 'active' ? faUserTimes : faUserCheck} 
                          className="w-3 h-3 mr-2" 
                        />
                        {customer.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => {
                          handleDeleteCustomer(customer._id);
                          closeDropdown();
                        }}
                        className="flex items-center w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-gray-100"
                      >
                        <FontAwesomeIcon icon={faTrash} className="w-3 h-3 mr-2" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Customer Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Customer Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Customer Info */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedCustomer.name}</h3>
                  <p className="text-gray-600">{selectedCustomer.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedCustomer.status)}`}>
                      {selectedCustomer.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSegmentColor(selectedCustomer.segment)}`}>
                      {selectedCustomer.segment}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <p className="text-gray-900">{selectedCustomer.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <p className="text-gray-900">{selectedCustomer.address}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{selectedCustomer.totalOrders}</p>
                  <p className="text-sm text-gray-600">Total Orders</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">₹{selectedCustomer.totalSpent}</p>
                  <p className="text-sm text-gray-600">Total Spent</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">₹{selectedCustomer.averageOrderValue}</p>
                  <p className="text-sm text-gray-600">Avg Order Value</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-2xl font-bold text-gray-900">{selectedCustomer.rating}</span>
                  </div>
                  <p className="text-sm text-gray-600">Rating</p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Date</label>
                  <p className="text-gray-900">{new Date(selectedCustomer.registrationDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Order</label>
                  <p className="text-gray-900">{new Date(selectedCustomer.lastOrderDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                <Mail className="w-4 h-4 inline mr-2" />
                Send Email
              </button>
              <button 
                onClick={() => handleUpdateCustomerStatus(selectedCustomer._id, selectedCustomer.status === 'active' ? 'inactive' : 'active')}
                className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                <FontAwesomeIcon 
                  icon={selectedCustomer.status === 'active' ? faUserTimes : faUserCheck} 
                  className="w-4 h-4 inline mr-2" 
                />
                {selectedCustomer.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
              <button 
                onClick={() => handleDeleteCustomer(selectedCustomer._id)}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllCustomers;
