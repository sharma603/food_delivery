import React, { useState } from 'react';
import { Search, Filter, Eye, Edit, User, MapPin, DollarSign, ShoppingBag, CheckCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';

const CustomerSupport = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // real data
  const customers = [
    {
      id: 'CUST-001',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      status: 'active',
      segment: 'premium',
      joinDate: '2023-01-15',
      lastOrderDate: '2024-01-15',
      totalOrders: 47,
      totalSpent: 1250.75,
      averageOrderValue: 26.61,
      favoriteRestaurants: ['Pizza Palace', 'Burger King'],
      addresses: [
        {
          type: 'home',
          address: '123 Main St, City, State 12345',
          isDefault: true
        },
        {
          type: 'work',
          address: '456 Business Ave, City, State 12345',
          isDefault: false
        }
      ],
      preferences: {
        cuisine: ['Italian', 'American'],
        deliveryTime: 'evening',
        notifications: true
      },
      loyaltyPoints: 1250,
      tier: 'Gold'
    },
    {
      id: 'CUST-002',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+1 (555) 234-5678',
      status: 'active',
      segment: 'regular',
      joinDate: '2023-03-20',
      lastOrderDate: '2024-01-14',
      totalOrders: 23,
      totalSpent: 580.50,
      averageOrderValue: 25.24,
      favoriteRestaurants: ['McDonald\'s', 'Subway'],
      addresses: [
        {
          type: 'home',
          address: '789 Oak St, City, State 12345',
          isDefault: true
        }
      ],
      preferences: {
        cuisine: ['Fast Food', 'Healthy'],
        deliveryTime: 'lunch',
        notifications: true
      },
      loyaltyPoints: 580,
      tier: 'Silver'
    },
    {
      id: 'CUST-003',
      name: 'Bob Wilson',
      email: 'bob.wilson@example.com',
      phone: '+1 (555) 345-6789',
      status: 'inactive',
      segment: 'new',
      joinDate: '2023-12-01',
      lastOrderDate: '2023-12-15',
      totalOrders: 3,
      totalSpent: 75.25,
      averageOrderValue: 25.08,
      favoriteRestaurants: ['KFC'],
      addresses: [
        {
          type: 'home',
          address: '321 Pine Ave, City, State 12345',
          isDefault: true
        }
      ],
      preferences: {
        cuisine: ['Fast Food'],
        deliveryTime: 'evening',
        notifications: false
      },
      loyaltyPoints: 75,
      tier: 'Bronze'
    },
    {
      id: 'CUST-004',
      name: 'Alice Brown',
      email: 'alice.brown@example.com',
      phone: '+1 (555) 456-7890',
      status: 'active',
      segment: 'vip',
      joinDate: '2022-08-10',
      lastOrderDate: '2024-01-15',
      totalOrders: 89,
      totalSpent: 2890.30,
      averageOrderValue: 32.48,
      favoriteRestaurants: ['Pizza Palace', 'McDonald\'s', 'Subway'],
      addresses: [
        {
          type: 'home',
          address: '654 Elm St, City, State 12345',
          isDefault: true
        },
        {
          type: 'work',
          address: '987 Corporate Blvd, City, State 12345',
          isDefault: false
        },
        {
          type: 'other',
          address: '147 Vacation Rd, City, State 12345',
          isDefault: false
        }
      ],
      preferences: {
        cuisine: ['Italian', 'American', 'Healthy'],
        deliveryTime: 'any',
        notifications: true
      },
      loyaltyPoints: 2890,
      tier: 'Platinum'
    }
  ];

  const statusOptions = ['all', 'active', 'inactive', 'suspended'];
  const segmentOptions = ['all', 'new', 'regular', 'premium', 'vip'];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'inactive':
        return <Badge variant="warning">Inactive</Badge>;
      case 'suspended':
        return <Badge variant="danger">Suspended</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getSegmentBadge = (segment) => {
    switch (segment) {
      case 'new':
        return <Badge variant="info">New</Badge>;
      case 'regular':
        return <Badge variant="default">Regular</Badge>;
      case 'premium':
        return <Badge variant="primary">Premium</Badge>;
      case 'vip':
        return <Badge variant="warning">VIP</Badge>;
      default:
        return <Badge variant="default">{segment}</Badge>;
    }
  };

  const getTierBadge = (tier) => {
    switch (tier) {
      case 'Bronze':
        return <Badge variant="default">Bronze</Badge>;
      case 'Silver':
        return <Badge variant="info">Silver</Badge>;
      case 'Gold':
        return <Badge variant="warning">Gold</Badge>;
      case 'Platinum':
        return <Badge variant="primary">Platinum</Badge>;
      default:
        return <Badge variant="default">{tier}</Badge>;
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm) ||
                         customer.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    const matchesSegment = segmentFilter === 'all' || customer.segment === segmentFilter;
    
    return matchesSearch && matchesStatus && matchesSegment;
  });

  const columns = [
    {
      key: 'name',
      header: 'Customer',
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">ID: {row.id}</p>
        </div>
      )
    },
    {
      key: 'email',
      header: 'Contact',
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{row.phone}</p>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'segment',
      header: 'Segment',
      sortable: true,
      render: (value) => getSegmentBadge(value)
    },
    {
      key: 'totalOrders',
      header: 'Orders',
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">${row.totalSpent.toFixed(2)}</p>
        </div>
      )
    },
    {
      key: 'loyaltyPoints',
      header: 'Loyalty',
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900">{value} pts</p>
          <div className="mt-1">{getTierBadge(row.tier)}</div>
        </div>
      )
    },
    {
      key: 'lastOrderDate',
      header: 'Last Order',
      sortable: true,
      render: (value) => (
        <div>
          <p className="text-sm text-gray-900">{new Date(value).toLocaleDateString()}</p>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (value, row) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedCustomer(row);
              setShowCustomerModal(true);
            }}
          >
            <Eye size={16} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedCustomer(row);
              setShowEditModal(true);
            }}
          >
            <Edit size={16} />
          </Button>
        </div>
      )
    }
  ];

  const handleEditCustomer = (customerId, customerData) => {
    console.log('Editing customer:', customerId, customerData);
    // Implement edit customer functionality
  };

  // const handleDeleteCustomer = (customerId) => {
  //   console.log('Deleting customer:', customerId);
  //   // Implement delete customer functionality
  // };

  const handleSuspendCustomer = (customerId) => {
    console.log('Suspending customer:', customerId);
    // Implement suspend customer functionality
  };

  const getTotalCustomers = () => customers.length;
  const getActiveCustomers = () => customers.filter(c => c.status === 'active').length;
  const getTotalRevenue = () => customers.reduce((acc, c) => acc + c.totalSpent, 0);
  const getAverageOrderValue = () => {
    const totalOrders = customers.reduce((acc, c) => acc + c.totalOrders, 0);
    const totalSpent = customers.reduce((acc, c) => acc + c.totalSpent, 0);
    return totalOrders > 0 ? (totalSpent / totalOrders).toFixed(2) : '0.00';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customer Database</h1>
        <p className="text-gray-600">View and manage customer profiles</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalCustomers()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Customers</p>
              <p className="text-2xl font-bold text-gray-900">{getActiveCustomers()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${getTotalRevenue().toFixed(2)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <ShoppingBag className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">${getAverageOrderValue()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search customers by name, email, phone..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Segment
            </label>
            <select
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {segmentOptions.map(segment => (
                <option key={segment} value={segment}>
                  {segment.charAt(0).toUpperCase() + segment.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button variant="outline" className="w-full">
              <Filter size={16} className="mr-2" />
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Customers Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Customers ({filteredCustomers.length})
          </h3>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              Export CSV
            </Button>
            <Button size="sm">
              Add Customer
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredCustomers}
          sortable={true}
        />
      </Card>

      {/* Customer Details Modal */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="Customer Profile"
        size="xl"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Personal Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Name:</span>
                    <span className="text-sm text-gray-900">{selectedCustomer.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Email:</span>
                    <span className="text-sm text-gray-900">{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Phone:</span>
                    <span className="text-sm text-gray-900">{selectedCustomer.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Status:</span>
                    <div className="mt-1">{getStatusBadge(selectedCustomer.status)}</div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Segment:</span>
                    <div className="mt-1">{getSegmentBadge(selectedCustomer.segment)}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Account Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Join Date:</span>
                    <span className="text-sm text-gray-900">
                      {new Date(selectedCustomer.joinDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Last Order:</span>
                    <span className="text-sm text-gray-900">
                      {new Date(selectedCustomer.lastOrderDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Loyalty Tier:</span>
                    <div className="mt-1">{getTierBadge(selectedCustomer.tier)}</div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Points:</span>
                    <span className="text-sm text-gray-900">{selectedCustomer.loyaltyPoints}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Statistics */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Order Statistics</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-lg font-medium text-gray-900">{selectedCustomer.totalOrders}</p>
                </div>
                <div className="p-3 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-lg font-medium text-gray-900">${selectedCustomer.totalSpent.toFixed(2)}</p>
                </div>
                <div className="p-3 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600">Average Order Value</p>
                  <p className="text-lg font-medium text-gray-900">${selectedCustomer.averageOrderValue.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Saved Addresses</h4>
              <div className="space-y-2">
                {selectedCustomer.addresses.map((address, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm text-gray-900 capitalize">{address.type}</p>
                        <p className="text-sm text-gray-600">{address.address}</p>
                      </div>
                    </div>
                    {address.isDefault && (
                      <Badge variant="success">Default</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Favorite Restaurants */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Favorite Restaurants</h4>
              <div className="flex flex-wrap gap-2">
                {selectedCustomer.favoriteRestaurants.map((restaurant, index) => (
                  <Badge key={index} variant="outline">{restaurant}</Badge>
                ))}
              </div>
            </div>

            {/* Preferences */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Preferences</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600">Preferred Cuisines</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedCustomer.preferences.cuisine.map((cuisine, index) => (
                      <Badge key={index} variant="info" size="sm">{cuisine}</Badge>
                    ))}
                  </div>
                </div>
                <div className="p-3 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600">Delivery Time</p>
                  <p className="text-sm text-gray-900 capitalize mt-1">
                    {selectedCustomer.preferences.deliveryTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowCustomerModal(false)}
              >
                Close
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(true);
                  setShowCustomerModal(false);
                }}
              >
                <Edit size={16} className="mr-2" />
                Edit Customer
              </Button>
              {selectedCustomer.status === 'active' && (
                <Button
                  variant="danger"
                  onClick={() => {
                    handleSuspendCustomer(selectedCustomer.id);
                    setShowCustomerModal(false);
                  }}
                >
                  Suspend Customer
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Customer"
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  defaultValue={selectedCustomer.name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  defaultValue={selectedCustomer.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  defaultValue={selectedCustomer.phone}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  defaultValue={selectedCustomer.status}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Segment
                </label>
                <select
                  defaultValue={selectedCustomer.segment}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="new">New</option>
                  <option value="regular">Regular</option>
                  <option value="premium">Premium</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loyalty Points
                </label>
                <input
                  type="number"
                  defaultValue={selectedCustomer.loyaltyPoints}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add any notes about this customer..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleEditCustomer(selectedCustomer.id, {});
                  setShowEditModal(false);
                }}
              >
                Update Customer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerSupport;
