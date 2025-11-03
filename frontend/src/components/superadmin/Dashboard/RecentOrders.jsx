// RecentOrders Component
// This file structure created as per requested organization
import React from 'react';

const RecentOrders = ({ orders = [] }) => {
  return (
    <div className="recent-orders">
      <h3>Recent Orders</h3>
      <div className="orders-list">
        {orders.map((order, index) => (
          <div key={index} className="order-item">
            <div className="order-id">#{order.id}</div>
            <div className="order-info">
              <p>{order.customer}</p>
              <p>{order.restaurant}</p>
              <p className={`status ${order.status.toLowerCase()}`}>
                {order.status}
              </p>
            </div>
            <div className="order-amount">{order.amount}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentOrders;
