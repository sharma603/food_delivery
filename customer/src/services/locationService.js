import { Alert } from 'react-native';

// Delivery configuration - should be fetched from backend API
const DELIVERY_ZONES = {};
const RESTAURANT_LOCATIONS = {};

class LocationService {
  // Mock implementation - always returns success
  static async getCurrentLocation() {
    try {
      // Return mock location data
      return {
        latitude: 27.7172,
        longitude: 85.3240,
        accuracy: 10,
        altitude: 1300,
        altitudeAccuracy: 5,
        heading: 0,
        speed: 0,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  // Mock implementation - always returns success with address
  static async getCurrentLocationWithAddress() {
    try {
      // Return empty address data - user must manually enter location
      return {
        latitude: 0,
        longitude: 0,
        accuracy: 0,
        address: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Nepal'
      };
    } catch (error) {
      console.error('Error getting location with address:', error);
      return null;
    }
  }

  // Mock implementation - always returns default charge
  static async calculateDeliveryCharge(restaurantId) {
    try {
      // Return mock delivery charge
      return {
        charge: 50,
        zone: 'kathmandu',
        distance: 5.2,
        estimatedTime: 25
      };
    } catch (error) {
      console.error('Error calculating delivery charge:', error);
      return {
        charge: 100,
        zone: 'default',
        distance: 0,
        estimatedTime: 30
      };
    }
  }

  // Mock implementation - always returns success
  static async requestLocationPermission() {
    try {
      // Return mock permission status
      return {
        granted: true,
        canAskAgain: true,
        status: 'granted'
      };
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied'
      };
    }
  }

  // Mock implementation - always returns success
  static async checkLocationPermission() {
    try {
      // Return mock permission status
      return {
        granted: true,
        canAskAgain: true,
        status: 'granted'
      };
    } catch (error) {
      console.error('Error checking location permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied'
      };
    }
  }

  // Mock implementation - always returns success
  static async enableLocationServices() {
    try {
      // Return mock success
      return true;
    } catch (error) {
      console.error('Error enabling location services:', error);
      return false;
    }
  }

  // Mock implementation - always returns success
  static async getLocationSettings() {
    try {
      // Return mock location settings
      return {
        enabled: true,
        accuracy: 'high',
        backgroundEnabled: false
      };
    } catch (error) {
      console.error('Error getting location settings:', error);
      return {
        enabled: false,
        accuracy: 'low',
        backgroundEnabled: false
      };
    }
  }

  // Mock implementation - always returns success
  static async openLocationSettings() {
    try {
      // Return mock success
      Alert.alert(
        'Location Settings',
        'Location services are enabled. This is a mock implementation.',
        [{ text: 'OK' }]
      );
      return true;
    } catch (error) {
      console.error('Error opening location settings:', error);
      return false;
    }
  }

  // Mock implementation - always returns success
  static async getLastKnownLocation() {
    try {
      // Return mock last known location
      return {
        latitude: 27.7172,
        longitude: 85.3240,
        accuracy: 10,
        timestamp: Date.now() - 300000 // 5 minutes ago
      };
    } catch (error) {
      console.error('Error getting last known location:', error);
      return null;
    }
  }

  // Mock implementation - always returns success
  static async watchPosition(callback) {
    try {
      // Return mock watch ID
      const mockLocation = {
        latitude: 27.7172,
        longitude: 85.3240,
        accuracy: 10,
        timestamp: Date.now()
      };
      
      // Call callback with mock location
      if (callback) {
        callback(mockLocation);
      }
      
      return 1; // Mock watch ID
    } catch (error) {
      console.error('Error watching position:', error);
      return null;
    }
  }

  // Mock implementation - always returns success
  static async clearWatch(watchId) {
    try {
      // Return mock success
      return true;
    } catch (error) {
      console.error('Error clearing watch:', error);
      return false;
    }
  }

  // Mock implementation - always returns success
  static async reverseGeocodeAsync(coordinates) {
    try {
      // Return empty suggestions - user must manually enter address
      return [];
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return [];
    }
  }

  // Mock implementation - always returns success
  static async geocodeAsync(address) {
    try {
      // Return mock coordinates
      return [{
        latitude: 27.7172,
        longitude: 85.3240,
        accuracy: 10
      }];
    } catch (error) {
      console.error('Error geocoding:', error);
      return [];
    }
  }

  // Mock implementation - always returns success
  static async getDistanceBetweenPoints(point1, point2) {
    try {
      // Return mock distance calculation
      const R = 6371; // Earth's radius in kilometers
      const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
      const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      return {
        distance: distance,
        unit: 'km'
      };
    } catch (error) {
      console.error('Error calculating distance:', error);
      return {
        distance: 0,
        unit: 'km'
      };
    }
  }

  // Mock implementation - always returns success
  static async isLocationEnabled() {
    try {
      // Return mock enabled status
      return true;
    } catch (error) {
      console.error('Error checking if location is enabled:', error);
      return false;
    }
  }

  // Mock implementation - always returns success
  static async getLocationAccuracy() {
    try {
      // Return mock accuracy
      return 'high';
    } catch (error) {
      console.error('Error getting location accuracy:', error);
      return 'low';
    }
  }

  // Mock implementation - always returns success
  static async getLocationStatus() {
    try {
      // Return mock status
      return {
        enabled: true,
        permission: 'granted',
        accuracy: 'high',
        backgroundEnabled: false
      };
    } catch (error) {
      console.error('Error getting location status:', error);
      return {
        enabled: false,
        permission: 'denied',
        accuracy: 'low',
        backgroundEnabled: false
      };
    }
  }
}

export default LocationService;
