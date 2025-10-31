import NetInfo from '@react-native-community/netinfo';
import { offlineStorage } from './offlineStorage';
import { deliveryAPI } from './api';

interface OfflineAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

class OfflineService {
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private listeners: Array<(isOnline: boolean) => void> = [];

  constructor() {
    this.initializeNetworkListener();
  }

  private initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      if (wasOffline && this.isOnline) {
        this.handleConnectionRestored();
      }
      
      this.notifyListeners();
    });
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline));
  }

  public addNetworkListener(listener: (isOnline: boolean) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public isConnected(): boolean {
    return this.isOnline;
  }

  // Store action for later sync when online
  public async storeOfflineAction(type: string, data: any): Promise<void> {
    const action: OfflineAction = {
      id: `${type}_${Date.now()}_${Math.random()}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
    };

    await offlineStorage.storeOfflineAction(action);
  }

  // Sync all pending actions when connection is restored
  private async handleConnectionRestored(): Promise<void> {
    if (this.syncInProgress) return;
    
    this.syncInProgress = true;
    
    try {
      const pendingActions = await offlineStorage.getOfflineActions();
      
      for (const action of pendingActions) {
        await this.syncAction(action);
      }
      
      await offlineStorage.clearOfflineActions();
    } catch (error) {
      console.error('Error syncing offline actions:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sync individual action
  private async syncAction(action: OfflineAction): Promise<void> {
    try {
      switch (action.type) {
        case 'update_status':
          await deliveryAPI.updateStatus(action.data.status, action.data.isOnline);
          break;
        case 'update_location':
          await deliveryAPI.updateLocation(action.data.latitude, action.data.longitude);
          break;
        case 'accept_order':
          await deliveryAPI.acceptOrder(action.data.orderId);
          break;
        case 'pickup_order':
          await deliveryAPI.pickupOrder(action.data.orderId);
          break;
        case 'deliver_order':
          await deliveryAPI.deliverOrder(action.data.orderId);
          break;
        case 'cancel_order':
          await deliveryAPI.cancelOrder(action.data.orderId, action.data.reason);
          break;
        default:
          console.warn('Unknown action type:', action.type);
      }
    } catch (error) {
      console.error(`Error syncing action ${action.type}:`, error);
      
      // Increment retry count
      action.retryCount++;
      
      if (action.retryCount < action.maxRetries) {
        // Store for retry
        await offlineStorage.storeOfflineAction(action);
      } else {
        console.error(`Max retries exceeded for action ${action.id}`);
      }
    }
  }

  // Cache data for offline access
  public async cacheData(key: string, data: any, expiryMs?: number): Promise<void> {
    await offlineStorage.setItem(key, data, expiryMs);
  }

  // Get cached data
  public async getCachedData<T>(key: string): Promise<T | null> {
    return await offlineStorage.getItem<T>(key);
  }

  // Smart data fetching with offline support
  public async fetchWithOfflineSupport<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    expiryMs: number = 5 * 60 * 1000 // 5 minutes default
  ): Promise<T | null> {
    // Try to get from cache first
    const cachedData = await this.getCachedData<T>(key);
    if (cachedData) {
      return cachedData;
    }

    // If online, fetch fresh data
    if (this.isOnline) {
      try {
        const freshData = await fetchFunction();
        await this.cacheData(key, freshData, expiryMs);
        return freshData;
      } catch (error) {
        console.error('Error fetching fresh data:', error);
        return null;
      }
    }

    // If offline, return null (no cached data available)
    return null;
  }

  // Queue API calls for when online
  public async queueApiCall(type: string, data: any): Promise<void> {
    if (this.isOnline) {
      // Execute immediately if online
      try {
        await this.executeApiCall(type, data);
      } catch (error) {
        // If fails, store for retry
        await this.storeOfflineAction(type, data);
      }
    } else {
      // Store for later if offline
      await this.storeOfflineAction(type, data);
    }
  }

  private async executeApiCall(type: string, data: any): Promise<void> {
    switch (type) {
      case 'update_status':
        await deliveryAPI.updateStatus(data.status, data.isOnline);
        break;
      case 'update_location':
        await deliveryAPI.updateLocation(data.latitude, data.longitude);
        break;
      case 'accept_order':
        await deliveryAPI.acceptOrder(data.orderId);
        break;
      case 'pickup_order':
        await deliveryAPI.pickupOrder(data.orderId);
        break;
      case 'deliver_order':
        await deliveryAPI.deliverOrder(data.orderId);
        break;
      case 'cancel_order':
        await deliveryAPI.cancelOrder(data.orderId, data.reason);
        break;
      default:
        throw new Error(`Unknown API call type: ${type}`);
    }
  }

  // Get offline status message
  public getOfflineStatusMessage(): string {
    if (this.isOnline) {
      return 'Connected';
    } else {
      return 'Offline - Changes will sync when connected';
    }
  }

  // Get pending actions count
  public async getPendingActionsCount(): Promise<number> {
    const actions = await offlineStorage.getOfflineActions();
    return actions.length;
  }

  // Force sync (for manual retry)
  public async forceSync(): Promise<void> {
    if (this.isOnline) {
      await this.handleConnectionRestored();
    }
  }

  // Clear all offline data
  public async clearOfflineData(): Promise<void> {
    await offlineStorage.clearAll();
    await offlineStorage.clearOfflineActions();
  }

  // Get cache statistics
  public async getCacheStats(): Promise<{
    size: number;
    pendingActions: number;
    lastSync: number;
  }> {
    const size = await offlineStorage.getCacheSize();
    const pendingActions = await this.getPendingActionsCount();
    const lastSync = Date.now(); // This would be stored in a real implementation

    return {
      size,
      pendingActions,
      lastSync,
    };
  }
}

export const offlineService = new OfflineService();
