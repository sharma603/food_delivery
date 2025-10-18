import React, { useState, useEffect, useCallback } from 'react';
import { 
  Handshake, 
  Banknote, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search, 
  Filter,
  Eye,
  RefreshCw,
  TrendingUp,
  Calendar,
  Download,
  Send,
  Pause,
  Play,
  Building
} from 'lucide-react';
import { superadminApi } from '../../../services/api/superadminApi';
import LoadingSpinner from '../../common/LoadingSpinner';
import { formatCurrency } from '../../../utils/currency';

const Settlements = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Settlement data state
  const [settlements, setSettlements] = useState([]);
  const [settlementStats, setSettlementStats] = useState({
    totalSettled: 0,
    pendingAmount: 0,
    processedToday: 0,
    failedSettlements: 0,
    averageProcessingTime: 0,
    monthlyGrowth: 0
  });

  // Filter options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const dateOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' }
  ];

  // Fetch settlement data
  const fetchSettlementData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      // Fetch settlements and stats
      const [settlementsResponse, statsResponse] = await Promise.allSettled([
        superadminApi.getSettlements({ limit: 50, sort: 'createdAt', order: 'desc' }),
        superadminApi.getSettlementStats()
      ]);

      let settlements = [];
      let stats = {
        totalSettled: 0,
        pendingAmount: 0,
        processedToday: 0,
        failedSettlements: 0,
        averageProcessingTime: 0,
        monthlyGrowth: 0
      };

      if (settlementsResponse.status === 'fulfilled') {
        settlements = settlementsResponse.value.data || [];
      }

      if (statsResponse.status === 'fulfilled') {
        stats = statsResponse.value.data || stats;
      }

      setSettlements(settlements);
      setSettlementStats(stats);
      
    } catch (err) {
      console.error('Error fetching settlement data:', err);
      setError('Failed to load settlement data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSettlementData();
  }, [fetchSettlementData]);

  // Filter settlements - ensure settlements is an array
  const filteredSettlements = Array.isArray(settlements) ? settlements.filter(settlement => {
    if (!settlement) return false;
    
    const matchesSearch = (settlement.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (settlement.restaurantName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || settlement.status === statusFilter;
    
    // Date filtering logic would go here
    const matchesDate = true; // Simplified for now
    
    return matchesSearch && matchesStatus && matchesDate;
  }) : [];

  // Get status color and icon
  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { 
          color: 'text-green-600 bg-green-100', 
          icon: CheckCircle,
          iconColor: 'text-green-600'
        };
      case 'processing':
        return { 
          color: 'text-blue-600 bg-blue-100', 
          icon: RefreshCw,
          iconColor: 'text-blue-600'
        };
      case 'pending':
        return { 
          color: 'text-yellow-600 bg-yellow-100', 
          icon: Clock,
          iconColor: 'text-yellow-600'
        };
      case 'failed':
        return { 
          color: 'text-red-600 bg-red-100', 
          icon: XCircle,
          iconColor: 'text-red-600'
        };
      case 'cancelled':
        return { 
          color: 'text-gray-600 bg-gray-100', 
          icon: XCircle,
          iconColor: 'text-gray-600'
        };
      default:
        return { 
          color: 'text-gray-600 bg-gray-100', 
          icon: AlertCircle,
          iconColor: 'text-gray-600'
        };
    }
  };

  // Currency formatting is now handled by the utility function

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Process settlement
  const processSettlement = (settlementId) => {
    // Implementation for processing settlement
    console.log('Processing settlement:', settlementId);
    setShowProcessModal(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Handshake className="mr-3 text-orange-600" />
                Settlements
              </h1>
              <p className="text-gray-600 mt-2">Manage restaurant payouts and settlements</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={fetchSettlementData}
                disabled={isRefreshing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
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
                <p className="text-sm font-medium text-gray-600">Total Settled</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(settlementStats.totalSettled)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Banknote className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+{settlementStats.monthlyGrowth}% this month</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(settlementStats.pendingAmount)}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
              <span className="text-sm text-yellow-600">Awaiting processing</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processed Today</p>
                <p className="text-2xl font-bold text-gray-900">{settlementStats.processedToday}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Calendar className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-sm text-blue-600">Settlements</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-gray-900">{settlementStats.failedSettlements}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-sm text-red-600">Requires attention</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
                <p className="text-2xl font-bold text-gray-900">{settlementStats.averageProcessingTime}h</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-purple-500 mr-1" />
              <span className="text-sm text-purple-600">Efficient processing</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Settlements</p>
                <p className="text-2xl font-bold text-gray-900">{settlements.length}</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <Handshake className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Building className="h-4 w-4 text-indigo-500 mr-1" />
              <span className="text-sm text-indigo-600">All restaurants</span>
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
                  placeholder="Search by settlement ID or restaurant name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {dateOptions.map(option => (
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

        {/* Settlements Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Settlement Records</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Settlement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restaurant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSettlements.map((settlement) => {
                  const statusInfo = getStatusInfo(settlement.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <tr key={settlement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{settlement.id}</div>
                          <div className="text-sm text-gray-500">{settlement.paymentMethod}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{settlement.restaurantName}</div>
                          <div className="text-sm text-gray-500">{settlement.bankAccount}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {settlement.period}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(settlement.netAmount)}</div>
                        <div className="text-sm text-gray-500">Gross: {formatCurrency(settlement.grossRevenue)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <StatusIcon className={`h-4 w-4 mr-2 ${statusInfo.iconColor}`} />
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                            {settlement.status.charAt(0).toUpperCase() + settlement.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(settlement.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedSettlement(settlement);
                              setShowDetailsModal(true);
                            }}
                            className="text-orange-600 hover:text-orange-900 flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </button>
                          {settlement.status === 'pending' && (
                            <button
                              onClick={() => {
                                setSelectedSettlement(settlement);
                                setShowProcessModal(true);
                              }}
                              className="text-green-600 hover:text-green-900 flex items-center"
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Process
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Settlement Details Modal */}
        {showDetailsModal && selectedSettlement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Settlement Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Settlement ID</label>
                    <p className="text-sm text-gray-900">{selectedSettlement.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Restaurant</label>
                    <p className="text-sm text-gray-900">{selectedSettlement.restaurantName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Period</label>
                    <p className="text-sm text-gray-900">{selectedSettlement.period}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <p className="text-sm text-gray-900">{selectedSettlement.paymentMethod}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gross Revenue</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedSettlement.grossRevenue)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Commission</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedSettlement.commission)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Platform Fee</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedSettlement.platformFee)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Net Amount</label>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(selectedSettlement.netAmount)}</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bank Account</label>
                    <p className="text-sm text-gray-900">{selectedSettlement.bankAccount}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusInfo(selectedSettlement.status).color}`}>
                      {selectedSettlement.status.charAt(0).toUpperCase() + selectedSettlement.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created At</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedSettlement.createdAt)}</p>
                  </div>
                  {selectedSettlement.processedAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Processed At</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedSettlement.processedAt)}</p>
                    </div>
                  )}
                </div>
                {selectedSettlement.transactionId && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                    <p className="text-sm text-gray-900 font-mono">{selectedSettlement.transactionId}</p>
                  </div>
                )}
                {selectedSettlement.failureReason && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Failure Reason</label>
                    <p className="text-sm text-red-600">{selectedSettlement.failureReason}</p>
                  </div>
                )}
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

        {/* Process Settlement Modal */}
        {showProcessModal && selectedSettlement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Process Settlement</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Settlement ID</label>
                  <p className="text-sm text-gray-900">{selectedSettlement.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Restaurant</label>
                  <p className="text-sm text-gray-900">{selectedSettlement.restaurantName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount to Process</label>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(selectedSettlement.netAmount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <p className="text-sm text-gray-900">{selectedSettlement.paymentMethod}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bank Account</label>
                  <p className="text-sm text-gray-900">{selectedSettlement.bankAccount}</p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowProcessModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => processSettlement(selectedSettlement.id)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Process Settlement
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settlements;
