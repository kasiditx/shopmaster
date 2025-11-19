/**
 * Request Logging Middleware
 * Logs all API requests with timing information
 * Validates: Requirements 12.4
 */

const { logRequest } = require('../utils/logger');
const crypto = require('crypto');

/**
 * Generate unique request ID
 */
const generateRequestId = () => {
  try {
    return crypto.randomUUID();
  } catch (error) {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

/**
 * Request Logger Middleware
 * Logs all incoming API requests with method, path, status, and duration
 */
const requestLogger = (req, res, next) => {
  // Generate unique request ID
  req.id = generateRequestId();
  
  // Record start time
  const startTime = Date.now();

  // Capture the original res.json to log after response
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    // Calculate duration
    const duration = Date.now() - startTime;
    
    // Log the request
    logRequest(req, res, duration);
    
    // Call original json method
    return originalJson(body);
  };

  // Also handle res.send
  const originalSend = res.send.bind(res);
  res.send = function (body) {
    // Calculate duration
    const duration = Date.now() - startTime;
    
    // Log the request
    logRequest(req, res, duration);
    
    // Call original send method
    return originalSend(body);
  };

  next();
};

module.exports = requestLogger;
