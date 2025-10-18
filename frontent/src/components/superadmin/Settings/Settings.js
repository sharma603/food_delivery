import React, { useState } from 'react';

import Form from '../../common/Form';


const Settings = ({ user, onLogout }) => {
  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '' },
    { path: '/admin/restaurants', label: 'Restaurants', icon: '' },
    { path: '/admin/orders', label: 'Orders', icon: '' },
    { path: '/admin/users', label: 'Users', icon: '' },
    { path: '/admin/analytics', label: 'Analytics', icon: '' },
    { path: '/admin/settings', label: 'Settings', icon: '' },
  ];

  const [settings, setSettings] = useState({
    platformName: 'Food Delivery System',
    supportEmail: 'support@fooddelivery.com',
    commissionRate: '10',
    minimumOrder: '5',
    deliveryRadius: '25',
    maintenanceMode: false,
    emailNotifications: true,
    smsNotifications: false,
  });

  const handleUpdateSettings = (formData) => {
    setSettings({ ...settings, ...formData });
    alert('Settings updated successfully!');
  };

  const settingsFields = [
    { name: 'platformName', label: 'Platform Name', type: 'text', required: true },
    { name: 'supportEmail', label: 'Support Email', type: 'email', required: true },
    { name: 'commissionRate', label: 'Commission Rate (%)', type: 'number', required: true, min: 0, max: 50 },
    { name: 'minimumOrder', label: 'Minimum Order Amount ($)', type: 'number', required: true, min: 0 },
    { name: 'deliveryRadius', label: 'Delivery Radius (km)', type: 'number', required: true, min: 1 },
    { name: 'maintenanceMode', label: 'Maintenance Mode', type: 'checkbox' },
    { name: 'emailNotifications', label: 'Email Notifications', type: 'checkbox' },
    { name: 'smsNotifications', label: 'SMS Notifications', type: 'checkbox' },
  ];

  return (
    <div className="settings">
      
      <main className="settings-content">
        <div className="settings-header">
          <h1>Platform Settings</h1>
          <p>Configure your food delivery platform settings</p>
        </div>

        <div className="settings-form-container">
          <Form
            fields={settingsFields}
            onSubmit={handleUpdateSettings}
            submitLabel="Update Settings"
            initialValues={settings}
          />
        </div>

        <div className="settings-sections">
          <div className="settings-section">
            <h3>Payment Settings</h3>
            <p>Configure payment gateways and commission rates</p>
            <button className="settings-btn">Configure Payments</button>
          </div>

          <div className="settings-section">
            <h3>Notification Settings</h3>
            <p>Manage email and SMS notification templates</p>
            <button className="settings-btn">Manage Notifications</button>
          </div>

          <div className="settings-section">
            <h3>Security Settings</h3>
            <p>Configure security policies and access controls</p>
            <button className="settings-btn">Security Settings</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
