// StatCard Component
// This file structure created as per requested organization
import React from 'react';


const StatCard = ({ title, value, icon, change }) => {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-details">
        <h3>{title}</h3>
        <div className="stat-value">{value}</div>
        {change && <div className="stat-change">{change}</div>}
      </div>
    </div>
  );
};

export default StatCard;
