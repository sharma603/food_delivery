import React, { useState } from 'react';
import { Search, ToggleLeft, Eye, Edit, CheckCircle, Clock, XCircle } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Table from '../ui/Table';
import Modal from '../ui/Modal';

const StatusControl = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // real data
  const restaurants = [
    {
      id: 'REST-001',
      name: 'Pizza Palace',
      owner: 'John Doe',
      email: 'john@pizzapalace.com',
      phone: '+1 (555) 123-4567',
      address: '123 Main St, New York, NY 10001',
      status: 'active',
      registrationDate: '2024-01-15',
      lastActive: '2024-01-28',
      totalOrders: 1250,
      rating: 4.5,
      revenue: 125000,
      documentsStatus: 'complete',
      verificationStatus: 'verified'
    },
    {
      id: 'REST-002',
      name: 'Burger King',
      owner: 'Jane Smith',
      email: 'jane@burgerking.com',
      phone: '+1 (555) 234-5678',
      address: '456 Oak Ave, Los Angeles, CA 90210',
      status: 'inactive',
      registrationDate: '2024-01-20',
      lastActive: '2024-01-25',
      totalOrders: 890,
      rating: 4.2,
      revenue: 89000,
      documentsStatus: 'pending',
      verificationStatus: 'pending'
    },
    {
      id: 'REST-003',
      name: 'Sushi Master',
      owner: 'Mike Johnson',
      email: 'mike@sushimaster.com',
      phone: '+1 (555) 345-6789',
      address: '789 Pine St, San Francisco, CA 94102',
      status: 'suspended',
      registrationDate: '2024-01-25',
      lastActive: '2024-01-26',
      totalOrders: 450,
      rating: 4.8,
      revenue: 67000,
      documentsStatus: 'incomplete',
      verificationStatus: 'rejected'
    },
    {
      id: 'REST-004',
      name: 'Taco Bell',
      owner: 'Sarah Wilson',
      email: 'sarah@tacobell.com',
      phone: '+1 (555) 456-7890',
      address: '321 Elm St, Chicago, IL 60601',
      status: 'pending',
      registrationDate: '2024-01-28',
      lastActive: '2024-01-28',
      totalOrders: 0,
      rating: 0,
      revenue: 0,
      documentsStatus: 'pending',
      verificationStatus: 'pending'
    }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'green', icon: CheckCircle },
      inactive: { color: 'gray', icon: ToggleLeft },
      suspended: { color: 'red', icon: XCircle },
      pending: { color: 'yellow', icon: Clock }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge color={config.color}>
        <Icon size={14} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getVerificationBadge = (status) => {
    const statusConfig = {
      verified: { color: 'green', icon: CheckCircle },
      pending: { color: 'yellow', icon: Clock },
      rejected: { color: 'red', icon: XCircle }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge color={config.color}>
        <Icon size={14} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || restaurant.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowDetailsModal(true);
  };

  const handleEditStatus = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowEditModal(true);
  };

  const handleStatusChange = (restaurantId, newStatus) => {
    console.log(`Changing status for ${restaurantId} to ${newStatus}`);
    setShowEditModal(false);
  };

  const columns = [
    { key: 'name', label: 'Restaurant Name' },
    { key: 'owner', label: 'Owner' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status' },
    { key: 'verificationStatus', label: 'Verification' },
    { key: 'totalOrders', label: 'Total Orders' },
    { key: 'rating', label: 'Rating' },
    { key: 'actions', label: 'Actions' }
  ];

  const tableData = filteredRestaurants.map(restaurant => ({
    ...restaurant,
    status: getStatusBadge(restaurant.status),
    verificationStatus: getVerificationBadge(restaurant.verificationStatus),
    rating: restaurant.rating > 0 ? `${restaurant.rating}/5` : 'N/A',
    actions: (
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleViewDetails(restaurant)}
        >
          <Eye size={16} />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleEditStatus(restaurant)}
        >
          <Edit size={16} />
        </Button>
      </div>
    )
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Status Control</h1>
          <p className="text-gray-600 mt-2">Manage restaurant status and verification</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Restaurants</p>
              <p className="text-2xl font-bold text-gray-900">
                {restaurants.filter(r => r.status === 'active').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {restaurants.filter(r => r.status === 'pending').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-full">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Suspended</p>
              <p className="text-2xl font-bold text-gray-900">
                {restaurants.filter(r => r.status === 'suspended').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <ToggleLeft className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-900">
                {restaurants.filter(r => r.status === 'inactive').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search restaurants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </Card>

      {/* Restaurants Table */}
      <Card className="p-6">
        <Table
          columns={columns}
          data={tableData}
          searchable={false}
        />
      </Card>

      {/* Restaurant Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Restaurant Details"
      >
        {selectedRestaurant && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Restaurant Name</label>
                <p className="mt-1 text-sm text-gray-900">{selectedRestaurant.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Owner</label>
                <p className="mt-1 text-sm text-gray-900">{selectedRestaurant.owner}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{selectedRestaurant.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-sm text-gray-900">{selectedRestaurant.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <p className="mt-1 text-sm text-gray-900">{selectedRestaurant.address}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">{getStatusBadge(selectedRestaurant.status)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Verification Status</label>
                <div className="mt-1">{getVerificationBadge(selectedRestaurant.verificationStatus)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Registration Date</label>
                <p className="mt-1 text-sm text-gray-900">{selectedRestaurant.registrationDate}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Active</label>
                <p className="mt-1 text-sm text-gray-900">{selectedRestaurant.lastActive}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Orders</label>
                <p className="mt-1 text-sm text-gray-900">{selectedRestaurant.totalOrders}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Rating</label>
                <p className="mt-1 text-sm text-gray-900">{selectedRestaurant.rating}/5</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Revenue</label>
                <p className="mt-1 text-sm text-gray-900">Rs. {selectedRestaurant.revenue.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Documents Status</label>
                <p className="mt-1 text-sm text-gray-900">{selectedRestaurant.documentsStatus}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => handleEditStatus(selectedRestaurant)}
              >
                <Edit size={16} />
                Edit Status
              </Button>
              <Button onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Status Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Restaurant Status"
      >
        {selectedRestaurant && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Restaurant</label>
              <p className="mt-1 text-sm text-gray-900">{selectedRestaurant.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Status</label>
              <div className="mt-1">{getStatusBadge(selectedRestaurant.status)}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">New Status</label>
              <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Reason (Optional)</label>
              <textarea
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter reason for status change..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => handleStatusChange(selectedRestaurant.id, 'active')}>
                Update Status
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StatusControl;
