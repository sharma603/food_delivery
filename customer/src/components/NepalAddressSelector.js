import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import {
  getProvinces,
  getDistricts,
  getMunicipalities,
  validateAddress
} from '../services/addressService';

const NepalAddressSelector = ({ 
  onAddressSelect, 
  selectedAddress = null,
  placeholder = "Select Address",
  style = {}
}) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [currentStep, setCurrentStep] = useState('province'); // province, district, municipality

  // Initialize with selected address if provided
  useEffect(() => {
    if (selectedAddress) {
      setSelectedProvince(selectedAddress.province || '');
      setSelectedDistrict(selectedAddress.district || '');
      setSelectedMunicipality(selectedAddress.municipality || '');
    }
  }, [selectedAddress]);

  // Load provinces when modal opens
  useEffect(() => {
    if (showModal && provinces.length === 0) {
      loadProvinces();
    }
  }, [showModal]);

  // Load districts when province changes
  useEffect(() => {
    if (selectedProvince && showModal) {
      loadDistricts(selectedProvince);
      setCurrentStep('district');
    }
  }, [selectedProvince]);

  // Load municipalities when district changes
  useEffect(() => {
    if (selectedDistrict && selectedProvince && showModal) {
      loadMunicipalities(selectedProvince, selectedDistrict);
      setCurrentStep('municipality');
    }
  }, [selectedDistrict, selectedProvince]);

  const loadProvinces = async () => {
    setLoading(true);
    try {
      const response = await getProvinces();
      setProvinces(response.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load provinces');
      console.error('Error loading provinces:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDistricts = async (province) => {
    setLoading(true);
    try {
      const response = await getDistricts(province);
      setDistricts(response.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load districts');
      console.error('Error loading districts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMunicipalities = async (province, district) => {
    setLoading(true);
    try {
      const response = await getMunicipalities(province, district);
      setMunicipalities(response.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load municipalities');
      console.error('Error loading municipalities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProvinceSelect = (province) => {
    setSelectedProvince(province.name);
    setSelectedDistrict('');
    setSelectedMunicipality('');
    setDistricts([]);
    setMunicipalities([]);
  };

  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district.name);
    setSelectedMunicipality('');
    setMunicipalities([]);
  };

  const handleMunicipalitySelect = async (municipality) => {
    setSelectedMunicipality(municipality.name);
    
    // Validate the complete address
    try {
      const validation = await validateAddress(selectedProvince, selectedDistrict, municipality.name);
      
      const addressData = {
        province: selectedProvince,
        district: selectedDistrict,
        municipality: municipality.name,
        completeAddress: validation.data.complete_address
      };
      
      onAddressSelect(addressData);
      setShowModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to validate address');
      console.error('Error validating address:', error);
    }
  };

  const resetSelection = () => {
    setSelectedProvince('');
    setSelectedDistrict('');
    setSelectedMunicipality('');
    setDistricts([]);
    setMunicipalities([]);
    setCurrentStep('province');
  };

  const goBack = () => {
    if (currentStep === 'municipality') {
      setCurrentStep('district');
      setSelectedMunicipality('');
      setMunicipalities([]);
    } else if (currentStep === 'district') {
      setCurrentStep('province');
      setSelectedDistrict('');
      setSelectedMunicipality('');
      setDistricts([]);
      setMunicipalities([]);
    }
  };

  const getDisplayText = () => {
    if (selectedMunicipality && selectedDistrict && selectedProvince) {
      return `${selectedMunicipality}, ${selectedDistrict}`;
    } else if (selectedDistrict && selectedProvince) {
      return `${selectedDistrict}, ${selectedProvince}`;
    } else if (selectedProvince) {
      return selectedProvince;
    }
    return placeholder;
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => {
        if (currentStep === 'province') {
          handleProvinceSelect(item);
        } else if (currentStep === 'district') {
          handleDistrictSelect(item);
        } else if (currentStep === 'municipality') {
          handleMunicipalitySelect(item);
        }
      }}
    >
      <Text style={styles.listItemText}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT_LIGHT} />
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={currentStep === 'province' ? () => setShowModal(false) : goBack}
      >
        <Ionicons 
          name={currentStep === 'province' ? 'close' : 'arrow-back'} 
          size={24} 
          color={COLORS.TEXT_PRIMARY} 
        />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>
        {currentStep === 'province' ? 'Select Province' :
         currentStep === 'district' ? 'Select District' :
         'Select Municipality'}
      </Text>
      <TouchableOpacity
        style={styles.resetButton}
        onPress={resetSelection}
      >
        <Text style={styles.resetButtonText}>Reset</Text>
      </TouchableOpacity>
    </View>
  );

  const getCurrentData = () => {
    switch (currentStep) {
      case 'province':
        return provinces;
      case 'district':
        return districts;
      case 'municipality':
        return municipalities;
      default:
        return [];
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowModal(true)}
      >
        <Text style={[styles.selectorText, !selectedProvince && styles.placeholderText]}>
          {getDisplayText()}
        </Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.TEXT_LIGHT} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          {renderHeader()}
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.PRIMARY} />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <FlatList
              data={getCurrentData()}
              renderItem={renderItem}
              keyExtractor={(item, index) => `${item.name}-${index}`}
              style={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: COLORS.WHITE,
  },
  selectorText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  placeholderText: {
    color: COLORS.TEXT_LIGHT,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    textAlign: 'center',
  },
  resetButton: {
    padding: 5,
  },
  resetButtonText: {
    color: COLORS.PRIMARY,
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    backgroundColor: COLORS.WHITE,
  },
  listItemText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
});

export default NepalAddressSelector;
