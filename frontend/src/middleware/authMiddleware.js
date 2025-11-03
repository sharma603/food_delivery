import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Authentication middleware hooks and utilities
 */

/**
 * Hook to prevent back button access to authenticated pages after logout
 */
export const usePreventBackButton = (isAuthenticated) => {
  useEffect(() => {
    if (!isAuthenticated) {
      // Prevent back button access
      const preventBack = () => {
        window.history.forward();
      };

      // Clear history and prevent back navigation
      window.history.pushState(null, null, window.location.pathname);
      window.addEventListener('popstate', preventBack);

      return () => {
        window.removeEventListener('popstate', preventBack);
      };
    }
  }, [isAuthenticated]);
};

/**
 * Hook to monitor authentication status and force logout on token expiry
 */
export const useAuthMonitor = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          await logout({ auditMessage: 'No token found - forced logout' });
          navigate('/admin/login', { replace: true });
          return;
        }

        // Check token expiry
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (tokenData.exp < currentTime) {
          await logout({ auditMessage: 'Token expired - forced logout' });
          navigate('/admin/login', { 
            replace: true,
            state: { 
              message: 'Your session has expired. Please login again.',
              type: 'warning'
            }
          });
        }
      } catch (error) {
        console.error('Auth status check failed:', error);
        // If token is malformed, force logout
        await logout({ auditMessage: 'Invalid token - forced logout' });
        navigate('/admin/login', { replace: true });
      }
    };

    // Check auth status immediately
    checkAuthStatus();

    // Set up periodic checks every 5 minutes
    const interval = setInterval(checkAuthStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, logout, navigate]);
};

/**
 * Hook to handle session timeout
 */
export const useSessionTimeout = (timeoutMinutes = 30) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    let timeoutId;
    let warningId;

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      clearTimeout(warningId);

      // Show warning 5 minutes before timeout
      const warningTime = (timeoutMinutes - 5) * 60 * 1000;
      warningId = setTimeout(() => {
        const userWantsToStay = window.confirm(
          'Your session will expire in 5 minutes due to inactivity. Click OK to stay logged in.'
        );
        
        if (userWantsToStay) {
          resetTimeout();
        }
      }, warningTime);

      // Set main timeout
      timeoutId = setTimeout(async () => {
        await logout({ auditMessage: 'Session timeout - auto logout' });
        navigate('/admin/login', { 
          replace: true,
          state: { 
            message: 'Your session has timed out due to inactivity.',
            type: 'warning'
          }
        });
      }, timeoutMinutes * 60 * 1000);
    };

    const activity = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const resetTimer = () => {
      resetTimeout();
    };

    activity.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    resetTimeout();

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(warningId);
      activity.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [user, logout, navigate, timeoutMinutes]);
};

/**
 * Hook to detect and prevent multiple tab logins
 */
export const useMultiTabPrevention = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const handleStorageChange = async (e) => {
      if (e.key === 'logout-event') {
        // Another tab logged out
        await logout({ auditMessage: 'Logout from another tab' });
        navigate('/admin/login', { 
          replace: true,
          state: { 
            message: 'You have been logged out from another tab.',
            type: 'info'
          }
        });
      } else if (e.key === 'login-event' && e.newValue !== user._id) {
        // Another user logged in from another tab
        await logout({ auditMessage: 'Different user login detected' });
        navigate('/admin/login', { 
          replace: true,
          state: { 
            message: 'Another user has logged in from this browser.',
            type: 'warning'
          }
        });
      }
    };

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);

    // Notify other tabs of this login
    localStorage.setItem('login-event', user._id);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, logout, navigate]);
};

/**
 * Hook to clear sensitive data on page unload
 */
export const useSecureUnload = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const handleBeforeUnload = (e) => {
      // Clear sensitive temporary data
      const tempKeys = Object.keys(localStorage).filter(key => 
        key.includes('temp') || key.includes('draft')
      );
      tempKeys.forEach(key => localStorage.removeItem(key));
      
      // Don't show confirmation for normal navigation
      // e.preventDefault();
      // e.returnValue = '';
    };

    const handleUnload = () => {
      // Log the page unload event
      navigator.sendBeacon('/api/admin/audit/log', JSON.stringify({
        action: 'page_unload',
        userId: user._id,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      }));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [user]);
};

/**
 * Comprehensive security middleware hook that combines all security measures
 */
export const useSecurityMiddleware = (options = {}) => {
  const {
    enableSessionTimeout = true,
    sessionTimeoutMinutes = 30,
    enableMultiTabPrevention = true,
    enableAuthMonitoring = true,
    enableSecureUnload = true
  } = options;

  const { user } = useAuth();

  // Apply security measures based on options
  usePreventBackButton(!!user);
  
  if (enableAuthMonitoring) {
    useAuthMonitor();
  }
  
  if (enableSessionTimeout) {
    useSessionTimeout(sessionTimeoutMinutes);
  }
  
  if (enableMultiTabPrevention) {
    useMultiTabPrevention();
  }
  
  if (enableSecureUnload) {
    useSecureUnload();
  }
};

export default {
  usePreventBackButton,
  useAuthMonitor,
  useSessionTimeout,
  useMultiTabPrevention,
  useSecureUnload,
  useSecurityMiddleware
};
