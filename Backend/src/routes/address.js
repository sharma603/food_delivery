import express from 'express';
const router = express.Router();
import {
  getProvinces,
  getDistricts,
  getMunicipalities,
  validateAddress,
  getAddressStatistics,
  getCompleteData
} from '../controllers/addressController.js';

// @route   GET /api/address/provinces
// @desc    Get all provinces of Nepal
// @access  Public
router.get('/provinces', getProvinces);

// @route   GET /api/address/districts/:province
// @desc    Get districts by province
// @access  Public
router.get('/districts/:province', getDistricts);

// @route   GET /api/address/municipalities/:province/:district
// @desc    Get municipalities by province and district
// @access  Public
router.get('/municipalities/:province/:district', getMunicipalities);

// @route   GET /api/address/validate/:province/:district/:municipality
// @desc    Validate complete address
// @access  Public
router.get('/validate/:province/:district/:municipality', validateAddress);

// @route   GET /api/address/statistics
// @desc    Get address statistics
// @access  Public
router.get('/statistics', getAddressStatistics);

// @route   GET /api/address/data
// @desc    Get complete Nepal address data
// @access  Public
router.get('/data', getCompleteData);

export default router;
