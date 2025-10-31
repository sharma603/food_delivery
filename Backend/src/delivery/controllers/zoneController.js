import Zone from '../../models/Zone.js';
import responseHandler from '../../utils/responseHandler.js';
import logger from '../../utils/logger.js';

// Get all zones
const getAllZones = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100, // Increased default limit to show more zones
      status = 'all', // Default to 'all' to show all statuses unless specified
      search,
      sortBy = 'name', // Sort by name by default for better UX
      sortOrder = 'asc', // Ascending by default
      dropdown = false // New parameter for dropdown format
    } = req.query;

    // Log request for debugging
    logger.info(`Fetching zones - page: ${page}, limit: ${limit}, status: ${status}, search: ${search || 'none'}`);

    // If dropdown format requested, return simplified list
    if (dropdown === 'true' || dropdown === true) {
      const query = { status: 'active' };
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { areas: { $regex: search, $options: 'i' } }
        ];
      }

      const zones = await Zone.find(query)
        .select('_id name deliveryCharge')
        .sort({ name: 1 });

      return responseHandler.successResponse(res, zones.map(zone => ({
        value: zone._id.toString(),
        label: zone.name,
        id: zone._id.toString(),
        deliveryCharge: zone.deliveryCharge
      })));
    }

    // Build query
    const query = {};
    
    // Filter by status - if 'all' or not specified, don't filter (show all statuses)
    // If a specific status is provided, filter by that status
    if (status && status !== 'all') {
      query.status = status;
    }
    // If status is 'all' or not provided, query will match all zones regardless of status
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { areas: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    // Try to populate, but if it fails, continue without populated fields
    let zones;
    try {
      zones = await Zone.find(query)
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .lean(); // Use lean() for better performance
    } catch (populateError) {
      // If populate fails (e.g., missing models), fetch without populate
      logger.warn('Population failed, fetching zones without populated fields:', populateError.message);
      zones = await Zone.find(query)
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();
    }

    // Get total count
    const total = await Zone.countDocuments(query);

    // Log results for debugging
    logger.info(`Zones query result: ${zones.length} zones found out of ${total} total`);

    // Return zones in format compatible with frontend
    // Frontend accesses: response.data.data or response.data.zones
    // Since axios wraps response, the structure is: response.data = { success, data: zones, ... }
    return res.status(200).json({
      success: true,
      message: 'Zones fetched successfully',
      data: zones, // Direct zones array - frontend accesses this as response.data.data
      zones: zones, // Also include zones for backward compatibility
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching zones:', error);
    return responseHandler.errorResponse(res, 'Failed to fetch zones');
  }
};

// Get zone by ID
const getZoneById = async (req, res) => {
  try {
    const { zoneId } = req.params;

    const zone = await Zone.findById(zoneId)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!zone) {
      return responseHandler.notFoundResponse(res, 'Zone not found');
    }

    return responseHandler.successResponse(res, zone);

  } catch (error) {
    logger.error('Error fetching zone:', error);
    return responseHandler.errorResponse(res, 'Failed to fetch zone');
  }
};

// Create new zone
const createZone = async (req, res) => {
  try {
    const {
      name,
      description,
      areas,
      pincodes,
      deliveryCharge,
      coverage,
      estimatedDeliveryTime,
      coordinates
    } = req.body;

    // Validate required fields
    if (!name || !areas || !deliveryCharge) {
      return responseHandler.validationErrorResponse(res, 'Name, areas, and delivery charge are required');
    }

    // Check if zone with same name already exists
    const existingZone = await Zone.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingZone) {
      return responseHandler.validationErrorResponse(res, 'Zone with this name already exists');
    }

    // Create new zone
    const zone = new Zone({
      name,
      description,
      areas: Array.isArray(areas) ? areas : [areas],
      pincodes: Array.isArray(pincodes) ? pincodes : (pincodes ? [pincodes] : []),
      deliveryCharge,
      coverage: coverage || '5km radius',
      estimatedDeliveryTime: estimatedDeliveryTime || '30-45 minutes',
      coordinates,
      createdBy: req.user.id
    });

    await zone.save();

    // Populate createdBy field
    await zone.populate('createdBy', 'name email');

    logger.info(`Zone created: ${zone.name} by ${req.user.email}`);

    return responseHandler.createdResponse(res, zone, 'Zone created successfully');

  } catch (error) {
    logger.error('Error creating zone:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return responseHandler.validationErrorResponse(res, errors.join(', '));
    }
    
    return responseHandler.errorResponse(res, 'Failed to create zone');
  }
};

// Update zone
const updateZone = async (req, res) => {
  try {
    const { zoneId } = req.params;
    const {
      name,
      description,
      areas,
      pincodes,
      deliveryCharge,
      status,
      coverage,
      estimatedDeliveryTime,
      coordinates
    } = req.body;

    const zone = await Zone.findById(zoneId);

    if (!zone) {
      return responseHandler.notFoundResponse(res, 'Zone not found');
    }

    // Check if name is being changed and if it already exists
    if (name && name !== zone.name) {
      const existingZone = await Zone.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: zoneId }
      });
      if (existingZone) {
        return responseHandler.validationErrorResponse(res, 'Zone with this name already exists');
      }
    }

    // Update fields
    if (name) zone.name = name;
    if (description !== undefined) zone.description = description;
    if (areas) zone.areas = Array.isArray(areas) ? areas : [areas];
    if (pincodes !== undefined) zone.pincodes = Array.isArray(pincodes) ? pincodes : (pincodes ? [pincodes] : []);
    if (deliveryCharge !== undefined) zone.deliveryCharge = deliveryCharge;
    if (status) zone.status = status;
    if (coverage) zone.coverage = coverage;
    if (estimatedDeliveryTime) zone.estimatedDeliveryTime = estimatedDeliveryTime;
    if (coordinates) zone.coordinates = coordinates;
    
    zone.updatedBy = req.user.id;

    await zone.save();

    // Populate updatedBy field
    await zone.populate('updatedBy', 'name email');

    logger.info(`Zone updated: ${zone.name} by ${req.user.email}`);

    return responseHandler.successResponse(res, zone, 'Zone updated successfully');

  } catch (error) {
    logger.error('Error updating zone:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return responseHandler.validationErrorResponse(res, errors.join(', '));
    }
    
    return responseHandler.errorResponse(res, 'Failed to update zone');
  }
};

// Delete zone
const deleteZone = async (req, res) => {
  try {
    const { zoneId } = req.params;

    const zone = await Zone.findById(zoneId);

    if (!zone) {
      return responseHandler.notFoundResponse(res, 'Zone not found');
    }

    await Zone.findByIdAndDelete(zoneId);

    logger.info(`Zone deleted: ${zone.name} by ${req.user.email}`);

    return responseHandler.successResponse(res, null, 'Zone deleted successfully');

  } catch (error) {
    logger.error('Error deleting zone:', error);
    return responseHandler.errorResponse(res, 'Failed to delete zone');
  }
};

// Get zone statistics
const getZoneStats = async (req, res) => {
  try {
    const stats = await Zone.getZoneStats();
    return responseHandler.successResponse(res, stats);

  } catch (error) {
    logger.error('Error fetching zone statistics:', error);
    return responseHandler.errorResponse(res, 'Failed to fetch zone statistics');
  }
};

// Find zone by area
const findZoneByArea = async (req, res) => {
  try {
    const { area } = req.params;

    const zone = await Zone.findByArea(area);

    if (!zone) {
      return responseHandler.notFoundResponse(res, 'No zone found for this area');
    }

    return responseHandler.successResponse(res, zone);

  } catch (error) {
    logger.error('Error finding zone by area:', error);
    return responseHandler.errorResponse(res, 'Failed to find zone by area');
  }
};

// Find zone by pincode
const findZoneByPincode = async (req, res) => {
  try {
    const { pincode } = req.params;

    const zone = await Zone.findByPincode(pincode);

    if (!zone) {
      return responseHandler.notFoundResponse(res, 'No zone found for this pincode');
    }

    return responseHandler.successResponse(res, zone);

  } catch (error) {
    logger.error('Error finding zone by pincode:', error);
    return responseHandler.errorResponse(res, 'Failed to find zone by pincode');
  }
};

// Bulk update zone status
const bulkUpdateZoneStatus = async (req, res) => {
  try {
    const { zoneIds, status } = req.body;

    if (!zoneIds || !Array.isArray(zoneIds) || zoneIds.length === 0) {
      return responseHandler.validationErrorResponse(res, 'Zone IDs array is required');
    }

    if (!status || !['active', 'inactive', 'maintenance'].includes(status)) {
      return responseHandler.validationErrorResponse(res, 'Valid status is required');
    }

    const result = await Zone.updateMany(
      { _id: { $in: zoneIds } },
      { 
        status,
        updatedBy: req.user.id,
        updatedAt: new Date()
      }
    );

    logger.info(`Bulk updated ${result.modifiedCount} zones to ${status} by ${req.user.email}`);

    return responseHandler.successResponse(res, {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    }, `${result.modifiedCount} zones updated successfully`);

  } catch (error) {
    logger.error('Error bulk updating zone status:', error);
    return responseHandler.errorResponse(res, 'Failed to bulk update zone status');
  }
};

// Get zone performance
const getZonePerformance = async (req, res) => {
  try {
    const { zoneId } = req.params;
    const { dateRange = 'week' } = req.query;

    const zone = await Zone.findById(zoneId);
    if (!zone) {
      return responseHandler.notFoundResponse(res, 'Zone not found');
    }

    // Mock performance data for now
    const performance = {
      totalDeliveries: Math.floor(Math.random() * 2000) + 500,
      completedDeliveries: Math.floor(Math.random() * 1800) + 450,
      averageTime: Math.floor(Math.random() * 20) + 25,
      onTimeRate: Math.floor(Math.random() * 20) + 80,
      customerRating: Math.round((Math.random() * 1 + 4) * 100) / 100,
      revenue: Math.floor(Math.random() * 100000) + 50000,
      efficiency: Math.floor(Math.random() * 20) + 80
    };

    return responseHandler.successResponse(res, {
      zone: {
        id: zone._id,
        name: zone.name,
        description: zone.description
      },
      performance
    });

  } catch (error) {
    logger.error('Error fetching zone performance:', error);
    return responseHandler.errorResponse(res, 'Failed to fetch zone performance');
  }
};

export {
  getAllZones,
  getZoneById,
  createZone,
  updateZone,
  deleteZone,
  getZoneStats,
  findZoneByArea,
  findZoneByPincode,
  bulkUpdateZoneStatus,
  getZonePerformance
};