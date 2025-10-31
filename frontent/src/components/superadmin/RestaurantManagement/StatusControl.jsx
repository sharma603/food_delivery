import React, { useState } from 'react';
import { Search, Filter, ToggleLeft, ToggleRight, Clock, MapPin, Phone, Mail, AlertTriangle } from 'lucide-react';
import Card from '../../../components/common/ui/Card';
import Button from '../../../components/common/ui/Button';
import Badge from '../../../components/common/ui/Badge';
import Table from '../../../components/common/Table';
import Modal from '../../../components/common/Modal';

const StatusControl = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedRestaurants, setSelectedRestaurants] = useState([]);

  // real data
  const restaurants = [
    {
      id: 1,
      name: 'Pizza Palace',
      owner: 'John Doe',
      phone: '+1 (555) 123-4567',
      email: 'john@pizzapalace.com',
      address: '123 Main St, City, State 12345',
      status: 'active',
      lastActive: '2024-01-15 14:30',
      operatingHours: {
        monday: '9:00 AM - 10:00 PM',
        tuesday: '9:00 AM - 10:00 PM',
        wednesday: '9:00 AM - 10:00 PM',
        thursday: '9:00 AM - 10:00 PM',
        friday: '9:00 AM - 11:00 PM',
        saturday: '9:00 AM - 11:00 PM',
        sunday: '10:00 AM - 9:00 PM'
      },
      totalOrders: 1247,
      rating: 4.5
    },
    {
      id: 2,
      name: 'Burger King',
      owner: 'Jane Smith',
      phone: '+1 (555) 234-5678',
      email: 'jane@burgerking.com',
      address: '456 Oak Ave, City, State 12345',
      status: 'inactive',
      lastActive: '2024-01-14 18:45',
      operatingHours: {
        monday: '8:00 AM - 11:00 PM',
        tuesday: '8:00 AM - 11:00 PM',
        wednesday: '8:00 AM - 11:00 PM',
        thursday: '8:00 AM - 11:00 PM',
        friday: '8:00 AM - 12:00 AM',
        saturday: '8:00 AM - 12:00 AM',
        sunday: '9:00 AM - 10:00 PM'
      },
      totalOrders: 892,
      rating: 4.2
    },
    {
      id: 3,
      name: 'McDonald\'s',
      owner: 'Mike Wilson',
      phone: '+1 (555) 345-6789',
      email: 'mike@mcdonalds.com',
      address: '789 Pine St, City, State 12345',
      status: 'active',
      lastActive: '2024-01-15 16:20',
      operatingHours: {
        monday: '6:00 AM - 11:00 PM',
        tuesday: '6:00 AM - 11:00 PM',
        wednesday: '6:00 AM - 11:00 PM',
        thursday: '6:00 AM - 11:00 PM',
        friday: '6:00 AM - 12:00 AM',
        saturday: '6:00 AM - 12:00 AM',
        sunday: '7:00 AM - 11:00 PM'
      },
      totalOrders: 2156,
      rating: 4.3
    },
    {
      id: 4,
      name: 'Subway',
      owner: 'Sarah Johnson',
      phone: '+1 (555) 456-7890',
      email: 'sarah@subway.com',
      address: '321 Elm St, City, State 12345',
      status: 'suspended',
      lastActive: '2024-01-10 12:15',
      operatingHours: {
        monday: '7:00 AM - 10:00 PM',
        tuesday: '7:00 AM - 10:00 PM',
        wednesday: '7:00 AM - 10:00 PM',
        thursday: '7:00 AM - 10:00 PM',
        friday: '7:00 AM - 11:00 PM',
        saturday: '8:00 AM - 11:00 PM',
        sunday: '8:00 AM - 9:00 PM'
      },
      totalOrders: 634,
      rating: 4.1
    },
    {
      id: 5,
      name: 'KFC',
      owner: 'David Brown',
      phone: '+1 (555) 567-8901',
      email: 'david@kfc.com',
      address: '654 Maple Ave, City, State 12345',
      status: 'active',
      lastActive: '2024-01-15 13:45',
      operatingHours: {
        monday: '10:00 AM - 10:00 PM',
        tuesday: '10:00 AM - 10:00 PM',
        wednesday: '10:00 AM - 10:00 PM',
        thursday: '10:00 AM - 10:00 PM',
        friday: '10:00 AM - 11:00 PM',
        saturday: '10:00 AM - 11:00 PM',
        sunday: '11:00 AM - 9:00 PM'
      },
      totalOrders: 987,
      rating: 4.4
    }
  ];

  const statusOptions = ['all', 'active', 'inactive', 'suspended'];

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

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || restaurant.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: 'name',
      header: 'Restaurant',
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{row.owner}</p>
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
      key: 'lastActive',
      header: 'Last Active',
      sortable: true
    },
    {
      key: 'totalOrders',
      header: 'Total Orders',
      sortable: true
    },
    {
      key: 'rating',
      header: 'Rating',
      sortable: true,
      render: (value) => (
        <div className="flex items-center">
          <span className="text-yellow-400">★</span>
          <span className="ml-1 text-sm text-gray-900">{value}</span>
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
              setSelectedRestaurant(row);
              setShowStatusModal(true);
            }}
          >
            {row.status === 'active' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedRestaurant(row);
              setShowHoursModal(true);
            }}
          >
            <Clock size={16} />
          </Button>
        </div>
      )
    }
  ];

  const handleStatusChange = (restaurantId, newStatus, reason = '') => {
    console.log('Changing status:', restaurantId, newStatus, reason);
    // Implement status change functionality
  };

  const handleBulkStatusChange = (status, reason = '') => {
    console.log('Bulk status change:', selectedRestaurants, status, reason);
    // Implement bulk status change functionality
  };

  const handleOperatingHoursUpdate = (restaurantId, hours) => {
    console.log('Updating operating hours:', restaurantId, hours);
    // Implement operating hours update functionality
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Restaurant Status Control</h1>
        <p className="text-gray-600">Manage restaurant operational status and hours</p>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                placeholder="Search restaurants or owners..."
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

          <div className="flex items-end">
            <Button variant="outline" className="w-full">
              <Filter size={16} className="mr-2" />
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Restaurants Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Restaurants ({filteredRestaurants.length})
          </h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkModal(true)}
              disabled={selectedRestaurants.length === 0}
            >
              Bulk Actions ({selectedRestaurants.length})
            </Button>
            <Button size="sm">
              Export CSV
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredRestaurants}
          sortable={true}
        />
      </Card>

      {/* Status Change Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Change Restaurant Status"
        size="md"
      >
        {selectedRestaurant && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900">{selectedRestaurant.name}</h4>
              <p className="text-sm text-gray-600">Current Status: {getStatusBadge(selectedRestaurant.status)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (Optional)
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter reason for status change..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowStatusModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleStatusChange(selectedRestaurant.id, 'active', '');
                  setShowStatusModal(false);
                }}
              >
                Update Status
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Operating Hours Modal */}
      <Modal
        isOpen={showHoursModal}
        onClose={() => setShowHoursModal(false)}
        title="Operating Hours"
        size="lg"
      >
        {selectedRestaurant && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900">{selectedRestaurant.name}</h4>
              <p className="text-sm text-gray-600">Manage operating hours for each day</p>
            </div>

            <div className="space-y-4">
              {Object.entries(selectedRestaurant.operatingHours).map(([day, hours]) => (
                <div key={day} className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 w-24">
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </label>
                  <input
                    type="text"
                    defaultValue={hours}
                    className="flex-1 ml-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 9:00 AM - 10:00 PM"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowHoursModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleOperatingHoursUpdate(selectedRestaurant.id, {});
                  setShowHoursModal(false);
                }}
              >
                Update Hours
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk Actions Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Bulk Status Actions"
        size="md"
      >
        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-yellow-800">
                  Bulk Action Warning
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  This action will affect {selectedRestaurants.length} restaurants. Please confirm your selection.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="activate">Activate All</option>
              <option value="deactivate">Deactivate All</option>
              <option value="suspend">Suspend All</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason (Optional)
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter reason for bulk action..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowBulkModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleBulkStatusChange('active', '');
                setShowBulkModal(false);
              }}
            >
              Apply Bulk Action
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StatusControl;
