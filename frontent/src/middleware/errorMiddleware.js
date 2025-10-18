// Error Middleware
// This file structure created as per requested organization

export const handleApiError = (error) => {
  console.error('API Error:', error);

  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        return {
          type: 'UNAUTHORIZED',
          message: 'Please login to continue',
          shouldRedirect: true,
          redirectTo: '/login'
        };
      
      case 403:
        return {
          type: 'FORBIDDEN',
          message: 'You do not have permission to access this resource',
          shouldRedirect: false
        };
      
      case 404:
        return {
          type: 'NOT_FOUND',
          message: 'The requested resource was not found',
          shouldRedirect: false
        };
      
      case 422:
        return {
          type: 'VALIDATION_ERROR',
          message: data.message || 'Validation failed',
          errors: data.errors || {},
          shouldRedirect: false
        };
      
      case 500:
        return {
          type: 'SERVER_ERROR',
          message: 'Internal server error. Please try again later.',
          shouldRedirect: false
        };
      
      default:
        return {
          type: 'API_ERROR',
          message: data.message || 'An unexpected error occurred',
          shouldRedirect: false
        };
    }
  } else if (error.request) {
    // Network error
    return {
      type: 'NETWORK_ERROR',
      message: 'Network error. Please check your connection.',
      shouldRedirect: false
    };
  } else {
    // Other error
    return {
      type: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
      shouldRedirect: false
    };
  }
};

export const logError = (error, context = {}) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    context,
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  console.error('Error Log:', errorLog);
  
  // In production, send to error tracking service
  // Example: sendToErrorService(errorLog);
};

export class ErrorBoundaryFallback {
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  static componentDidCatch(error, errorInfo) {
    logError(error, errorInfo);
  }
}
