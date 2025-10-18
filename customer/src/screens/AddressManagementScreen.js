import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
// import MapLibreGL from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { COLORS } from '../utils/constants';
import { addressAPI } from '../services/api';

const { width, height } = Dimensions.get('window');

const AddressManagementScreen = ({ navigation }) => {
  const [addresses, setAddresses] = useState([]);
  const [filteredAddresses, setFilteredAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
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
        Alert.alert(
          'Permission Denied',
          'Location permission is required to show your current location on the map.',
          [{ text: 'OK' }]
        );
        setLocationPermission(false);
        return;
      }
      
      setLocationPermission(true);
      
      // Get current position
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const { latitude, longitude } = currentLocation.coords;
      
      setLocation({
        latitude,
        longitude,
      });
      
      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      
      console.log('📍 Current location:', { latitude, longitude });
      
    } catch (error) {
      console.error('❌ Error getting location:', error);
      Alert.alert('Error', 'Unable to get your current location');
    } finally {
      setLocationLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching addresses...');
      const response = await addressAPI.getAllAddresses();
      console.log('✅ Addresses response:', response);
      const fetchedAddresses = response.data || [];
      setAddresses(fetchedAddresses);
      setFilteredAddresses(fetchedAddresses);
      console.log(`📍 Loaded ${fetchedAddresses.length} addresses`);
    } catch (error) {
      console.error('❌ Error fetching addresses:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      
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
    navigation.navigate('AddAddress', { address, isEdit: true });
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

  const AddressCard = ({ address }) => (
    <View style={styles.addressCard}>
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
        <View style={styles.addressActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditAddress(address)}
          >
            <Ionicons name="create-outline" size={20} color={COLORS.PRIMARY} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteAddress(address._id)}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.ERROR} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.addressDetails}>
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={16} color={COLORS.TEXT_SECONDARY} />
          <Text style={styles.addressText}>{address.street}</Text>
        </View>
        {address.apartment && (
          <View style={styles.addressRow}>
            <Ionicons name="business-outline" size={16} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.addressText}>{address.apartment}</Text>
          </View>
        )}
        <View style={styles.addressRow}>
          <Ionicons name="map-outline" size={16} color={COLORS.TEXT_SECONDARY} />
          <Text style={styles.addressText}>
            {address.city}, {address.state} {address.zipCode}
          </Text>
        </View>
        {address.instructions && (
          <View style={styles.instructionsContainer}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.instructionsText}>{address.instructions}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.PRIMARY} />
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
          <Ionicons name="arrow-back" size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Addresses</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Box */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchLabel}>Search Addresses</Text>
        <TouchableOpacity 
          style={[
            styles.searchInputContainer,
            searchQuery.length > 0 && styles.searchInputContainerFocused
          ]}
          activeOpacity={1}
          onPress={() => {
            // Force focus on the TextInput when container is tapped
            console.log('📱 Search container tapped');
          }}
          delayPressIn={0}
        >
          <Ionicons 
            name="search-outline" 
            size={20} 
            color={searchQuery.length > 0 ? COLORS.PRIMARY : "#666"} 
            style={styles.searchIcon} 
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search addresses..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            blurOnSubmit={false}
            autoCorrect={false}
            autoCapitalize="none"
            textContentType="none"
            editable={true}
            selectTextOnFocus={false}
            caretHidden={false}
            autoFocus={false}
            keyboardShouldPersistTaps="handled"
            underlineColorAndroid="transparent"
            importantForAutofill="no"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearchChange('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={COLORS.TEXT_LIGHT} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
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
              <View style={styles.locationDisplay}>
                <Ionicons name="location" size={40} color={COLORS.PRIMARY} />
                <Text style={styles.locationTitle}>Your Location</Text>
                
                {location && (
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationText}>
                      Latitude: {location.latitude.toFixed(6)}
                    </Text>
                    <Text style={styles.locationText}>
                      Longitude: {location.longitude.toFixed(6)}
                    </Text>
                  </View>
                )}
                
                {filteredAddresses.length > 0 && (
                  <View style={styles.addressesInfo}>
                    <Text style={styles.addressesTitle}>
                      Saved Addresses ({filteredAddresses.length})
                    </Text>
                    {filteredAddresses.slice(0, 3).map((address, index) => (
                      <View key={address._id} style={styles.addressPreview}>
                        <Ionicons 
                          name={address.type === 'home' ? 'home' : address.type === 'work' ? 'briefcase' : 'location'} 
                          size={16} 
                          color={address.type === 'home' ? '#4CAF50' : address.type === 'work' ? '#2196F3' : '#FF9800'} 
                        />
                        <Text style={styles.addressPreviewText}>
                          {address.label || address.type} - {address.city}
                        </Text>
                      </View>
                    ))}
                    {filteredAddresses.length > 3 && (
                      <Text style={styles.moreAddresses}>
                        +{filteredAddresses.length - 3} more addresses
                      </Text>
                    )}
                  </View>
                )}
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
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    height: 56,
    minHeight: 56,
  },
  searchInputContainerFocused: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: '#fff',
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
    paddingVertical: 0,
    minHeight: 24,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
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
  currentLocationMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addressMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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

