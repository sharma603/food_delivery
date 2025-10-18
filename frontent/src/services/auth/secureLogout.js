import api from '../../utils/api';

/**
 * Secure Logout Service
 * Handles comprehensive logout functionality with security measures
 */
export class SecureLogoutService {
  
  /**
   * Performs secure logout with comprehensive cleanup
   * @param {Object} options - Logout options
   * @returns {Promise<Object>} - Logout result
   */
  static async performSecureLogout(options = {}) {
    const {
      userId,
      skipConfirmation = false,
      redirectPath = '/admin/login',
      auditMessage = 'Admin logout'
    } = options;

    try {
      // Step 1: Revoke server-side tokens
      await this.revokeServerTokens(userId);

      // Step 2: Clear client-side storage
      await this.clearClientStorage();

      // Step 3: Clear browser cache related to admin session
      await this.clearSessionCache();

      // Step 4: Log audit trail
      await this.logAuditTrail(userId, auditMessage);

      // Step 5: Clear temporary data and drafts
      await this.clearTemporaryData();

      // Step 6: Invalidate any active websockets or real-time connections
      await this.invalidateRealTimeConnections();

      return {
        success: true,
        message: 'Logout successful',
        redirectPath,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Secure logout error:', error);
      
      // Even if server logout fails, clear client-side data for security
      await this.emergencyClientCleanup();
      
      return {
        success: false,
        error: error.message || 'Logout failed',
        redirectPath,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Revokes tokens on the server side
   */
  static async revokeServerTokens(userId) {
    try {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');

      if (!token) {
        console.warn('No token found for revocation');
        return;
      }

      // Call server logout endpoint
      await api.post('/admin/auth/logout', {
        userId,
        token,
        refreshToken,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Token revocation failed:', error);
      // Continue with client cleanup even if server revocation fails
      throw new Error('Server logout failed: ' + error.message);
    }
  }

  /**
   * Clears all client-side storage
   */
  static async clearClientStorage() {
    try {
      // Clear localStorage
      const keysToRemove = [
        'token',
        'refreshToken',
        'user',
        'adminSession',
        'lastActivity',
        'sessionStartTime',
        'userPreferences',
        'adminDashboardState',
        'tempFormData',
        'draftChanges',
        'unsavedWork'
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      // Clear sessionStorage
      sessionStorage.clear();

      // Clear any admin-specific storage
      this.clearAdminSpecificStorage();

    } catch (error) {
      console.error('Client storage cleanup failed:', error);
    }
  }

  /**
   * Clears admin-specific storage items
   */
  static clearAdminSpecificStorage() {
    try {
      // Find and remove admin-related keys
      const adminKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('admin') || 
          key.includes('dashboard') || 
          key.includes('restaurant') ||
          key.includes('order') ||
          key.includes('management')
        )) {
          adminKeys.push(key);
        }
      }

      adminKeys.forEach(key => localStorage.removeItem(key));

    } catch (error) {
      console.error('Admin storage cleanup failed:', error);
    }
  }

  /**
   * Clears session-related browser cache
   */
  static async clearSessionCache() {
    try {
      // Clear IndexedDB if used
      if ('indexedDB' in window) {
        await this.clearIndexedDB();
      }

      // Clear any service worker cache
      if ('serviceWorker' in navigator) {
        await this.clearServiceWorkerCache();
      }

      // Clear any web SQL databases (deprecated but still check)
      if ('webkitStorageInfo' in window) {
        await this.clearWebSQL();
      }

    } catch (error) {
      console.error('Cache cleanup failed:', error);
    }
  }

  /**
   * Clears IndexedDB data
   */
  static async clearIndexedDB() {
    try {
      const databases = await indexedDB.databases();
      await Promise.all(
        databases.map(db => {
          return new Promise((resolve, reject) => {
            const deleteRequest = indexedDB.deleteDatabase(db.name);
            deleteRequest.onerror = () => reject(deleteRequest.error);
            deleteRequest.onsuccess = () => resolve();
          });
        })
      );
    } catch (error) {
      console.error('IndexedDB cleanup failed:', error);
    }
  }

  /**
   * Clears service worker cache
   */
  static async clearServiceWorkerCache() {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => registration.unregister())
      );

      // Clear caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    } catch (error) {
      console.error('Service worker cache cleanup failed:', error);
    }
  }

  /**
   * Clears Web SQL (deprecated)
   */
  static async clearWebSQL() {
    try {
      // This is deprecated but included for completeness
      if (window.openDatabase) {
        const db = window.openDatabase('', '', '', '');
        if (db) {
          db.transaction(tx => {
            tx.executeSql('DROP TABLE IF EXISTS admin_data');
            tx.executeSql('DROP TABLE IF EXISTS session_data');
          });
        }
      }
    } catch (error) {
      console.error('WebSQL cleanup failed:', error);
    }
  }

  /**
   * Logs audit trail for logout action
   */
  static async logAuditTrail(userId, message) {
    try {
      const auditData = {
        action: 'logout',
        userId: userId,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        ip: await this.getClientIP(),
        sessionDuration: this.calculateSessionDuration(),
        message: message
      };

      // Send to audit service
      await api.post('/admin/audit/log', auditData);

    } catch (error) {
      console.error('Audit logging failed:', error);
      // Don't throw error for audit failures
    }
  }

  /**
   * Gets client IP for audit trail
   */
  static async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Calculates session duration
   */
  static calculateSessionDuration() {
    try {
      const sessionStart = localStorage.getItem('sessionStartTime');
      if (sessionStart) {
        const duration = Date.now() - parseInt(sessionStart);
        return Math.floor(duration / 1000); // Duration in seconds
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Clears temporary data and draft changes
   */
  static async clearTemporaryData() {
    try {
      // Clear any unsaved form data
      const tempKeys = Object.keys(localStorage).filter(key => 
        key.includes('temp') || 
        key.includes('draft') || 
        key.includes('unsaved') ||
        key.includes('autoSave')
      );

      tempKeys.forEach(key => localStorage.removeItem(key));

      // Clear any component state that might be persisted
      this.clearPersistedComponentState();

    } catch (error) {
      console.error('Temporary data cleanup failed:', error);
    }
  }

  /**
   * Clears persisted component state
   */
  static clearPersistedComponentState() {
    try {
      // Clear React component state that might be persisted
      const stateKeys = Object.keys(localStorage).filter(key =>
        key.includes('componentState') ||
        key.includes('formState') ||
        key.includes('wizardState')
      );

      stateKeys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Component state cleanup failed:', error);
    }
  }

  /**
   * Invalidates real-time connections
   */
  static async invalidateRealTimeConnections() {
    try {
      // Close any WebSocket connections
      if (window.adminSocket) {
        window.adminSocket.close();
        window.adminSocket = null;
      }

      // Close any EventSource connections
      if (window.adminEventSource) {
        window.adminEventSource.close();
        window.adminEventSource = null;
      }

      // Clear any real-time subscriptions
      if (window.adminSubscriptions) {
        window.adminSubscriptions.forEach(sub => {
          if (typeof sub.unsubscribe === 'function') {
            sub.unsubscribe();
          }
        });
        window.adminSubscriptions = [];
      }

    } catch (error) {
      console.error('Real-time connection cleanup failed:', error);
    }
  }

  /**
   * Emergency client cleanup when server logout fails
   */
  static async emergencyClientCleanup() {
    try {
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();

      // Close connections
      await this.invalidateRealTimeConnections();

      // Clear cookies related to admin session
      this.clearAdminCookies();

    } catch (error) {
      console.error('Emergency cleanup failed:', error);
    }
  }

  /**
   * Clears admin-related cookies
   */
  static clearAdminCookies() {
    try {
      const cookies = document.cookie.split(';');
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name.includes('admin') || name.includes('session') || name.includes('auth')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        }
      });
    } catch (error) {
      console.error('Cookie cleanup failed:', error);
    }
  }

  /**
   * Validates logout completion
   */
  static validateLogoutCompletion() {
    const criticalKeys = ['token', 'refreshToken', 'user', 'adminSession'];
    const remainingKeys = criticalKeys.filter(key => localStorage.getItem(key));
    
    return {
      isComplete: remainingKeys.length === 0,
      remainingKeys,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Prevents back-button access by invalidating history
   */
  static preventBackButtonAccess() {
    try {
      // Replace current history entry
      window.history.replaceState(null, '', '/admin/login');
      
      // Push a new state
      window.history.pushState(null, '', '/admin/login');
      
      // Handle back button
      window.addEventListener('popstate', (event) => {
        window.history.pushState(null, '', '/admin/login');
      });
      
    } catch (error) {
      console.error('Back button prevention failed:', error);
    }
  }
}

export default SecureLogoutService;
