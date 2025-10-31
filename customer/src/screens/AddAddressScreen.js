import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { COLORS, MAP_API_KEYS } from '../utils/constants';
import { addressAPI } from '../services/api';
import LoginStyleInput from '../components/LoginStyleInput';
import NepalAddressSelector from '../components/NepalAddressSelector';

const { width, height } = Dimensions.get('window');

const AddAddressScreen = ({ navigation, route }) => {
  const { address, isEdit } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [useNepalSelector, setUseNepalSelector] = useState(true);
  const [showMap, setShowMap] = useState(false); // Toggle between map and form view
  const streetInputRef = useRef(null);
  const mapRef = useRef(null);
  
  // Form data state
  const [formData, setFormData] = useState({
    type: 'home',
    label: '',
    street: '',
    apartment: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Nepal',
    instructions: '',
    isDefault: false,
  });

  // Map-related state
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [startMarker, setStartMarker] = useState(null); // First marker (start point)
  const [destinationMarker, setDestinationMarker] = useState(null); // Second marker (destination)
  const [routeCoordinates, setRouteCoordinates] = useState([]); // Route polyline
  const [fetchingRoute, setFetchingRoute] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 0, // No default location - user must select
    longitude: 0,
    latitudeDelta: 0.005,
    longitudeDelta: 0.0025,
  });

  useEffect(() => {
    if (isEdit && address) {
      setFormData({
        type: address.type || 'home',
        label: address.label || '',
        street: address.street || '',
        apartment: address.apartment || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.zipCode || '',
        country: address.country || 'Nepal',
        instructions: address.instructions || '',
        isDefault: address.isDefault || false,
      });
      
      // If address has coordinates, set them as start marker
      if (address.coordinates?.latitude && address.coordinates?.longitude) {
        setStartMarker({
          latitude: address.coordinates.latitude,
          longitude: address.coordinates.longitude,
        });
      }
    }
  }, [isEdit, address]);

  /**
   * Request location permission and get current user location
   * FAST VERSION: Shows map immediately, gets location in background
   */
  useEffect(() => {
    (async () => {
      try {
        // Show map immediately with default location
        setLoadingLocation(false);
        
        // Request location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setLocationPermission(false);
          return;
        }
        
        setLocationPermission(true);
        
        // Try to get last known location first (instant!)
        try {
          const lastKnown = await Location.getLastKnownPositionAsync({
            maxAge: 60000, // Accept location up to 1 minute old
          });
          
          if (lastKnown) {
          // Validate coordinates
          if (lastKnown?.coords?.latitude && lastKnown?.coords?.longitude) {
            const { latitude, longitude } = lastKnown.coords;
            setCurrentLocation({ latitude, longitude });
            setMapRegion({
              latitude,
              longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.0025,
            });
            if (!isEdit) {
              setStartMarker({ latitude, longitude });
            }
            console.log('Using last known location (instant)');
            return; // Got it instantly, no need to wait for GPS
          }
        }
        } catch (e) {
          console.log('No last known location');
        }
        
        // If no cached location, get fresh one (but don't block the UI)
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Lowest, // Fastest possible
          maximumAge: 30000,
          timeout: 3000, // 3 sec max
        }).then(location => {
          // Validate coordinates
          if (location?.coords?.latitude && location?.coords?.longitude) {
            const { latitude, longitude } = location.coords;
            setCurrentLocation({ latitude, longitude });
            setMapRegion({
              latitude,
              longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.0025,
            });
            
            if (!isEdit && !startMarker) {
              setStartMarker({ latitude, longitude });
            }
            console.log('Got fresh GPS location');
          }
        }).catch(() => {
          console.log('GPS timeout, using default location');
        });
        
      } catch (error) {
        console.error('Error with location:', error);
        setLoadingLocation(false);
      }
    })();
  }, [isEdit]);

  /**
   * Fetch driving route from OSRM API when both markers are set
   */
  useEffect(() => {
    if (startMarker && destinationMarker) {
      fetchRoute();
    } else {
      // Clear route if markers are removed
      setRouteCoordinates([]);
    }
  }, [startMarker, destinationMarker]);

  /**
   * Fetch route from GraphHopper API
   * Uses GraphHopper API for navigation with turn-by-turn instructions
   */
  const fetchRoute = async () => {
    try {
      setFetchingRoute(true);
      
      const { longitude: lon1, latitude: lat1 } = startMarker;
      const { longitude: lon2, latitude: lat2 } = destinationMarker;
      
      // GraphHopper API endpoint with your API key
      const url = `${MAP_API_KEYS.GRAPHHOPPER_BASE_URL}/route?` +
        `point=${lat1},${lon1}&` +
        `point=${lat2},${lon2}&` +
        `profile=car&` +
        `locale=en&` +
        `instructions=true&` +
        `points_encoded=false&` +
        `key=${MAP_API_KEYS.GRAPHHOPPER_API_KEY}`;
      
      console.log('Fetching route from GraphHopper:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('GraphHopper response:', JSON.stringify(data, null, 2));
      
      if (data.paths && data.paths.length > 0) {
        const path = data.paths[0];
        
        // Extract coordinates from GraphHopper format
        const coordinates = path.points.coordinates.map(coord => ({
          latitude: coord[1],
          longitude: coord[0],
        }));
        
        setRouteCoordinates(coordinates);
        
        // Fit map to show entire route
        if (mapRef.current && coordinates.length > 0) {
          mapRef.current.fitToCoordinates(coordinates, {
            edgePadding: {
              top: 100,
              right: 50,
              bottom: 300,
              left: 50,
            },
            animated: true,
          });
        }
        
        // Get route info
        const distance = (path.distance / 1000).toFixed(2); // km
        const duration = Math.round(path.time / 1000 / 60); // minutes
        
        // Extract turn-by-turn instructions
        let instructionsText = '';
        if (path.instructions && path.instructions.length > 0) {
          instructionsText = '\n\nTurn-by-turn:\n';
          path.instructions.slice(0, 5).forEach((instruction, index) => {
            const dist = (instruction.distance / 1000).toFixed(1);
            instructionsText += `${index + 1}. ${instruction.text} (${dist} km)\n`;
          });
          if (path.instructions.length > 5) {
            instructionsText += `... and ${path.instructions.length - 5} more steps`;
          }
        }
        
        Alert.alert(
          '🗺️ Route Found!',
          `Distance: ${distance} km\n` +
          `Estimated time: ${duration} minutes\n` +
          `Via: ${path.snapped_waypoints?.coordinates ? 'Optimized route' : 'Direct route'}` +
          instructionsText,
          [{ text: 'OK' }]
        );
        
        console.log('Route calculated successfully:', {
          distance: `${distance} km`,
          duration: `${duration} min`,
          points: coordinates.length,
          instructions: path.instructions?.length || 0
        });
        
      } else if (data.message) {
        // GraphHopper error message
        Alert.alert('Route Error', data.message);
        setRouteCoordinates([]);
      } else {
        Alert.alert('Route Error', 'Could not find a route between the two points.');
        setRouteCoordinates([]);
      }
      
    } catch (error) {
      console.error('Error fetching route from GraphHopper:', error);
      Alert.alert(
        'Navigation Error',
        'Failed to fetch route. Please check your internet connection and try again.'
      );
      setRouteCoordinates([]);
    } finally {
      setFetchingRoute(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNepalAddressSelect = (addressData) => {
    setFormData((prev) => ({
      ...prev,
      city: addressData.municipality || '',
      state: addressData.province || '',
      // You can use district as additional info if needed
    }));
  };

  /**
   * Handle long press on map to drop a marker
   * First long press sets start marker, second sets destination
   */
  const handleMapLongPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    if (!startMarker) {
      // First marker - set as start point
      setStartMarker({ latitude, longitude });
      Alert.alert('Start Point Set', `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`);
    } else if (!destinationMarker) {
      // Second marker - set as destination
      setDestinationMarker({ latitude, longitude });
      Alert.alert('Destination Set', `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`);
    } else {
      // Both markers already set, reset and start over
      Alert.alert(
        'Reset Markers',
        'Both markers are already set. Do you want to reset and start over?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reset',
            onPress: () => {
              setStartMarker({ latitude, longitude });
              setDestinationMarker(null);
              setRouteCoordinates([]);
            },
          },
        ]
      );
    }
  };

  /**
   * Center map on current location
   */
  const centerOnCurrentLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...currentLocation,
        latitudeDelta: 0.005,
        longitudeDelta: 0.0025,
      }, 1000);
    }
  };

  /**
   * Clear all markers and route
   */
  const clearMarkers = () => {
    setStartMarker(null);
    setDestinationMarker(null);
    setRouteCoordinates([]);
  };

  /**
   * Use selected location to fill form
   */
  const useMapLocation = () => {
    if (startMarker) {
      // In a real app, you'd use reverse geocoding to get address from coordinates
      // For now, just store the coordinates
      Alert.alert(
        'Location Selected',
        'Coordinates saved. You can now fill in the rest of the address details.',
        [{ text: 'OK', onPress: () => setShowMap(false) }]
      );
    } else {
      Alert.alert('No Location', 'Please select a location on the map first.');
    }
  };

  const validateForm = () => {
    if (!formData.street.trim()) {
      Alert.alert('Error', 'Please enter street address');
      return false;
    }
    if (!formData.city.trim()) {
      Alert.alert('Error', 'Please enter city');
      return false;
    }
    if (!formData.state.trim()) {
      Alert.alert('Error', 'Please enter state/province');
      return false;
    }
    if (!formData.zipCode.trim()) {
      Alert.alert('Error', 'Please enter zip/postal code');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Include coordinates if start marker is set and has valid numeric values
      const addressData = {
        ...formData,
        coordinates: (startMarker && 
          typeof startMarker.latitude === 'number' && 
          typeof startMarker.longitude === 'number') ? {
          latitude: Number(startMarker.latitude),
          longitude: Number(startMarker.longitude),
        } : undefined,
      };
      
      if (isEdit && address) {
        await addressAPI.updateAddress(address._id, addressData);
        Alert.alert('Success', 'Address updated successfully');
      } else {
        await addressAPI.addAddress(addressData);
        Alert.alert('Success', 'Address added successfully');
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const AddressTypeButton = ({ type, icon, label }) => (
    <TouchableOpacity
      style={[
        styles.typeButton,
        formData.type === type && styles.typeButtonActive,
      ]}
      onPress={() => handleInputChange('type', type)}
    >
      <Ionicons
        name={icon}
        size={24}
        color={formData.type === type ? COLORS.WHITE : COLORS.PRIMARY}
      />
      <Text
        style={[
          styles.typeButtonText,
          formData.type === type && styles.typeButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );


  // Render Map View
  const renderMapView = () => {
    if (loadingLocation) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      );
    }

    if (!locationPermission) {
      return (
        <View style={styles.permissionContainer}>
          <Ionicons name="location-outline" size={80} color={COLORS.TEXT_SECONDARY} />
          <Text style={styles.permissionText}>Location permission is required</Text>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={() => {
              Alert.alert(
                'Location Permission',
                'Please enable location access in your device settings.',
                [{ text: 'OK' }]
              );
            }}
          >
            <Text style={styles.permissionButtonText}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.mapContainer}>
        {/* Map with OpenStreetMap tiles */}
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          initialRegion={mapRegion}
          onLongPress={handleMapLongPress}
          showsUserLocation={true}
          showsMyLocationButton={false}
          loadingEnabled={true}
          mapType="standard"
        >
          {/* Use CartoDB tiles instead of OSM (no blocking issues) */}
          <UrlTile
            urlTemplate="https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
            tileSize={256}
          />

          {/* Current Location Marker (Blue) */}
          {currentLocation && (
            <Marker
              coordinate={currentLocation}
              title="Your Location"
              description="You are here"
              pinColor="blue"
            >
              <View style={styles.currentLocationMarker}>
                <Ionicons name="person" size={20} color={COLORS.WHITE} />
              </View>
            </Marker>
          )}

          {/* Start Marker (Green) */}
          {startMarker && (
            <Marker
              coordinate={startMarker}
              title="Start Point"
              description={`Lat: ${startMarker.latitude.toFixed(6)}, Lon: ${startMarker.longitude.toFixed(6)}`}
              pinColor="green"
            >
              <View style={styles.startMarker}>
                <Ionicons name="flag" size={24} color={COLORS.WHITE} />
              </View>
            </Marker>
          )}

          {/* Destination Marker (Red) */}
          {destinationMarker && (
            <Marker
              coordinate={destinationMarker}
              title="Destination"
              description={`Lat: ${destinationMarker.latitude.toFixed(6)}, Lon: ${destinationMarker.longitude.toFixed(6)}`}
              pinColor="red"
            >
              <View style={styles.destinationMarker}>
                <Ionicons name="location" size={24} color={COLORS.WHITE} />
              </View>
            </Marker>
          )}

          {/* Route Polyline */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={COLORS.PRIMARY}
              strokeWidth={4}
              lineDashPattern={[1]}
            />
          )}
        </MapView>

        {/* Map Controls Overlay */}
        <View style={styles.mapControls}>
          {/* Coordinates Display */}
          <View style={styles.coordinatesPanel}>
            <Text style={styles.coordinatesTitle}>Selected Coordinates</Text>
            {startMarker && (
              <View style={styles.coordinateRow}>
                <Ionicons name="flag" size={16} color="#4CAF50" />
                <Text style={styles.coordinateText}>
                  Start: {startMarker.latitude.toFixed(6)}, {startMarker.longitude.toFixed(6)}
                </Text>
              </View>
            )}
            {destinationMarker && (
              <View style={styles.coordinateRow}>
                <Ionicons name="location" size={16} color="#f44336" />
                <Text style={styles.coordinateText}>
                  Dest: {destinationMarker.latitude.toFixed(6)}, {destinationMarker.longitude.toFixed(6)}
                </Text>
              </View>
            )}
            {!startMarker && !destinationMarker && (
              <Text style={styles.coordinateHint}>
                Long press on map to drop markers
              </Text>
            )}
            {fetchingRoute && (
              <View style={styles.fetchingRoute}>
                <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                <Text style={styles.fetchingText}>Fetching route...</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.mapButtonsContainer}>
            <TouchableOpacity
              style={[styles.mapButton, styles.locationButton]}
              onPress={centerOnCurrentLocation}
            >
              <Ionicons name="locate" size={24} color={COLORS.WHITE} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mapButton, styles.clearButton]}
              onPress={clearMarkers}
            >
              <Ionicons name="refresh" size={24} color={COLORS.WHITE} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mapButton, styles.useLocationButton]}
              onPress={useMapLocation}
            >
              <Ionicons name="checkmark-circle" size={24} color={COLORS.WHITE} />
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsPanel}>
            <Text style={styles.instructionText}>
              📍 Long press to drop markers (Start → Destination)
            </Text>
            {routeCoordinates.length > 0 && (
              <Text style={styles.instructionText}>
                ✅ Route displayed in orange
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
          <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={COLORS.PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? 'Edit Address' : 'Add New Address'}
        </Text>
        <TouchableOpacity
          style={styles.headerRight}
          onPress={() => setShowMap(!showMap)}
        >
          <Ionicons 
            name={showMap ? "list" : "map"} 
            size={24} 
            color={COLORS.PRIMARY} 
          />
        </TouchableOpacity>
      </View>

      {/* Toggle between Map and Form */}
      {showMap ? (
        renderMapView()
      ) : (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
        {/* Address Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address Type</Text>
          <View style={styles.typeContainer}>
            <AddressTypeButton type="home" icon="home" label="Home" />
            <AddressTypeButton type="work" icon="briefcase" label="Work" />
            <AddressTypeButton type="other" icon="location" label="Other" />
          </View>
        </View>

        {/* Label (Optional) */}
        <View style={styles.section}>
          <Text style={styles.inputLabel}>Label (Optional)</Text>
          <LoginStyleInput
            placeholder="e.g., Mom's House, Office Building"
            value={formData.label}
            onChangeText={(value) => handleInputChange('label', value)}
            icon="pricetag-outline"
          />
        </View>

        {/* Address Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Address Details</Text>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Use Nepal Selector</Text>
              <Switch
                value={useNepalSelector}
                onValueChange={setUseNepalSelector}
                trackColor={{ false: '#767577', true: COLORS.PRIMARY_LIGHT }}
                thumbColor={useNepalSelector ? COLORS.PRIMARY : '#f4f3f4'}
              />
            </View>
          </View>
          
          <Text style={styles.inputLabel}>Street Address *</Text>
          <LoginStyleInput
            placeholder="Enter street address"
            value={formData.street}
            onChangeText={(value) => handleInputChange('street', value)}
            icon="location-outline"
          />

          <Text style={styles.inputLabel}>Apartment, Suite, etc. (Optional)</Text>
          <LoginStyleInput
            placeholder="Apt, Suite, Unit, Building, Floor"
            value={formData.apartment}
            onChangeText={(value) => handleInputChange('apartment', value)}
            icon="business-outline"
          />

          {useNepalSelector ? (
            <>
              <Text style={styles.inputLabel}>Province & Municipality *</Text>
              <NepalAddressSelector
                onAddressSelect={handleNepalAddressSelect}
                selectedAddress={{
                  province: formData.state,
                  municipality: formData.city,
                }}
                placeholder="Select Province, District, Municipality"
              />
              <Text style={styles.helperText}>
                Select your province, district, and municipality from Nepal's administrative divisions
              </Text>
            </>
          ) : (
            <>
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.inputLabel}>City *</Text>
                  <LoginStyleInput
                    placeholder="City"
                    value={formData.city}
                    onChangeText={(value) => handleInputChange('city', value)}
                    icon="map-outline"
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Text style={styles.inputLabel}>State/Province *</Text>
                  <LoginStyleInput
                    placeholder="State"
                    value={formData.state}
                    onChangeText={(value) => handleInputChange('state', value)}
                    icon="map-outline"
                  />
                </View>
              </View>
            </>
          )}

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.inputLabel}>Zip/Postal Code *</Text>
              <LoginStyleInput
                placeholder="Zip Code"
                value={formData.zipCode}
                onChangeText={(value) => handleInputChange('zipCode', value)}
                keyboardType="numeric"
                icon="mail-outline"
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.inputLabel}>Country</Text>
              <LoginStyleInput
                placeholder="Country"
                value={formData.country}
                onChangeText={(value) => handleInputChange('country', value)}
                icon="earth-outline"
              />
            </View>
          </View>
        </View>

        {/* Delivery Instructions */}
        <View style={styles.section}>
          <Text style={styles.inputLabel}>Delivery Instructions (Optional)</Text>
          <LoginStyleInput
            placeholder="e.g., Ring the doorbell, Leave at door, Call on arrival"
            value={formData.instructions}
            onChangeText={(value) => handleInputChange('instructions', value)}
            multiline
            numberOfLines={3}
            icon="information-circle-outline"
          />
          <Text style={styles.helperText}>
            Help delivery person find your location easily
          </Text>
        </View>

        {/* Set as Default Address */}
        <View style={styles.section}>
          <View style={styles.defaultAddressContainer}>
            <View style={styles.defaultAddressText}>
              <Ionicons name="star" size={20} color={COLORS.PRIMARY} />
              <Text style={styles.defaultAddressLabel}>Set as Default Address</Text>
            </View>
            <Switch
              value={formData.isDefault}
              onValueChange={(value) => handleInputChange('isDefault', value)}
              trackColor={{ false: '#767577', true: COLORS.PRIMARY_LIGHT }}
              thumbColor={formData.isDefault ? COLORS.PRIMARY : '#f4f3f4'}
            />
          </View>
          <Text style={styles.helperText}>
            This address will be used as your primary delivery location
          </Text>
        </View>

        <View style={styles.spacer} />
        </ScrollView>

        {/* Save Button */}
        <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.WHITE} />
          ) : (
            <>
              <Ionicons name="checkmark" size={24} color={COLORS.WHITE} />
              <Text style={styles.saveButtonText}>
                {isEdit ? 'Update Address' : 'Save Address'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  typeButtonActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  typeButtonTextActive: {
    color: COLORS.WHITE,
  },
  inputFieldContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 8,
    fontStyle: 'italic',
  },
  defaultAddressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  defaultAddressText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  defaultAddressLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  spacer: {
    height: 40,
  },
  bottomContainer: {
    backgroundColor: COLORS.WHITE,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Map-related styles
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
    padding: 20,
  },
  permissionText: {
    marginTop: 20,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  permissionButton: {
    marginTop: 20,
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  mapControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  coordinatesPanel: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 12,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  coordinatesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  coordinateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  coordinateText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: 8,
    flex: 1,
  },
  coordinateHint: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 4,
  },
  fetchingRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  fetchingText: {
    marginLeft: 8,
    fontSize: 12,
    color: COLORS.PRIMARY,
  },
  mapButtonsContainer: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    gap: 12,
  },
  mapButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  locationButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  clearButton: {
    backgroundColor: '#ff9800',
  },
  useLocationButton: {
    backgroundColor: '#4CAF50',
  },
  instructionsPanel: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 80,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    padding: 10,
  },
  instructionText: {
    fontSize: 11,
    color: COLORS.WHITE,
    marginVertical: 2,
  },
  currentLocationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.WHITE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  startMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.WHITE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  destinationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.WHITE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});

export default AddAddressScreen;

