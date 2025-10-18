import React, { useState } from 'react';



const OrderMonitoring = ({ user, onLogout }) => {
 const menuItems = [
 { path: '/admin/dashboard', label: 'Dashboard', icon: 'fas fa-chart-bar' },
 { 
 path: '/admin/restaurants', 
 label: 'Restaurant Management', 
 icon: 'fas fa-store',
 submenu: [
 { path: '/admin/restaurants/onboarding', label: 'Restaurant Onboarding', icon: 'fas fa-plus-circle' },
 { path: '/admin/restaurants/documents', label: 'Document Management', icon: 'fas fa-file-alt' },
 { path: '/admin/restaurants/status', label: 'Status Control', icon: 'fas fa-toggle-on' },
 { path: '/admin/restaurants/approvals', label: 'Approvals', icon: 'fas fa-check-circle' }
 ]
 },
 { 
 path: '/admin/orders', 
 label: 'Order Management', 
 icon: 'fas fa-shopping-bag',
 active: true,
 submenu: [
 { path: '/admin/orders/monitoring', label: 'Real-time Monitoring', icon: 'fas fa-eye' },
 { path: '/admin/orders/operations', label: 'Order Operations', icon: 'fas fa-cogs' },
 { path: '/admin/orders/analytics', label: 'Order Analytics', icon: 'fas fa-chart-pie' },
 { path: '/admin/orders/disputes', label: 'Disputes', icon: 'fas fa-exclamation-triangle' }
 ]
 },
 { 
 path: '/admin/delivery', 
 label: 'Delivery Management', 
 icon: 'fas fa-truck',
 submenu: [
 { path: '/admin/delivery/personnel', label: 'Personnel Management', icon: 'fas fa-user-tie' },
 { path: '/admin/delivery/tracking', label: 'Live Tracking', icon: 'fas fa-map-marker-alt' },
 { path: '/admin/delivery/zones', label: 'Zone Management', icon: 'fas fa-map' },
 { path: '/admin/delivery/performance', label: 'Performance', icon: 'fas fa-chart-line' }
 ]
 },
 { 
 path: '/admin/finance', 
 label: 'Financial Management', 
 icon: 'fas fa-dollar-sign',
 submenu: [
 { path: '/admin/finance/commission', label: 'Commission System', icon: 'fas fa-percentage' },
 { path: '/admin/finance/payments', label: 'Payment Processing', icon: 'fas fa-credit-card' },
 { path: '/admin/finance/revenue', label: 'Revenue Analytics', icon: 'fas fa-chart-bar' },
 { path: '/admin/finance/settlements', label: 'Settlements', icon: 'fas fa-handshake' }
 ]
 },
 { 
 path: '/admin/customers', 
 label: 'Customer Management', 
 icon: 'fas fa-users',
 submenu: [
 { path: '/admin/customers/database', label: 'Customer Database', icon: 'fas fa-database' },
 { path: '/admin/customers/support', label: 'Customer Support', icon: 'fas fa-headset' },
 { path: '/admin/customers/loyalty', label: 'Loyalty Program', icon: 'fas fa-gift' },
 { path: '/admin/customers/analytics', label: 'Customer Analytics', icon: 'fas fa-chart-area' }
 ]
 },
 { 
 path: '/admin/menu', 
 label: 'Menu & Pricing', 
 icon: 'fas fa-utensils',
 submenu: [
 { path: '/admin/menu/control', label: 'Menu Control', icon: 'fas fa-clipboard-list' },
 { path: '/admin/menu/pricing', label: 'Pricing Management', icon: 'fas fa-tags' },
 { path: '/admin/menu/promotions', label: 'Promotional Control', icon: 'fas fa-bullhorn' },
 { path: '/admin/menu/approvals', label: 'Menu Approvals', icon: 'fas fa-check' }
 ]
 },
 { 
 path: '/admin/reports', 
 label: 'Reports & Analytics', 
 icon: 'fas fa-chart-line',
 submenu: [
 { path: '/admin/reports/performance', label: 'Performance Reports', icon: 'fas fa-tachometer-alt' },
 { path: '/admin/reports/financial', label: 'Financial Reports', icon: 'fas fa-file-invoice-dollar' },
 { path: '/admin/reports/export', label: 'Export Data', icon: 'fas fa-download' },
 { path: '/admin/reports/custom', label: 'Custom Reports', icon: 'fas fa-cogs' }
 ]
 },
 { 
 path: '/admin/system', 
 label: 'System Administration', 
 icon: 'fas fa-server',
 submenu: [
 { path: '/admin/system/users', label: 'User Management', icon: 'fas fa-user-shield' },
 { path: '/admin/system/settings', label: 'Platform Settings', icon: 'fas fa-cog' },
 { path: '/admin/system/notifications', label: 'Notifications', icon: 'fas fa-bell' },
 { path: '/admin/system/security', label: 'Security', icon: 'fas fa-shield-alt' }
 ]
 },
 { 
 path: '/admin/communication', 
 label: 'Communication Tools', 
 icon: 'fas fa-comments',
 submenu: [
 { path: '/admin/communication/internal', label: 'Internal Chat', icon: 'fas fa-comment-dots' },
 { path: '/admin/communication/customers', label: 'Customer Messaging', icon: 'fas fa-envelope' },
 { path: '/admin/communication/announcements', label: 'Announcements', icon: 'fas fa-bullhorn' },
 { path: '/admin/communication/campaigns', label: 'Marketing Campaigns', icon: 'fas fa-megaphone' }
 ]
 }
 ];

 const [orderStats] = useState([
 {
 label: 'Active Orders',
 value: '89',
 icon: 'fas fa-shopping-bag',
 color: '#3498db',
 bgColor: '#ebf3fd',
 trend: '+12%',
 change: 'positive',
 period: 'Today'
 },
 {
 label: 'Completed Orders',
 value: '1,234',
 icon: 'fas fa-check-circle',
 color: '#27ae60',
 bgColor: '#eafaf1',
 trend: '+8%',
 change: 'positive',
 period: 'This Week'
 },
 {
 label: 'Cancelled Orders',
 value: '45',
 icon: 'fas fa-times-circle',
 color: '#e74c3c',
 bgColor: '#fdeaea',
 trend: '-3%',
 change: 'negative',
 period: 'Today'
 },
 {
 label: 'Avg Delivery Time',
 value: '28 min',
 icon: 'fas fa-clock',
 color: '#f39c12',
 bgColor: '#fef9e7',
 trend: '-5%',
 change: 'positive',
 period: 'This Week'
 }
 ]);

 const [recentOrders] = useState([
 {
 id: 'ORD001',
 customer: 'John Doe',
 restaurant: 'Pizza Palace',
 items: '2x Pizza, 1x Coke',
 amount: '$25.99',
 status: 'Preparing',
 time: '5 min ago'
 },
 {
 id: 'ORD002',
 customer: 'Jane Smith',
 restaurant: 'Burger House',
 items: '1x Burger, 1x Fries',
 amount: '$18.50',
 status: 'Out for Delivery',
 time: '12 min ago'
 },
 {
 id: 'ORD003',
 customer: 'Mike Johnson',
 restaurant: 'Sushi Bar',
 items: '3x Sushi Rolls',
 amount: '$42.00',
 status: 'Delivered',
 time: '25 min ago'
 }
 ]);

 const getStatusColor = (status) => {
 switch (status) {
 case 'Delivered': return '#27ae60';
 case 'Preparing': return '#f39c12';
 case 'Out for Delivery': return '#3498db';
 case 'Cancelled': return '#e74c3c';
 default: return '#95a5a6';
 }
 };

 return (
 <div className="order-monitoring">
 
 
 <main className="dashboard-content">
 <div className="dashboard-header">
 <div className="header-content">
 <div className="header-text">
 <h1>Order Monitoring</h1>
 <p>Welcome back, {user?.name || 'Admin'}! Monitor all orders in real-time.</p>
 </div>
 </div>
 </div>

 <div className="stats-grid">
 {orderStats.map((stat, index) => (
 <div key={index} className="stat-card">
 <div className="stat-icon" style={{ backgroundColor: stat.bgColor }}>
 <i className={stat.icon} style={{ color: stat.color }}></i>
 </div>
 <div className="stat-info">
 <div className="stat-header">
 <h3>{stat.value}</h3>
 <span className={`trend-badge ${stat.change}`}>
 <i className={`fas fa-arrow-${stat.change === 'positive' ? 'up' : 'down'}`}></i>
 {stat.trend} ({stat.period})
 </span>
 </div>
 <p>{stat.label}</p>
 </div>
 </div>
 ))}
 </div>

 <div className="dashboard-grid">
 <div className="recent-orders">
 <div className="card-header">
 <h2><i className="fas fa-shopping-bag"></i> Recent Orders</h2>
 <button className="view-all-btn">
 <i className="fas fa-external-link-alt"></i>
 View All
 </button>
 </div>
 <div className="orders-table">
 <div className="table-header">
 <span>Order ID</span>
 <span>Customer</span>
 <span>Restaurant</span>
 <span>Items</span>
 <span>Amount</span>
 <span>Status</span>
 <span>Time</span>
 </div>
 {recentOrders.map((order) => (
 <div key={order.id} className="table-row">
 <span className="order-id">{order.id}</span>
 <span>{order.customer}</span>
 <span>{order.restaurant}</span>
 <span className="items">{order.items}</span>
 <span className="amount">{order.amount}</span>
 <span
 className="status"
 style={{ color: getStatusColor(order.status) }}
 >
 {order.status}
 </span>
 <span className="time">{order.time}</span>
 </div>
 ))}
 </div>
 </div>

 <div className="quick-actions">
 <h2>Quick Actions</h2>
 <div className="actions-grid">
 <button className="action-btn">
 <span className="action-icon"></span>
 <span>Live Tracking</span>
 </button>
 <button className="action-btn">
 <span className="action-icon"></span>
 <span>Order Analytics</span>
 </button>
 <button className="action-btn">
 <span className="action-icon"></span>
 <span>Order Settings</span>
 </button>
 <button className="action-btn">
 <span className="action-icon"></span>
 <span>Assign Delivery</span>
 </button>
 </div>
 </div>
 </div>
 </main>
 </div>
 );
};

export default OrderMonitoring;
