import React, { useState, useEffect } from 'react';
import {
  Save,
  Upload,
  Eye,
  EyeOff,
  MapPin,
  Phone,
  Mail,
  Clock,
  CreditCard,
  Bell,
  Shield,
  User,
  Building,
  Globe,
  Camera,
  Trash2,
  Edit3,
  Check,
  X,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';

const RestaurantSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    profile: {
      restaurantName: '',
      email: '',
      phone: '',
      address: '',
      description: '',
      cuisine: '',
      logo: '',
      coverImage: ''
    },
    business: {
      openingHours: {
        monday: { open: '09:00', close: '22:00', isOpen: true },
        tuesday: { open: '09:00', close: '22:00', isOpen: true },
        wednesday: { open: '09:00', close: '22:00', isOpen: true },
        thursday: { open: '09:00', close: '22:00', isOpen: true },
        friday: { open: '09:00', close: '22:00', isOpen: true },
        saturday: { open: '09:00', close: '22:00', isOpen: true },
        sunday: { open: '09:00', close: '22:00', isOpen: true }
      },
      deliveryRadius: 5,
      minimumOrder: 0,
      deliveryFee: 0,
      preparationTime: 30
    },
    notifications: {
      newOrders: true,
      orderUpdates: true,
      customerReviews: true,
      promotions: true,
      email: true,
      sms: false
    },
    security: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      twoFactorAuth: false
    },
    payment: {
      acceptCash: true,
      acceptCard: true,
      acceptOnline: true,
      bankAccount: '',
      upiId: ''
    }
  });

  // Fetch restaurant settings from API
  const fetchSettings = async () => {
    try {
      setLoading(true);
      console.log('Fetching restaurant settings...');
      
      // Get current restaurant ID from user data
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const restaurantId = userData._id;
      
      console.log('User data:', userData);
      console.log('Restaurant ID:', restaurantId);
      
      if (!restaurantId) {
        console.error('No restaurant ID found in user data');
        setLoading(false);
        return;
      }
      
      const response = await api.get('/restaurant/settings');
      console.log('Settings API Response:', response.data);
      
      if (response.data.success) {
        const data = response.data.data;
        setSettings(prevSettings => ({
          ...prevSettings,
          profile: {
            restaurantName: data.restaurantName || data.name || '',
            email: data.email || '',
            phone: data.phone || data.phoneNumber || '',
            address: data.address || data.location || '',
            description: data.description || '',
            cuisine: data.cuisine || data.cuisineType || '',
            logo: data.logo || data.logoUrl || '',
            coverImage: data.coverImage || data.coverImageUrl || ''
          },
          business: {
            ...prevSettings.business,
            openingHours: data.openingHours || prevSettings.business.openingHours,
            deliveryRadius: data.deliveryRadius || 5,
            minimumOrder: data.minimumOrder || 0,
            deliveryFee: data.deliveryFee || 0,
            preparationTime: data.preparationTime || 30
          },
          notifications: data.notifications || prevSettings.notifications,
          payment: data.payment || prevSettings.payment
        }));
      } else {
        console.error('Failed to fetch settings:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Save settings
  const saveSettings = async (section) => {
    try {
      setSaving(true);
      console.log(`Saving ${section} settings...`);
      
      const response = await api.put('/restaurant/settings', {
        section,
        data: settings[section]
      });
      
      console.log('Save settings response:', response.data);
      
      if (response.data.success) {
        // Show success message
        console.log(`${section} settings saved successfully`);
      } else {
        console.error('Failed to save settings:', response.data.message);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  // Handle input changes
  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Handle nested input changes
  const handleNestedInputChange = (section, parentField, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [parentField]: {
          ...prev[section][parentField],
          [field]: value
        }
      }
    }));
  };

  // Handle opening hours change
  const handleOpeningHoursChange = (day, field, value) => {
    setSettings(prev => ({
      ...prev,
      business: {
        ...prev.business,
        openingHours: {
          ...prev.business.openingHours,
          [day]: {
            ...prev.business.openingHours[day],
            [field]: value
          }
        }
      }
    }));
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'business', name: 'Business', icon: Building },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'payment', name: 'Payment', icon: CreditCard }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full">
        <div className="p-4 lg:p-6">
          {/* Header */}
          <div className="mb-6 lg:mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Restaurant Settings</h1>
                <p className="text-gray-600">Manage your restaurant profile and preferences</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          activeTab === tab.id
                            ? 'bg-orange-50 text-orange-700 border-r-2 border-orange-500'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.name}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {/* Profile Settings */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900">Restaurant Profile</h2>
                      <button
                        onClick={() => saveSettings('profile')}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Restaurant Name *
                        </label>
                        <input
                          type="text"
                          value={settings.profile.restaurantName}
                          onChange={(e) => handleInputChange('profile', 'restaurantName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter restaurant name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={settings.profile.email}
                          onChange={(e) => handleInputChange('profile', 'email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter email address"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          value={settings.profile.phone}
                          onChange={(e) => handleInputChange('profile', 'phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter phone number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cuisine Type
                        </label>
                        <input
                          type="text"
                          value={settings.profile.cuisine}
                          onChange={(e) => handleInputChange('profile', 'cuisine', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="e.g., Indian, Chinese, Italian"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address *
                        </label>
                        <textarea
                          value={settings.profile.address}
                          onChange={(e) => handleInputChange('profile', 'address', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter complete address"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={settings.profile.description}
                          onChange={(e) => handleInputChange('profile', 'description', e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Describe your restaurant, specialties, etc."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Business Settings */}
                {activeTab === 'business' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900">Business Settings</h2>
                      <button
                        onClick={() => saveSettings('business')}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>

                    {/* Opening Hours */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Opening Hours</h3>
                      <div className="space-y-3">
                        {Object.entries(settings.business.openingHours).map(([day, hours]) => (
                          <div key={day} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <div className="w-20">
                              <span className="text-sm font-medium text-gray-700 capitalize">{day}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={hours.isOpen}
                                onChange={(e) => handleOpeningHoursChange(day, 'isOpen', e.target.checked)}
                                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                              />
                              <span className="text-sm text-gray-600">Open</span>
                            </div>
                            {hours.isOpen && (
                              <>
                                <input
                                  type="time"
                                  value={hours.open}
                                  onChange={(e) => handleOpeningHoursChange(day, 'open', e.target.value)}
                                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <span className="text-gray-500">to</span>
                                <input
                                  type="time"
                                  value={hours.close}
                                  onChange={(e) => handleOpeningHoursChange(day, 'close', e.target.value)}
                                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Settings */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Delivery Radius (km)
                          </label>
                          <input
                            type="number"
                            value={settings.business.deliveryRadius}
                            onChange={(e) => handleInputChange('business', 'deliveryRadius', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            min="0"
                            max="50"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Minimum Order (NPR)
                          </label>
                          <input
                            type="number"
                            value={settings.business.minimumOrder}
                            onChange={(e) => handleInputChange('business', 'minimumOrder', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            min="0"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Delivery Fee (NPR)
                          </label>
                          <input
                            type="number"
                            value={settings.business.deliveryFee}
                            onChange={(e) => handleInputChange('business', 'deliveryFee', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            min="0"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preparation Time (minutes)
                          </label>
                          <input
                            type="number"
                            value={settings.business.preparationTime}
                            onChange={(e) => handleInputChange('business', 'preparationTime', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            min="5"
                            max="120"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Settings */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
                      <button
                        onClick={() => saveSettings('notifications')}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>

                    <div className="space-y-4">
                      {Object.entries(settings.notifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {key === 'newOrders' && 'Get notified when new orders arrive'}
                              {key === 'orderUpdates' && 'Get notified about order status changes'}
                              {key === 'customerReviews' && 'Get notified when customers leave reviews'}
                              {key === 'promotions' && 'Get notified about promotional offers'}
                              {key === 'email' && 'Receive notifications via email'}
                              {key === 'sms' && 'Receive notifications via SMS'}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => handleInputChange('notifications', key, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Security Settings */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
                      <button
                        onClick={() => saveSettings('security')}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={settings.security.currentPassword}
                            onChange={(e) => handleInputChange('security', 'currentPassword', e.target.value)}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={settings.security.newPassword}
                          onChange={(e) => handleInputChange('security', 'newPassword', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter new password"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={settings.security.confirmPassword}
                          onChange={(e) => handleInputChange('security', 'confirmPassword', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Confirm new password"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                          <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.security.twoFactorAuth}
                            onChange={(e) => handleInputChange('security', 'twoFactorAuth', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Settings */}
                {activeTab === 'payment' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900">Payment Settings</h2>
                      <button
                        onClick={() => saveSettings('payment')}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Accepted Payment Methods</h3>
                        <div className="space-y-3">
                          {[
                            { key: 'acceptCash', label: 'Cash on Delivery', description: 'Accept cash payments upon delivery' },
                            { key: 'acceptCard', label: 'Credit/Debit Cards', description: 'Accept card payments' },
                            { key: 'acceptOnline', label: 'Online Payments', description: 'Accept online payment methods' }
                          ].map((method) => (
                            <div key={method.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div>
                                <h4 className="font-medium text-gray-900">{method.label}</h4>
                                <p className="text-sm text-gray-600">{method.description}</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.payment[method.key]}
                                  onChange={(e) => handleInputChange('payment', method.key, e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Banking Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Bank Account Number
                            </label>
                            <input
                              type="text"
                              value={settings.payment.bankAccount}
                              onChange={(e) => handleInputChange('payment', 'bankAccount', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              placeholder="Enter bank account number"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              UPI ID
                            </label>
                            <input
                              type="text"
                              value={settings.payment.upiId}
                              onChange={(e) => handleInputChange('payment', 'upiId', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              placeholder="Enter UPI ID"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantSettings;
