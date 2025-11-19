/**
 * Custom Error Classes for E-commerce Platform
 * Provides structured error handling with specific error types
 */

/**
 * Base API Error class
 */
class ApiError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Distinguishes operational errors from programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error (400)
 * Used when request data is invalid or missing required fields
 */
class ValidationError extends ApiError {
  constructor(message = 'Invalid input data', details = null) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

/**
 * Authentication Error (401)
 * Used when authentication fails or token is invalid/expired
 */
class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed', code = 'AUTHENTICATION_FAILED') {
    super(401, code, message);
  }
}

/**
 * Authorization Error (403)
 * Used when user doesn't have permission to access resource
 */
class AuthorizationError extends ApiError {
  constructor(message = 'Insufficient permissions') {
    super(403, 'INSUFFICIENT_PERMISSIONS', message);
  }
}

/**
 * Not Found Error (404)
 * Used when requested resource doesn't exist
 */
class NotFoundError extends ApiError {
  constructor(message = 'Resource not found', resource = null) {
    super(404, 'RESOURCE_NOT_FOUND', message);
    if (resource) {
      this.details = { resource };
    }
  }
}

/**
 * Business Logic Error (422)
 * Used when business rules are violated
 */
class BusinessLogicError extends ApiError {
  constructor(code, message, details = null) {
    super(422, code, message, details);
  }
}

/**
 * Server Error (500)
 * Used for internal server errors
 */
class ServerError extends ApiError {
  constructor(message = 'Internal server error', code = 'INTERNAL_SERVER_ERROR') {
    super(500, code, message);
  }
}

module.exports = {
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  BusinessLogicError,
  ServerError,
};
