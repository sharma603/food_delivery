import React, { useState } from 'react';
import Header from '../../common/Header';

import Form from '../../common/Form';


const RestaurantProfile = ({ user, onLogout }) => {
 const menuItems = [
 { path: '/restaurant/dashboard', label: 'Dashboard', icon: '' },
 { path: '/restaurant/menu', label: 'Menu Management', icon: '' },
 { path: '/restaurant/orders', label: 'Order Tracking', icon: '' },
 { path: '/restaurant/profile', label: 'Profile', icon: '' },
 { path: '/restaurant/analytics', label: 'Analytics', icon: '' },
 ];

 const [profile, setProfile] = useState({
 name: user.name,
 email: user.email,
 phone: '+1 234 567 8900',
 address: '123 Main St, City, State 12345',
 description: 'Delicious food made with love.',
 });

 const handleUpdateProfile = (formData) => {
 setProfile({ ...profile, ...formData });
 alert('Profile updated successfully!');
 };

 const formFields = [
 { name: 'name', label: 'Restaurant Name', type: 'text', required: true },
 { name: 'email', label: 'Email', type: 'email', required: true },
 { name: 'phone', label: 'Phone', type: 'tel', required: true },
 { name: 'address', label: 'Address', type: 'text', required: true },
 { name: 'description', label: 'Description', type: 'textarea', required: true },
 ];

 return (
 <div className="restaurant-profile">
 <Header user={user} onLogout={onLogout} title={`${user.name} - Profile`} />
 
 <main className="profile-content">
 <div className="profile-header">
 <h1>Restaurant Profile</h1>
 </div>
 <div className="profile-form-container">
 <Form
 fields={formFields}
 onSubmit={handleUpdateProfile}
 submitLabel="Update Profile"
 />
 </div>
 </main>
 </div>
 );
};

export default RestaurantProfile;
