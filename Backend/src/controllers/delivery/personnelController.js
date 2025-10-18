import DeliveryPersonnel from '../../models/DeliveryPersonnel.js';
import Zone from '../../models/Zone.js';
import responseHandler from '../../utils/responseHandler.js';
import logger from '../../utils/logger.js';

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
      zone,
      vehicleType,
      vehicleNumber,
      vehicleModel,
      vehicleYear,
      baseSalary,
      commissionRate
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !employeeId || !zone || !vehicleType || !vehicleNumber) {
      return responseHandler.validationErrorResponse(res, 'Name, email, phone, employee ID, zone, vehicle type, and vehicle number are required');
    }

    // Check if personnel with same email already exists
    const existingEmail = await DeliveryPersonnel.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    if (existingEmail) {
      return responseHandler.validationErrorResponse(res, 'Personnel with this email already exists');
    }

    // Verify zone exists
    const zoneExists = await Zone.findById(zone);
    if (!zoneExists) {
      return responseHandler.validationErrorResponse(res, 'Invalid zone');
    }

    // Create new personnel
    const personnel = new DeliveryPersonnel({
      name,
      email,
      phone,
      employeeId,
      zone,
      zoneName: zoneExists.name,
      vehicleType,
      vehicleNumber,
      vehicleModel,
      vehicleYear,
      baseSalary: baseSalary || 0,
      commissionRate: commissionRate || 0.1,
      createdBy: req.user.id
    });

    await personnel.save();

    // Populate fields
    await personnel.populate('zone', 'name description');
    await personnel.populate('createdBy', 'name email');

    logger.info(`Personnel created: ${personnel.name} (${personnel.employeeId}) by ${req.user.email}`);

    return responseHandler.createdResponse(res, personnel, 'Personnel created successfully');

  } catch (error) {
    logger.error('Error creating personnel:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return responseHandler.validationErrorResponse(res, errors.join(', '));
    }
    
    return responseHandler.errorResponse(res, 'Failed to create personnel');
  }
};

// Update personnel
const updatePersonnel = async (req, res) => {
  try {
    const { personnelId } = req.params;
    const updateData = req.body;

    const personnel = await DeliveryPersonnel.findById(personnelId);

    if (!personnel) {
      return responseHandler.notFoundResponse(res, 'Personnel not found');
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        personnel[key] = updateData[key];
      }
    });
    
    personnel.updatedBy = req.user.id;

    await personnel.save();

    logger.info(`Personnel updated: ${personnel.name} (${personnel.employeeId}) by ${req.user.email}`);

    return responseHandler.successResponse(res, personnel, 'Personnel updated successfully');

  } catch (error) {
    logger.error('Error updating personnel:', error);
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