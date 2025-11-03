import React, { useState } from 'react';
import UsersList from '../../components/superadmin/Users/UsersList';
import UserForm from '../../components/superadmin/Users/UserForm';

const ManageUsers = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const handleCreate = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleSave = () => {
    setShowForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  return (
    <div>
      <h1>Manage Users</h1>
      <button onClick={handleCreate}>Create New User</button>
      {showForm ? (
        <UserForm
          user={editingUser}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <UsersList onEdit={handleEdit} />
      )}
    </div>
  );
};

export default ManageUsers;
