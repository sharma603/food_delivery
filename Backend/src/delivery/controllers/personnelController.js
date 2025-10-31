import DeliveryPersonnel from '../../models/DeliveryPersonnel.js';
import Zone from '../../models/Zone.js';
import responseHandler from '../../utils/responseHandler.js';
import logger from '../../utils/logger.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// Get all personnel
const getAllPersonnel = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      zone,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (zone && zone !== 'all') {
      query.zone = zone;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const personnel = await DeliveryPersonnel.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('zone', 'name description')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    // Get total count
    const total = await DeliveryPersonnel.countDocuments(query);

    return responseHandler.successResponse(res, {
      personnel,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching personnel:', error);
    return responseHandler.errorResponse(res, 'Failed to fetch personnel');
  }
};

// Get personnel by ID
const getPersonnelById = async (req, res) => {
  try {
    const { personnelId } = req.params;

    const personnel = await DeliveryPersonnel.findById(personnelId)
      .populate('zone', 'name description areas deliveryCharge')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!personnel) {
      return responseHandler.notFoundResponse(res, 'Personnel not found');
    }

    return responseHandler.successResponse(res, personnel);

  } catch (error) {
    logger.error('Error fetching personnel:', error);
    return responseHandler.errorResponse(res, 'Failed to fetch personnel');
  }
};

// Create new personnel
const createPersonnel = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      employeeId,
      password,
      zone,
      vehicleType,
      vehicleNumber,
      vehicleModel,
      vehicleYear,
      baseSalary,
      commissionRate,
      documents,
      status,
      rating,
      totalDeliveries,
      totalEarnings,
      isOnline,
      currentLocation
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !employeeId || !zone || !vehicleType || !vehicleNumber) {
      return responseHandler.validationErrorResponse(res, 'Name, email, phone, employee ID, zone, vehicle type, and vehicle number are required');
    }

    // Check if personnel with same email already exists
    const existingEmail = await DeliveryPersonnel.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    if (existingEmail) {
      return responseHandler.validationErrorResponse(res, `This email address (${email}) already exists and is being used by another personnel. Please use a different email address.`);
    }

    // Normalize phone number for duplicate checking (remove spaces, ensure consistent format)
    const normalizedPhone = phone.trim().replace(/[\s-]/g, '');
    
    // Check if personnel with same phone number already exists
    // Check both normalized and exact formats
    const existingPhone = await DeliveryPersonnel.findOne({ 
      $or: [
        { phone: normalizedPhone },
        { phone: phone.trim() } // Check exact match (trimmed)
      ]
    });
    if (existingPhone) {
      return responseHandler.validationErrorResponse(res, `This mobile number (${phone}) already exists and is being used by another personnel. Please use a different mobile number.`);
    }

    // Check if personnel with same employee ID already exists
    const existingEmployeeId = await DeliveryPersonnel.findOne({ employeeId: employeeId.toUpperCase() });
    if (existingEmployeeId) {
      return responseHandler.validationErrorResponse(res, `This employee ID (${employeeId.toUpperCase()}) already exists and is being used by another personnel. Please use a different employee ID.`);
    }

    // Verify zone exists - handle both ObjectId and zone name
    let zoneExists = null;
    let zoneId = zone;
    
    // Check if zone is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(zone)) {
      zoneExists = await Zone.findById(zone);
      if (!zoneExists) {
        return responseHandler.validationErrorResponse(res, 'Zone not found. Please select a valid zone from the dropdown.');
      }
      zoneId = zoneExists._id;
    } else {
      // If not a valid ObjectId, try to find by name
      zoneExists = await Zone.findOne({ 
        name: { $regex: new RegExp(`^${zone}$`, 'i') },
        status: 'active'
      });
      
      if (!zoneExists) {
        return responseHandler.validationErrorResponse(res, `Zone "${zone}" not found. Please select a valid zone from the dropdown.`);
      }
      
      // Use the found zone's ID
      zoneId = zoneExists._id;
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12);
    }

    // Use normalized phone for storage (already normalized above)

    // Get createdBy from authenticated user or request body
    // MongoDB uses _id, so check that first
    let createdById = null;
    if (req.user) {
      createdById = req.user._id || req.user.id;
      // Convert to string if it's an ObjectId
      if (createdById && typeof createdById.toString === 'function') {
        createdById = createdById.toString();
      }
    }
    
    // Fallback to body if provided
    if (!createdById && req.body.createdBy) {
      createdById = req.body.createdBy;
    }
    
    if (!createdById) {
      logger.error('createdBy is required but req.user is not set', {
        hasUser: !!req.user,
        userType: req.user?.type,
        userId: req.user?.id || req.user?._id,
        user_id: req.user?._id,
        bodyCreatedBy: req.body.createdBy,
        userKeys: req.user ? Object.keys(req.user) : [],
        headers: req.headers.authorization ? 'Token present' : 'No token'
      });
      return responseHandler.errorResponse(res, 'Authentication required. Please login and try again.');
    }

    // Create new personnel
    const personnel = new DeliveryPersonnel({
      name,
      email: email.toLowerCase().trim(),
      phone: normalizedPhone,
      employeeId: employeeId.toUpperCase().trim(),
      password: hashedPassword,
      zone: zoneId,
      zoneName: zoneExists.name,
      vehicleType,
      vehicleNumber,
      vehicleModel,
      vehicleYear,
      baseSalary: baseSalary || 0,
      commissionRate: commissionRate || 0.1,
      documents: documents || {},
      status: status || 'active',
      rating: rating || 0,
      totalDeliveries: totalDeliveries || 0,
      totalEarnings: totalEarnings || 0,
      isOnline: isOnline || false,
      currentLocation: currentLocation || {
        latitude: 27.7172,
        longitude: 85.3240
      },
      createdBy: createdById
    });

    await personnel.save();

    // Populate fields
    await personnel.populate('zone', 'name description');
    await personnel.populate('createdBy', 'name email');

    const creatorEmail = req.user?.email || req.user?.name || 'Unknown';
    logger.info(`Personnel created: ${personnel.name} (${personnel.employeeId}) by ${creatorEmail}`);

    return responseHandler.createdResponse(res, personnel, 'Personnel created successfully');

  } catch (error) {
    logger.error('Error creating personnel:', error);
    logger.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      errors: error.errors,
      stack: error.stack?.split('\n').slice(0, 5), // First 5 lines of stack
      reqUser: req.user ? { 
        id: req.user.id, 
        _id: req.user._id?.toString(), 
        email: req.user.email,
        type: req.user.type 
      } : 'undefined',
      requestBody: {
        name: req.body?.name,
        email: req.body?.email,
        phone: req.body?.phone,
        employeeId: req.body?.employeeId,
        zone: req.body?.zone,
        hasPassword: !!req.body?.password
      }
    });
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      const errorMessages = errors.map(e => `${e.field}: ${e.message}`).join(', ');
      logger.error('Validation errors:', errors);
      return responseHandler.validationErrorResponse(res, errorMessages);
    }
    
    // Handle duplicate key errors (e.g., duplicate email, phone, employeeId)
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      let fieldName = duplicateField;
      let value = '';
      
      // Get the duplicate value from error if available
      if (error.keyValue) {
        value = error.keyValue[duplicateField] || '';
      }
      
      // Human-readable field names and messages
      if (duplicateField === 'email') {
        fieldName = 'email address';
        return responseHandler.validationErrorResponse(res, `This email address ${value ? `(${value})` : ''} already exists and is being used by another personnel. Please use a different email address.`);
      } else if (duplicateField === 'phone') {
        fieldName = 'mobile number';
        return responseHandler.validationErrorResponse(res, `This mobile number ${value ? `(${value})` : ''} already exists and is being used by another personnel. Please use a different mobile number.`);
      } else if (duplicateField === 'employeeId') {
        fieldName = 'employee ID';
        return responseHandler.validationErrorResponse(res, `This employee ID ${value ? `(${value})` : ''} already exists and is being used by another personnel. Please use a different employee ID.`);
      }
      
      return responseHandler.validationErrorResponse(res, `${fieldName} already exists and is being used. Please use a different ${fieldName}.`);
    }
    
    // Provide more detailed error message
    const errorMessage = error.message || 'Failed to create personnel';
    return responseHandler.errorResponse(res, errorMessage);
  }
};

// Update personnel
const updatePersonnel = async (req, res) => {
  try {
    const { personnelId } = req.params;
    const updateData = req.body;

    console.log('Update personnel request:', {
      personnelId,
      updateData: {
        ...updateData,
        password: updateData.password ? '[HIDDEN]' : 'not provided'
      }
    });

    const personnel = await DeliveryPersonnel.findById(personnelId);

    if (!personnel) {
      return responseHandler.notFoundResponse(res, 'Personnel not found');
    }

    // Check for duplicate email if email is being updated
    if (updateData.email && updateData.email.toLowerCase() !== personnel.email.toLowerCase()) {
      const existingEmail = await DeliveryPersonnel.findOne({ 
        email: { $regex: new RegExp(`^${updateData.email}$`, 'i') },
        _id: { $ne: personnelId } // Exclude current personnel
      });
      if (existingEmail) {
        return responseHandler.validationErrorResponse(res, `This email address (${updateData.email}) already exists and is being used by another personnel. Please use a different email address.`);
      }
    }

    // Check for duplicate phone if phone is being updated
    if (updateData.phone && updateData.phone !== personnel.phone) {
      // Normalize phone number for duplicate checking
      const normalizedPhone = updateData.phone.trim().replace(/[\s-]/g, '');
      
      const existingPhone = await DeliveryPersonnel.findOne({ 
        $or: [
          { phone: normalizedPhone },
          { phone: updateData.phone } // Also check exact match
        ],
        _id: { $ne: personnelId } // Exclude current personnel
      });
      if (existingPhone) {
        return responseHandler.validationErrorResponse(res, `This mobile number (${updateData.phone}) already exists and is being used by another personnel. Please use a different mobile number.`);
      }
    }

    // Check for duplicate employee ID if employee ID is being updated
    if (updateData.employeeId && updateData.employeeId.toUpperCase() !== personnel.employeeId.toUpperCase()) {
      const existingEmployeeId = await DeliveryPersonnel.findOne({ 
        employeeId: updateData.employeeId.toUpperCase(),
        _id: { $ne: personnelId } // Exclude current personnel
      });
      if (existingEmployeeId) {
        return responseHandler.validationErrorResponse(res, `This employee ID (${updateData.employeeId.toUpperCase()}) already exists and is being used by another personnel. Please use a different employee ID.`);
      }
    }

    // Handle password update separately if provided
    if (updateData.password && updateData.password.trim() !== '') {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    } else {
      // Remove password from updateData if it's empty to avoid overwriting
      delete updateData.password;
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        personnel[key] = updateData[key];
      }
    });
    
    personnel.updatedBy = req.user?.id || req.user?._id || null;

    await personnel.save();

    logger.info(`Personnel updated: ${personnel.name} (${personnel.employeeId}) by ${req.user.email}`);

    return responseHandler.successResponse(res, personnel, 'Personnel updated successfully');

  } catch (error) {
    logger.error('Error updating personnel:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      let fieldName = duplicateField;
      
      if (duplicateField === 'email') {
        fieldName = 'Email';
      } else if (duplicateField === 'phone') {
        fieldName = 'Phone number';
      } else if (duplicateField === 'employeeId') {
        fieldName = 'Employee ID';
      }
      
      return responseHandler.validationErrorResponse(res, `${fieldName} already exists. Please use a different ${fieldName.toLowerCase()}.`);
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return responseHandler.validationErrorResponse(res, errors.join(', '));
    }
    
    return responseHandler.errorResponse(res, 'Failed to update personnel');
  }
};

// Delete personnel
const deletePersonnel = async (req, res) => {
  try {
    const { personnelId } = req.params;

    const personnel = await DeliveryPersonnel.findById(personnelId);

    if (!personnel) {
      return responseHandler.notFoundResponse(res, 'Personnel not found');
    }

    await DeliveryPersonnel.findByIdAndDelete(personnelId);

    logger.info(`Personnel deleted: ${personnel.name} (${personnel.employeeId}) by ${req.user.email}`);

    return responseHandler.successResponse(res, null, 'Personnel deleted successfully');

  } catch (error) {
    logger.error('Error deleting personnel:', error);
    return responseHandler.errorResponse(res, 'Failed to delete personnel');
  }
};

// Update personnel status
const updatePersonnelStatus = async (req, res) => {
  try {
    const { personnelId } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'inactive', 'on_duty', 'off_duty', 'suspended'].includes(status)) {
      return responseHandler.validationErrorResponse(res, 'Valid status is required');
    }

    const personnel = await DeliveryPersonnel.findById(personnelId);

    if (!personnel) {
      return responseHandler.notFoundResponse(res, 'Personnel not found');
    }

    personnel.status = status;
    personnel.updatedBy = req.user.id;

    // Update online status based on new status
    if (status === 'on_duty') {
      personnel.isOnline = true;
    } else if (status === 'off_duty' || status === 'inactive' || status === 'suspended') {
      personnel.isOnline = false;
    }

    await personnel.save();

    logger.info(`Personnel status updated: ${personnel.name} to ${status} by ${req.user.email}`);

    return responseHandler.successResponse(res, personnel, 'Personnel status updated successfully');

  } catch (error) {
    logger.error('Error updating personnel status:', error);
    return responseHandler.errorResponse(res, 'Failed to update personnel status');
  }
};

// Update personnel location
const updatePersonnelLocation = async (req, res) => {
  try {
    const { personnelId } = req.params;
    const { latitude, longitude, address } = req.body;

    if (!latitude || !longitude) {
      return responseHandler.validationErrorResponse(res, 'Latitude and longitude are required');
    }

    const personnel = await DeliveryPersonnel.findById(personnelId);

    if (!personnel) {
      return responseHandler.notFoundResponse(res, 'Personnel not found');
    }

    personnel.currentLocation = {
      latitude,
      longitude,
      address,
      lastUpdated: new Date()
    };
    personnel.lastActive = new Date();
    personnel.isOnline = true;

    await personnel.save();

    logger.info(`Personnel location updated: ${personnel.name} at ${latitude}, ${longitude}`);

    return responseHandler.successResponse(res, personnel, 'Location updated successfully');

  } catch (error) {
    logger.error('Error updating personnel location:', error);
    return responseHandler.errorResponse(res, 'Failed to update location');
  }
};

// Get available personnel for zone
const getAvailablePersonnel = async (req, res) => {
  try {
    const { zoneId } = req.params;

    const personnel = await DeliveryPersonnel.find({
      status: { $in: ['active', 'on_duty'] },
      zone: zoneId,
      isOnline: true
    }).populate('zone');

    return responseHandler.successResponse(res, personnel);

  } catch (error) {
    logger.error('Error fetching available personnel:', error);
    return responseHandler.errorResponse(res, 'Failed to fetch available personnel');
  }
};

// Get personnel statistics
const getPersonnelStats = async (req, res) => {
  try {
    const stats = await DeliveryPersonnel.getPersonnelStats();
    return responseHandler.successResponse(res, stats);

  } catch (error) {
    logger.error('Error fetching personnel statistics:', error);
    return responseHandler.errorResponse(res, 'Failed to fetch personnel statistics');
  }
};

// Bulk update personnel status
const bulkUpdatePersonnelStatus = async (req, res) => {
  try {
    const { personnelIds, status } = req.body;

    if (!personnelIds || !Array.isArray(personnelIds) || personnelIds.length === 0) {
      return responseHandler.validationErrorResponse(res, 'Personnel IDs array is required');
    }

    if (!status || !['active', 'inactive', 'on_duty', 'off_duty', 'suspended'].includes(status)) {
      return responseHandler.validationErrorResponse(res, 'Valid status is required');
    }

    const result = await DeliveryPersonnel.updateMany(
      { _id: { $in: personnelIds } },
      { 
        status,
        updatedBy: req.user.id,
        updatedAt: new Date()
      }
    );

    logger.info(`Bulk updated ${result.modifiedCount} personnel to ${status} by ${req.user.email}`);

    return responseHandler.successResponse(res, {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    }, `${result.modifiedCount} personnel updated successfully`);

  } catch (error) {
    logger.error('Error bulk updating personnel status:', error);
    return responseHandler.errorResponse(res, 'Failed to bulk update personnel status');
  }
};

// Get personnel performance
const getPersonnelPerformance = async (req, res) => {
  try {
    const { personnelId } = req.params;
    const { dateRange = 'week' } = req.query;

    const personnel = await DeliveryPersonnel.findById(personnelId);
    if (!personnel) {
      return responseHandler.notFoundResponse(res, 'Personnel not found');
    }

    // Mock performance data for now
    const performance = {
      totalDeliveries: Math.floor(Math.random() * 1500) + 500,
      completedDeliveries: Math.floor(Math.random() * 1400) + 450,
      averageTime: Math.floor(Math.random() * 15) + 25,
      onTimeRate: Math.floor(Math.random() * 15) + 85,
      customerRating: Math.round((Math.random() * 1 + 4) * 100) / 100,
      earnings: Math.floor(Math.random() * 200000) + 100000,
      efficiency: Math.floor(Math.random() * 15) + 85,
      performance: 'good'
    };

    return responseHandler.successResponse(res, {
      personnel: {
        id: personnel._id,
        name: personnel.name,
        employeeId: personnel.employeeId,
        zone: personnel.zoneName
      },
      performance
    });

  } catch (error) {
    logger.error('Error fetching personnel performance:', error);
    return responseHandler.errorResponse(res, 'Failed to fetch personnel performance');
  }
};

export {
  getAllPersonnel,
  getPersonnelById,
  createPersonnel,
  updatePersonnel,
  deletePersonnel,
  updatePersonnelStatus,
  updatePersonnelLocation,
  getAvailablePersonnel,
  getPersonnelStats,
  bulkUpdatePersonnelStatus,
  getPersonnelPerformance
};