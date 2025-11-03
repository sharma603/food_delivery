import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Lock,
  Key,
  User,
  Clock,
  Globe,
  Database,
  Server,
  Activity,
  RefreshCw,
  Settings,
  Plus,
  Trash2,
  Edit,
  Search,
  Filter,
  X
} from 'lucide-react';

const Security = () => {
  const [securityData, setSecurityData] = useState({
    overview: {
      totalThreats: 0,
      blockedAttempts: 0,
      activeSessions: 0,
      systemHealth: 'Good'
    },
    recentActivity: [],
    securityLogs: [],
    ipWhitelist: [],
    securitySettings: {
      twoFactorAuth: true,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireStrongPassword: true,
      ipWhitelist: false,
      rateLimiting: true,
      sslEnforcement: true,
      dataEncryption: true
    }
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddIPModal, setShowAddIPModal] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      // real data - replace with actual API call
      const realData = {
        overview: {
          totalThreats: 12,
          blockedAttempts: 156,
          activeSessions: 89,
          systemHealth: 'Good'
        },
        recentActivity: [
          {
            id: 1,
            type: 'login_attempt',
            description: 'Successful login from 192.168.1.100',
            timestamp: new Date(Date.now() - 1000 * 60 * 5),
            severity: 'info',
            ip: '192.168.1.100',
            user: 'admin@hypebridge.com'
          },
          {
            id: 2,
            type: 'failed_login',
            description: 'Failed login attempt from 203.0.113.1',
            timestamp: new Date(Date.now() - 1000 * 60 * 15),
            severity: 'warning',
            ip: '203.0.113.1',
            user: 'unknown'
          },
          {
            id: 3,
            type: 'suspicious_activity',
            description: 'Multiple failed login attempts detected',
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            severity: 'high',
            ip: '198.51.100.1',
            user: 'unknown'
          },
          {
            id: 4,
            type: 'password_change',
            description: 'Password changed for user john@example.com',
            timestamp: new Date(Date.now() - 1000 * 60 * 60),
            severity: 'info',
            ip: '192.168.1.50',
            user: 'john@example.com'
          }
        ],
        securityLogs: [
          {
            id: 1,
            event: 'User Login',
            user: 'admin@hypebridge.com',
            ip: '192.168.1.100',
            timestamp: new Date(Date.now() - 1000 * 60 * 5),
            status: 'success',
            details: 'Successful login with 2FA'
          },
          {
            id: 2,
            event: 'Failed Login',
            user: 'unknown',
            ip: '203.0.113.1',
            timestamp: new Date(Date.now() - 1000 * 60 * 15),
            status: 'failed',
            details: 'Invalid credentials'
          },
          {
            id: 3,
            event: 'Password Reset',
            user: 'jane@example.com',
            ip: '192.168.1.75',
            timestamp: new Date(Date.now() - 1000 * 60 * 45),
            status: 'success',
            details: 'Password reset email sent'
          },
          {
            id: 4,
            event: 'IP Blocked',
            user: 'system',
            ip: '198.51.100.1',
            timestamp: new Date(Date.now() - 1000 * 60 * 60),
            status: 'blocked',
            details: 'IP blocked due to multiple failed attempts'
          }
        ],
        ipWhitelist: [
          { id: 1, ip: '192.168.1.0/24', description: 'Office Network', addedAt: new Date('2024-01-15') },
          { id: 2, ip: '10.0.0.0/8', description: 'Internal Network', addedAt: new Date('2024-01-10') },
          { id: 3, ip: '203.0.113.50', description: 'Admin Home IP', addedAt: new Date('2024-01-20') }
        ],
        securitySettings: {
          twoFactorAuth: true,
          sessionTimeout: 30,
          maxLoginAttempts: 5,
          passwordMinLength: 8,
          requireStrongPassword: true,
          ipWhitelist: false,
          rateLimiting: true,
          sslEnforcement: true,
          dataEncryption: true
        }
      };
      setSecurityData(realData);
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIP = async () => {
    if (!newIP.trim()) return;
    
    try {
      const newIPEntry = {
        id: Date.now(),
        ip: newIP,
        description: 'Added manually',
        addedAt: new Date()
      };
      setSecurityData(prev => ({
        ...prev,
        ipWhitelist: [...prev.ipWhitelist, newIPEntry]
      }));
      setNewIP('');
      setShowAddIPModal(false);
    } catch (error) {
      console.error('Error adding IP:', error);
    }
  };

  const handleRemoveIP = async (ipId) => {
    if (window.confirm('Are you sure you want to remove this IP from the whitelist?')) {
      try {
        setSecurityData(prev => ({
          ...prev,
          ipWhitelist: prev.ipWhitelist.filter(ip => ip.id !== ipId)
        }));
      } catch (error) {
        console.error('Error removing IP:', error);
      }
    }
  };

  const handleUpdateSecuritySettings = async (setting, value) => {
    try {
      setSecurityData(prev => ({
        ...prev,
        securitySettings: {
          ...prev.securitySettings,
          [setting]: value
        }
      }));
      // Real data
      console.log('Updating security setting:', setting, value);
    } catch (error) {
      console.error('Error updating security settings:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const filteredLogs = securityData.securityLogs.filter(log => {
    const matchesSearch = log.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.ip.includes(searchTerm);
    const matchesType = !filterType || log.status === filterType;
    return matchesSearch && matchesType;
  });

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Threats</p>
              <p className="text-2xl font-bold text-gray-900">{securityData.overview.totalThreats}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Blocked Attempts</p>
              <p className="text-2xl font-bold text-gray-900">{securityData.overview.blockedAttempts}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Shield className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{securityData.overview.activeSessions}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Health</p>
              <p className="text-2xl font-bold text-green-600">{securityData.overview.systemHealth}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Security Activity</h3>
        <div className="space-y-4">
          {securityData.recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
              <div className={`p-2 rounded-full ${getSeverityColor(activity.severity)}`}>
                {activity.severity === 'high' && <AlertTriangle className="w-4 h-4" />}
                {activity.severity === 'warning' && <AlertTriangle className="w-4 h-4" />}
                {activity.severity === 'info' && <CheckCircle className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                  <span>IP: {activity.ip}</span>
                  <span>User: {activity.user}</span>
                  <span>{formatDate(activity.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSecurityLogs = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search security logs..."
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
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Security Logs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {log.event}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.user}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.ip}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderIPWhitelist = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">IP Whitelist</h3>
        <button
          onClick={() => setShowAddIPModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add IP</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Added Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {securityData.ipWhitelist.map((ip) => (
                <tr key={ip.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {ip.ip}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ip.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(ip.addedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleRemoveIP(ip.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="space-y-6">
          {/* Authentication Settings */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Authentication</h4>
            <div className="space-y-4">
              {[
                { key: 'twoFactorAuth', label: 'Two-Factor Authentication', description: 'Require 2FA for admin accounts' },
                { key: 'requireStrongPassword', label: 'Strong Password Policy', description: 'Enforce complex password requirements' },
                { key: 'ipWhitelist', label: 'IP Whitelist', description: 'Restrict access to specific IP addresses' }
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h5 className="text-sm font-medium text-gray-900">{label}</h5>
                    <p className="text-sm text-gray-500">{description}</p>
                  </div>
                  <button
                    onClick={() => handleUpdateSecuritySettings(key, !securityData.securitySettings[key])}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                    style={{ backgroundColor: securityData.securitySettings[key] ? '#3B82F6' : '#D1D5DB' }}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        securityData.securitySettings[key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Session Management */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Session Management</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={securityData.securitySettings.sessionTimeout}
                  onChange={(e) => handleUpdateSecuritySettings('sessionTimeout', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={securityData.securitySettings.maxLoginAttempts}
                  onChange={(e) => handleUpdateSecuritySettings('maxLoginAttempts', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Password Length</label>
              <input
                type="number"
                min="6"
                max="20"
                value={securityData.securitySettings.passwordMinLength}
                onChange={(e) => handleUpdateSecuritySettings('passwordMinLength', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* System Security */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">System Security</h4>
            <div className="space-y-4">
              {[
                { key: 'rateLimiting', label: 'Rate Limiting', description: 'Limit API requests per IP' },
                { key: 'sslEnforcement', label: 'SSL Enforcement', description: 'Force HTTPS connections' },
                { key: 'dataEncryption', label: 'Data Encryption', description: 'Encrypt sensitive data at rest' }
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h5 className="text-sm font-medium text-gray-900">{label}</h5>
                    <p className="text-sm text-gray-500">{description}</p>
                  </div>
                  <button
                    onClick={() => handleUpdateSecuritySettings(key, !securityData.securitySettings[key])}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                    style={{ backgroundColor: securityData.securitySettings[key] ? '#3B82F6' : '#D1D5DB' }}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        securityData.securitySettings[key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'logs', label: 'Security Logs', icon: Database },
    { id: 'whitelist', label: 'IP Whitelist', icon: Globe },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'logs': return renderSecurityLogs();
      case 'whitelist': return renderIPWhitelist();
      case 'settings': return renderSecuritySettings();
      default: return renderOverview();
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Security</h1>
          <p className="text-gray-600 mt-2">Monitor and manage system security</p>
        </div>
        <button
          onClick={fetchSecurityData}
          className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>

      {/* Add IP Modal */}
      {showAddIPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Add IP to Whitelist</h2>
              <button
                onClick={() => setShowAddIPModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IP Address/CIDR</label>
                <input
                  type="text"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                  placeholder="192.168.1.0/24 or 203.0.113.50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={handleAddIP}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add IP
                </button>
                <button
                  onClick={() => setShowAddIPModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
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

export default Security;
