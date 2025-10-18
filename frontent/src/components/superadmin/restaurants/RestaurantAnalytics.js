import React from 'react';
import Header from '../../common/Header';



const RestaurantAnalytics = ({ user, onLogout }) => {
 const menuItems = [
 { path: '/restaurant/dashboard', label: 'Dashboard', icon: '' },
 { path: '/restaurant/menu', label: 'Menu Management', icon: '' },
 { path: '/restaurant/orders', label: 'Order Tracking', icon: '' },
 { path: '/restaurant/profile', label: 'Profile', icon: '' },
 { path: '/restaurant/analytics', label: 'Analytics', icon: '' },
 ];

 const analyticsData = {
 todayRevenue: '$450',
 todayOrders: 23,
 averageOrderValue: '$19.57',
 topItems: [
 { name: 'Margherita Pizza', orders: 8, revenue: '$120' },
 { name: 'Cheeseburger', orders: 6, revenue: '$78' },
 { name: 'Caesar Salad', orders: 4, revenue: '$36' },
 ],
 customerRating: '4.6/5',
 orderCompletionRate: '95%',
 };

 return (
 <div className="restaurant-analytics">
 <Header user={user} onLogout={onLogout} title={`${user.name} - Analytics`} />
 
 <main className="analytics-content">
 <div className="analytics-header">
 <h1>Restaurant Analytics</h1>
 <p>Track your restaurant's performance and insights</p>
 </div>

 <div className="metrics-grid">
 <div className="metric-card">
 <h3>Today's Revenue</h3>
 <p className="metric-value">{analyticsData.todayRevenue}</p>
 <span className="metric-change positive">+15% from yesterday</span>
 </div>
 <div className="metric-card">
 <h3>Today's Orders</h3>
 <p className="metric-value">{analyticsData.todayOrders}</p>
 <span className="metric-change positive">+12% from yesterday</span>
 </div>
 <div className="metric-card">
 <h3>Average Order Value</h3>
 <p className="metric-value">{analyticsData.averageOrderValue}</p>
 <span className="metric-change positive">+5% from yesterday</span>
 </div>
 <div className="metric-card">
 <h3>Customer Rating</h3>
 <p className="metric-value">{analyticsData.customerRating}</p>
 <span className="metric-change positive">+0.1 from last week</span>
 </div>
 </div>

 <div className="performance-section">
 <div className="performance-card">
 <h3>Order Completion Rate</h3>
 <div className="completion-rate">
 <div className="rate-bar">
 <div className="rate-fill" style={{ width: analyticsData.orderCompletionRate }}></div>
 </div>
 <span className="rate-text">{analyticsData.orderCompletionRate}</span>
 </div>
 </div>
 </div>

 <div className="top-items">
 <h3>Top Selling Items</h3>
 <div className="items-list">
 {analyticsData.topItems.map((item, index) => (
 <div key={index} className="item-card">
 <div className="item-info">
 <h4>{item.name}</h4>
 <p>{item.orders} orders • {item.revenue} revenue</p>
 </div>
 <div className="item-rank">#{index + 1}</div>
 </div>
 ))}
 </div>
 </div>
 </main>
 </div>
 );
};

export default RestaurantAnalytics;
