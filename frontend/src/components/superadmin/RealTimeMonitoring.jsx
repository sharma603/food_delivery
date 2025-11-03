import React, { useState } from 'react';
import { Search, Filter, Eye, Edit, Trash2, RefreshCw, MessageSquare, CreditCard, Package, AlertTriangle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';

const OrderOperations = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);

  // real data
  const orders = [
    {
      id: 'ORD-2024-001',
      customer: { name: 'John Doe', phone: '+1 (555) 123-4567', email: 'john@example.com' },
      restaurant: { name: 'Pizza Palace', id: 'REST-001' },
      items: [
        { name: 'Margherita Pizza', quantity: 2, price: 12.99, customization: 'Extra cheese' },
        { name: 'Caesar Salad', quantity: 1, price: 8.99, customization: 'No croutons' }
      ],
      totalAmount: 34.97,
      status: 'delivered',
      driver: { name: 'Mike Wilson', id: 'DRV-045' },
      timestamps: {
        ordered: '2024-01-15T10:30:00',
        confirmed: '2024-01-15T10:32:00',
        preparing: '2024-01-15T10:35:00',
        ready: '2024-01-15T10:50:00',
        pickedUp: '2024-01-15T10:55:00',
        delivered: '2024-01-15T11:15:00'
      },
      deliveryAddress: '123 Main St, City, State 12345',
      paymentMethod: 'credit_card',
      paymentStatus: 'completed',
      issues: [],
      notes: 'Customer requested extra napkins'
    },
    {
      id: 'ORD-2024-002',
      customer: { name: 'Jane Smith', phone: '+1 (555) 234-5678', email: 'jane@example.com' },
      restaurant: { name: 'Burger King', id: 'REST-002' },
      items: [
        { name: 'Whopper', quantity: 1, price: 6.99, customization: 'No pickles' },
        { name: 'French Fries', quantity: 1, price: 3.99, customization: 'Well done' }
      ],
      totalAmount: 10.98,
      status: 'cancelled',
      driver: null,
      timestamps: {
        ordered: '2024-01-15T09:45:00',
        confirmed: '2024-01-15T09:47:00',
        preparing: '2024-01-15T09:50:00',
        ready: null,
        pickedUp: null,
        delivered: null
      },
      deliveryAddress: '456 Oak Ave, City, State 12345',
      paymentMethod: 'cash',
      paymentStatus: 'refunded',
      issues: ['Customer cancelled order'],
      notes: 'Customer called to cancel after 15 minutes'
    },
    {
      id: 'ORD-2024-003',
      customer: { name: 'Bob Wilson', phone: '+1 (555) 345-6789', email: 'bob@example.com' },
      restaurant: { name: 'McDonald\'s', id: 'REST-003' },
      items: [
        { name: 'Big Mac', quantity: 1, price: 5.99, customization: 'No onions' },
        { name: 'McFlurry', quantity: 1, price: 3.49, customization: 'Extra M&Ms' }
      ],
      totalAmount: 9.48,
      status: 'delivered',
      driver: { name: 'Sarah Johnson', id: 'DRV-023' },
      timestamps: {
        ordered: '2024-01-15T11:00:00',
        confirmed: '2024-01-15T11:02:00',
        preparing: '2024-01-15T11:05:00',
        ready: '2024-01-15T11:20:00',
        pickedUp: '2024-01-15T11:25:00',
        delivered: '2024-01-15T11:45:00'
      },
      deliveryAddress: '789 Pine St, City, State 12345',
      paymentMethod: 'credit_card',
      paymentStatus: 'completed',
      issues: [],
      notes: 'Delivery was on time'
    },
    {
      id: 'ORD-2024-004',
      customer: { name: 'Alice Brown', phone: '+1 (555) 456-7890', email: 'alice@example.com' },
      restaurant: { name: 'Subway', id: 'REST-004' },
      items: [
        { name: 'Turkey Sub', quantity: 1, price: 7.99, customization: 'Wheat bread, extra veggies' },
        { name: 'Chips', quantity: 1, price: 1.99, customization: 'Salt and vinegar' }
      ],
      totalAmount: 9.98,
      status: 'delivered',
      driver: { name: 'David Lee', id: 'DRV-067' },
      timestamps: {
        ordered: '2024-01-15T08:30:00',
        confirmed: '2024-01-15T08:32:00',
        preparing: '2024-01-15T08:35:00',
        ready: '2024-01-15T08:50:00',
        pickedUp: '2024-01-15T08:55:00',
        delivered: '2024-01-15T09:15:00'
      },
      deliveryAddress: '321 Elm St, City, State 12345',
      paymentMethod: 'credit_card',
      paymentStatus: 'completed',
      issues: [],
      notes: 'Customer was satisfied with the order'
    }
  ];

  const statusOptions = ['all', 'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
  const dateOptions = ['all', 'today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month'];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="info">Confirmed</Badge>;
      case 'preparing':
        return <Badge variant="warning">Preparing</Badge>;
      case 'ready':
        return <Badge variant="info">Ready</Badge>;
      case 'out_for_delivery':
        return <Badge variant="primary">Out for Delivery</Badge>;
      case 'delivered':
        return <Badge variant="success">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'failed':
        return <Badge variant="danger">Failed</Badge>;
      case 'refunded':
        return <Badge variant="info">Refunded</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.restaurant.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: 'id',
      header: 'Order ID',
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{new Date(row.timestamps.ordered).toLocaleDateString()}</p>
        </div>
      )
    },
    {
      key: 'customer',
      header: 'Customer',
      sortable: true,
      render: (value) => (
        <div>
          <p className="font-medium text-gray-900">{value.name}</p>
          <p className="text-sm text-gray-500">{value.phone}</p>
        </div>
      )
    },
    {
      key: 'restaurant',
      header: 'Restaurant',
      sortable: true,
      render: (value) => (
        <div>
          <p className="font-medium text-gray-900">{value.name}</p>
          <p className="text-sm text-gray-500">ID: {value.id}</p>
        </div>
      )
    },
    {
      key: 'totalAmount',
      header: 'Amount',
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
      key: 'paymentStatus',
      header: 'Payment',
      sortable: true,
      render: (value) => getPaymentStatusBadge(value)
    },
    {
      key: 'issues',
      header: 'Issues',
      sortable: true,
      render: (value) => (
        <div>
          {value.length > 0 ? (
            <Badge variant="danger">{value.length} issue(s)</Badge>
          ) : (
            <Badge variant="success">No issues</Badge>
          )}
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
              setSelectedOrder(row);
              setShowOrderModal(true);
            }}
          >
            <Eye size={16} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedOrder(row);
              setShowIssueModal(true);
            }}
          >
            <MessageSquare size={16} />
          </Button>
          {row.paymentStatus === 'completed' && row.status !== 'cancelled' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedOrder(row);
                setShowRefundModal(true);
              }}
            >
              <CreditCard size={16} />
            </Button>
          )}
        </div>
      )
    }
  ];

  const handleRefund = (orderId, amount, reason) => {
    console.log('Processing refund:', orderId, amount, reason);
    // Implement refund functionality
  };

  const handleIssueResolution = (orderId, resolution, notes) => {
    console.log('Resolving issue:', orderId, resolution, notes);
    // Implement issue resolution functionality
  };

  // const handleOrderModification = (orderId, modifications) => {
  //   console.log('Modifying order:', orderId, modifications);
  //   // Implement order modification functionality
  // };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Order Operations</h1>
        <p className="text-gray-600">Manage order lifecycle and operations</p>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                placeholder="Search orders, customers, restaurants..."
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
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {dateOptions.map(date => (
                <option key={date} value={date}>
                  {date.charAt(0).toUpperCase() + date.slice(1).replace('_', ' ')}
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

      {/* Orders Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Orders ({filteredOrders.length})
          </h3>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              Export CSV
            </Button>
            <Button size="sm">
              Bulk Actions
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredOrders}
          sortable={true}
        />
      </Card>

      {/* Order Details Modal */}
      <Modal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        title="Order Details & Operations"
        size="xl"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Order Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Order Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Order ID:</span>
                    <span className="text-sm text-gray-900">{selectedOrder.id}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Status:</span>
                    <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Total:</span>
                    <span className="text-sm text-gray-900">${selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Payment:</span>
                    <span className="text-sm text-gray-900 capitalize">{selectedOrder.paymentMethod.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Customer Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Name:</span>
                    <span className="text-sm text-gray-900">{selectedOrder.customer.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Phone:</span>
                    <span className="text-sm text-gray-900">{selectedOrder.customer.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Email:</span>
                    <span className="text-sm text-gray-900">{selectedOrder.customer.email}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Address:</span>
                    <span className="text-sm text-gray-900">{selectedOrder.deliveryAddress}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
              <div className="space-y-2">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      {item.customization && (
                        <p className="text-sm text-blue-600">Custom: {item.customization}</p>
                      )}
                    </div>
                    <p className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Timeline */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Order Timeline</h4>
              <div className="space-y-2">
                {Object.entries(selectedOrder.timestamps).map(([status, timestamp]) => (
                  <div key={status} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
                    <span className="text-sm text-gray-900 capitalize">
                      {status.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-600">
                      {timestamp ? new Date(timestamp).toLocaleString() : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Issues and Notes */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Issues & Notes</h4>
              <div className="space-y-3">
                {selectedOrder.issues.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Issues:</p>
                    <div className="space-y-1">
                      {selectedOrder.issues.map((issue, index) => (
                        <div key={index} className="flex items-center p-2 bg-red-50 border border-red-200 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                          <span className="text-sm text-red-800">{issue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedOrder.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Notes:</p>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-900">{selectedOrder.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowOrderModal(false)}
              >
                Close
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowIssueModal(true);
                  setShowOrderModal(false);
                }}
              >
                <MessageSquare size={16} className="mr-2" />
                Add Issue
              </Button>
              {selectedOrder.paymentStatus === 'completed' && selectedOrder.status !== 'cancelled' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRefundModal(true);
                    setShowOrderModal(false);
                  }}
                >
                  <CreditCard size={16} className="mr-2" />
                  Process Refund
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Refund Modal */}
      <Modal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        title="Process Refund"
        size="md"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900">{selectedOrder.id}</h4>
              <p className="text-sm text-gray-600">
                Customer: {selectedOrder.customer.name} | Amount: ${selectedOrder.totalAmount.toFixed(2)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refund Amount
              </label>
              <input
                type="number"
                step="0.01"
                max={selectedOrder.totalAmount}
                defaultValue={selectedOrder.totalAmount}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refund Reason
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Select reason</option>
                <option value="customer_request">Customer Request</option>
                <option value="order_cancelled">Order Cancelled</option>
                <option value="quality_issue">Quality Issue</option>
                <option value="delivery_issue">Delivery Issue</option>
                <option value="payment_error">Payment Error</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter additional details about the refund..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowRefundModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleRefund(selectedOrder.id, selectedOrder.totalAmount, 'Customer request');
                  setShowRefundModal(false);
                }}
              >
                Process Refund
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Issue Resolution Modal */}
      <Modal
        isOpen={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        title="Issue Resolution"
        size="md"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900">{selectedOrder.id}</h4>
              <p className="text-sm text-gray-600">
                Customer: {selectedOrder.customer.name} | Restaurant: {selectedOrder.restaurant.name}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Type
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Select issue type</option>
                <option value="quality_issue">Quality Issue</option>
                <option value="delivery_issue">Delivery Issue</option>
                <option value="payment_issue">Payment Issue</option>
                <option value="customer_service">Customer Service</option>
                <option value="restaurant_issue">Restaurant Issue</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Select resolution</option>
                <option value="refund_processed">Refund Processed</option>
                <option value="replacement_sent">Replacement Sent</option>
                <option value="credit_issued">Credit Issued</option>
                <option value="apology_sent">Apology Sent</option>
                <option value="issue_resolved">Issue Resolved</option>
                <option value="escalated">Escalated</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution Notes
              </label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter detailed resolution notes..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowIssueModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleIssueResolution(selectedOrder.id, 'issue_resolved', 'Issue resolved');
                  setShowIssueModal(false);
                }}
              >
                Resolve Issue
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderOperations;
