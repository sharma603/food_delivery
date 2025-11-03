// RecentActivity Component
// This file structure created as per requested organization
import React from 'react';

const RecentActivity = ({ activities = [] }) => {
  return (
    <div className="recent-activity">
      <h3>Recent Activity</h3>
      <div className="activity-list">
        {activities.map((activity, index) => (
          <div key={index} className="activity-item">
            <div className="activity-time">{activity.time}</div>
            <div className="activity-description">{activity.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;
