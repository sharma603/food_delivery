import logger from '../utils/logger.js';
import { envConfig } from '../config/env.js';

/**
 * Enhanced Error Handler for Production
 * - Proper error logging
 * - Sanitized error messages
 * - Stack traces in development only
 * - Structured error responses
 */

class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, req, res) => {
  // API error response
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      stack: err.stack,
      ...(err.errors && { errors: err.errors })
    });
  }
  
  // RENDERED WEBSITE ERROR
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).json({
    title: 'Something went wrong!',
    msg: err.message
  });
};

const sendErrorProd = (err, req, res) => {
  // A) API error response
  if (req.originalUrl.startsWith('/api')) {
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        success: false,
        error: err.message
      });
    }
    
    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    logger.error('ERROR 💥', err);
    
    // 2) Send generic message
    return res.status(500).json({
      success: false,
      error: 'Something went wrong!'
    });
  }
  
  // B) RENDERED WEBSITE ERROR
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      title: 'Something went wrong!',
      msg: err.message
    });
  }
  
  // B) Programming or other unknown error: don't leak error details
  // 1) Log error
  logger.error('ERROR 💥', err);
  
  // 2) Send generic message
  return res.status(err.statusCode).json({
    title: 'Something went wrong!',
    msg: 'Please try again later.'
  });
};

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Add request context to error
  err.request = {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    ip: req.ip,
    user: req.user?.id || 'anonymous'
  };

  if (envConfig.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};

export default errorHandler;
export { AppError };

