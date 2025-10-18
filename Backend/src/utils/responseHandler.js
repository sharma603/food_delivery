// Response Handler Utility
// This file structure created as per requested organization

export const successResponse = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

export const errorResponse = (res, message = 'Error', statusCode = 500, errorCode = null, details = {}) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    details,
    timestamp: new Date().toISOString()
  });
};

export const validationErrorResponse = (res, errors, message = 'Validation failed') => {
  return res.status(422).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString()
  });
};

export const notFoundResponse = (res, resource = 'Resource') => {
  return res.status(404).json({
    success: false,
    message: `${resource} not found`,
    timestamp: new Date().toISOString()
  });
};

export const unauthorizedResponse = (res, message = 'Unauthorized access') => {
  return res.status(401).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
};

export const forbiddenResponse = (res, message = 'Access forbidden') => {
  return res.status(403).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
};

export const paginatedResponse = (res, data, pagination, message = 'Success') => {
  return res.json({
    success: true,
    message,
    data,
    pagination: {
      currentPage: pagination.page,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      totalItems: pagination.total,
      itemsPerPage: pagination.limit,
      hasNextPage: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrevPage: pagination.page > 1
    },
    timestamp: new Date().toISOString()
  });
};

export const createdResponse = (res, data, message = 'Created successfully') => {
  return successResponse(res, data, message, 201);
};

export const noContentResponse = (res, message = 'No content') => {
  return res.status(204).json({
    success: true,
    message,
    timestamp: new Date().toISOString()
  });
};

export default {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  paginatedResponse,
  createdResponse,
  noContentResponse
};
