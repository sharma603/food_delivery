// Notification Component
// This file structure created as per requested organization
import React from 'react';


const Notification = ({ type, message, onClose }) => {
  return (
    <div className={`notification notification-${type}`}>
      <span>{message}</span>
      {onClose && <button onClick={onClose}>×</button>}
    </div>
  );
};

export default Notification;
