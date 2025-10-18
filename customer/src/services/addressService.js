import { SERVER_IP, SERVER_PORT } from '../utils/constants';

const BASE_URL = `http://${SERVER_IP}:${SERVER_PORT}/api/v1/address`;

// Get all provinces
export const getProvinces = async () => {
  try {
    const response = await fetch(`${BASE_URL}/provinces`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch provinces');
    }

    return data;
  } catch (error) {
    console.error('Error fetching provinces:', error);
    throw error;
  }
};

// Get districts by province
export const getDistricts = async (province) => {
  try {
    const encodedProvince = encodeURIComponent(province);
    const response = await fetch(`${BASE_URL}/districts/${encodedProvince}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch districts');
    }

    return data;
  } catch (error) {
    console.error('Error fetching districts:', error);
    throw error;
  }
};

// Get municipalities by province and district
export const getMunicipalities = async (province, district) => {
  try {
    const encodedProvince = encodeURIComponent(province);
    const encodedDistrict = encodeURIComponent(district);
    const response = await fetch(`${BASE_URL}/municipalities/${encodedProvince}/${encodedDistrict}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch municipalities');
    }

    return data;
  } catch (error) {
    console.error('Error fetching municipalities:', error);
    throw error;
  }
};

// Validate complete address
export const validateAddress = async (province, district, municipality) => {
  try {
    const encodedProvince = encodeURIComponent(province);
    const encodedDistrict = encodeURIComponent(district);
    const encodedMunicipality = encodeURIComponent(municipality);
    
    const response = await fetch(`${BASE_URL}/validate/${encodedProvince}/${encodedDistrict}/${encodedMunicipality}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to validate address');
    }

    return data;
  } catch (error) {
    console.error('Error validating address:', error);
    throw error;
  }
};

// Get address statistics
export const getAddressStatistics = async () => {
  try {
    const response = await fetch(`${BASE_URL}/statistics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch statistics');
    }

    return data;
  } catch (error) {
    console.error('Error fetching statistics:', error);
    throw error;
  }
};

// Get complete Nepal data
export const getCompleteData = async () => {
  try {
    const response = await fetch(`${BASE_URL}/data`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch complete data');
    }

    return data;
  } catch (error) {
    console.error('Error fetching complete data:', error);
    throw error;
  }
};
