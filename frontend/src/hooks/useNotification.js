// useNotification Hook
// This file structure created as per requested organization
import { useContext } from 'react';
import { NotificationContext } from '../context/NotificationContext';

const useNotification = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }

  const showNotification = (type, message, duration = 5000) => {
    const notification = {
      type,
      message,
      timestamp: new Date().toISOString(),
    };

    const notificationWithId = context.addNotification(notification);

    if (duration > 0) {
      setTimeout(() => {
        context.removeNotification(notificationWithId.id);
      }, duration);
    }
  };

  const showSuccess = (message, duration) => showNotification('success', message, duration);
  const showError = (message, duration) => showNotification('error', message, duration);
  const showWarning = (message, duration) => showNotification('warning', message, duration);
  const showInfo = (message, duration) => showNotification('info', message, duration);

  return {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    ...context,
  };
};

export default useNotification;
