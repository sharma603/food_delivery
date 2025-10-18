// QuickActions Component
// This file structure created as per requested organization
import React from 'react';

const QuickActions = ({ actions = [] }) => {
  return (
    <div className="quick-actions">
      <h3>Quick Actions</h3>
      <div className="actions-grid">
        {actions.map((action, index) => (
          <button 
            key={index} 
            className="action-button"
            onClick={action.onClick}
          >
            {action.icon && <span className="action-icon">{action.icon}</span>}
            <span className="action-label">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
