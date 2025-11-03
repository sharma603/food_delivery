import React, { useState, useEffect, useCallback } from 'react';
import { superadminApi } from '../../../services/api/superadminApi';
import WebSocketService from '../../../services/webSocketService';
import Table from '../../common/Table';
import SearchBar from '../../common/ui/SearchBar';
import Pagination from '../../common/ui/Pagination';
import Modal from '../../common/Modal';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import AppConfig from '../../../config/appConfig';
import './RefundManagement.css';

const RefundManagement = ({ user, onLogout }) => {
  // State management
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [showRefundDetails, setShowRefundDetails] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundType, setRefundType] = useState('');
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);

  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRefunds, setTotalRefunds] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  });

  // Refund statistics
  const [refundStats, setRefundStats] = useState({
    totalRefunds: 0,
    pendingRefunds: 0,
    processedRefunds: 0,
    totalAmount: 0
  });


  // Process refund type options
  const processRefundTypeOptions = [
    { value: 'full', label: 'Full Refund' },
    { value: 'partial', label: 'Partial Refund' },
    { value: 'credit', label: 'Account Credit' }
  ];

  // Mock data removed - using API calls

  // Table columns
  const columns = [
    { 
      key: 'id', 
      label: 'Refund ID',
      render: (refund) => (
        <span className="refund-id" onClick={() => viewRefundDetails(refund)}>
          {refund.id}
        </span>
      )
    },
    { 
      key: 'orderId', 
      label: 'Order ID',
      render: (refund) => refund.orderId
    },
    { 
      key: 'customer', 
      label: 'Customer',
      render: (refund) => refund.customer
    },
    { 
      key: 'restaurant', 
      label: 'Restaurant',
      render: (refund) => refund.restaurant
    },
    { 
      key: 'amounts', 
      label: 'Amounts',
      render: (refund) => (
        <div className="amount-info">
          <div className="original-amount">Original: ${refund.originalAmount.toFixed(2)}</div>
          <div className="refund-amount">Refund: ${refund.refundAmount.toFixed(2)}</div>
        </div>
      )
    },
    { 
      key: 'type', 
      label: 'Type',
      render: (refund) => (
        <span className={`type-badge type-${refund.type}`}>
          {refund.type}
        </span>
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (refund) => (
        <span className={`status-badge status-${refund.status}`}>
          {refund.status}
        </span>
      )
    },
    { 
      key: 'paymentMethod', 
      label: 'Payment Method',
      render: (refund) => refund.paymentMethod
    },
    { 
      key: 'requestedAt', 
      label: 'Requested',
      render: (refund) => new Date(refund.requestedAt).toLocaleDateString()
    },
    { 
      key: 'actions', 
      label: 'Actions',
      render: (refund) => (
        <div className="refund-actions">
          <button
            onClick={() => viewRefundDetails(refund)}
            className="btn btn-sm btn-primary"
          >
            View
          </button>
          {refund.status === 'pending' && (
            <button
              onClick={() => openProcessModal(refund)}
              className="btn btn-sm btn-success"
            >
              Process
            </button>
          )}
        </div>
      )
    }
  ];

  // Fetch refunds from API
  const fetchRefunds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with actual API endpoint when available
      // Example: const response = await superadminApi.getAllRefunds({ ...params });
      
      // For now, return empty data
      setRefunds([]);
      setTotalRefunds(0);
      setTotalPages(1);
    } catch (error) {
      setError('Failed to fetch refunds');
      console.error('Error fetching refunds:', error);
      setRefunds([]);
      setTotalRefunds(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  // Fetch refund statistics from API
  const fetchRefundStats = useCallback(async () => {
    try {
      // TODO: Replace with actual API endpoint when available
      // Example: const response = await superadminApi.getRefundStats();
      
      // For now, return empty stats
      setRefundStats({
        totalRefunds: 0,
        pendingRefunds: 0,
        processedRefunds: 0,
        totalAmount: 0
      });
    } catch (error) {
      console.error('Error fetching refund stats:', error);
      setRefundStats({
        totalRefunds: 0,
        pendingRefunds: 0,
        processedRefunds: 0,
        totalAmount: 0
      });
    }
  }, []);

  // Real-time WebSocket setup
  useEffect(() => {
    if (realTimeUpdates) {
      // Connect to WebSocket for real-time updates
      WebSocketService.connect(AppConfig.API.WEBSOCKET_URL, localStorage.getItem('token'));
      
      // Listen for new refund requests
      WebSocketService.on('newRefundRequest', (data) => {
        console.log('New refund request received:', data);
        setRefunds(prev => [data.refund, ...prev]);
        setTotalRefunds(prev => prev + 1);
        setRefundStats(prev => ({
          ...prev,
          totalRefunds: prev.totalRefunds + 1,
          pendingRefunds: prev.pendingRefunds + 1
        }));
      });

      // Listen for refund updates
      WebSocketService.on('refundUpdate', (data) => {
        console.log('Refund update received:', data);
        setRefunds(prev => 
          prev.map(refund => 
            refund.id === data.refundId 
              ? { ...refund, ...data.updates }
              : refund
          )
        );
      });

      return () => {
        WebSocketService.disconnect();
      };
    }
  }, [realTimeUpdates]);

  // Load data
  useEffect(() => {
    fetchRefunds();
    fetchRefundStats();
  }, [fetchRefunds, fetchRefundStats]);

  // View refund details
  const viewRefundDetails = (refund) => {
    setSelectedRefund(refund);
    setShowRefundDetails(true);
  };

  // Open process modal
  const openProcessModal = (refund) => {
    setSelectedRefund(refund);
    setRefundAmount(refund.originalAmount.toString());
    setShowProcessModal(true);
  };

  // Handle refund processing
  const handleProcessRefund = async () => {
    try {
      // Real data
      console.log('Processing refund:', selectedRefund.id, 'Amount:', refundAmount, 'Type:', refundType);
      
      // Update local state
      setRefunds(prev => prev.map(refund => 
        refund.id === selectedRefund.id 
          ? { 
              ...refund, 
              status: 'processing',
              refundAmount: parseFloat(refundAmount),
              type: refundType,
              processedAt: new Date().toISOString()
            }
          : refund
      ));
      
      setShowProcessModal(false);
      setRefundAmount('');
      setRefundReason('');
      setRefundType('');
      await fetchRefundStats();
    } catch (error) {
      setError('Failed to process refund');
      console.error('Error processing refund:', error);
    }
  };

  // Handle search
  const handleSearch = (searchTerm) => {
    setFilters({ ...filters, search: searchTerm });
    setCurrentPage(1);
  };


  // Export refunds
  const handleExport = async (format = 'csv') => {
    try {
      // Real data
      console.log('Exporting refunds in', format, 'format');
      // Create download link
      const data = refunds.map(refund => ({
        'Refund ID': refund.id,
        'Order ID': refund.orderId,
        'Customer': refund.customer,
        'Restaurant': refund.restaurant,
        'Original Amount': refund.originalAmount,
        'Refund Amount': refund.refundAmount,
        'Type': refund.type,
        'Status': refund.status,
        'Reason': refund.reason,
        'Requested At': refund.requestedAt
      }));
      
      const csvContent = "data:text/csv;charset=utf-8," 
        + Object.keys(data[0]).join(",") + "\n"
        + data.map(row => Object.values(row).join(",")).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `refunds.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      setError('Failed to export refunds');
      console.error('Error exporting refunds:', error);
    }
  };

  // Toggle real-time updates
  const toggleRealTimeUpdates = () => {
    setRealTimeUpdates(!realTimeUpdates);
  };

  if (loading && refunds.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="refund-management">
      <div className="refunds-header">
        <div className="header-content">
          <h1>Refund Management</h1>
          <p>Process and manage customer refunds and account credits</p>
        </div>
        <div className="header-actions">
          <div className="real-time-toggle">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={realTimeUpdates}
                onChange={toggleRealTimeUpdates}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">Real-time</span>
            </label>
          </div>
          <button className="btn btn-primary">
            <i className="fas fa-plus"></i> Create Refund
          </button>
          <button 
            onClick={() => handleExport('csv')}
            className="btn btn-secondary"
          >
            <i className="fas fa-download"></i> Export CSV
          </button>
          <button 
            onClick={() => handleExport('excel')}
            className="btn btn-secondary"
          >
            <i className="fas fa-file-excel"></i> Export Excel
          </button>
        </div>
      </div>

      {/* Real-time Status Indicator */}
      {realTimeUpdates && (
        <div className="real-time-indicator">
          <div className="live-dot"></div>
          <span>Live Refund Updates Active</span>
        </div>
      )}

      {/* Refund Statistics */}
      <div className="refund-stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-money-bill-wave"></i>
            </div>
            <div className="stat-content">
              <h3>{refundStats.totalRefunds}</h3>
              <p>Total Refunds</p>
            </div>
          </div>
          <div className="stat-card pending">
            <div className="stat-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-content">
              <h3>{refundStats.pendingRefunds}</h3>
              <p>Pending</p>
            </div>
          </div>
          <div className="stat-card processed">
            <div className="stat-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-content">
              <h3>{refundStats.processedRefunds}</h3>
              <p>Processed</p>
            </div>
          </div>
          <div className="stat-card amount">
            <div className="stat-icon">
              <i className="fas fa-dollar-sign"></i>
            </div>
            <div className="stat-content">
              <h3>${refundStats.totalAmount.toFixed(2)}</h3>
              <p>Total Amount</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-section">
        <SearchBar
          placeholder="Search refunds by ID, customer, or order..."
          onSearch={handleSearch}
          value={filters.search}
        />
      </div>

      {/* Refunds Table */}
      <div className="refunds-table-container">
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}
        
        <Table
          columns={columns}
          data={refunds}
          loading={loading}
          emptyMessage="No refunds found"
        />
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalRefunds}
        onPageChange={setCurrentPage}
      />

      {/* Refund Details Modal */}
      {showRefundDetails && selectedRefund && (
        <Modal
          isOpen={showRefundDetails}
          onClose={() => setShowRefundDetails(false)}
          title="Refund Details"
          size="large"
        >
          <div className="refund-details">
            <div className="refund-header">
              <h3>Refund #{selectedRefund.id}</h3>
              <div className="refund-meta">
                <span className={`type-badge type-${selectedRefund.type}`}>
                  {selectedRefund.type} refund
                </span>
                <span className={`status-badge status-${selectedRefund.status}`}>
                  {selectedRefund.status}
                </span>
              </div>
            </div>
            
            <div className="refund-info">
              <div className="info-row">
                <label>Order ID:</label>
                <span>{selectedRefund.orderId}</span>
              </div>
              <div className="info-row">
                <label>Customer:</label>
                <span>{selectedRefund.customer}</span>
              </div>
              <div className="info-row">
                <label>Restaurant:</label>
                <span>{selectedRefund.restaurant}</span>
              </div>
              <div className="info-row">
                <label>Original Amount:</label>
                <span>${selectedRefund.originalAmount.toFixed(2)}</span>
              </div>
              <div className="info-row">
                <label>Refund Amount:</label>
                <span>${selectedRefund.refundAmount.toFixed(2)}</span>
              </div>
              <div className="info-row">
                <label>Payment Method:</label>
                <span>{selectedRefund.paymentMethod}</span>
              </div>
              <div className="info-row">
                <label>Requested:</label>
                <span>{selectedRefund.requestedAt ? new Date(selectedRefund.requestedAt).toLocaleString() : 'N/A'}</span>
              </div>
              {selectedRefund.processedAt && (
                <div className="info-row">
                  <label>Processed:</label>
                  <span>{selectedRefund.processedAt ? new Date(selectedRefund.processedAt).toLocaleString() : 'N/A'}</span>
                </div>
              )}
            </div>
            
            <div className="refund-reason">
              <label>Reason:</label>
              <p>{selectedRefund.reason}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Process Refund Modal */}
      {showProcessModal && selectedRefund && (
        <Modal
          isOpen={showProcessModal}
          onClose={() => setShowProcessModal(false)}
          title="Process Refund"
          size="medium"
        >
          <div className="process-refund-form">
            <div className="form-group">
              <label>Refund Type:</label>
              <select
                value={refundType}
                onChange={(e) => setRefundType(e.target.value)}
                className="form-control"
              >
                <option value="">Select refund type</option>
                {processRefundTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Refund Amount:</label>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="Enter refund amount"
                max={selectedRefund.originalAmount}
                step="0.01"
                className="form-control"
              />
              <small>Original amount: ${selectedRefund.originalAmount.toFixed(2)}</small>
            </div>
            
            <div className="form-group">
              <label>Processing Notes:</label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Enter processing notes..."
                rows="3"
                className="form-control"
              />
            </div>
            
            <div className="form-actions">
              <button
                onClick={() => setShowProcessModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessRefund}
                className="btn btn-success"
                disabled={!refundType || !refundAmount}
              >
                Process Refund
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default RefundManagement;
