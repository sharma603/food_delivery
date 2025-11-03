import React, { useState } from 'react';
import { Search, Download, Eye, FileText, Upload, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Table from '../ui/Table';
import Modal from '../ui/Modal';

const DocumentManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // real data
  const documents = [
    {
      id: 'DOC-001',
      restaurantId: 'REST-001',
      restaurantName: 'Pizza Palace',
      documentType: 'Business License',
      fileName: 'business_license_2024.pdf',
      fileSize: '2.3 MB',
      uploadDate: '2024-01-15',
      expiryDate: '2024-12-31',
      status: 'approved',
      uploadedBy: 'John Doe',
      reviewedBy: 'Admin User',
      reviewDate: '2024-01-16',
      notes: 'Valid business license for 2024'
    },
    {
      id: 'DOC-002',
      restaurantId: 'REST-002',
      restaurantName: 'Burger King',
      documentType: 'Health Certificate',
      fileName: 'health_cert_2024.pdf',
      fileSize: '1.8 MB',
      uploadDate: '2024-01-20',
      expiryDate: '2024-06-30',
      status: 'pending',
      uploadedBy: 'Jane Smith',
      reviewedBy: null,
      reviewDate: null,
      notes: 'Awaiting health department verification'
    },
    {
      id: 'DOC-003',
      restaurantId: 'REST-003',
      restaurantName: 'Sushi Master',
      documentType: 'Insurance Certificate',
      fileName: 'insurance_cert_2024.pdf',
      fileSize: '3.1 MB',
      uploadDate: '2024-01-25',
      expiryDate: '2024-12-31',
      status: 'rejected',
      uploadedBy: 'Mike Johnson',
      reviewedBy: 'Admin User',
      reviewDate: '2024-01-26',
      notes: 'Insurance coverage insufficient, please update'
    },
    {
      id: 'DOC-004',
      restaurantId: 'REST-004',
      restaurantName: 'Taco Bell',
      documentType: 'Tax Certificate',
      fileName: 'tax_cert_2024.pdf',
      fileSize: '1.5 MB',
      uploadDate: '2024-01-28',
      expiryDate: '2024-12-31',
      status: 'expired',
      uploadedBy: 'Sarah Wilson',
      reviewedBy: 'Admin User',
      reviewDate: '2024-01-29',
      notes: 'Certificate expired, renewal required'
    }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { color: 'green', icon: CheckCircle },
      pending: { color: 'yellow', icon: Clock },
      rejected: { color: 'red', icon: XCircle },
      expired: { color: 'orange', icon: AlertCircle }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge color={config.color}>
        <Icon size={14} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesType = typeFilter === 'all' || doc.documentType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setShowViewModal(true);
  };

  const handleDownload = (document) => {
    // functionality
    console.log(`Downloading ${document.fileName}`);
  };

  const handleApprove = (documentId) => {
    console.log(`Approving document ${documentId}`);
  };

  const handleReject = (documentId) => {
    console.log(`Rejecting document ${documentId}`);
  };

  const columns = [
    { key: 'restaurantName', label: 'Restaurant' },
    { key: 'documentType', label: 'Document Type' },
    { key: 'fileName', label: 'File Name' },
    { key: 'uploadDate', label: 'Upload Date' },
    { key: 'expiryDate', label: 'Expiry Date' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' }
  ];

  const tableData = filteredDocuments.map(doc => ({
    ...doc,
    status: getStatusBadge(doc.status),
    actions: (
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleViewDocument(doc)}
        >
          <Eye size={16} />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleDownload(doc)}
        >
          <Download size={16} />
        </Button>
        {doc.status === 'pending' && (
          <>
            <Button
              size="sm"
              variant="success"
              onClick={() => handleApprove(doc.id)}
            >
              <CheckCircle size={16} />
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleReject(doc.id)}
            >
              <XCircle size={16} />
            </Button>
          </>
        )}
      </div>
    )
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-600 mt-2">Manage restaurant documents and verifications</p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <Upload size={20} />
          Upload Document
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">
                {documents.filter(d => d.status === 'approved').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {documents.filter(d => d.status === 'pending').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expired</p>
              <p className="text-2xl font-bold text-gray-900">
                {documents.filter(d => d.status === 'expired').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="Business License">Business License</option>
            <option value="Health Certificate">Health Certificate</option>
            <option value="Insurance Certificate">Insurance Certificate</option>
            <option value="Tax Certificate">Tax Certificate</option>
          </select>
        </div>
      </Card>

      {/* Documents Table */}
      <Card className="p-6">
        <Table
          columns={columns}
          data={tableData}
          searchable={false}
        />
      </Card>

      {/* View Document Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Document Details"
      >
        {selectedDocument && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Restaurant</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDocument.restaurantName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Document Type</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDocument.documentType}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">File Name</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDocument.fileName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">File Size</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDocument.fileSize}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Upload Date</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDocument.uploadDate}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDocument.expiryDate}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">{getStatusBadge(selectedDocument.status)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Uploaded By</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDocument.uploadedBy}</p>
              </div>
            </div>
            {selectedDocument.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDocument.notes}</p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => handleDownload(selectedDocument)}
              >
                <Download size={16} />
                Download
              </Button>
              <Button onClick={() => setShowViewModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Upload Document Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Document"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Restaurant</label>
            <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              <option>Select Restaurant</option>
              <option>Pizza Palace</option>
              <option>Burger King</option>
              <option>Sushi Master</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Document Type</label>
            <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              <option>Select Document Type</option>
              <option>Business License</option>
              <option>Health Certificate</option>
              <option>Insurance Certificate</option>
              <option>Tax Certificate</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">File</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Upload a file</span>
                    <input type="file" className="sr-only" />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowUploadModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => setShowUploadModal(false)}>
              Upload
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentManagement;
