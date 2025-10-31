import React, { useState, useEffect } from 'react';
import Header from '../../common/Header';

import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { apiService as api } from '../../../services/api';


const RestaurantDashboard = ({ user, onLogout }) => {
 const menuItems = [
 { path: '/restaurant/dashboard', label: 'Dashboard', icon: '' },
 { path: '/restaurant/menu', label: 'Menu Management', icon: '' },
 { path: '/restaurant/orders', label: 'Order Tracking', icon: '' },
 { path: '/restaurant/profile', label: 'Profile', icon: '' },
 { path: '/restaurant/analytics', label: 'Analytics', icon: '' },
 ];

 const [stats, setStats] = useState([]);
 const [recentOrders, setRecentOrders] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);

 useEffect(() => {
 fetchDashboardData();
 }, []);

 const fetchDashboardData = async () => {
 try {
 setLoading(true);
 const [statsResponse, ordersResponse] = await Promise.all([
 api.get('/restaurants/dashboard/stats'),
 api.get('/orders/recent?limit=5')
 ]);

 setStats([
 { label: 'Today\'s Orders', value: statsResponse.todayOrders || 0, icon: '' },
 { label: 'Pending Orders', value: statsResponse.pendingOrders || 0, icon: '' },
 { label: 'Total Revenue', value: `$${statsResponse.totalRevenue || 0}`, icon: '' },
 { label: 'Average Rating', value: statsResponse.averageRating || '0', icon: '' },
 ]);

 setRecentOrders(ordersResponse.orders || []);
 } catch (err) {
 setError('Failed to load dashboard data');
 console.error('Error fetching dashboard data:', err);
 } finally {
 setLoading(false);
 }
 };

 if (loading) {
 return (
 <div className="restaurant-dashboard">
 <Header user={user} onLogout={onLogout} title={`${user.name} Dashboard`} />
 
 <main className="dashboard-content">
 <LoadingSpinner message="Loading dashboard..." />
 </main>
 </div>
 );
 }

 return (
 <div className="restaurant-dashboard">
 <Header user={user} onLogout={onLogout} title={`${user.name} Dashboard`} />
 
 <main className="dashboard-content">
 <div className="dashboard-header">
 <h1>Restaurant Dashboard</h1>
 <p>Welcome back, {user.name}!</p>
 </div>

 {error && <div className="error-message">{error}</div>}

 <div className="stats-grid">
 {stats.map((stat, index) => (
 <div key={index} className="stat-card">
 <div className="stat-icon">{stat.icon}</div>
 <div className="stat-info">
 <h3>{stat.value}</h3>
 <p>{stat.label}</p>
 </div>
 </div>
 ))}
 </div>

 <div className="recent-orders">
 <h2>Recent Orders</h2>
 <div className="order-list">
 {recentOrders.length > 0 ? recentOrders.map((order) => (
 <div key={order.id} className="order-item">
 <span className="order-icon"></span>
 <span>Order #{order.id} - {order.customerName}</span>
 <span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span>
 </div>
 )) : (
 <p>No recent orders</p>
 )}
 </div>
 </div>
 </main>
 </div>
 );
};

export default RestaurantDashboard;
