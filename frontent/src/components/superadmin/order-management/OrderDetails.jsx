import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { superadminApi } from '../../../services/api/superadminApi';
import './OrderDetails.css';

const OrderDetails = ({ order, onStatusChange, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const statusOptions = [
    { value: 'placed', label: 'Placed', color: '#3498db' },
    { value: 'confirmed', label: 'Confirmed', color: '#f39c12' },
    { value: 'preparing', label: 'Preparing', color: '#e67e22' },
    { value: 'ready', label: 'Ready', color: '#9b59b6' },
    { value: 'picked_up', label: 'Picked Up', color: '#34495e' },
    { value: 'delivered', label: 'Delivered', color: '#27ae60' },
    { value: 'cancelled', label: 'Cancelled', color: '#e74c3c' }
  ];

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.color : '#95a5a6';
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setLoading(true);
      await onStatusChange(order._id, newStatus);
    } catch (error) {
      setError('Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    try {
      setLoading(true);
      await superadminApi.processRefund(order._id, parseFloat(refundAmount), refundReason);
      setShowRefundModal(false);
      setRefundAmount('');
      setRefundReason('');
      // Refresh order data
      window.location.reload();
    } catch (error) {
      setError('Failed to process refund');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };


  return (
    <div className="order-details">
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="order-details-header">
        <div className="order-info">
          <h2>Order #{order.orderNumber}</h2>
          <div className="order-meta">
            <span className="order-date">Placed: {formatDate(order.createdAt)}</span>
            <span 
              className="order-status"
              style={{ color: getStatusColor(order.status) }}
            >
              {statusOptions.find(s => s.value === order.status)?.label || order.status}
            </span>
          </div>
        </div>
        <div className="order-actions">
          <select
            value={order.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="status-select"
            disabled={loading}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {order.paymentStatus === 'paid' && order.status !== 'cancelled' && (
            <button
              onClick={() => setShowRefundModal(true)}
              className="btn btn-warning"
            >
              Process Refund
            </button>
          )}
        </div>
      </div>

      <div className="order-details-content">
        <div className="order-sections">
          {/* Customer Information */}
          <div className="order-section">
            <h3>Customer Information</h3>
            <div className="customer-details">
              <div className="detail-item">
                <label>Name:</label>
                <span>{order.customer?.name || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Email:</label>
                <span>{order.customer?.email || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Phone:</label>
                <span>{order.customer?.phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Restaurant Information */}
          <div className="order-section">
            <h3>Restaurant Information</h3>
            <div className="restaurant-details">
              <div className="detail-item">
                <label>Name:</label>
                <span>{order.restaurant?.name || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Address:</label>
                <span>{order.restaurant?.address || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Phone:</label>
                <span>{order.restaurant?.phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="order-section">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-4 h-4 text-gray-600">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delivery Address</h3>
              </div>
              <div className="text-gray-700">
                <div className="font-medium">
                  {order.deliveryAddress?.street || order.deliveryAddress?.address || 'Thamel, Kathmandu, Nepal'}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {order.deliveryAddress?.city || 'Kathmandu'}, {order.deliveryAddress?.postalCode || '44600'}
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="order-section">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
            <div className="grid gap-3">
              {order.items?.map((item, index) => {
                // Get the best available image
                const itemImage = item.menuItem?.images?.[0] || 
                                 item.menuItem?.image || 
                                 item.image || 
                                 null;
                
                // Construct full image URL if needed
                let imageUrl = itemImage;
                if (itemImage && !itemImage.startsWith('http')) {
                  const backendUrl = process.env.REACT_APP_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
                  imageUrl = `${backendUrl}${itemImage}`;
                }
                
                return (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex">
                      {/* Image Section */}
                      <div className="w-8 h-8 flex-shrink-0">
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={item.menuItem?.name || item.name || 'Unknown Item'} 
                            className="w-full h-full object-cover rounded"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded" style={{display: imageUrl ? 'none' : 'flex'}}>
                          <Package className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                      
                      {/* Content Section */}
                      <div className="flex-1 p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm truncate">
                              {item.menuItem?.name || item.name || 'Unknown Item'}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                Qty: {item.quantity || 1}
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                ${(item.menuItem && item.menuItem.price) ? item.menuItem.price.toFixed(2) : '0.00'}
                              </span>
                            </div>
                            {item.menuItem?.description && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                                {item.menuItem.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right ml-2">
                            <div className="text-sm font-bold text-gray-900">
                              ${item.subtotal ? item.subtotal.toFixed(2) : '0.00'}
                            </div>
                          </div>
                        </div>
                        
                        {item.customizations && item.customizations.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-gray-500 mb-1">Customizations:</div>
                            <div className="flex flex-wrap gap-1">
                              {item.customizations.map((custom, idx) => (
                                <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                  {custom.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="order-section">
            <h3>Pricing Breakdown</h3>
            <div className="pricing-breakdown">
              <div className="pricing-item">
                <label>Subtotal:</label>
                <span>${order.pricing?.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="pricing-item">
                <label>Delivery Fee:</label>
                <span>${order.pricing?.deliveryFee?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="pricing-item">
                <label>Tax:</label>
                <span>${order.pricing?.tax?.toFixed(2) || '0.00'}</span>
              </div>
              {order.pricing?.discount > 0 && (
                <div className="pricing-item discount">
                  <label>Discount:</label>
                  <span>-${order.pricing.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="pricing-item total">
                <label>Total:</label>
                <span>${order.pricing?.total?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="modal-overlay">
          <div className="refund-modal">
            <h3>Process Refund</h3>
            <div className="refund-form">
              <div className="form-group">
                <label>Refund Amount:</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="Enter refund amount"
                  max={order.pricing?.total || 0}
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Reason:</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Enter refund reason"
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                onClick={() => setShowRefundModal(false)}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                className="btn btn-warning"
                disabled={loading || !refundAmount}
              >
                {loading ? 'Processing...' : 'Process Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
