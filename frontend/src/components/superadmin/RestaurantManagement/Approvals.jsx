import React, { useState } from 'react';
import { Search, Filter, CheckCircle, XCircle, Eye, Clock, MapPin, Phone, Mail, FileText, Star } from 'lucide-react';
import Card from '../../../components/common/ui/Card';
import Button from '../../../components/common/ui/Button';
import Badge from '../../../components/common/ui/Badge';
import Table from '../../../components/common/Table';
import Modal from '../../../components/common/Modal';

const Approvals = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState('');

  // real data
  const pendingApprovals = [
    {
      id: 1,
      restaurantName: 'Taco Bell',
      ownerName: 'Carlos Rodriguez',
      phone: '+1 (555) 123-4567',
      email: 'carlos@tacobell.com',
      address: '123 Taco St, City, State 12345',
      cuisineType: 'Mexican',
      applicationDate: '2024-01-15',
      status: 'pending',
      documents: {
        businessLicense: true,
        foodPermit: true,
        taxId: false,
        insurance: true
      },
      rating: 0,
      totalOrders: 0,
      estimatedDeliveryTime: '25-30 min',
      averageOrderValue: '$0.00'
    },
    {
      id: 2,
      restaurantName: 'Starbucks',
      ownerName: 'Emily Chen',
      phone: '+1 (555) 234-5678',
      email: 'emily@starbucks.com',
      address: '456 Coffee Ave, City, State 12345',
      cuisineType: 'Coffee & Beverages',
      applicationDate: '2024-01-14',
      status: 'pending',
      documents: {
        businessLicense: true,
        foodPermit: true,
        taxId: true,
        insurance: true
      },
      rating: 0,
      totalOrders: 0,
      estimatedDeliveryTime: '15-20 min',
      averageOrderValue: '$0.00'
    },
    {
      id: 3,
      restaurantName: 'Panda Express',
      ownerName: 'David Kim',
      phone: '+1 (555) 345-6789',
      email: 'david@pandaexpress.com',
      address: '789 Asian Blvd, City, State 12345',
      cuisineType: 'Chinese',
      applicationDate: '2024-01-13',
      status: 'pending',
      documents: {
        businessLicense: true,
        foodPermit: false,
        taxId: true,
        insurance: false
      },
      rating: 0,
      totalOrders: 0,
      estimatedDeliveryTime: '20-25 min',
      averageOrderValue: '$0.00'
    },
    {
      id: 4,
      restaurantName: 'Chick-fil-A',
      ownerName: 'Michael Johnson',
      phone: '+1 (555) 456-7890',
      email: 'michael@chickfila.com',
      address: '321 Chicken Way, City, State 12345',
      cuisineType: 'Fast Food',
      applicationDate: '2024-01-12',
      status: 'pending',
      documents: {
        businessLicense: true,
        foodPermit: true,
        taxId: true,
        insurance: true
      },
      rating: 0,
      totalOrders: 0,
      estimatedDeliveryTime: '18-22 min',
      averageOrderValue: '$0.00'
    }
  ];

  const statusOptions = ['all', 'pending', 'approved', 'rejected', 'needs_more_info'];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>;
      case 'needs_more_info':
        return <Badge variant="info">Needs More Info</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getDocumentStatus = (documents) => {
    const total = Object.keys(documents).length;
    const completed = Object.values(documents).filter(Boolean).length;
    return `${completed}/${total}`;
  };

  const filteredApprovals = pendingApprovals.filter(approval => {
    const matchesSearch = approval.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         approval.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || approval.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: 'restaurantName',
      header: 'Restaurant',
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{row.ownerName}</p>
        </div>
      )
    },
    {
      key: 'cuisineType',
      header: 'Cuisine',
      sortable: true
    },
    {
      key: 'applicationDate',
      header: 'Application Date',
      sortable: true
    },
    {
      key: 'documents',
      header: 'Documents',
      sortable: true,
      render: (value) => (
        <div className="flex items-center">
          <FileText className="w-4 h-4 text-gray-400 mr-1" />
          <span className="text-sm text-gray-900">{getDocumentStatus(value)}</span>
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
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (value, row) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedRestaurant(row);
              setShowReviewModal(true);
            }}
          >
            <Eye size={16} />
          </Button>
          <Button
            size="sm"
            variant="success"
            onClick={() => {
              setSelectedRestaurant(row);
              setApprovalAction('approve');
              setShowApprovalModal(true);
            }}
          >
            <CheckCircle size={16} />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              setSelectedRestaurant(row);
              setApprovalAction('reject');
              setShowApprovalModal(true);
            }}
          >
            <XCircle size={16} />
          </Button>
        </div>
      )
    }
  ];

  const handleApproval = (restaurantId, action, comments = '') => {
    console.log('Approval action:', restaurantId, action, comments);
    // Implement approval functionality
  };

  const handleRequestMoreInfo = (restaurantId, requirements) => {
    console.log('Requesting more info:', restaurantId, requirements);
    // Implement request more info functionality
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Restaurant Approvals</h1>
        <p className="text-gray-600">Review and approve pending restaurant applications</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">4</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved Today</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-full">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected Today</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Needs More Info</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
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
                placeholder="Search restaurants or owners..."
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

          <div className="flex items-end">
            <Button variant="outline" className="w-full">
              <Filter size={16} className="mr-2" />
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Approvals Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Pending Approvals ({filteredApprovals.length})
          </h3>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              Export CSV
            </Button>
            <Button size="sm">
              Bulk Approve
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredApprovals}
          sortable={true}
        />
      </Card>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Restaurant Application Review"
        size="xl"
      >
        {selectedRestaurant && (
          <div className="space-y-6">
            {/* Restaurant Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Restaurant Details</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Name:</span>
                    <span className="text-sm text-gray-900">{selectedRestaurant.restaurantName}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Cuisine:</span>
                    <span className="text-sm text-gray-900">{selectedRestaurant.cuisineType}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Address:</span>
                    <span className="text-sm text-gray-900">{selectedRestaurant.address}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Owner Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Name:</span>
                    <span className="text-sm text-gray-900">{selectedRestaurant.ownerName}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Phone:</span>
                    <span className="text-sm text-gray-900">{selectedRestaurant.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Email:</span>
                    <span className="text-sm text-gray-900">{selectedRestaurant.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Verification */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Document Verification</h4>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(selectedRestaurant.documents).map(([doc, status]) => (
                  <div key={doc} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <span className="text-sm text-gray-900 capitalize">
                      {doc.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className="flex items-center">
                      {status ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Business Information */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Business Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600">Estimated Delivery Time</p>
                  <p className="text-lg font-medium text-gray-900">{selectedRestaurant.estimatedDeliveryTime}</p>
                </div>
                <div className="p-3 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600">Average Order Value</p>
                  <p className="text-lg font-medium text-gray-900">{selectedRestaurant.averageOrderValue}</p>
                </div>
                <div className="p-3 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600">Application Date</p>
                  <p className="text-lg font-medium text-gray-900">{selectedRestaurant.applicationDate}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowReviewModal(false)}
              >
                Close
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  handleRequestMoreInfo(selectedRestaurant.id, []);
                  setShowReviewModal(false);
                }}
              >
                Request More Info
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setApprovalAction('reject');
                  setShowApprovalModal(true);
                  setShowReviewModal(false);
                }}
              >
                <XCircle size={16} className="mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => {
                  setApprovalAction('approve');
                  setShowApprovalModal(true);
                  setShowReviewModal(false);
                }}
              >
                <CheckCircle size={16} className="mr-2" />
                Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Approval Modal */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title={`${approvalAction === 'approve' ? 'Approve' : 'Reject'} Restaurant`}
        size="md"
      >
        {selectedRestaurant && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900">{selectedRestaurant.restaurantName}</h4>
              <p className="text-sm text-gray-600">Owner: {selectedRestaurant.ownerName}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments
              </label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Enter comments for ${approvalAction}...`}
              />
            </div>

            {approvalAction === 'reject' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select reason</option>
                  <option value="incomplete_documents">Incomplete Documents</option>
                  <option value="invalid_information">Invalid Information</option>
                  <option value="location_restrictions">Location Restrictions</option>
                  <option value="business_license_issues">Business License Issues</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowApprovalModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant={approvalAction === 'approve' ? 'primary' : 'danger'}
                onClick={() => {
                  handleApproval(selectedRestaurant.id, approvalAction, '');
                  setShowApprovalModal(false);
                }}
              >
                {approvalAction === 'approve' ? 'Approve' : 'Reject'} Restaurant
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Approvals;
