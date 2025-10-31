import Delivery from '../../models/Delivery.js';
import DeliveryPersonnel from '../../models/DeliveryPersonnel.js';
import Zone from '../../models/Zone.js';
import responseHandler from '../../utils/responseHandler.js';
import logger from '../../utils/logger.js';

// Get active deliveries
const getActiveDeliveries = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      zone,
      personnel,
      priority,
      search,
      sortBy = 'assignedAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {
      status: { $in: ['assigned', 'picked_up', 'in_transit', 'delayed'] }
    };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (zone && zone !== 'all') {
      query['zone.id'] = zone;
    }
    
    if (personnel && personnel !== 'all') {
      query['deliveryPersonnel.id'] = personnel;
    }
    
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'restaurant.name': { $regex: search, $options: 'i' } },
        { 'deliveryPersonnel.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const deliveries = await Delivery.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('orderId', 'orderNumber items')
      .populate('customer.id', 'name phone email')
      .populate('restaurant.id', 'name address')
      .populate('deliveryPersonnel.id', 'name phone vehicleType vehicleNumber')
      .populate('zone.id', 'name deliveryCharge');

    // Get total count
    const total = await Delivery.countDocuments(query);

    return responseHandler.successResponse(res, {
      deliveries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching active deliveries:', error);
    return responseHandler.errorResponse(res, 'Failed to fetch active deliveries');
  }
};

// Get delivery by ID
const getDeliveryById = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    const delivery = await Delivery.findById(deliveryId)
      .populate('orderId', 'orderNumber items')
      .populate('customer.id', 'name phone email')
      .populate('restaurant.id', 'name address')
      .populate('deliveryPersonnel.id', 'name phone vehicleType vehicleNumber')
      .populate('zone.id', 'name deliveryCharge');

    if (!delivery) {
      return responseHandler.notFoundResponse(res, 'Delivery not found');
    }

    return responseHandler.successResponse(res, delivery);

  } catch (error) {
    logger.error('Error fetching delivery:', error);
    return responseHandler.errorResponse(res, 'Failed to fetch delivery');
  }
};

// Update delivery status
const updateDeliveryStatus = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { status, notes } = req.body;

    if (!status || !['assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'delayed', 'failed'].includes(status)) {
      return responseHandler.validationErrorResponse(res, 'Valid status is required');
    }

    const delivery = await Delivery.findById(deliveryId);

    if (!delivery) {
      return responseHandler.notFoundResponse(res, 'Delivery not found');
    }

    const oldStatus = delivery.status;
    delivery.status = status;
    delivery.updatedBy = req.user.id;

    // Set timestamps based on status
    switch (status) {
      case 'picked_up':
        delivery.pickedUpAt = new Date();
        break;
      case 'delivered':
        delivery.actualDelivery = new Date();
        break;
    }

    await delivery.save();

    logger.info(`Delivery status updated: ${delivery.orderNumber} from ${oldStatus} to ${status} by ${req.user.email}`);

    return responseHandler.successResponse(res, delivery, 'Delivery status updated successfully');

  } catch (error) {
    logger.error('Error updating delivery status:', error);
    return responseHandler.errorResponse(res, 'Failed to update delivery status');
  }
};

// Update delivery location
const updateDeliveryLocation = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { latitude, longitude, address } = req.body;

    if (!latitude || !longitude) {
      return responseHandler.validationErrorResponse(res, 'Latitude and longitude are required');
    }

    const delivery = await Delivery.findById(deliveryId);

    if (!delivery) {
      return responseHandler.notFoundResponse(res, 'Delivery not found');
    }

    delivery.currentLocation = {
      latitude,
      longitude,
      address,
      lastUpdated: new Date()
    };

    await delivery.save();

    logger.info(`Delivery location updated: ${delivery.orderNumber} at ${latitude}, ${longitude}`);

    return responseHandler.successResponse(res, delivery, 'Location updated successfully');

  } catch (error) {
    logger.error('Error updating delivery location:', error);
    return responseHandler.errorResponse(res, 'Failed to update location');
  }
};

// Add delay to delivery
const addDeliveryDelay = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { reason, delayTime } = req.body;

    if (!reason) {
      return responseHandler.validationErrorResponse(res, 'Delay reason is required');
    }

    const delivery = await Delivery.findById(deliveryId);

    if (!delivery) {
      return responseHandler.notFoundResponse(res, 'Delivery not found');
    }

    delivery.isDelayed = true;
    delivery.delayReason = reason;
    delivery.delayTime = delayTime || 30;

    await delivery.save();

    logger.info(`Delivery delayed: ${delivery.orderNumber} - ${reason} by ${req.user.email}`);

    return responseHandler.successResponse(res, delivery, 'Delivery delay added successfully');

  } catch (error) {
    logger.error('Error adding delivery delay:', error);
    return responseHandler.errorResponse(res, 'Failed to add delivery delay');
  }
};

// Get tracking statistics
const getTrackingStats = async (req, res) => {
  try {
    const stats = await Delivery.getTrackingStats();
    return responseHandler.successResponse(res, stats);

  } catch (error) {
    logger.error('Error fetching tracking statistics:', error);
    return responseHandler.errorResponse(res, 'Failed to fetch tracking statistics');
  }
};

// Get delivery history
const getDeliveryHistory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      status,
      zone,
      personnel,
      search,
      sortBy = 'assignedAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    // Date range filter
    if (startDate || endDate) {
      query.assignedAt = {};
      if (startDate) query.assignedAt.$gte = new Date(startDate);
      if (endDate) query.assignedAt.$lte = new Date(endDate);
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (zone && zone !== 'all') {
      query['zone.id'] = zone;
    }
    
    if (personnel && personnel !== 'all') {
      query['deliveryPersonnel.id'] = personnel;
    }
    
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'restaurant.name': { $regex: search, $options: 'i' } },
        { 'deliveryPersonnel.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const deliveries = await Delivery.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('orderId', 'orderNumber items')
      .populate('customer.id', 'name phone email')
      .populate('restaurant.id', 'name address')
      .populate('deliveryPersonnel.id', 'name phone vehicleType vehicleNumber')
      .populate('zone.id', 'name deliveryCharge');

    // Get total count
    const total = await Delivery.countDocuments(query);

    return responseHandler.successResponse(res, {
      deliveries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching delivery history:', error);
    return responseHandler.errorResponse(res, 'Failed to fetch delivery history');
  }
};

// Get deliveries by personnel
const getDeliveriesByPersonnel = async (req, res) => {
  try {
    const { personnelId } = req.params;
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
      sortBy = 'assignedAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {
      'deliveryPersonnel.id': personnelId
    };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.assignedAt = {};
      if (startDate) query.assignedAt.$gte = new Date(startDate);
      if (endDate) query.assignedAt.$lte = new Date(endDate);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const deliveries = await Delivery.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('orderId', 'orderNumber items')
      .populate('customer.id', 'name phone email')
      .populate('restaurant.id', 'name address')
      .populate('zone.id', 'name deliveryCharge');

    // Get total count
    const total = await Delivery.countDocuments(query);

    return responseHandler.successResponse(res, {
      deliveries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching deliveries by personnel:', error);
    return responseHandler.errorResponse(res, 'Failed to fetch deliveries by personnel');
  }
};

// Get deliveries by zone
const getDeliveriesByZone = async (req, res) => {
  try {
    const { zoneId } = req.params;
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
      sortBy = 'assignedAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {
      'zone.id': zoneId
    };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.assignedAt = {};
      if (startDate) query.assignedAt.$gte = new Date(startDate);
      if (endDate) query.assignedAt.$lte = new Date(endDate);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const deliveries = await Delivery.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('orderId', 'orderNumber items')
      .populate('customer.id', 'name phone email')
      .populate('restaurant.id', 'name address')
      .populate('deliveryPersonnel.id', 'name phone vehicleType vehicleNumber');

    // Get total count
    const total = await Delivery.countDocuments(query);

    return responseHandler.successResponse(res, {
      deliveries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching deliveries by zone:', error);
    return responseHandler.errorResponse(res, 'Failed to fetch deliveries by zone');
  }
};

// Assign delivery to personnel
const assignDeliveryToPersonnel = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { personnelId } = req.body;

    if (!personnelId) {
      return responseHandler.validationErrorResponse(res, 'Personnel ID is required');
    }

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return responseHandler.notFoundResponse(res, 'Delivery not found');
    }

    const personnel = await DeliveryPersonnel.findById(personnelId);
    if (!personnel) {
      return responseHandler.notFoundResponse(res, 'Personnel not found');
    }

    // Update delivery with personnel information
    delivery.deliveryPersonnel = {
      id: personnel._id,
      name: personnel.name,
      phone: personnel.phone,
      vehicleType: personnel.vehicleType,
      vehicleNumber: personnel.vehicleNumber
    };
    
    delivery.status = 'assigned';
    delivery.assignedAt = new Date();
    delivery.updatedBy = req.user.id;

    await delivery.save();

    logger.info(`Delivery assigned: ${delivery.orderNumber} to ${personnel.name} by ${req.user.email}`);

    return responseHandler.successResponse(res, delivery, 'Delivery assigned successfully');

  } catch (error) {
    logger.error('Error assigning delivery to personnel:', error);
    return responseHandler.errorResponse(res, 'Failed to assign delivery');
  }
};

// Get delayed deliveries
const getDelayedDeliveries = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'assignedAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query for delayed deliveries
    const query = {
      isDelayed: true,
      status: { $in: ['assigned', 'picked_up', 'in_transit'] }
    };

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const deliveries = await Delivery.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('orderId', 'orderNumber items')
      .populate('customer.id', 'name phone email')
      .populate('restaurant.id', 'name address')
      .populate('deliveryPersonnel.id', 'name phone vehicleType vehicleNumber')
      .populate('zone.id', 'name deliveryCharge');

    // Get total count
    const total = await Delivery.countDocuments(query);

    return responseHandler.successResponse(res, {
      deliveries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching delayed deliveries:', error);
    return responseHandler.errorResponse(res, 'Failed to fetch delayed deliveries');
  }
};

// Bulk update delivery status
const bulkUpdateDeliveryStatus = async (req, res) => {
  try {
    const { deliveryIds, status } = req.body;

    if (!deliveryIds || !Array.isArray(deliveryIds) || deliveryIds.length === 0) {
      return responseHandler.validationErrorResponse(res, 'Delivery IDs array is required');
    }

    if (!status || !['assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'delayed', 'failed'].includes(status)) {
      return responseHandler.validationErrorResponse(res, 'Valid status is required');
    }

    const result = await Delivery.updateMany(
      { _id: { $in: deliveryIds } },
      { 
        status,
        updatedBy: req.user.id,
        updatedAt: new Date()
      }
    );

    logger.info(`Bulk updated ${result.modifiedCount} deliveries to ${status} by ${req.user.email}`);

    return responseHandler.successResponse(res, {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    }, `${result.modifiedCount} deliveries updated successfully`);

  } catch (error) {
    logger.error('Error bulk updating delivery status:', error);
    return responseHandler.errorResponse(res, 'Failed to bulk update delivery status');
  }
};

export {
  getActiveDeliveries,
  getDeliveryById,
  updateDeliveryStatus,
  updateDeliveryLocation,
  addDeliveryDelay,
  getTrackingStats,
  getDeliveryHistory,
  getDeliveriesByPersonnel,
  getDeliveriesByZone,
  assignDeliveryToPersonnel,
  getDelayedDeliveries,
  bulkUpdateDeliveryStatus
};