import React, { useState, useEffect } from 'react';

import Table from '../../common/Table';
import Modal from '../../common/Modal';
import Form from '../../common/Form';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { apiService as api } from '../../../services/api';


const UserManagement = ({ user, onLogout }) => {
  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '' },
    { path: '/admin/restaurants', label: 'Restaurants', icon: '' },
    { path: '/admin/orders', label: 'Orders', icon: '' },
    { path: '/admin/users', label: 'Users', icon: '' },
    { path: '/admin/analytics', label: 'Analytics', icon: '' },
    { path: '/admin/settings', label: 'Settings', icon: '' },
  ];

  const [activeTab, setActiveTab] = useState('customers');
  const [customers, setCustomers] = useState([]);
  const [restaurantOwners, setRestaurantOwners] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      const users = response.users || [];

      // Separate users by role
      setCustomers(users.filter(u => u.role === 'customer'));
      setRestaurantOwners(users.filter(u => u.role === 'restaurant'));
      setAdmins(users.filter(u => u.role === 'admin'));
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'customers': return customers;
      case 'restaurantOwners': return restaurantOwners;
      case 'admins': return admins;
      default: return [];
    }
  };

  const getColumns = () => {
    const baseColumns = [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'status', label: 'Status' },
      { key: 'verified', label: 'Verified' },
    ];

    if (activeTab === 'restaurantOwners') {
      baseColumns.splice(3, 0, { key: 'restaurant', label: 'Restaurant' });
    }

    if (activeTab === 'admins') {
      baseColumns.splice(4, 0, { key: 'permissions', label: 'Permissions' });
    }

    return baseColumns;
  };

  const handleCreateUser = async (formData) => {
    try {
      const userData = {
        ...formData,
        role: activeTab === 'customers' ? 'customer' : activeTab === 'restaurantOwners' ? 'restaurant' : 'admin',
        status: 'Active',
        verified: false,
      };

      if (activeTab === 'admins') {
        userData.permissions = ['read'];
      }

      await api.post('/users', userData);

      // Refresh users list
      await fetchUsers();
      setShowCreateModal(false);
    } catch (err) {
      setError('Failed to create user');
      console.error('Error creating user:', err);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
  };

  const handleUpdateUser = async (formData) => {
    try {
      const updatedUser = { ...editingUser, ...formData };
      await api.put(`/users/${editingUser.id}`, updatedUser);

      // Refresh users list
      await fetchUsers();
      setEditingUser(null);
    } catch (err) {
      setError('Failed to update user');
      console.error('Error updating user:', err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${userId}`);
        // Refresh users list
        await fetchUsers();
      } catch (err) {
        setError('Failed to delete user');
        console.error('Error deleting user:', err);
      }
    }
  };

  const handleToggleVerification = async (userId) => {
    try {
      await api.put(`/users/${userId}/verify`, {});
      // Refresh users list
      await fetchUsers();
    } catch (err) {
      setError('Failed to update verification status');
      console.error('Error updating verification:', err);
    }
  };

  const getFormFields = () => {
    const baseFields = [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], required: true },
    ];

    if (activeTab === 'restaurantOwners') {
      baseFields.push({ name: 'restaurant', label: 'Restaurant', type: 'text', required: true });
    }

    if (activeTab === 'admins') {
      baseFields.push({ name: 'permissions', label: 'Permissions', type: 'multiselect', options: ['read', 'write', 'delete'], required: true });
    }

    return baseFields;
  };

  if (loading) {
    return (
      <div className="user-management">
        
        <main className="management-content">
          <LoadingSpinner message="Loading users..." />
        </main>
      </div>
    );
  }

  return (
    <div className="user-management">
      
      <main className="management-content">
        <div className="management-header">
          <h1>User Management</h1>
          <button className="add-button" onClick={() => setShowCreateModal(true)}>
            Add {activeTab === 'customers' ? 'Customer' : activeTab === 'restaurantOwners' ? 'Restaurant Owner' : 'Admin'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            Customers ({customers.length})
          </button>
          <button
            className={`tab ${activeTab === 'restaurantOwners' ? 'active' : ''}`}
            onClick={() => setActiveTab('restaurantOwners')}
          >
            Restaurant Owners ({restaurantOwners.length})
          </button>
          <button
            className={`tab ${activeTab === 'admins' ? 'active' : ''}`}
            onClick={() => setActiveTab('admins')}
          >
            Admins ({admins.length})
          </button>
        </div>

        <div className="table-container">
          <Table
            columns={getColumns()}
            data={getCurrentData()}
          />
        </div>

        <div className="actions">
          {getCurrentData().map(user => (
            <div key={user.id} className="user-actions">
              <button onClick={() => handleEditUser(user)} className="edit-btn">
                Edit {user.name}
              </button>
              <button onClick={() => handleToggleVerification(user.id)} className={`verify-btn ${user.verified ? 'verified' : ''}`}>
                {user.verified ? 'Unverify' : 'Verify'} {user.name}
              </button>
              <button onClick={() => handleDeleteUser(user.id)} className="delete-btn">
                Delete {user.name}
              </button>
            </div>
          ))}
        </div>
      </main>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={`Add ${activeTab === 'customers' ? 'Customer' : activeTab === 'restaurantOwners' ? 'Restaurant Owner' : 'Admin'}`}
      >
        <Form
          fields={getFormFields()}
          onSubmit={handleCreateUser}
          submitLabel="Create User"
        />
      </Modal>

      {editingUser && (
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title={`Edit ${editingUser.name}`}
        >
          <Form
            fields={getFormFields()}
            onSubmit={handleUpdateUser}
            submitLabel="Update User"
            initialValues={editingUser}
          />
        </Modal>
      )}
    </div>
  );
};

export default UserManagement;
