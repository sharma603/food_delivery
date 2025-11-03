import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AppConfig from '../config/appConfig';

const API_BASE_URL = `${AppConfig.API.BACKEND_BASE_URL}/api/v1/address`;

const NepalAddressSelector = ({ 
  onAddressSelect, 
  selectedAddress = null,
  placeholder = "Select Address",
  className = ""
}) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [currentStep, setCurrentStep] = useState('province');

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
      const response = await axios.get(`${API_BASE_URL}/provinces`);
      setProvinces(response.data.data || []);
    } catch (error) {
      console.error('Error loading provinces:', error);
      alert('Failed to load provinces');
    } finally {
      setLoading(false);
    }
  };

  const loadDistricts = async (province) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/districts/${encodeURIComponent(province)}`);
      setDistricts(response.data.data || []);
    } catch (error) {
      console.error('Error loading districts:', error);
      alert('Failed to load districts');
    } finally {
      setLoading(false);
    }
  };

  const loadMunicipalities = async (province, district) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/municipalities/${encodeURIComponent(province)}/${encodeURIComponent(district)}`
      );
      setMunicipalities(response.data.data || []);
    } catch (error) {
      console.error('Error loading municipalities:', error);
      alert('Failed to load municipalities');
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
      const response = await axios.get(
        `${API_BASE_URL}/validate/${encodeURIComponent(selectedProvince)}/${encodeURIComponent(selectedDistrict)}/${encodeURIComponent(municipality.name)}`
      );
      
      const addressData = {
        province: selectedProvince,
        district: selectedDistrict,
        municipality: municipality.name,
        completeAddress: response.data.data.complete_address
      };
      
      onAddressSelect(addressData);
      setShowModal(false);
    } catch (error) {
      console.error('Error validating address:', error);
      alert('Failed to validate address');
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

  const getCurrentTitle = () => {
    switch (currentStep) {
      case 'province':
        return 'Select Province';
      case 'district':
        return 'Select District';
      case 'municipality':
        return 'Select Municipality';
      default:
        return 'Select Address';
    }
  };

  return (
    <div className={`nepal-address-selector ${className}`}>
      <button
        onClick={() => setShowModal(true)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-colors"
      >
        <div className="flex justify-between items-center">
          <span className={`${!selectedProvince ? 'text-gray-500' : 'text-gray-900'}`}>
            {getDisplayText()}
          </span>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <button
                onClick={currentStep === 'province' ? () => setShowModal(false) : goBack}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                {currentStep === 'province' ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                )}
              </button>
              <h3 className="text-lg font-semibold">{getCurrentTitle()}</h3>
              <button
                onClick={resetSelection}
                className="text-blue-600 hover:text-blue-800 px-2 py-1"
              >
                Reset
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading...</span>
                </div>
              ) : (
                <div className="divide-y">
                  {getCurrentData().map((item, index) => (
                    <button
                      key={`${item.name}-${index}`}
                      onClick={() => {
                        if (currentStep === 'province') {
                          handleProvinceSelect(item);
                        } else if (currentStep === 'district') {
                          handleDistrictSelect(item);
                        } else if (currentStep === 'municipality') {
                          handleMunicipalitySelect(item);
                        }
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-gray-900">{item.name}</span>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NepalAddressSelector;
