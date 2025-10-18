import React, { useState } from 'react';
import RestaurantList from '../../components/superadmin/Restaurant/RestaurantList';
import RestaurantForm from '../../components/superadmin/Restaurant/RestaurantForm';

const ManageRestaurants = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);

  const handleCreate = () => {
    setEditingRestaurant(null);
    setShowForm(true);
  };

  const handleEdit = (restaurant) => {
    setEditingRestaurant(restaurant);
    setShowForm(true);
  };

  const handleSave = () => {
    setShowForm(false);
    // Refresh list if needed
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  return (
    <div>
      <h1>Manage Restaurants</h1>
      <button onClick={handleCreate}>Create New Restaurant</button>
      {showForm ? (
        <RestaurantForm
          restaurant={editingRestaurant}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <RestaurantList onEdit={handleEdit} />
      )}
    </div>
  );
};

export default ManageRestaurants;
