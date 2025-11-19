const logger = require('../utils/logger');
const {
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ServerError,
} = require('../utils/errors');

/**
 * 404 Not Found Handler
 * Catches requests to undefined routes
 * Validates: Requirements 12.1
 */
const notFound = (req, res, next) => {
  const error = new NotFoundError(`Not Found - ${req.originalUrl}`);
  next(error);
};

/**
 * Validation Error Handler (400)
 * Handles invalid input data and missing required fields
 * Validates: Requirements 12.1
 */
const handleValidationError = (err, req) => {
  logger.error('Validation error', {
    error: err.message,
    details: err.details,
    path: req.path,
    method: req.method,
  });

  return {
    success: false,
    error: {
      code: err.code || 'VALIDATION_ERROR',
      message: err.message || 'Invalid input data',
      details: err.details || null,
    },
  };
};

/**
 * Authentication Error Handler (401)
 * Handles authentication failures and invalid/expired tokens
 * Validates: Requirements 12.2
 */
const handleAuthenticationError = (err, req) => {
  logger.warn('Authentication error', {
    error: err.message,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  return {
    success: false,
    error: {
      code: err.code || 'AUTHENTICATION_FAILED',
      message: err.message || 'Authentication failed',
    },
  };
};

/**
 * Authorization Error Handler (403)
 * Handles insufficient permissions
 * Validates: Requirements 12.3
 */
const handleAuthorizationError = (err, req) => {
  logger.warn('Authorization error', {
    error: err.message,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });

  return {
    success: false,
    error: {
      code: err.code || 'INSUFFICIENT_PERMISSIONS',
      message: err.message || 'Insufficient permissions',
    },
  };
};

/**
 * Not Found Error Handler (404)
 * Handles resource not found errors
 * Validates: Requirements 12.1
 */
const handleNotFoundError = (err, req) => {
  logger.info('Resource not found', {
    error: err.message,
    path: req.path,
    method: req.method,
  });

  return {
    success: false,
    error: {
      code: err.code || 'RESOURCE_NOT_FOUND',
      message: err.message || 'Resource not found',
      details: err.details || null,
    },
  };
};

/**
 * Server Error Handler (500)
 * Handles internal server errors
 * Validates: Requirements 12.4
 */
const handleServerError = (err, req) => {
  logger.error('Server error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  return {
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message:
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : err.message || 'Internal server error',
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  };
};

/**
 * Handle Mongoose Validation Errors
 */
const handleMongooseValidationError = (err, req) => {
  const errors = Object.values(err.errors).map((e) => ({
    field: e.path,
    message: e.message,
  }));

  logger.error('Mongoose validation error', {
    errors,
    path: req.path,
    method: req.method,
  });

  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: errors,
    },
  };
};

/**
 * Handle Mongoose Cast Errors (invalid ObjectId)
 */
const handleMongooseCastError = (err, req) => {
  logger.error('Mongoose cast error', {
    error: err.message,
    path: req.path,
    method: req.method,
  });

  return {
    success: false,
    error: {
      code: 'INVALID_ID',
      message: `Invalid ${err.path}: ${err.value}`,
    },
  };
};

/**
 * Handle Mongoose Duplicate Key Errors
 */
const handleMongooseDuplicateKeyError = (err, req) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];

  logger.error('Mongoose duplicate key error', {
    field,
    value,
    path: req.path,
    method: req.method,
  });

  return {
    success: false,
    error: {
      code: 'DUPLICATE_ENTRY',
      message: `${field} '${value}' already exists`,
      details: { field, value },
    },
  };
};

/**
 * Handle JWT Errors
 */
const handleJWTError = (err, req) => {
  logger.warn('JWT error', {
    error: err.message,
    path: req.path,
    method: req.method,
  });

  let message = 'Invalid token';
  let code = 'TOKEN_INVALID';

  if (err.name === 'TokenExpiredError') {
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  } else if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token';
    code = 'TOKEN_INVALID';
  }

  return {
    success: false,
    error: {
      code,
      message,
    },
  };
};

/**
 * Main Error Handler Middleware
 * Routes errors to appropriate handlers based on error type
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  let statusCode = 500;
  let response;

  // Handle custom API errors
  if (err instanceof ApiError) {
    statusCode = err.statusCode;

    if (err instanceof ValidationError) {
      response = handleValidationError(err, req);
    } else if (err instanceof AuthenticationError) {
      response = handleAuthenticationError(err, req);
    } else if (err instanceof AuthorizationError) {
      response = handleAuthorizationError(err, req);
    } else if (err instanceof NotFoundError) {
      response = handleNotFoundError(err, req);
    } else if (err instanceof ServerError) {
      response = handleServerError(err, req);
    } else {
      // Generic API error
      response = {
        success: false,
        error: {
          code: err.code,
          message: err.message,
          details: err.details || null,
        },
      };
    }
  }
  // Handle Mongoose validation errors
  else if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    response = handleMongooseValidationError(err, req);
  }
  // Handle Mongoose cast errors
  else if (err.name === 'CastError') {
    statusCode = 400;
    response = handleMongooseCastError(err, req);
  }
  // Handle Mongoose duplicate key errors
  else if (err.code === 11000) {
    statusCode = 400;
    response = handleMongooseDuplicateKeyError(err, req);
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    response = handleJWTError(err, req);
  }
  // Handle all other errors as server errors
  else {
    statusCode = err.statusCode || 500;
    response = handleServerError(err, req);
  }

  res.status(statusCode).json(response);
};

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors and pass to error middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  notFound,
  errorHandler,
  asyncHandler,
};
