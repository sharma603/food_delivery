import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { COLORS } from '../utils/constants';
import { addressAPI } from '../services/api';
import LoginStyleInput from '../components/LoginStyleInput';

const { width, height } = Dimensions.get('window');

const AddressManagementScreen = ({ navigation, route }) => {
  // Check if this screen is accessed from cart for order flow
  const fromCart = route?.params?.fromCart || false;
  const [addresses, setAddresses] = useState([]);
  const [filteredAddresses, setFilteredAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef(null);
  
  // Map and location state
  const [location, setLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 27.7172,
    longitude: 85.3240,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [locationPermission, setLocationPermission] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Fetch addresses when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchAddresses();
      getCurrentLocation();
    }, [])
  );

  // MapLibre configuration
  const MAPTILER_API_KEY = 'lgQJObPrjN9YsL1iCEhH';
  const MAPTILER_STYLE_URL = `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_API_KEY}`;

  // Get center coordinates for map
  const getMapCenter = () => {
    if (location) {
      return [location.longitude, location.latitude];
    }
    return [mapRegion.longitude, mapRegion.latitude];
  };

  // Get current location
  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Don't show alert immediately, just set state
        setLocationPermission(false);
        return;
      }
      
      setLocationPermission(true);
      
      // Get current position
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      // Validate coordinates before setting
      if (currentLocation?.coords?.latitude && currentLocation?.coords?.longitude) {
        const { latitude, longitude } = currentLocation.coords;
        
        setLocation({
          latitude,
          longitude,
        });
        
      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.0025,
      });
      }
      
      
    } catch (error) {
      console.error('❌ Error getting location:', error);
      // Don't show alert in catch block to prevent crashes
      setLocationPermission(false);
    } finally {
      setLocationLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await addressAPI.getAllAddresses();
      const fetchedAddresses = response.data || [];
      setAddresses(fetchedAddresses);
      setFilteredAddresses(fetchedAddresses);
    } catch (error) {
      
      let errorMessage = 'Failed to fetch addresses';
      if (error.response?.status === 401) {
        errorMessage = 'Please login again to access your addresses';
      } else if (error.response?.status === 404) {
        errorMessage = 'Address service not available';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter addresses based on search query
  const filterAddresses = (query) => {
    if (!query.trim()) {
      setFilteredAddresses(addresses);
      return;
    }

    const filtered = addresses.filter(address => {
      const searchText = query.toLowerCase();
      return (
        address.street?.toLowerCase().includes(searchText) ||
        address.apartment?.toLowerCase().includes(searchText) ||
        address.city?.toLowerCase().includes(searchText) ||
        address.state?.toLowerCase().includes(searchText) ||
        address.zipCode?.toLowerCase().includes(searchText) ||
        address.label?.toLowerCase().includes(searchText) ||
        address.type?.toLowerCase().includes(searchText) ||
        address.instructions?.toLowerCase().includes(searchText)
      );
    });
    setFilteredAddresses(filtered);
  };

  // Handle search query change
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    filterAddresses(text);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAddresses();
  };

  const handleAddAddress = () => {
    navigation.navigate('AddAddress');
  };

  const handleEditAddress = (address) => {
    try {
      if (!address || !address._id) {
        console.error('Invalid address object:', address);
        Alert.alert('Error', 'Invalid address data');
        return;
      }
      navigation.navigate('AddAddress', { address, isEdit: true });
    } catch (error) {
      console.error('Error navigating to edit address:', error);
      Alert.alert('Error', 'Unable to edit this address');
    }
  };

  const handleDeleteAddress = (addressId) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await addressAPI.deleteAddress(addressId);
              Alert.alert('Success', 'Address deleted successfully');
              fetchAddresses();
            } catch (error) {
              console.error('Error deleting address:', error);
              Alert.alert('Error', error.message || 'Failed to delete address');
            }
          },
        },
      ]
    );
  };

  const getAddressTypeIcon = (type) => {
    switch (type) {
      case 'home':
        return 'home';
      case 'work':
        return 'briefcase';
      case 'other':
        return 'location';
      default:
        return 'location';
    }
  };

  const getAddressTypeColor = (type) => {
    switch (type) {
      case 'home':
        return COLORS.PRIMARY;
      case 'work':
        return COLORS.SUCCESS;
      case 'other':
        return COLORS.WARNING;
      default:
        return COLORS.TEXT_SECONDARY;
    }
  };

  // Handle address selection for order flow
  const handleSelectAddress = (address) => {
    if (fromCart) {
      // Return selected address to cart screen
      navigation.navigate('CartScreen', { selectedAddress: address });
    }
  };

  const AddressCard = ({ address }) => (
    <TouchableOpacity 
      style={styles.addressCard}
      onPress={() => fromCart && handleSelectAddress(address)}
      activeOpacity={fromCart ? 0.7 : 1}
    >
      <View style={styles.addressHeader}>
        <View style={styles.addressTypeContainer}>
          <View
            style={[
              styles.addressTypeIcon,
              { backgroundColor: getAddressTypeColor(address.type) + '20' },
            ]}
          >
            <Ionicons
              name={getAddressTypeIcon(address.type)}
              size={20}
              color={getAddressTypeColor(address.type)}
            />
          </View>
          <View style={styles.addressTypeText}>
            <Text style={styles.addressType}>
              {address.type.charAt(0).toUpperCase() + address.type.slice(1)}
            </Text>
            {address.label && (
              <Text style={styles.addressLabel}>{address.label}</Text>
            )}
          </View>
        </View>
        {!fromCart && (
          <View style={styles.addressActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                try {
                  handleEditAddress(address);
                } catch (error) {
                  console.error('Error handling edit button:', error);
                  Alert.alert('Error', 'Unable to edit this address');
                }
              }}
            >
              <Ionicons name="create-outline" size={20} color={COLORS.PRIMARY} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                try {
                  handleDeleteAddress(address._id);
                } catch (error) {
                  console.error('Error handling delete button:', error);
                  Alert.alert('Error', 'Unable to delete this address');
                }
              }}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.ERROR} />
            </TouchableOpacity>
          </View>
        )}
        {fromCart && (
          <Ionicons name="chevron-forward" size={24} color={COLORS.PRIMARY} />
        )}
      </View>

      <View style={styles.addressDetails}>
        {address.street && (
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={16} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.addressText}>{address.street}</Text>
          </View>
        )}
        {address.apartment && (
          <View style={styles.addressRow}>
            <Ionicons name="business-outline" size={16} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.addressText}>{address.apartment}</Text>
          </View>
        )}
        {(address.city || address.state || address.zipCode) && (
          <View style={styles.addressRow}>
            <Ionicons name="map-outline" size={16} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.addressText}>
              {[address.city, address.state, address.zipCode].filter(Boolean).join(', ')}
            </Text>
          </View>
        )}
        {address.instructions && (
          <View style={styles.instructionsContainer}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.instructionsText}>{address.instructions}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color={COLORS.PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Addresses</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading addresses...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          {fromCart ? 'Select Delivery Address' : 'My Addresses'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {fromCart && (
        <View style={styles.selectModeBanner}>
          <Ionicons name="location" size={20} color={COLORS.PRIMARY} />
          <Text style={styles.selectModeText}>
            Tap an address to select it for your order
          </Text>
        </View>
      )}

      {/* Search Box */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchLabel}>Search Addresses</Text>
        <LoginStyleInput
          placeholder="Search addresses..."
          value={searchQuery}
          onChangeText={handleSearchChange}
          icon="search-outline"
        />
      </View>

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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.PRIMARY]}
              tintColor={COLORS.PRIMARY}
            />
          }
        >
        {/* Google Map Section */}
        <View style={styles.mapContainer}>
          <Text style={styles.mapTitle}>Your Location</Text>
          {locationLoading ? (
            <View style={styles.mapLoadingContainer}>
              <ActivityIndicator size="large" color={COLORS.PRIMARY} />
              <Text style={styles.mapLoadingText}>Getting your location...</Text>
            </View>
          ) : (
            <View style={styles.map}>
              <MapView
                ref={mapRef}
                provider={PROVIDER_DEFAULT}
                style={styles.actualMap}
                initialRegion={location ? {
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.0025,
                } : mapRegion}
                showsUserLocation={true}
                showsMyLocationButton={false}
              >
                {/* CartoDB tiles */}
                <UrlTile
                  urlTemplate="https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
                  maximumZ={19}
                  flipY={false}
                  tileSize={256}
                />

                {/* Current Location */}
                {location && location.latitude && location.longitude && (
                  <Marker
                    coordinate={{
                      latitude: Number(location.latitude),
                      longitude: Number(location.longitude),
                    }}
                    title="Your Location"
                  >
                    <View style={styles.currentLocationMarker}>
                      <Ionicons name="person" size={16} color={COLORS.WHITE} />
                    </View>
                  </Marker>
                )}

                {/* Saved Addresses */}
                {filteredAddresses.map((address) => (
                  address.coordinates?.latitude && address.coordinates?.longitude && (
                    <Marker
                      key={address._id}
                      coordinate={{
                        latitude: Number(address.coordinates.latitude),
                        longitude: Number(address.coordinates.longitude),
                      }}
                      title={String(address.label || address.type || 'Address')}
                      description={String(address.street || '')}
                      onPress={() => {
                        try {
                          handleEditAddress(address);
                        } catch (error) {
                          console.error('Error handling marker press:', error);
                          Alert.alert('Error', 'Unable to open this address');
                        }
                      }}
                    >
                      <View style={[styles.addressMarker, { 
                        backgroundColor: address.type === 'home' ? '#4CAF50' : address.type === 'work' ? '#2196F3' : '#FF9800'
                      }]}>
                        <Ionicons 
                          name={address.type === 'home' ? 'home' : address.type === 'work' ? 'briefcase' : 'location'} 
                          size={16} 
                          color={COLORS.WHITE} 
                        />
                      </View>
                    </Marker>
                  )
                ))}
              </MapView>

              {/* Map overlay */}
              <View style={styles.mapOverlay}>
                <View style={styles.locationBadge}>
                  <Ionicons name="location" size={16} color={COLORS.PRIMARY} />
                  <Text style={styles.locationBadgeText}>
                    {filteredAddresses.length} address{filteredAddresses.length !== 1 ? 'es' : ''}
                  </Text>
                </View>
              </View>
            </View>
          )}
          
          {/* Location permission message */}
          {!locationPermission && !locationLoading && (
            <View style={styles.permissionContainer}>
              <Ionicons name="location-outline" size={40} color={COLORS.TEXT_LIGHT} />
              <Text style={styles.permissionText}>Enable location to see your position on the map</Text>
              <TouchableOpacity style={styles.enableLocationButton} onPress={getCurrentLocation}>
                <Text style={styles.enableLocationText}>Enable Location</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Address List */}
        {filteredAddresses.length > 0 && (
          <View style={styles.addressList}>
            <Text style={styles.addressListTitle}>Your Addresses</Text>
            {filteredAddresses.map((address) => (
              <AddressCard key={address._id} address={address} />
            ))}
          </View>
        )}

        {/* Empty state for search results */}
        {filteredAddresses.length === 0 && searchQuery && (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="search-outline" size={64} color={COLORS.TEXT_LIGHT} />
            </View>
            <Text style={styles.emptyTitle}>No Addresses Found</Text>
            <Text style={styles.emptyText}>
              No addresses match "{searchQuery}". Try a different search term.
            </Text>
          </View>
        )}
        </ScrollView>

        {/* Add Address Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddAddress}>
          <Ionicons name="add" size={24} color={COLORS.WHITE} />
          <Text style={styles.addButtonText}>Add New Address</Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
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
  searchContainer: {
    marginHorizontal: 20,
    marginVertical: 12,
  },
  searchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  mapContainer: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  map: {
    height: 250,
    width: '100%',
  },
  mapLoadingContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  mapLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  permissionContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
    padding: 20,
  },
  permissionText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginVertical: 16,
  },
  enableLocationButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  enableLocationText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
  addressListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
    marginHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  content: {
    flex: 1,
  },
  addressList: {
    padding: 20,
  },
  addressCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  addressTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressTypeText: {
    flex: 1,
  },
  addressType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  addressLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 20,
  },
  addressDetails: {
    gap: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    lineHeight: 20,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.BACKGROUND,
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  instructionsText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    flex: 1,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyIconContainer: {
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 60,
    padding: 24,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomContainer: {
    backgroundColor: COLORS.WHITE,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  addButton: {
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
  addButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  actualMap: {
    width: '100%',
    height: '100%',
  },
  currentLocationMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  addressMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  mapOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationBadge: {
    backgroundColor: COLORS.WHITE,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
    locationBadgeText: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  selectModeBanner: {
    backgroundColor: COLORS.PRIMARY + '15',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 8,
  },
  selectModeText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    flex: 1,
  },
  locationDisplay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.BACKGROUND,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: 12,
    marginBottom: 20,
  },
  locationInfo: {
    backgroundColor: COLORS.WHITE,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  addressesInfo: {
    backgroundColor: COLORS.WHITE,
    padding: 16,
    borderRadius: 12,
    width: '100%',
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  addressPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressPreviewText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: 8,
    flex: 1,
  },
  moreAddresses: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    fontStyle: 'italic',
    marginTop: 4,
  },
});

export default AddressManagementScreen;

