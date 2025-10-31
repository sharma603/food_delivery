import * as Location from 'expo-location';
import { Alert } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

class LocationService {
  private watchId: Location.LocationSubscription | null = null;
  private isTracking = false;
  private onLocationUpdate?: (location: LocationData) => void;

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to track deliveries and receive orders.',
          [{ text: 'OK' }]
        );
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus !== 'granted') {
        Alert.alert(
          'Background Permission',
          'Background location permission is recommended for better tracking.',
          [{ text: 'OK' }]
        );
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async startTracking(onLocationUpdate: (location: LocationData) => void) {
    if (this.isTracking) return;

    this.onLocationUpdate = onLocationUpdate;
    this.isTracking = true;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    // watchPositionAsync returns a Promise<LocationSubscription>
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // Update every 10 seconds
        distanceInterval: 10, // Update every 10 meters
      },
      (location) => {
        const locationData: LocationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || undefined,
          timestamp: location.timestamp,
        };

        this.onLocationUpdate?.(locationData);
      }
    );

    this.watchId = subscription;
  }

  stopTracking() {
    try {
      if (this.watchId && typeof (this.watchId as any).remove === 'function') {
        (this.watchId as any).remove();
      }
    } catch {}
    this.watchId = null;
    this.isTracking = false;
    this.onLocationUpdate = undefined;
  }

  async getAddressFromCoordinates(latitude: number, longitude: number): Promise<string> {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses.length > 0) {
        const address = addresses[0];
        return `${address.street || ''} ${address.city || ''} ${address.region || ''}`.trim();
      }
      return 'Unknown location';
    } catch (error) {
      console.error('Error getting address:', error);
      return 'Unknown location';
    }
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const locationService = new LocationService();
