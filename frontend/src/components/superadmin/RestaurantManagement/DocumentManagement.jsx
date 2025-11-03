import React, { useState } from 'react';
import { Search, Filter, Download, Eye, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import Card from '../../../components/common/ui/Card';
import Button from '../../../components/common/ui/Button';
import Badge from '../../../components/common/ui/Badge';
import Table from '../../../components/common/Table';
import Modal from '../../../components/common/Modal';

const DocumentManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // real data
  const documents = [
    {
      id: 1,
      restaurantName: 'Pizza Palace',
      documentType: 'Business License',
      uploadDate: '2024-01-15',
      expiryDate: '2025-01-15',
      status: 'approved',
      fileSize: '2.3 MB',
      uploadedBy: 'John Doe'
    },
    {
      id: 2,
      restaurantName: 'Burger King',
      documentType: 'Food Permit',
      uploadDate: '2024-01-14',
      expiryDate: '2024-12-31',
      status: 'pending',
      fileSize: '1.8 MB',
      uploadedBy: 'Jane Smith'
    },
    {
      id: 3,
      restaurantName: 'McDonald\'s',
      documentType: 'Tax ID',
      uploadDate: '2024-01-13',
      expiryDate: null,
      status: 'rejected',
      fileSize: '0.9 MB',
      uploadedBy: 'Mike Wilson'
    },
    {
      id: 4,
      restaurantName: 'Subway',
      documentType: 'Business License',
      uploadDate: '2024-01-12',
      expiryDate: '2025-01-12',
      status: 'approved',
      fileSize: '2.1 MB',
      uploadedBy: 'Sarah Johnson'
    },
    {
      id: 5,
      restaurantName: 'KFC',
      documentType: 'Food Permit',
      uploadDate: '2024-01-11',
      expiryDate: '2024-11-30',
      status: 'pending',
      fileSize: '1.5 MB',
      uploadedBy: 'David Brown'
    },
    {
      id: 6,
      restaurantName: 'Domino\'s',
      documentType: 'Insurance Certificate',
      uploadDate: '2024-01-10',
      expiryDate: '2024-10-31',
      status: 'approved',
      fileSize: '3.2 MB',
      uploadedBy: 'Lisa Davis'
    }
  ];

  const documentTypes = ['Business License', 'Food Permit', 'Tax ID', 'Insurance Certificate', 'Health Certificate'];
  const statusOptions = ['all', 'approved', 'pending', 'rejected', 'expired'];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>;
      case 'expired':
        return <Badge variant="danger">Expired</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.documentType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesType = typeFilter === 'all' || doc.documentType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const columns = [
    {
      key: 'restaurantName',
      header: 'Restaurant',
      sortable: true
    },
    {
      key: 'documentType',
      header: 'Document Type',
      sortable: true
    },
    {
      key: 'uploadDate',
      header: 'Upload Date',
      sortable: true
    },
    {
      key: 'expiryDate',
      header: 'Expiry Date',
      sortable: true,
      render: (value) => value || 'N/A'
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'fileSize',
      header: 'File Size',
      sortable: true
    },
    {
      key: 'uploadedBy',
      header: 'Uploaded By',
      sortable: true
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
              setSelectedDocument(row);
              setShowViewModal(true);
            }}
          >
            <Eye size={16} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownload(row)}
          >
            <Download size={16} />
          </Button>
        </div>
      )
    }
  ];

  const handleDownload = (document) => {
    console.log('Downloading document:', document);
    // Implement download functionality
  };

  const handleApprove = (documentId) => {
    console.log('Approving document:', documentId);
    // Implement approval functionality
  };

  const handleReject = (documentId) => {
    console.log('Rejecting document:', documentId);
    // Implement rejection functionality
  };

  const handleRequestMore = (documentId) => {
    console.log('Requesting more documents for:', documentId);
    // Implement request more functionality
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
        <p className="text-gray-600">View and manage restaurant documents</p>
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
                placeholder="Search restaurants or documents..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              {documentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
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
                  {status.charAt(0).toUpperCase() + status.slice(1)}
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

      {/* Documents Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Documents ({filteredDocuments.length})
          </h3>
          <div className="flex space-x-2">
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
          data={filteredDocuments}
          sortable={true}
        />
      </Card>

      {/* View Document Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Document Details"
        size="lg"
      >
        {selectedDocument && (
          <div className="space-y-6">
            {/* Document Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Restaurant</label>
                <p className="text-sm text-gray-900">{selectedDocument.restaurantName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Document Type</label>
                <p className="text-sm text-gray-900">{selectedDocument.documentType}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Upload Date</label>
                <p className="text-sm text-gray-900">{selectedDocument.uploadDate}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                <p className="text-sm text-gray-900">{selectedDocument.expiryDate || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">{getStatusBadge(selectedDocument.status)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">File Size</label>
                <p className="text-sm text-gray-900">{selectedDocument.fileSize}</p>
              </div>
            </div>

            {/* Document Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Document Preview</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Document preview would be displayed here</p>
                <p className="text-sm text-gray-500 mt-2">
                  {selectedDocument.documentType} - {selectedDocument.fileSize}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => handleDownload(selectedDocument)}
              >
                <Download size={16} className="mr-2" />
                Download
              </Button>
              {selectedDocument.status === 'pending' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleRequestMore(selectedDocument.id)}
                  >
                    Request More
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleReject(selectedDocument.id)}
                  >
                    <XCircle size={16} className="mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedDocument.id)}
                  >
                    <CheckCircle size={16} className="mr-2" />
                    Approve
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DocumentManagement;
