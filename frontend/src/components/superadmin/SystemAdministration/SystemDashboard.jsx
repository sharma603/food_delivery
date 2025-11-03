import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Users,
  Settings,
  Shield,
  Bell,
  Utensils,
  FileText,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

const SystemDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeRestaurants: 0,
    totalOrders: 0,
    systemHealth: 'Good'
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);

  useEffect(() => {
    // Fetch system statistics
    fetchSystemStats();
    fetchRecentActivities();
    fetchSystemAlerts();
  }, []);

  const fetchSystemStats = async () => {
    try {
      const response = await fetch('/api/v1/superadmin/system/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch system stats');
      }
      
      const data = await response.json();
      if (data.success) {
        setStats({
          totalUsers: data.data.stats.totalUsers,
          activeRestaurants: data.data.stats.activeRestaurants,
          totalOrders: data.data.stats.totalOrders,
          systemHealth: data.data.systemHealth.status
        });
      }
    } catch (error) {
      console.error('Error fetching system stats:', error);
      // Fallback to default values
      setStats({
        totalUsers: 0,
        activeRestaurants: 0,
        totalOrders: 0,
        systemHealth: 'Unknown'
      });
    }
  };

  const fetchRecentActivities = async () => {
    try {
      // real data - replace with actual API call
      setRecentActivities([
        {
          id: 1,
          type: 'user_registration',
          message: 'New restaurant "Pizza Palace" registered',
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          status: 'success'
        },
        {
          id: 2,
          type: 'system_update',
          message: 'Menu management system updated',
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          status: 'info'
        },
        {
          id: 3,
          type: 'order_processed',
          message: 'Order #12345 processed successfully',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          status: 'success'
        }
      ]);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  const fetchSystemAlerts = async () => {
    try {
      // real data - replace with actual API call
      setSystemAlerts([
        {
          id: 1,
          type: 'warning',
          message: 'High server load detected',
          timestamp: new Date(Date.now() - 1000 * 60 * 10),
          priority: 'high'
        },
        {
          id: 2,
          type: 'info',
          message: 'Database backup completed',
          timestamp: new Date(Date.now() - 1000 * 60 * 60),
          priority: 'low'
        }
      ]);
    } catch (error) {
      console.error('Error fetching system alerts:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 60) {
      return `${minutes} minutes ago`;
    } else if (hours < 24) {
      return `${hours} hours ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Administration</h1>
          <p className="text-gray-600 mt-2">Monitor and manage system-wide operations</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">System Healthy</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>+12% from last month</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Restaurants</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeRestaurants}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Utensils className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>+8% from last month</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>+15% from last month</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Health</p>
              <p className="text-2xl font-bold text-green-600">{stats.systemHealth}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-1" />
            <span>Last check: 2 minutes ago</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/system/menu"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <Utensils className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Menu Management</p>
              <p className="text-sm text-gray-600">Manage system menus</p>
            </div>
          </Link>

          <Link
            to="/admin/system/pages"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Page Management</p>
              <p className="text-sm text-gray-600">Manage system pages</p>
            </div>
          </Link>

          <Link
            to="/admin/system/users"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-purple-100 rounded-lg mr-3">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">User Management</p>
              <p className="text-sm text-gray-600">Manage system users</p>
            </div>
          </Link>

          <Link
            to="/admin/system/settings"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-gray-100 rounded-lg mr-3">
              <Settings className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Platform Settings</p>
              <p className="text-sm text-gray-600">Configure system settings</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activities</h2>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${getStatusColor(activity.status)}`}>
                  {activity.status === 'success' && <CheckCircle className="w-4 h-4" />}
                  {activity.status === 'warning' && <AlertTriangle className="w-4 h-4" />}
                  {activity.status === 'info' && <Activity className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Alerts</h2>
          <div className="space-y-4">
            {systemAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${getPriorityColor(alert.priority)}`}>
                  {alert.priority === 'high' && <AlertTriangle className="w-4 h-4" />}
                  {alert.priority === 'medium' && <Bell className="w-4 h-4" />}
                  {alert.priority === 'low' && <CheckCircle className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                  <p className="text-xs text-gray-500">{formatTimeAgo(alert.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemDashboard;
