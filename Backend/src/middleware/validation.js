import { body, validationResult } from 'express-validator';
import responseHandler from '../utils/responseHandler.js';

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    const errorMessages = errors.array().map(err => err.msg);
    console.log('Error messages:', errorMessages);
    return responseHandler.validationErrorResponse(res, errorMessages, 'Validation failed');
  }
  next();
};

// Zone validation
const validateZone = [
  body('name')
    .notEmpty()
    .withMessage('Zone name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Zone name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('areas')
    .isArray({ min: 1 })
    .withMessage('At least one area is required')
    .custom((areas) => {
      if (!Array.isArray(areas) || areas.length === 0) {
        throw new Error('Areas must be a non-empty array');
      }
      for (const area of areas) {
        if (typeof area !== 'string' || area.trim().length === 0) {
          throw new Error('Each area must be a non-empty string');
        }
      }
      return true;
    }),
  
  body('pincodes')
    .optional()
    .isArray()
    .withMessage('Pincodes must be an array')
    .custom((pincodes) => {
      if (pincodes && Array.isArray(pincodes)) {
        for (const pincode of pincodes) {
          if (typeof pincode !== 'string' || !/^\d{4,5}$/.test(pincode)) {
            throw new Error('Each pincode must be a 4 or 5-digit string');
          }
        }
      }
      return true;
    }),
  
  body('deliveryCharge')
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Delivery charge must be between 0 and 1000'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'maintenance'])
    .withMessage('Status must be active, inactive, or maintenance'),
  
  body('coverage')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Coverage cannot exceed 100 characters'),
  
  body('estimatedDeliveryTime')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Estimated delivery time cannot exceed 100 characters'),
  
  body('coordinates.center.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('coordinates.center.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  handleValidationErrors
];

// Personnel validation
const validatePersonnel = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('employeeId')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Employee ID must be between 3 and 20 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Employee ID must contain only uppercase letters and numbers'),
  
  body('zone')
    .notEmpty()
    .withMessage('Zone assignment is required')
    .custom(async (value) => {
      // Allow both ObjectId and zone name
      const mongoose = (await import('mongoose')).default;
      if (!mongoose.Types.ObjectId.isValid(value)) {
        // If not a valid ObjectId, check if it's a valid zone name
        const Zone = (await import('../models/Zone.js')).default;
        const zone = await Zone.findOne({ 
          name: { $regex: new RegExp(`^${value}$`, 'i') },
          status: 'active'
        });
        if (!zone) {
          throw new Error('Invalid zone. Please select a valid zone from the dropdown.');
        }
      }
      return true;
    }),
  
  body('vehicleType')
    .isIn(['Motorcycle', 'Bicycle', 'Car', 'Scooter', 'E-bike'])
    .withMessage('Vehicle type must be one of: Motorcycle, Bicycle, Car, Scooter, E-bike'),
  
  body('vehicleNumber')
    .notEmpty()
    .withMessage('Vehicle number is required')
    .isLength({ min: 2, max: 20 })
    .withMessage('Vehicle number must be between 2 and 20 characters'),
  
  body('vehicleModel')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Vehicle model cannot exceed 50 characters'),
  
  body('vehicleYear')
    .optional()
    .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
    .withMessage('Vehicle year must be between 2000 and current year + 1'),
  
  body('baseSalary')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base salary must be a positive number'),
  
  body('commissionRate')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Commission rate must be between 0 and 1'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'on_duty', 'off_duty', 'suspended'])
    .withMessage('Status must be one of: active, inactive, on_duty, off_duty, suspended'),
  
  body('documents.licenseNumber')
    .optional()
    .isLength({ min: 2, max: 20 })
    .withMessage('License number must be between 2 and 20 characters'),
  
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  handleValidationErrors
];

// Delivery validation
const validateDelivery = [
  body('orderId')
    .isMongoId()
    .withMessage('Valid order ID is required'),
  
  body('customer.id')
    .isMongoId()
    .withMessage('Valid customer ID is required'),
  
  body('customer.name')
    .notEmpty()
    .withMessage('Customer name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters'),
  
  body('customer.phone')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid customer phone number'),
  
  body('deliveryAddress.street')
    .notEmpty()
    .withMessage('Street address is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Street address must be between 5 and 200 characters'),
  
  body('deliveryAddress.city')
    .notEmpty()
    .withMessage('City is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  
  body('deliveryAddress.pincode')
    .matches(/^\d{5}$/)
    .withMessage('Pincode must be a 5-digit number'),
  
  body('restaurant.id')
    .isMongoId()
    .withMessage('Valid restaurant ID is required'),
  
  body('restaurant.name')
    .notEmpty()
    .withMessage('Restaurant name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Restaurant name must be between 2 and 100 characters'),
  
  body('deliveryPersonnel.id')
    .isMongoId()
    .withMessage('Valid delivery personnel ID is required'),
  
  body('zone.id')
    .isMongoId()
    .withMessage('Valid zone ID is required'),
  
  body('zone.deliveryCharge')
    .isFloat({ min: 0 })
    .withMessage('Delivery charge must be a positive number'),
  
  body('status')
    .optional()
    .isIn(['assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'delayed', 'failed'])
    .withMessage('Invalid status'),
  
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, normal, high, urgent'),
  
  body('orderValue')
    .isFloat({ min: 0 })
    .withMessage('Order value must be a positive number'),
  
  body('deliveryCharge')
    .isFloat({ min: 0 })
    .withMessage('Delivery charge must be a positive number'),
  
  body('paymentMethod')
    .isIn(['Cash on Delivery', 'Credit Card', 'Debit Card', 'Digital Wallet', 'Bank Transfer'])
    .withMessage('Invalid payment method'),
  
  body('specialInstructions')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Special instructions cannot exceed 500 characters'),
  
  handleValidationErrors
];

// Analytics validation
const validateAnalytics = [
  body('dateRange')
    .optional()
    .isIn(['today', 'week', 'month', 'quarter', 'year'])
    .withMessage('Date range must be one of: today, week, month, quarter, year'),
  
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

// Location validation
const validateLocation = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('address')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Address cannot exceed 200 characters'),
  
  handleValidationErrors
];

// Status validation
const validateStatus = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['active', 'inactive', 'on_duty', 'off_duty', 'suspended', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'delayed', 'failed'])
    .withMessage('Invalid status'),
  
  handleValidationErrors
];

// Bulk operation validation
const validateBulkOperation = [
  body('ids')
    .isArray({ min: 1 })
    .withMessage('IDs array is required and must not be empty')
    .custom((ids) => {
      for (const id of ids) {
        if (typeof id !== 'string' || id.length !== 24) {
          throw new Error('Each ID must be a valid MongoDB ObjectId');
        }
      }
      return true;
    }),
  
  body('status')
    .notEmpty()
    .withMessage('Status is required'),
  
  handleValidationErrors
];

// Delay validation
const validateDelay = [
  body('reason')
    .notEmpty()
    .withMessage('Delay reason is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Delay reason must be between 5 and 200 characters'),
  
  body('delayTime')
    .optional()
    .isInt({ min: 1, max: 480 })
    .withMessage('Delay time must be between 1 and 480 minutes'),
  
  handleValidationErrors
];

// Personnel update validation (more lenient for updates)
const validatePersonnelUpdate = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('employeeId')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Employee ID must be between 3 and 20 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Employee ID must contain only uppercase letters and numbers'),
  
  body('zone')
    .optional()
    .isMongoId()
    .withMessage('Valid zone ID is required'),
  
  body('vehicleType')
    .optional()
    .isIn(['Motorcycle', 'Bicycle', 'Car', 'Scooter', 'E-bike'])
    .withMessage('Vehicle type must be one of: Motorcycle, Bicycle, Car, Scooter, E-bike'),
  
  body('vehicleNumber')
    .optional()
    .isLength({ min: 2, max: 20 })
    .withMessage('Vehicle number must be between 2 and 20 characters'),
  
  body('licenseNumber')
    .optional()
    .isLength({ min: 2, max: 20 })
    .withMessage('License number must be between 2 and 20 characters'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'on_duty', 'off_duty', 'suspended'])
    .withMessage('Invalid status provided'),
  
  body('rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),
  
  body('totalDeliveries')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total deliveries must be a non-negative integer'),
  
  body('totalEarnings')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total earnings must be a non-negative number'),
  
  body('isAvailable')
    .optional()
    .isBoolean()
    .withMessage('isAvailable must be a boolean'),
  
  body('isOnline')
    .optional()
    .isBoolean()
    .withMessage('isOnline must be a boolean'),
  
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  handleValidationErrors
];

export {
  validateZone,
  validatePersonnel,
  validatePersonnelUpdate,
  validateDelivery,
  validateAnalytics,
  validateLocation,
  validateStatus,
  validateBulkOperation,
  validateDelay,
  handleValidationErrors
};