import React from 'react';
import './OrderStats.css';

const OrderStats = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders || 0,
      icon: 'fas fa-shopping-bag',
      color: '#3498db',
      bgColor: '#ebf3fd'
    },
    {
      title: 'Active Orders',
      value: stats.activeOrders || 0,
      icon: 'fas fa-clock',
      color: '#f39c12',
      bgColor: '#fef9e7'
    },
    {
      title: 'Completed Orders',
      value: stats.completedOrders || 0,
      icon: 'fas fa-check-circle',
      color: '#27ae60',
      bgColor: '#eafaf1'
    },
    {
      title: 'Cancelled Orders',
      value: stats.cancelledOrders || 0,
      icon: 'fas fa-times-circle',
      color: '#e74c3c',
      bgColor: '#fdeaea'
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue?.toFixed(2) || '0.00'}`,
      icon: 'fas fa-dollar-sign',
      color: '#9b59b6',
      bgColor: '#f4ecf7'
    },
    {
      title: 'Avg Order Value',
      value: `$${stats.averageOrderValue?.toFixed(2) || '0.00'}`,
      icon: 'fas fa-chart-line',
      color: '#34495e',
      bgColor: '#f8f9fa'
    }
  ];

  return (
    <div className="order-stats">
      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: stat.bgColor }}>
              <i className={stat.icon} style={{ color: stat.color }}></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-title">{stat.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderStats;
