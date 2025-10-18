import React, { useState, useEffect, useCallback } from 'react';
import { 
  Percent, 
  Calculator, 
  TrendingUp, 
  Building, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Banknote,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { superadminApi } from '../../../services/api/superadminApi';
import LoadingSpinner from '../../common/LoadingSpinner';
import { formatCurrency } from '../../../utils/currency';

const CommissionSystem = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [calculationData, setCalculationData] = useState({
    orderAmount: '',
    commissionRate: '',
    calculatedCommission: '',
    restaurantName: ''
  });

  // Commission data state
  const [commissions, setCommissions] = useState([]);
  const [commissionStats, setCommissionStats] = useState({
    totalCommission: 0,
    averageRate: 0,
    totalTransactions: 0,
    monthlyGrowth: 0
  });

  // Commission types
  const commissionTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'fixed', label: 'Fixed Rate' },
    { value: 'tiered', label: 'Tiered Rate' },
    { value: 'volume', label: 'Volume Based' },
    { value: 'category', label: 'Category Based' }
  ];

  // Fetch commission data
  const fetchCommissionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch commission rates and stats
      const [commissionsResponse, dashboardResponse] = await Promise.allSettled([
        superadminApi.getCommissionRates(),
        superadminApi.getDashboardData()
      ]);

      let commissions = [];
      let stats = {
        totalCommission: 0,
        averageRate: 0,
        totalTransactions: 0,
        monthlyGrowth: 0
      };

      if (commissionsResponse.status === 'fulfilled') {
        commissions = commissionsResponse.value.data || [];
      }

      if (dashboardResponse.status === 'fulfilled') {
        const dashboardData = dashboardResponse.value.data;
        stats = {
          totalCommission: dashboardData.stats?.monthlyCommission || 0,
          averageRate: 10, // This would be calculated from commission rates
          totalTransactions: dashboardData.stats?.totalOrders || 0,
          monthlyGrowth: 12.5 // This would come from analytics
        };
      }

      setCommissions(commissions);
      setCommissionStats(stats);
      
    } catch (err) {
      console.error('Error fetching commission data:', err);
      setError('Failed to load commission data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommissionData();
  }, [fetchCommissionData]);

  // Calculate commission
  const calculateCommission = () => {
    const amount = parseFloat(calculationData.orderAmount);
    const rate = parseFloat(calculationData.commissionRate);
    
    if (amount && rate) {
      const commission = (amount * rate) / 100;
      setCalculationData(prev => ({
        ...prev,
        calculatedCommission: commission.toFixed(2)
      }));
    }
  };

  // Filter commissions - ensure commissions is an array
  const filteredCommissions = Array.isArray(commissions) ? commissions.filter(commission => {
    if (!commission) return false;
    
    const matchesSearch = (commission.restaurantName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (commission.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || commission.type === typeFilter;
    return matchesSearch && matchesType;
  }) : [];

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get type color
  const getTypeColor = (type) => {
    switch (type) {
      case 'fixed': return 'text-blue-600 bg-blue-100';
      case 'tiered': return 'text-purple-600 bg-purple-100';
      case 'volume': return 'text-orange-600 bg-orange-100';
      case 'category': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Percent className="mr-3 text-blue-600" />
                Commission System
              </h1>
              <p className="text-gray-600 mt-2">Manage restaurant commission rates and calculations</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCalculationModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Calculator className="mr-2 h-4 w-4" />
                Calculate
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Commission
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Commission</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(commissionStats.totalCommission)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Banknote className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+{commissionStats.monthlyGrowth}% this month</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rate</p>
                <p className="text-2xl font-bold text-gray-900">{commissionStats.averageRate}%</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Percent className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-sm text-blue-600">Industry standard</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{commissionStats.totalTransactions.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Building className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Clock className="h-4 w-4 text-purple-500 mr-1" />
              <span className="text-sm text-purple-600">All time</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Commissions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Array.isArray(commissions) ? commissions.filter(c => c && c.status === 'active').length : 0}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <AlertCircle className="h-4 w-4 text-orange-500 mr-1" />
              <span className="text-sm text-orange-600">Currently active</span>
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
                  placeholder="Search by restaurant name or commission ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {commissionTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Commissions Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Commission Rates</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restaurant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCommissions.map((commission) => (
                  <tr key={commission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{commission.restaurantName}</div>
                        <div className="text-sm text-gray-500">{commission.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(commission.type)}`}>
                        {commission.type.charAt(0).toUpperCase() + commission.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {commission.rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {commission.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(commission.status)}`}>
                        {commission.status.charAt(0).toUpperCase() + commission.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedCommission(commission);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Commission Calculation Modal */}
        {showCalculationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Calculator</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                  <input
                    type="text"
                    value={calculationData.restaurantName}
                    onChange={(e) => setCalculationData(prev => ({ ...prev, restaurantName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter restaurant name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Amount (Rs.)</label>
                  <input
                    type="number"
                    value={calculationData.orderAmount}
                    onChange={(e) => setCalculationData(prev => ({ ...prev, orderAmount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter order amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    value={calculationData.commissionRate}
                    onChange={(e) => setCalculationData(prev => ({ ...prev, commissionRate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter commission rate"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Calculated Commission (Rs.)</label>
                  <input
                    type="text"
                    value={calculationData.calculatedCommission}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    placeholder="Commission will be calculated"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCalculationModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={calculateCommission}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Calculate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Commission Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Commission Rate</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Select Restaurant</option>
                    {/* Restaurant options would be populated from API */}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Fixed Rate</option>
                    <option>Tiered Rate</option>
                    <option>Volume Based</option>
                    <option>Category Based</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate (%)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter commission rate"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter category"
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
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Add Commission
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommissionSystem;
