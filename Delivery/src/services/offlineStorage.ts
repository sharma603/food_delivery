import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class OfflineStorageService {
  private readonly CACHE_PREFIX = 'delivery_cache_';
  private readonly DEFAULT_EXPIRY = 5 * 60 * 1000; // 5 minutes

  // Store data with expiry
  async setItem<T>(key: string, data: T, expiryMs: number = this.DEFAULT_EXPIRY): Promise<void> {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + expiryMs,
      };
      
      await AsyncStorage.setItem(
        `${this.CACHE_PREFIX}${key}`,
        JSON.stringify(cacheItem)
      );
    } catch (error) {
      console.error('Error storing cache item:', error);
    }
  }

  // Retrieve data if not expired
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`${this.CACHE_PREFIX}${key}`);
      
      if (!cached) {
        return null;
      }

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      
      // Check if expired
      if (Date.now() > cacheItem.expiry) {
        await this.removeItem(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('Error retrieving cache item:', error);
      return null;
    }
  }

  // Remove specific item
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${this.CACHE_PREFIX}${key}`);
    } catch (error) {
      console.error('Error removing cache item:', error);
    }
  }

  // Clear all cache
  async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Get cache size
  async getCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      return cacheKeys.length;
    } catch (error) {
      console.error('Error getting cache size:', error);
      return 0;
    }
  }

  // Clean expired items
  async cleanExpired(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      for (const key of cacheKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const cacheItem: CacheItem<any> = JSON.parse(cached);
          if (Date.now() > cacheItem.expiry) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning expired cache:', error);
    }
  }

  // Store user data
  async storeUserData(userData: any): Promise<void> {
    await this.setItem('user_data', userData, 24 * 60 * 60 * 1000); // 24 hours
  }

  // Get user data
  async getUserData(): Promise<any | null> {
    return await this.getItem('user_data');
  }

  // Store orders data
  async storeOrdersData(orders: any[]): Promise<void> {
    await this.setItem('orders_data', orders, 2 * 60 * 1000); // 2 minutes
  }

  // Get orders data
  async getOrdersData(): Promise<any[] | null> {
    return await this.getItem('orders_data');
  }

  // Store earnings data
  async storeEarningsData(earnings: any): Promise<void> {
    await this.setItem('earnings_data', earnings, 5 * 60 * 1000); // 5 minutes
  }

  // Get earnings data
  async getEarningsData(): Promise<any | null> {
    return await this.getItem('earnings_data');
  }

  // Store stats data
  async storeStatsData(stats: any): Promise<void> {
    await this.setItem('stats_data', stats, 2 * 60 * 1000); // 2 minutes
  }

  // Get stats data
  async getStatsData(): Promise<any | null> {
    return await this.getItem('stats_data');
  }

  // Store offline actions
  async storeOfflineAction(action: any): Promise<void> {
    try {
      const existingActions = (await this.getItem('offline_actions')) as any[] || [];
      const updatedActions = [...existingActions, action];
      await this.setItem('offline_actions', updatedActions, 7 * 24 * 60 * 60 * 1000); // 7 days
    } catch (error) {
      console.error('Error storing offline action:', error);
    }
  }

  // Get offline actions
  async getOfflineActions(): Promise<any[]> {
    return await this.getItem('offline_actions') || [];
  }

  // Clear offline actions
  async clearOfflineActions(): Promise<void> {
    await this.removeItem('offline_actions');
  }

  // Store location data
  async storeLocationData(location: {
    latitude: number;
    longitude: number;
    timestamp: number;
  }): Promise<void> {
    try {
      const existingLocations = (await this.getItem('location_history')) as any[] || [];
      const updatedLocations = [...existingLocations, location];
      
      // Keep only last 100 locations
      if (updatedLocations.length > 100) {
        updatedLocations.splice(0, updatedLocations.length - 100);
      }
      
      await this.setItem('location_history', updatedLocations, 24 * 60 * 60 * 1000); // 24 hours
    } catch (error) {
      console.error('Error storing location data:', error);
    }
  }

  // Get location history
  async getLocationHistory(): Promise<any[]> {
    return await this.getItem('location_history') || [];
  }

  // Store app settings
  async storeAppSettings(settings: any): Promise<void> {
    await this.setItem('app_settings', settings, 30 * 24 * 60 * 60 * 1000); // 30 days
  }

  // Get app settings
  async getAppSettings(): Promise<any | null> {
    return await this.getItem('app_settings');
  }
}

export const offlineStorage = new OfflineStorageService();
