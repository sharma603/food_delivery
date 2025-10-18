import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const nepalData = JSON.parse(readFileSync(join(__dirname, '../../nepal.json'), 'utf8'));

// Get all provinces
const getProvinces = async (req, res) => {
  try {
    const provinces = nepalData.map(province => ({
      name: province.province_name,
      districts_count: province.districts.length
    }));
    
    res.status(200).json({
      success: true,
      message: 'Provinces retrieved successfully',
      data: provinces,
      total: provinces.length
    });
  } catch (error) {
    console.error('Error fetching provinces:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching provinces',
      error: error.message
    });
  }
};

// Get districts by province
const getDistricts = async (req, res) => {
  try {
    const { province } = req.params;
    const decodedProvince = decodeURIComponent(province);
    
    const provinceData = nepalData.find(p => 
      p.province_name.toLowerCase() === decodedProvince.toLowerCase()
    );
    
    if (!provinceData) {
      return res.status(404).json({
        success: false,
        message: 'Province not found'
      });
    }
    
    const districts = provinceData.districts.map(district => ({
      name: district.district_name,
      municipalities_count: district.municipalities.length
    }));
    
    res.status(200).json({
      success: true,
      message: 'Districts retrieved successfully',
      data: districts,
      province: provinceData.province_name,
      total: districts.length
    });
  } catch (error) {
    console.error('Error fetching districts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching districts',
      error: error.message
    });
  }
};

// Get municipalities by province and district
const getMunicipalities = async (req, res) => {
  try {
    const { province, district } = req.params;
    const decodedProvince = decodeURIComponent(province);
    const decodedDistrict = decodeURIComponent(district);
    
    const provinceData = nepalData.find(p => 
      p.province_name.toLowerCase() === decodedProvince.toLowerCase()
    );
    
    if (!provinceData) {
      return res.status(404).json({
        success: false,
        message: 'Province not found'
      });
    }
    
    const districtData = provinceData.districts.find(d => 
      d.district_name.toLowerCase() === decodedDistrict.toLowerCase()
    );
    
    if (!districtData) {
      return res.status(404).json({
        success: false,
        message: 'District not found'
      });
    }
    
    const municipalities = districtData.municipalities.map(municipality => ({
      name: municipality,
      type: municipality.includes('Rural Municipality') ? 'Rural Municipality' : 'Municipality'
    }));
    
    res.status(200).json({
      success: true,
      message: 'Municipalities retrieved successfully',
      data: municipalities,
      province: provinceData.province_name,
      district: districtData.district_name,
      total: municipalities.length
    });
  } catch (error) {
    console.error('Error fetching municipalities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching municipalities',
      error: error.message
    });
  }
};

// Validate complete address
const validateAddress = async (req, res) => {
  try {
    const { province, district, municipality } = req.params;
    const decodedProvince = decodeURIComponent(province);
    const decodedDistrict = decodeURIComponent(district);
    const decodedMunicipality = decodeURIComponent(municipality);
    
    const provinceData = nepalData.find(p => 
      p.province_name.toLowerCase() === decodedProvince.toLowerCase()
    );
    
    if (!provinceData) {
      return res.status(404).json({
        success: false,
        message: 'Province not found'
      });
    }
    
    const districtData = provinceData.districts.find(d => 
      d.district_name.toLowerCase() === decodedDistrict.toLowerCase()
    );
    
    if (!districtData) {
      return res.status(404).json({
        success: false,
        message: 'District not found'
      });
    }
    
    const municipalityExists = districtData.municipalities.some(m => 
      m.toLowerCase() === decodedMunicipality.toLowerCase()
    );
    
    if (!municipalityExists) {
      return res.status(404).json({
        success: false,
        message: 'Municipality not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Address validated successfully',
      data: {
        province: provinceData.province_name,
        district: districtData.district_name,
        municipality: decodedMunicipality,
        complete_address: `${decodedMunicipality}, ${districtData.district_name}, ${provinceData.province_name}, Nepal`
      }
    });
  } catch (error) {
    console.error('Error validating address:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating address',
      error: error.message
    });
  }
};

// Get address statistics
const getAddressStatistics = async (req, res) => {
  try {
    const totalProvinces = nepalData.length;
    const totalDistricts = nepalData.reduce((total, province) => total + province.districts.length, 0);
    const totalMunicipalities = nepalData.reduce((total, province) => 
      total + province.districts.reduce((distTotal, district) => 
        distTotal + district.municipalities.length, 0), 0);
    
    const provinceStats = nepalData.map(province => ({
      name: province.province_name,
      districts: province.districts.length,
      municipalities: province.districts.reduce((total, district) => 
        total + district.municipalities.length, 0)
    }));
    
    res.status(200).json({
      success: true,
      message: 'Address statistics retrieved successfully',
      data: {
        total_provinces: totalProvinces,
        total_districts: totalDistricts,
        total_municipalities: totalMunicipalities,
        provinces: provinceStats
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

// Get complete Nepal data
const getCompleteData = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Complete Nepal address data retrieved successfully',
      data: nepalData
    });
  } catch (error) {
    console.error('Error fetching complete data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching complete data',
      error: error.message
    });
  }
};

export {
  getProvinces,
  getDistricts,
  getMunicipalities,
  validateAddress,
  getAddressStatistics,
  getCompleteData
};
