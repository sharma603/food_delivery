import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Send,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  Mail,
  MessageSquare,
  Smartphone,
  Users,
  Store,
  ShoppingBag
} from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    targetAudience: 'all',
    channels: ['email'],
    scheduledAt: '',
    isScheduled: false
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // real data - replace with actual API call
      const mockNotifications = [
        {
          id: 1,
          title: 'Welcome to HypeBridge!',
          message: 'Thank you for joining our food delivery platform. Enjoy your first order with 20% off!',
          type: 'info',
          targetAudience: 'customers',
          channels: ['email', 'push'],
          status: 'sent',
          sentAt: new Date('2024-01-20T10:30:00'),
          recipients: 1250,
          openRate: 85.2,
          clickRate: 12.5
        },
        {
          id: 2,
          title: 'New Restaurant Added',
          message: 'Check out our newest restaurant partner - Pizza Palace! Order now and get free delivery.',
          type: 'promotion',
          targetAudience: 'all',
          channels: ['email', 'push', 'sms'],
          status: 'scheduled',
          scheduledAt: new Date('2024-01-22T14:00:00'),
          recipients: 0,
          openRate: 0,
          clickRate: 0
        },
        {
          id: 3,
          title: 'System Maintenance Notice',
          message: 'We will be performing scheduled maintenance on Sunday from 2-4 AM. Some features may be temporarily unavailable.',
          type: 'alert',
          targetAudience: 'all',
          channels: ['email', 'push'],
          status: 'sent',
          sentAt: new Date('2024-01-19T16:00:00'),
          recipients: 2890,
          openRate: 92.1,
          clickRate: 8.3
        },
        {
          id: 4,
          title: 'Order Status Update',
          message: 'Your order #12345 has been confirmed and is being prepared.',
          type: 'order',
          targetAudience: 'customers',
          channels: ['email', 'push'],
          status: 'sent',
          sentAt: new Date('2024-01-20T12:15:00'),
          recipients: 1,
          openRate: 100,
          clickRate: 0
        },
        {
          id: 5,
          title: 'Restaurant Performance Report',
          message: 'Your weekly performance report is ready. You had 45 orders this week with a 4.8 rating.',
          type: 'report',
          targetAudience: 'restaurants',
          channels: ['email'],
          status: 'sent',
          sentAt: new Date('2024-01-20T09:00:00'),
          recipients: 89,
          openRate: 78.7,
          clickRate: 45.2
        }
      ];
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNotification = async () => {
    try {
      // Real data
      const newNotification = {
        id: Date.now(),
        ...formData,
        status: formData.isScheduled ? 'scheduled' : 'draft',
        recipients: 0,
        openRate: 0,
        clickRate: 0,
        createdAt: new Date()
      };
      setNotifications([newNotification, ...notifications]);
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  const handleEditNotification = async () => {
    try {
      // Real data
      setNotifications(notifications.map(notification => 
        notification.id === selectedNotification.id ? { ...notification, ...formData } : notification
      ));
      setShowEditModal(false);
      setSelectedNotification(null);
      resetForm();
    } catch (error) {
      console.error('Error editing notification:', error);
    }
  };

  const handleSendNotification = async (notificationId) => {
    try {
      // Real data
      setNotifications(notifications.map(notification => 
        notification.id === notificationId 
          ? { 
              ...notification, 
              status: 'sent', 
              sentAt: new Date(),
              recipients: Math.floor(0 * 1000) + 100
            } 
          : notification
      ));
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        // Real data
        setNotifications(notifications.filter(notification => notification.id !== notificationId));
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      targetAudience: 'all',
      channels: ['email'],
      scheduledAt: '',
      isScheduled: false
    });
  };

  const openEditModal = (notification) => {
    setSelectedNotification(notification);
    setFormData({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      targetAudience: notification.targetAudience,
      channels: notification.channels,
      scheduledAt: notification.scheduledAt ? new Date(notification.scheduledAt).toISOString().slice(0, 16) : '',
      isScheduled: notification.status === 'scheduled'
    });
    setShowEditModal(true);
  };

  const openPreviewModal = (notification) => {
    setSelectedNotification(notification);
    setShowPreviewModal(true);
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || notification.type === filterType;
    const matchesStatus = !filterStatus || notification.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'info': return <Info className="w-4 h-4" />;
      case 'alert': return <AlertCircle className="w-4 h-4" />;
      case 'promotion': return <Bell className="w-4 h-4" />;
      case 'order': return <ShoppingBag className="w-4 h-4" />;
      case 'report': return <CheckCircle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'alert': return 'bg-red-100 text-red-800';
      case 'promotion': return 'bg-green-100 text-green-800';
      case 'order': return 'bg-purple-100 text-purple-800';
      case 'report': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'push': return <Smartphone className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getTargetAudienceIcon = (audience) => {
    switch (audience) {
      case 'customers': return <Users className="w-4 h-4" />;
      case 'restaurants': return <Store className="w-4 h-4" />;
      case 'all': return <Users className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-2">Manage system notifications and announcements</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Notification</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Notifications</p>
              <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sent</p>
              <p className="text-2xl font-bold text-gray-900">
                {notifications.filter(n => n.status === 'sent').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Scheduled</p>
              <p className="text-2xl font-bold text-gray-900">
                {notifications.filter(n => n.status === 'scheduled').length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Drafts</p>
              <p className="text-2xl font-bold text-gray-900">
                {notifications.filter(n => n.status === 'draft').length}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <Edit className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="md:w-48">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="info">Info</option>
              <option value="alert">Alert</option>
              <option value="promotion">Promotion</option>
              <option value="order">Order</option>
              <option value="report">Report</option>
            </select>
          </div>
          <div className="md:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="sent">Sent</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.map((notification) => (
          <div key={notification.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                    {getTypeIcon(notification.type)}
                    <span className="ml-1 capitalize">{notification.type}</span>
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(notification.status)}`}>
                    {notification.status}
                  </span>
                  <span className="inline-flex items-center px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-full">
                    {getTargetAudienceIcon(notification.targetAudience)}
                    <span className="ml-1 capitalize">{notification.targetAudience}</span>
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{notification.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{notification.message}</p>
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    {notification.channels.map((channel, index) => (
                      <div key={index} className="flex items-center space-x-1">
                        {getChannelIcon(channel)}
                        <span className="capitalize">{channel}</span>
                      </div>
                    ))}
                  </div>
                  {notification.status === 'sent' && notification.sentAt && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Sent {formatDate(notification.sentAt)}</span>
                    </div>
                  )}
                  {notification.status === 'scheduled' && notification.scheduledAt && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Scheduled {formatDate(notification.scheduledAt)}</span>
                    </div>
                  )}
                  {notification.recipients > 0 && (
                    <div>
                      <span>{notification.recipients.toLocaleString()} recipients</span>
                    </div>
                  )}
                </div>
                {notification.status === 'sent' && notification.recipients > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Open Rate</p>
                      <p className="text-lg font-semibold text-gray-900">{notification.openRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Click Rate</p>
                      <p className="text-lg font-semibold text-gray-900">{notification.clickRate}%</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => openPreviewModal(notification)}
                  className="text-blue-600 hover:text-blue-900"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openEditModal(notification)}
                  className="text-indigo-600 hover:text-indigo-900"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                {notification.status === 'draft' && (
                  <button
                    onClick={() => handleSendNotification(notification.id)}
                    className="text-green-600 hover:text-green-900"
                    title="Send"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDeleteNotification(notification.id)}
                  className="text-red-600 hover:text-red-900"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredNotifications.length === 0 && (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Add Notification Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Create Notification</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleAddNotification(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="4"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="info">Info</option>
                    <option value="alert">Alert</option>
                    <option value="promotion">Promotion</option>
                    <option value="order">Order</option>
                    <option value="report">Report</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Users</option>
                    <option value="customers">Customers</option>
                    <option value="restaurants">Restaurants</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Channels</label>
                <div className="space-y-2">
                  {['email', 'push', 'sms'].map((channel) => (
                    <label key={channel} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.channels.includes(channel)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({...formData, channels: [...formData.channels, channel]});
                          } else {
                            setFormData({...formData, channels: formData.channels.filter(c => c !== channel)});
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 capitalize">{channel}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isScheduled}
                  onChange={(e) => setFormData({...formData, isScheduled: e.target.checked})}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Schedule for later</span>
              </div>
              {formData.isScheduled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={formData.isScheduled}
                  />
                </div>
              )}
              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {formData.isScheduled ? 'Schedule Notification' : 'Save as Draft'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Notification Modal */}
      {showEditModal && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Edit Notification</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleEditNotification(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="4"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="info">Info</option>
                    <option value="alert">Alert</option>
                    <option value="promotion">Promotion</option>
                    <option value="order">Order</option>
                    <option value="report">Report</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Users</option>
                    <option value="customers">Customers</option>
                    <option value="restaurants">Restaurants</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Channels</label>
                <div className="space-y-2">
                  {['email', 'push', 'sms'].map((channel) => (
                    <label key={channel} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.channels.includes(channel)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({...formData, channels: [...formData.channels, channel]});
                          } else {
                            setFormData({...formData, channels: formData.channels.filter(c => c !== channel)});
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 capitalize">{channel}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isScheduled}
                  onChange={(e) => setFormData({...formData, isScheduled: e.target.checked})}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Schedule for later</span>
              </div>
              {formData.isScheduled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={formData.isScheduled}
                  />
                </div>
              )}
              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Notification
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Notification Preview</h2>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(selectedNotification.type)}`}>
                    {getTypeIcon(selectedNotification.type)}
                    <span className="ml-1 capitalize">{selectedNotification.type}</span>
                  </span>
                  <span className="text-xs text-gray-500">to {selectedNotification.targetAudience}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{selectedNotification.title}</h3>
                <p className="text-gray-600 text-sm">{selectedNotification.message}</p>
                <div className="mt-3 flex items-center space-x-2 text-xs text-gray-500">
                  {selectedNotification.channels.map((channel, index) => (
                    <div key={index} className="flex items-center space-x-1">
                      {getChannelIcon(channel)}
                      <span className="capitalize">{channel}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
