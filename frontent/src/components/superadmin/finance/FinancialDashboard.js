import React, { useState, useEffect, useCallback } from 'react';
import { 
  Banknote, 
  TrendingUp, 
  Clock, 
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  BarChart3,
  CreditCard,
  Percent,
  Handshake
} from 'lucide-react';
import { superadminApi } from '../../../services/api/superadminApi';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { formatCurrency } from '../../../utils/currency';

const FinancialDashboard = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [financialStats, setFinancialStats] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  // Fetch financial dashboard data
  const fetchFinancialData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      // Fetch dashboard data and payment stats
      const [dashboardResponse, paymentStatsResponse, recentPaymentsResponse] = await Promise.allSettled([
        superadminApi.getDashboardData(),
        superadminApi.getPaymentStats(),
        superadminApi.getAllPayments({ limit: 5, sort: 'createdAt', order: 'desc' })
      ]);

      let dashboardData = {};
      let paymentStats = {};
      let recentPayments = [];

      if (dashboardResponse.status === 'fulfilled') {
        dashboardData = dashboardResponse.value.data;
      }

      if (paymentStatsResponse.status === 'fulfilled') {
        paymentStats = paymentStatsResponse.value.data;
      }

      if (recentPaymentsResponse.status === 'fulfilled') {
        recentPayments = recentPaymentsResponse.value.data || [];
      }

      // Process financial stats
      const stats = [
        {
          label: 'Total Revenue',
          value: formatCurrency(dashboardData.stats?.monthlyRevenue || 0),
          icon: Banknote,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          trend: '+12%', // This would come from analytics
          change: 'positive',
          period: 'This Month'
        },
        {
          label: 'Commission Earned',
          value: formatCurrency(dashboardData.stats?.monthlyCommission || 0),
          icon: Percent,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          trend: '+8%', // This would come from analytics
          change: 'positive',
          period: 'This Month'
        },
        {
          label: 'Pending Payments',
          value: formatCurrency(paymentStats.pendingAmount || 0),
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          trend: '-3%', // This would come from analytics
          change: 'negative',
          period: 'This Week'
        },
        {
          label: 'Total Transactions',
          value: paymentStats.totalTransactions?.toLocaleString() || '0',
          icon: CreditCard,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          trend: '+15%', // This would come from analytics
          change: 'positive',
          period: 'This Month'
        }
      ];

      setFinancialStats(stats);
      setRecentTransactions(recentPayments);
      
    } catch (err) {
      console.error('Error fetching financial data:', err);
      setError('Failed to load financial data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  // Currency formatting is now handled by the utility function

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return '#27ae60';
      case 'Pending': return '#f39c12';
      case 'Failed': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  if (loading) return <LoadingSpinner message="Loading financial dashboard..." />;

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Financial Data</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchFinancialData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Banknote className="mr-3 text-indigo-600" />
                Financial Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Welcome back, {user?.name || 'Admin'}! Here's your financial overview.</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={fetchFinancialData}
                disabled={isRefreshing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center">
                <BarChart3 className="mr-2 h-4 w-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {financialStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 ${stat.bgColor} rounded-full`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  {stat.change === 'positive' ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${stat.change === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.trend} ({stat.period})
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <CreditCard className="mr-2 h-5 w-5 text-indigo-600" />
                Recent Transactions
              </h2>
              <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                View All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Restaurant</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentTransactions.length > 0 ? (
                    recentTransactions.map((transaction) => (
                      <tr key={transaction._id || transaction.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">
                          {transaction._id || transaction.id}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {transaction.restaurant?.name || transaction.restaurantName || 'N/A'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {formatCurrency(transaction.amount || transaction.totalAmount || 0)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {formatCurrency(transaction.commission || 0)}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                            style={{ 
                              color: getStatusColor(transaction.status),
                              backgroundColor: getStatusColor(transaction.status) + '20'
                            }}
                          >
                            {transaction.status || 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {formatDate(transaction.createdAt || transaction.date)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                        No recent transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex flex-col items-center">
                <CreditCard className="h-8 w-8 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Process Payments</span>
              </button>
              <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex flex-col items-center">
                <BarChart3 className="h-8 w-8 text-green-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Generate Report</span>
              </button>
              <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex flex-col items-center">
                <Percent className="h-8 w-8 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Commission Settings</span>
              </button>
              <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors flex flex-col items-center">
                <Handshake className="h-8 w-8 text-orange-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">View Analytics</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;
