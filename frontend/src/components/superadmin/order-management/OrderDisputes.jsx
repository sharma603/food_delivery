import React, { useState, useEffect, useCallback } from 'react';
import { superadminApi } from '../../../services/api/superadminApi';
import './OrderDisputes.css';

const OrderDisputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({});
  const [newComment, setNewComment] = useState('');
  const [resolutionData, setResolutionData] = useState({
    resolution: '',
    refundAmount: 0,
    refundReason: '',
    customerCompensation: 0,
    restaurantPenalty: 0,
    adminNotes: ''
  });

  // Fetch disputes data
  const fetchDisputes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await superadminApi.getAllDisputes(filters);
      console.log('Disputes response:', response);
      
      if (response.data?.success) {
        setDisputes(response.data.data.disputes || []);
        setPagination(response.data.data.pagination || {});
      }
    } catch (error) {
      console.error('Error fetching disputes:', error);
      setError('Failed to fetch disputes data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await superadminApi.getDisputeAnalytics({ period: '30d' });
      if (response.data?.success) {
        setAnalytics(response.data.data || {});
      }
    } catch (error) {
      console.error('Error fetching dispute analytics:', error);
    }
  }, []);

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchDisputes();
    fetchAnalytics();
  }, []);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // View dispute details
  const viewDispute = async (disputeId) => {
    try {
      const response = await superadminApi.getDisputeById(disputeId);
      if (response.data?.success) {
        setSelectedDispute(response.data.data);
        setShowDisputeModal(true);
      }
    } catch (error) {
      console.error('Error fetching dispute details:', error);
    }
  };

  // Update dispute status
  const updateStatus = async (disputeId, status) => {
    try {
      await superadminApi.updateDisputeStatus(disputeId, status, '', '');
      fetchDisputes();
      setShowDisputeModal(false);
    } catch (error) {
      console.error('Error updating dispute status:', error);
    }
  };

  // Add comment to dispute
  const addComment = async () => {
    if (!newComment.trim() || !selectedDispute) return;

    try {
      await superadminApi.addDisputeComment(selectedDispute._id, newComment, false);
      setNewComment('');
      // Refresh dispute details
      viewDispute(selectedDispute._id);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Resolve dispute
  const resolveDispute = async () => {
    if (!selectedDispute) return;

    try {
      await superadminApi.resolveDispute(selectedDispute._id, resolutionData);
      setShowResolutionModal(false);
      setShowDisputeModal(false);
      fetchDisputes();
      setResolutionData({
        resolution: '',
        refundAmount: 0,
        refundReason: '',
        customerCompensation: 0,
        restaurantPenalty: 0,
        adminNotes: ''
      });
    } catch (error) {
      console.error('Error resolving dispute:', error);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      investigating: '#17a2b8',
      resolved: '#28a745',
      closed: '#6c757d',
      escalated: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#fd7e14',
      critical: '#dc3545'
    };
    return colors[priority] || '#6c757d';
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="order-disputes">
      {/* Header */}
      <div className="disputes-header">
        <div className="header-content">
          <h1>Order Disputes</h1>
          <p>Manage and resolve customer disputes efficiently</p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-number">{analytics.disputeStats?.find(s => s._id === 'pending')?.count || 0}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{analytics.disputeStats?.find(s => s._id === 'resolved')?.count || 0}</span>
            <span className="stat-label">Resolved</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">RS {(analytics.refunds?.totalRefunds || 0).toLocaleString()}</span>
            <span className="stat-label">Total Refunds</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filters.status} 
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
            <option value="escalated">Escalated</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Priority:</label>
          <select 
            value={filters.priority} 
            onChange={(e) => handleFilterChange('priority', e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => superadminApi.exportDisputes(filters)}
        >
          <i className="fas fa-download"></i> Export
        </button>
      </div>

      {/* Disputes Table */}
      <div className="disputes-table-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading disputes...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={fetchDisputes} className="btn btn-primary">Retry</button>
          </div>
        ) : (
          <table className="disputes-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Restaurant</th>
                <th>Issue Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((dispute) => (
                <tr key={dispute._id}>
                  <td className="order-id">{dispute.orderNumber}</td>
                  <td>
                    <div className="customer-info">
                      <span className="name">{dispute.customer?.name || 'Unknown'}</span>
                      <span className="email">{dispute.customer?.email || ''}</span>
                    </div>
                  </td>
                  <td>
                    <div className="restaurant-info">
                      <span className="name">{dispute.restaurant?.name || 'Unknown'}</span>
                      <span className="email">{dispute.restaurant?.email || ''}</span>
                    </div>
                  </td>
                  <td>
                    <span className="issue-type">
                      {dispute.disputeType || 'General'}
                    </span>
                  </td>
                  <td>
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(dispute.disputePriority) }}
                    >
                      {dispute.disputePriority || 'medium'}
                    </span>
                  </td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(dispute.disputeStatus) }}
                    >
                      {dispute.disputeStatus || 'pending'}
                    </span>
                  </td>
                  <td>{formatDate(dispute.disputeCreatedAt || dispute.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => viewDispute(dispute._id)}
                      >
                        View
                      </button>
                      {dispute.disputeStatus === 'pending' && (
                        <button 
                          className="btn btn-sm btn-warning"
                          onClick={() => updateStatus(dispute._id, 'investigating')}
                        >
                          Investigate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button 
            className="btn btn-secondary"
            disabled={pagination.current === 1}
            onClick={() => handlePageChange(pagination.current - 1)}
          >
            Previous
          </button>
          <span className="page-info">
            Page {pagination.current} of {pagination.pages}
          </span>
          <button 
            className="btn btn-secondary"
            disabled={pagination.current === pagination.pages}
            onClick={() => handlePageChange(pagination.current + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Dispute Details Modal */}
      {showDisputeModal && selectedDispute && (
        <div className="modal-overlay" onClick={() => setShowDisputeModal(false)}>
          <div className="dispute-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Dispute Details</h2>
              <button 
                className="close-btn"
                onClick={() => setShowDisputeModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="dispute-info">
                <div className="info-row">
                  <label>Order ID:</label>
                  <span>{selectedDispute.orderNumber}</span>
                </div>
                <div className="info-row">
                  <label>Customer:</label>
                  <span>{selectedDispute.customer?.name} ({selectedDispute.customer?.email})</span>
                </div>
                <div className="info-row">
                  <label>Restaurant:</label>
                  <span>{selectedDispute.restaurant?.name} ({selectedDispute.restaurant?.email})</span>
                </div>
                <div className="info-row">
                  <label>Issue Type:</label>
                  <span>{selectedDispute.disputeType || 'General'}</span>
                </div>
                <div className="info-row">
                  <label>Priority:</label>
                  <span 
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(selectedDispute.disputePriority) }}
                  >
                    {selectedDispute.disputePriority || 'medium'}
                  </span>
                </div>
                <div className="info-row">
                  <label>Status:</label>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(selectedDispute.disputeStatus) }}
                  >
                    {selectedDispute.disputeStatus || 'pending'}
                  </span>
                </div>
                <div className="info-row">
                  <label>Created:</label>
                  <span>{formatDate(selectedDispute.disputeCreatedAt || selectedDispute.createdAt)}</span>
                </div>
                {selectedDispute.disputeDescription && (
                  <div className="info-row">
                    <label>Description:</label>
                    <p className="description">{selectedDispute.disputeDescription}</p>
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="comments-section">
                <h3>Comments</h3>
                <div className="comments-list">
                  {selectedDispute.disputeComments?.map((comment, index) => (
                    <div key={index} className="comment">
                      <div className="comment-header">
                        <span className="comment-author">Admin</span>
                        <span className="comment-date">{formatDate(comment.addedAt)}</span>
                      </div>
                      <div className="comment-content">{comment.comment}</div>
                    </div>
                  )) || <p>No comments yet.</p>}
                </div>
                <div className="add-comment">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows="3"
                  />
                  <button 
                    className="btn btn-primary"
                    onClick={addComment}
                    disabled={!newComment.trim()}
                  >
                    Add Comment
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="modal-actions">
                {selectedDispute.disputeStatus === 'investigating' && (
                  <button 
                    className="btn btn-success"
                    onClick={() => setShowResolutionModal(true)}
                  >
                    Resolve Dispute
                  </button>
                )}
                {selectedDispute.disputeStatus === 'pending' && (
                  <button 
                    className="btn btn-warning"
                    onClick={() => updateStatus(selectedDispute._id, 'investigating')}
                  >
                    Start Investigation
                  </button>
                )}
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowDisputeModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {showResolutionModal && (
        <div className="modal-overlay" onClick={() => setShowResolutionModal(false)}>
          <div className="resolution-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Resolve Dispute</h2>
              <button 
                className="close-btn"
                onClick={() => setShowResolutionModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>Resolution:</label>
                <select 
                  value={resolutionData.resolution}
                  onChange={(e) => setResolutionData(prev => ({ ...prev, resolution: e.target.value }))}
                >
                  <option value="">Select Resolution</option>
                  <option value="refund_full">Full Refund</option>
                  <option value="refund_partial">Partial Refund</option>
                  <option value="compensation">Customer Compensation</option>
                  <option value="restaurant_penalty">Restaurant Penalty</option>
                  <option value="no_action">No Action Required</option>
                </select>
              </div>
              <div className="form-group">
                <label>Refund Amount (RS):</label>
                <input
                  type="number"
                  value={resolutionData.refundAmount}
                  onChange={(e) => setResolutionData(prev => ({ ...prev, refundAmount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Refund Reason:</label>
                <input
                  type="text"
                  value={resolutionData.refundReason}
                  onChange={(e) => setResolutionData(prev => ({ ...prev, refundReason: e.target.value }))}
                  placeholder="Reason for refund"
                />
              </div>
              <div className="form-group">
                <label>Customer Compensation (RS):</label>
                <input
                  type="number"
                  value={resolutionData.customerCompensation}
                  onChange={(e) => setResolutionData(prev => ({ ...prev, customerCompensation: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Restaurant Penalty (RS):</label>
                <input
                  type="number"
                  value={resolutionData.restaurantPenalty}
                  onChange={(e) => setResolutionData(prev => ({ ...prev, restaurantPenalty: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Admin Notes:</label>
                <textarea
                  value={resolutionData.adminNotes}
                  onChange={(e) => setResolutionData(prev => ({ ...prev, adminNotes: e.target.value }))}
                  placeholder="Additional notes about the resolution"
                  rows="4"
                />
              </div>
              <div className="modal-actions">
                <button 
                  className="btn btn-success"
                  onClick={resolveDispute}
                  disabled={!resolutionData.resolution}
                >
                  Resolve Dispute
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowResolutionModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDisputes;