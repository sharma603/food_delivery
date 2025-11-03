// AlertBox Component
// This file structure created as per requested organization
import React from 'react';

const AlertBox = ({ type = 'info', title, message, onClose }) => {
  return (
    <div className={`alert-box alert-${type}`}>
      {title && <h4 className="alert-title">{title}</h4>}
      <p className="alert-message">{message}</p>
      {onClose && (
        <button className="alert-close" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
};

export default AlertBox;
