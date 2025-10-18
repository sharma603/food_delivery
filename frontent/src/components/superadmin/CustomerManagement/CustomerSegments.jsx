import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  TrendingUp,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  PieChart,
  X
} from 'lucide-react';

const CustomerSegments = () => {
  const [segments, setSegments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSegment, setNewSegment] = useState({
    name: '',
    description: '',
    criteria: {
      minOrders: '',
      minSpent: '',
      minRating: '',
      registrationPeriod: '',
      location: ''
    }
  });

  // real data for demonstration
  useEffect(() => {
    const mockSegments = [
      {
        _id: '1',
        name: 'Premium Customers',
        description: 'High-value customers with excellent loyalty',
        criteria: {
          minOrders: 20,
          minSpent: 500,
          minRating: 4.5,
          registrationPeriod: '6months',
          location: 'all'
        },
        customerCount: 320,
        totalRevenue: 125000,
        averageOrderValue: 85.50,
        retentionRate: 92.5,
        color: 'purple',
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        _id: '2',
        name: 'Regular Customers',
        description: 'Frequent customers with good engagement',
        criteria: {
          minOrders: 5,
          minSpent: 100,
          minRating: 4.0,
          registrationPeriod: '3months',
          location: 'all'
        },
        customerCount: 680,
        totalRevenue: 89000,
        averageOrderValue: 45.20,
        retentionRate: 78.3,
        color: 'blue',
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        _id: '3',
        name: 'New Customers',
        description: 'Recently registered customers',
        criteria: {
          minOrders: 1,
          minSpent: 0,
          minRating: 0,
          registrationPeriod: '1month',
          location: 'all'
        },
        customerCount: 250,
        totalRevenue: 15000,
        averageOrderValue: 25.80,
        retentionRate: 45.2,
        color: 'yellow',
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        _id: '4',
        name: 'At-Risk Customers',
        description: 'Customers showing signs of churn',
        criteria: {
          minOrders: 2,
          minSpent: 50,
          minRating: 3.0,
          registrationPeriod: '6months',
          location: 'all'
        },
        customerCount: 95,
        totalRevenue: 8500,
        averageOrderValue: 35.40,
        retentionRate: 25.8,
        color: 'red',
        createdAt: '2024-01-01T00:00:00Z'
      }
    ];

    const mockCustomers = [
      {
        _id: '1',
        name: 'John Doe',
        email: 'john.doe@email.com',
        segment: 'premium',
        totalOrders: 25,
        totalSpent: 1250,
        averageOrderValue: 50,
        lastOrderDate: '2024-01-20',
        registrationDate: '2023-06-15',
        rating: 4.8,
        location: 'New York'
      },
      {
        _id: '2',
        name: 'Jane Smith',
        email: 'jane.smith@email.com',
        segment: 'regular',
        totalOrders: 12,
        totalSpent: 480,
        averageOrderValue: 40,
        lastOrderDate: '2024-01-18',
        registrationDate: '2023-10-10',
        rating: 4.5,
        location: 'Los Angeles'
      },
      {
        _id: '3',
        name: 'Mike Johnson',
        email: 'mike.johnson@email.com',
        segment: 'new',
        totalOrders: 3,
        totalSpent: 75,
        averageOrderValue: 25,
        lastOrderDate: '2024-01-12',
        registrationDate: '2024-01-05',
        rating: 4.2,
        location: 'Chicago'
      }
    ];
    
    setTimeout(() => {
      setSegments(mockSegments);
      setCustomers(mockCustomers);
      setLoading(false);
    }, 1000);
  }, []);

  const getSegmentColor = (color) => {
    switch (color) {
      case 'purple': return 'bg-purple-100 text-purple-800';
      case 'blue': return 'bg-blue-100 text-blue-800';
      case 'yellow': return 'bg-yellow-100 text-yellow-800';
      case 'red': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSegmentIcon = (color) => {
    switch (color) {
      case 'purple': return 'text-purple-600';
      case 'blue': return 'text-blue-600';
      case 'yellow': return 'text-yellow-600';
      case 'red': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const handleViewSegment = (segment) => {
    setSelectedSegment(segment);
    setShowSegmentModal(true);
  };

  const handleCreateSegment = () => {
    if (newSegment.name && newSegment.description) {
      const segment = {
        _id: Date.now().toString(),
        ...newSegment,
        customerCount: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        retentionRate: 0,
        color: 'gray',
        createdAt: new Date().toISOString()
      };
      
      setSegments(prev => [...prev, segment]);
      setNewSegment({
        name: '',
        description: '',
        criteria: {
          minOrders: '',
          minSpent: '',
          minRating: '',
          registrationPeriod: '',
          location: ''
        }
      });
      setShowCreateModal(false);
    }
  };

  const handleDeleteSegment = (segmentId) => {
    setSegments(prev => prev.filter(segment => segment._id !== segmentId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Customer Segments</h1>
            <p className="text-gray-600">Create and manage customer segments for targeted marketing</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Segment</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Segments</p>
              <p className="text-2xl font-bold text-gray-900">{segments.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {segments.reduce((sum, s) => sum + s.customerCount, 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                Rs. {segments.reduce((sum, s) => sum + s.totalRevenue, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Retention</p>
              <p className="text-2xl font-bold text-gray-900">
                {(segments.reduce((sum, s) => sum + s.retentionRate, 0) / segments.length).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Segments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {segments.map((segment) => (
          <div key={segment._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            {/* Segment Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getSegmentColor(segment.color)}`}>
                  <Users className={`w-6 h-6 ${getSegmentIcon(segment.color)}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{segment.name}</h3>
                  <p className="text-sm text-gray-600">{segment.customerCount} customers</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleViewSegment(segment)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteSegment(segment._id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Segment Description */}
            <p className="text-gray-600 text-sm mb-4">{segment.description}</p>

            {/* Segment Stats */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Revenue</span>
                <span className="text-sm font-medium text-gray-900">Rs. {segment.totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Order Value</span>
                <span className="text-sm font-medium text-gray-900">${segment.averageOrderValue}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Retention Rate</span>
                <span className="text-sm font-medium text-gray-900">{segment.retentionRate}%</span>
              </div>
            </div>

            {/* Segment Criteria */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Criteria</h4>
              <div className="space-y-1 text-xs text-gray-600">
                {segment.criteria.minOrders && (
                  <p>Min Orders: {segment.criteria.minOrders}</p>
                )}
                {segment.criteria.minSpent && (
                  <p>Min Spent: ${segment.criteria.minSpent}</p>
                )}
                {segment.criteria.minRating && (
                  <p>Min Rating: {segment.criteria.minRating}</p>
                )}
                {segment.criteria.registrationPeriod && (
                  <p>Registration: {segment.criteria.registrationPeriod}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => handleViewSegment(segment)}
                className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                View Details
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Segment Details Modal */}
      {showSegmentModal && selectedSegment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Segment Details</h2>
              <button
                onClick={() => setShowSegmentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Segment Header */}
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${getSegmentColor(selectedSegment.color)}`}>
                  <Users className={`w-8 h-8 ${getSegmentIcon(selectedSegment.color)}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedSegment.name}</h3>
                  <p className="text-gray-600">{selectedSegment.description}</p>
                </div>
              </div>

              {/* Segment Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{selectedSegment.customerCount}</p>
                  <p className="text-sm text-gray-600">Customers</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">Rs. {selectedSegment.totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">Rs. {selectedSegment.averageOrderValue}</p>
                  <p className="text-sm text-gray-600">Avg Order Value</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{selectedSegment.retentionRate}%</p>
                  <p className="text-sm text-gray-600">Retention Rate</p>
                </div>
              </div>

              {/* Segment Criteria */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Segment Criteria</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Orders</label>
                    <p className="text-gray-900">{selectedSegment.criteria.minOrders || 'No minimum'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Spent</label>
                    <p className="text-gray-900">${selectedSegment.criteria.minSpent || 'No minimum'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Rating</label>
                    <p className="text-gray-900">{selectedSegment.criteria.minRating || 'No minimum'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Period</label>
                    <p className="text-gray-900">{selectedSegment.criteria.registrationPeriod || 'Any time'}</p>
                  </div>
                </div>
              </div>

              {/* Customer List */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Customers in Segment</h4>
                <div className="space-y-2">
                  {customers.filter(c => c.segment === selectedSegment.name.toLowerCase().split(' ')[0]).map((customer) => (
                    <div key={customer._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-600">{customer.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{customer.totalOrders} orders</p>
                        <p className="text-sm text-gray-600">${customer.totalSpent} spent</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                <BarChart3 className="w-4 h-4 inline mr-2" />
                View Analytics
              </button>
              <button className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                <Edit className="w-4 h-4 inline mr-2" />
                Edit Segment
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <PieChart className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Segment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create New Segment</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Segment Name</label>
                <input
                  type="text"
                  value={newSegment.name}
                  onChange={(e) => setNewSegment(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter segment name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newSegment.description}
                  onChange={(e) => setNewSegment(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter segment description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Orders</label>
                  <input
                    type="number"
                    value={newSegment.criteria.minOrders}
                    onChange={(e) => setNewSegment(prev => ({ 
                      ...prev, 
                      criteria: { ...prev.criteria, minOrders: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Spent ($)</label>
                  <input
                    type="number"
                    value={newSegment.criteria.minSpent}
                    onChange={(e) => setNewSegment(prev => ({ 
                      ...prev, 
                      criteria: { ...prev.criteria, minSpent: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={newSegment.criteria.minRating}
                    onChange={(e) => setNewSegment(prev => ({ 
                      ...prev, 
                      criteria: { ...prev.criteria, minRating: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Period</label>
                  <select
                    value={newSegment.criteria.registrationPeriod}
                    onChange={(e) => setNewSegment(prev => ({ 
                      ...prev, 
                      criteria: { ...prev.criteria, registrationPeriod: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Any time</option>
                    <option value="1month">Last month</option>
                    <option value="3months">Last 3 months</option>
                    <option value="6months">Last 6 months</option>
                    <option value="1year">Last year</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleCreateSegment}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Create Segment
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSegments;
