import React, { useState, useEffect, useCallback } from 'react';
import { 
  Banknote, 
  Search, 
  Filter,
  RefreshCw,
  TrendingUp,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { superadminApi } from '../../../services/api/superadminApi';
import { zoneApi } from '../../../services/api/deliveryApi';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const CashCollectionManagement = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Data state
  const [personnel, setPersonnel] = useState([]);
  const [summary, setSummary] = useState({
    totalPersonnel: 0,
    totalPendingCash: 0,
    totalSubmittedCash: 0,
    totalReconciledCash: 0,
    totalPendingCount: 0,
    totalSubmittedCount: 0,
    totalReconciledCount: 0,
    totalCashInSystem: 0
  });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    currentPage: 1
  });

  // Zones state for dropdown
  const [zones, setZones] = useState([]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-NP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fetch zones
  const fetchZones = useCallback(async () => {
    try {
      const response = await zoneApi.getAllZones({ status: 'active', limit: 100 });
      if (response && response.success) {
        const zonesData = response.data || response.zones || [];
        setZones(zonesData.map(zone => ({
          _id: zone._id || zone.id,
          name: zone.name
        })));
      }
    } catch (err) {
      console.error('Error fetching zones:', err);
    }
  }, []);

  // Fetch cash collection data
  const fetchCashData = useCallback(async (page = currentPage) => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      const params = {
        page: page,
        limit: itemsPerPage
      };

      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (zoneFilter && zoneFilter !== 'all') {
        params.zoneId = zoneFilter;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await superadminApi.getDeliveryPersonnelCash(params);
      
      console.log('API Response:', response);
      
      // ApiService wraps the response in a data property
      const responseData = response.data || response;
      
      console.log('Response Data:', responseData);
      
      if (responseData && responseData.success) {
        setPersonnel(responseData.data || []);
        setSummary(responseData.summary || {});
        setPagination(responseData.pagination || {});
        setCurrentPage(page);
      } else {
        setError(responseData?.message || 'Failed to fetch cash collection data');
      }
    } catch (err) {
      console.error('Error fetching cash data:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        stack: err.stack
      });
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch cash collection data';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [statusFilter, zoneFilter, searchTerm, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchZones();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchCashData(1);
  }, [statusFilter, zoneFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter personnel
  const filteredPersonnel = personnel.filter(person => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        person.name?.toLowerCase().includes(searchLower) ||
        person.email?.toLowerCase().includes(searchLower) ||
        person.phone?.includes(searchTerm) ||
        person.employeeId?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'on_duty', label: 'On Duty' },
    { value: 'off_duty', label: 'Off Duty' },
    { value: 'suspended', label: 'Suspended' }
  ];

  const zoneOptions = [
    { value: 'all', label: 'All Zones' },
    ...zones.map(zone => ({ value: zone._id, label: zone.name }))
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Banknote className="mr-3 text-emerald-600" />
                Cash Collection Management
              </h1>
              <p className="text-gray-600 mt-2">Track and manage cash collections from all delivery partners</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => fetchCashData(currentPage)}
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Pending Cash</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(summary.totalPendingCash)}</p>
                <p className="text-xs text-gray-500 mt-1">{summary.totalPendingCount} collections</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Submitted</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalSubmittedCash)}</p>
                <p className="text-xs text-gray-500 mt-1">{summary.totalSubmittedCount} collections</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <AlertCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Reconciled</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalReconciledCash)}</p>
                <p className="text-xs text-gray-500 mt-1">{summary.totalReconciledCount} collections</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Cash in System</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.totalCashInSystem)}</p>
                <p className="text-xs text-gray-500 mt-1">{summary.totalPersonnel} personnel</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-full">
                <Banknote className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchCashData(1)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zone</label>
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {zoneOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {/* Personnel Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Delivery Personnel Cash Status</h2>
            <p className="text-sm text-gray-500 mt-1">
              {loading ? 'Loading...' : `${filteredPersonnel.length} personnel found`}
            </p>
          </div>
          
          {filteredPersonnel.length === 0 ? (
            <div className="p-12 text-center">
              <Banknote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No delivery personnel found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personnel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash In Hand</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reconciled</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Collected</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Today</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPersonnel.map((person) => (
                    <tr key={person._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                            <User className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{person.name}</div>
                            <div className="text-sm text-gray-500">{person.employeeId}</div>
                            <div className="text-xs text-gray-400 flex items-center mt-1">
                              <Mail className="h-3 w-3 mr-1" />
                              {person.email}
                            </div>
                            <div className="text-xs text-gray-400 flex items-center mt-1">
                              <Phone className="h-3 w-3 mr-1" />
                              {person.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{person.zone?.name || person.zoneName || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-yellow-600">{formatCurrency(person.cashInHand)}</div>
                        <div className="text-xs text-gray-500">{person.pendingCollectionsCount || 0} pending</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-yellow-600">{formatCurrency(person.pendingCollectionsAmount)}</div>
                        <div className="text-xs text-gray-500">{person.pendingCollectionsCount || 0} collections</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-600">{formatCurrency(person.submittedCollectionsAmount)}</div>
                        <div className="text-xs text-gray-500">{person.submittedCollectionsCount || 0} collections</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">{formatCurrency(person.reconciledCollectionsAmount)}</div>
                        <div className="text-xs text-gray-500">{person.reconciledCollectionsCount || 0} collections</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(person.totalCashCollected)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-emerald-600">{formatCurrency(person.todayCollectionsAmount)}</div>
                        <div className="text-xs text-gray-500">{person.todayCollectionsCount || 0} today</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedPersonnel(person);
                            setShowDetailsModal(true);
                          }}
                          className="text-emerald-600 hover:text-emerald-900 flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.currentPage - 1) * itemsPerPage) + 1} to {Math.min(pagination.currentPage * itemsPerPage, pagination.total)} of {pagination.total} personnel
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchCashData(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                  const pageNum = Math.max(1, Math.min(pagination.pages, currentPage - 2 + i));
                  return (
                    <button
                      key={pageNum}
                      onClick={() => fetchCashData(pageNum)}
                      className={`px-4 py-2 rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-emerald-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => fetchCashData(currentPage + 1)}
                  disabled={currentPage >= pagination.pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedPersonnel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Cash Collection Details</h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">{selectedPersonnel.name} ({selectedPersonnel.employeeId})</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Cash In Hand</p>
                    <p className="text-xl font-bold text-yellow-600">{formatCurrency(selectedPersonnel.cashInHand)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Collected</p>
                    <p className="text-xl font-bold text-emerald-600">{formatCurrency(selectedPersonnel.totalCashCollected)}</p>
                  </div>
                </div>
                
                {selectedPersonnel.recentPendingCollections && selectedPersonnel.recentPendingCollections.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Recent Pending Collections</h4>
                    <div className="space-y-2">
                      {selectedPersonnel.recentPendingCollections.map((collection, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">Order: {collection.orderNumber}</p>
                              <p className="text-sm text-gray-600">Amount: {formatCurrency(collection.amount)}</p>
                              <p className="text-xs text-gray-500">Collected: {formatDate(collection.collectedAt)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashCollectionManagement;
