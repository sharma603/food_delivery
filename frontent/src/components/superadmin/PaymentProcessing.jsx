import React, { useState } from 'react';
import { Search, Filter, Plus, Edit, Trash2, DollarSign, Percent, Calculator, TrendingUp, Building } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';

const CommissionSystem = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCalculationModal, setShowCalculationModal] = useState(false);

  // real data
  const commissions = [
    {
      id: 'COMM-001',
      restaurantId: 'REST-001',
      restaurantName: 'Pizza Palace',
      commissionType: 'percentage',
      baseRate: 15.0,
      tieredRates: [
        { minAmount: 0, maxAmount: 1000, rate: 15.0 },
        { minAmount: 1001, maxAmount: 5000, rate: 12.0 },
        { minAmount: 5001, maxAmount: null, rate: 10.0 }
      ],
      status: 'active',
      effectiveDate: '2024-01-01',
      endDate: null,
      specialConditions: 'Premium partner - reduced rates for high volume',
      monthlyRevenue: 12500.00,
      calculatedCommission: 1500.00
    },
    {
      id: 'COMM-002',
      restaurantId: 'REST-002',
      restaurantName: 'Burger King',
      commissionType: 'fixed',
      baseRate: 2.50,
      tieredRates: [],
      status: 'active',
      effectiveDate: '2024-01-01',
      endDate: null,
      specialConditions: 'Fixed rate per order',
      monthlyRevenue: 8900.00,
      calculatedCommission: 445.00
    },
    {
      id: 'COMM-003',
      restaurantId: 'REST-003',
      restaurantName: 'McDonald\'s',
      commissionType: 'percentage',
      baseRate: 12.0,
      tieredRates: [
        { minAmount: 0, maxAmount: 2000, rate: 12.0 },
        { minAmount: 2001, maxAmount: 10000, rate: 10.0 },
        { minAmount: 10001, maxAmount: null, rate: 8.0 }
      ],
      status: 'active',
      effectiveDate: '2024-01-01',
      endDate: null,
      specialConditions: 'Corporate partnership - volume discounts',
      monthlyRevenue: 21500.00,
      calculatedCommission: 2150.00
    },
    {
      id: 'COMM-004',
      restaurantId: 'REST-004',
      restaurantName: 'Subway',
      commissionType: 'percentage',
      baseRate: 18.0,
      tieredRates: [],
      status: 'inactive',
      effectiveDate: '2023-12-01',
      endDate: '2023-12-31',
      specialConditions: 'Temporary promotional rate',
      monthlyRevenue: 0.00,
      calculatedCommission: 0.00
    }
  ];

  const typeOptions = ['all', 'percentage', 'fixed', 'tiered'];
  // const statusOptions = ['all', 'active', 'inactive', 'expired']; // Not currently used

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'inactive':
        return <Badge variant="warning">Inactive</Badge>;
      case 'expired':
        return <Badge variant="danger">Expired</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'percentage':
        return <Badge variant="primary">Percentage</Badge>;
      case 'fixed':
        return <Badge variant="info">Fixed</Badge>;
      case 'tiered':
        return <Badge variant="warning">Tiered</Badge>;
      default:
        return <Badge variant="default">{type}</Badge>;
    }
  };

  const filteredCommissions = commissions.filter(commission => {
    const matchesSearch = commission.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         commission.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || commission.commissionType === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const columns = [
    {
      key: 'restaurantName',
      header: 'Restaurant',
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">ID: {row.restaurantId}</p>
        </div>
      )
    },
    {
      key: 'commissionType',
      header: 'Type',
      sortable: true,
      render: (value) => getTypeBadge(value)
    },
    {
      key: 'baseRate',
      header: 'Base Rate',
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900">
            {row.commissionType === 'percentage' ? `${value}%` : `$${value}`}
          </p>
        </div>
      )
    },
    {
      key: 'monthlyRevenue',
      header: 'Monthly Revenue',
      sortable: true,
      render: (value) => (
        <div>
          <p className="font-medium text-gray-900">${value.toFixed(2)}</p>
        </div>
      )
    },
    {
      key: 'calculatedCommission',
      header: 'Commission',
      sortable: true,
      render: (value) => (
        <div>
          <p className="font-medium text-gray-900">${value.toFixed(2)}</p>
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
      key: 'effectiveDate',
      header: 'Effective Date',
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
              setSelectedCommission(row);
              setShowCommissionModal(true);
            }}
          >
            <Edit size={16} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedCommission(row);
              setShowCalculationModal(true);
            }}
          >
            <Calculator size={16} />
          </Button>
        </div>
      )
    }
  ];

  const handleAddCommission = (commissionData) => {
    console.log('Adding new commission:', commissionData);
    // Implement add commission functionality
  };

  const handleEditCommission = (commissionId, commissionData) => {
    console.log('Editing commission:', commissionId, commissionData);
    // Implement edit commission functionality
  };

  const handleDeleteCommission = (commissionId) => {
    console.log('Deleting commission:', commissionId);
    // Implement delete commission functionality
  };

  // const calculateCommission = (revenue, commissionType, baseRate, tieredRates) => {
  //   if (commissionType === 'fixed') {
  //     return baseRate; // This would need order count for accurate calculation
  //   }
    
  //   if (commissionType === 'percentage') {
  //     if (tieredRates && tieredRates.length > 0) {
  //       // Calculate tiered percentage
  //       let totalCommission = 0;
  //       let remainingRevenue = revenue;
        
  //       for (const tier of tieredRates) {
  //         if (remainingRevenue <= 0) break;
          
  //         const tierAmount = Math.min(
  //           remainingRevenue,
  //           tier.maxAmount ? tier.maxAmount - tier.minAmount : remainingRevenue
  //         );
          
  //         totalCommission += (tierAmount * tier.rate) / 100;
  //         remainingRevenue -= tierAmount;
  //       }
        
  //       return totalCommission;
  //     } else {
  //       return (revenue * baseRate) / 100;
  //     }
  //   }
    
  //   return 0;
  // };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Commission System</h1>
        <p className="text-gray-600">Manage commission rates and structures</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Commissions</p>
              <p className="text-2xl font-bold text-gray-900">
                {commissions.filter(c => c.status === 'active').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${commissions.reduce((acc, c) => acc + c.monthlyRevenue, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <Percent className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Commissions</p>
              <p className="text-2xl font-bold text-gray-900">
                ${commissions.reduce((acc, c) => acc + c.calculatedCommission, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Commission Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {commissions.filter(c => c.commissionType === 'percentage').length > 0 
                  ? (commissions.filter(c => c.commissionType === 'percentage')
                      .reduce((acc, c) => acc + c.baseRate, 0) / 
                     commissions.filter(c => c.commissionType === 'percentage').length).toFixed(1) + '%'
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </Card>
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
                placeholder="Search restaurants or commission ID..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commission Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {typeOptions.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
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

      {/* Commissions Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Commission Rates ({filteredCommissions.length})
          </h3>
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={16} className="mr-2" />
              Add Commission
            </Button>
            <Button variant="outline" size="sm">
              Export CSV
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredCommissions}
          sortable={true}
        />
      </Card>

      {/* Commission Details Modal */}
      <Modal
        isOpen={showCommissionModal}
        onClose={() => setShowCommissionModal(false)}
        title="Commission Details"
        size="xl"
      >
        {selectedCommission && (
          <div className="space-y-6">
            {/* Commission Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Restaurant Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Restaurant:</span>
                    <span className="text-sm text-gray-900">{selectedCommission.restaurantName}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">ID:</span>
                    <span className="text-sm text-gray-900">{selectedCommission.restaurantId}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Status:</span>
                    <div className="mt-1">{getStatusBadge(selectedCommission.status)}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Commission Details</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Type:</span>
                    <div className="mt-1">{getTypeBadge(selectedCommission.commissionType)}</div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Base Rate:</span>
                    <span className="text-sm text-gray-900">
                      {selectedCommission.commissionType === 'percentage' 
                        ? `${selectedCommission.baseRate}%` 
                        : `$${selectedCommission.baseRate}`
                      }
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Effective:</span>
                    <span className="text-sm text-gray-900">
                      {new Date(selectedCommission.effectiveDate).toLocaleDateString()}
                    </span>
                  </div>
                  {selectedCommission.endDate && (
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 w-24">End Date:</span>
                      <span className="text-sm text-gray-900">
                        {new Date(selectedCommission.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tiered Rates */}
            {selectedCommission.tieredRates && selectedCommission.tieredRates.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Tiered Rates</h4>
                <div className="space-y-2">
                  {selectedCommission.tieredRates.map((tier, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-900">
                          ${tier.minAmount.toLocaleString()} - {tier.maxAmount ? `$${tier.maxAmount.toLocaleString()}` : 'Above'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{tier.rate}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Performance Metrics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600">Monthly Revenue</p>
                  <p className="text-lg font-medium text-gray-900">
                    ${selectedCommission.monthlyRevenue.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600">Calculated Commission</p>
                  <p className="text-lg font-medium text-gray-900">
                    ${selectedCommission.calculatedCommission.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Special Conditions */}
            {selectedCommission.specialConditions && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Special Conditions</h4>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-900">{selectedCommission.specialConditions}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowCommissionModal(false)}
              >
                Close
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(true);
                  setShowCommissionModal(false);
                }}
              >
                <Edit size={16} className="mr-2" />
                Edit Commission
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  handleDeleteCommission(selectedCommission.id);
                  setShowCommissionModal(false);
                }}
              >
                <Trash2 size={16} className="mr-2" />
                Delete Commission
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Commission Calculation Modal */}
      <Modal
        isOpen={showCalculationModal}
        onClose={() => setShowCalculationModal(false)}
        title="Commission Calculator"
        size="md"
      >
        {selectedCommission && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900">{selectedCommission.restaurantName}</h4>
              <p className="text-sm text-gray-600">
                {selectedCommission.commissionType === 'percentage' 
                  ? `${selectedCommission.baseRate}% base rate` 
                  : `$${selectedCommission.baseRate} fixed rate`
                }
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Revenue Amount
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue={selectedCommission.monthlyRevenue}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter revenue amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Orders (for fixed rate)
              </label>
              <input
                type="number"
                defaultValue="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter number of orders"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-2">Calculation Result</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Revenue:</span>
                  <span className="text-sm font-medium text-blue-900">${selectedCommission.monthlyRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Commission Rate:</span>
                  <span className="text-sm font-medium text-blue-900">
                    {selectedCommission.commissionType === 'percentage' 
                      ? `${selectedCommission.baseRate}%` 
                      : `$${selectedCommission.baseRate} per order`
                    }
                  </span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-2">
                  <span className="text-sm font-medium text-blue-900">Total Commission:</span>
                  <span className="text-sm font-bold text-blue-900">
                    ${selectedCommission.calculatedCommission.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowCalculationModal(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  // Implement calculation functionality
                  console.log('Calculating commission for:', selectedCommission.id);
                  setShowCalculationModal(false);
                }}
              >
                <Calculator size={16} className="mr-2" />
                Calculate
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Commission Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Commission"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restaurant *
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Select restaurant</option>
                <option value="REST-001">Pizza Palace</option>
                <option value="REST-002">Burger King</option>
                <option value="REST-003">McDonald's</option>
                <option value="REST-004">Subway</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commission Type *
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Select type</option>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Rate</option>
                <option value="tiered">Tiered</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Rate *
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter base rate"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Effective Date *
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Conditions
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter any special conditions or notes..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleAddCommission({});
                setShowAddModal(false);
              }}
            >
              Add Commission
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Commission Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Commission"
        size="lg"
      >
        {selectedCommission && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant
                </label>
                <input
                  type="text"
                  defaultValue={selectedCommission.restaurantName}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commission Type
                </label>
                <select
                  defaultValue={selectedCommission.commissionType}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Rate</option>
                  <option value="tiered">Tiered</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Rate
                </label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={selectedCommission.baseRate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  defaultValue={selectedCommission.status}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Conditions
              </label>
              <textarea
                rows={3}
                defaultValue={selectedCommission.specialConditions}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  handleEditCommission(selectedCommission.id, {});
                  setShowEditModal(false);
                }}
              >
                Update Commission
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CommissionSystem;
