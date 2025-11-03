import React, { useState } from 'react';
import Header from '../../common/Header';

import Table from '../../common/Table';


const OrderTracker = ({ user, onLogout }) => {
 const menuItems = [
 { path: '/restaurant/dashboard', label: 'Dashboard', icon: '' },
 { path: '/restaurant/menu', label: 'Menu Management', icon: '' },
 { path: '/restaurant/orders', label: 'Order Tracking', icon: '' },
 { path: '/restaurant/profile', label: 'Profile', icon: '' },
 { path: '/restaurant/analytics', label: 'Analytics', icon: '' },
 ];

 const [orders, setOrders] = useState([
 { id: 1234, customer: 'John Doe', items: 'Margherita Pizza, Coke', status: 'Pending', total: '$15.99' },
 { id: 1233, customer: 'Jane Smith', items: 'Cheeseburger, Fries', status: 'Preparing', total: '$12.99' },
 { id: 1232, customer: 'Bob Johnson', items: 'Caesar Salad', status: 'Ready', total: '$7.99' },
 ]);

 const columns = [
 { key: 'id', label: 'Order ID' },
 { key: 'customer', label: 'Customer' },
 { key: 'items', label: 'Items' },
 { key: 'status', label: 'Status' },
 { key: 'total', label: 'Total' },
 ];

 const handleStatusChange = (orderId, newStatus) => {
 setOrders(orders.map(order =>
 order.id === orderId ? { ...order, status: newStatus } : order
 ));
 };

 return (
 <div className="order-tracker">
 <Header user={user} onLogout={onLogout} title={`${user.name} - Orders`} />
 
 <main className="tracker-content">
 <div className="tracker-header">
 <h1>Order Tracking</h1>
 </div>
 <div className="table-container">
 <Table
 columns={columns}
 data={orders}
 onRowClick={(order) => {
 const statuses = ['Pending', 'Preparing', 'Ready', 'Delivered'];
 const currentIndex = statuses.indexOf(order.status);
 const newStatus = statuses[(currentIndex + 1) % statuses.length];
 handleStatusChange(order.id, newStatus);
 }}
 />
 </div>
 </main>
 </div>
 );
};

export default OrderTracker;
