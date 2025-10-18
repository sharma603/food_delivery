import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';


const LogoutNotification = () => {
  const location = useLocation();
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (location.state?.message) {
      setNotification({
        message: location.state.message,
        type: location.state.type || 'info',
        timestamp: location.state.timestamp
      });

      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const handleDismiss = () => {
    setNotification(null);
  };

  if (!notification) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return 'fas fa-check-circle';
      case 'warning':
        return 'fas fa-exclamation-triangle';
      case 'error':
        return 'fas fa-times-circle';
      default:
        return 'fas fa-info-circle';
    }
  };

  return (
    <div className={`logout-notification ${notification.type}`}>
      <div className="notification-content">
        <div className="notification-icon">
          <i className={getIcon(notification.type)}></i>
        </div>
        <div className="notification-message">
          <p>{notification.message}</p>
          {notification.timestamp && (
            <small>
              {new Date(notification.timestamp).toLocaleString()}
            </small>
          )}
        </div>
        <button 
          className="notification-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
};

export default LogoutNotification;
