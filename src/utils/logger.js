/**
 * Enhanced Logger Utility with Winston
 * Provides structured logging for the application
 * Validates: Requirements 12.4
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

// Custom format for JSON logging
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Custom format for console logging (development)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = '\n' + JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Configure transports
const transports = [];

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? jsonFormat : consoleFormat,
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  })
);

// File transports (production and development)
if (process.env.NODE_ENV !== 'test') {
  // Error logs - separate file for errors
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: jsonFormat,
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    })
  );

  // Combined logs - all logs
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: jsonFormat,
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    })
  );

  // Authentication logs - separate file for security events
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'auth-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: jsonFormat,
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true,
      level: 'info',
    })
  );

  // Transaction logs - orders and payments
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'transactions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: jsonFormat,
      maxSize: '20m',
      maxFiles: '90d', // Keep transaction logs longer
      zippedArchive: true,
      level: 'info',
    })
  );
}

// Create Winston logger instance
const logger = winston.createLogger({
  levels: winston.config.npm.levels,
  transports,
  exitOnError: false,
});

/**
 * Log error level messages with stack traces
 * Validates: Requirements 12.4
 */
const error = (message, context = {}) => {
  logger.error(message, {
    ...context,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log warning level messages
 */
const warn = (message, context = {}) => {
  logger.warn(message, {
    ...context,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log info level messages
 * Used for important business events
 */
const info = (message, context = {}) => {
  logger.info(message, {
    ...context,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log debug level messages (detailed debugging information)
 */
const debug = (message, context = {}) => {
  logger.debug(message, {
    ...context,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log authentication events
 * Validates: Requirements 12.4
 */
const logAuth = (event, context = {}) => {
  logger.info(`AUTH: ${event}`, {
    ...context,
    category: 'authentication',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log order transactions
 * Validates: Requirements 12.4
 */
const logOrder = (event, context = {}) => {
  logger.info(`ORDER: ${event}`, {
    ...context,
    category: 'order',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log payment transactions
 * Validates: Requirements 12.4
 */
const logPayment = (event, context = {}) => {
  logger.info(`PAYMENT: ${event}`, {
    ...context,
    category: 'payment',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log API requests
 * Validates: Requirements 12.4
 */
const logRequest = (req, res, duration) => {
  const logData = {
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id,
    requestId: req.id,
    category: 'api_request',
  };

  if (res.statusCode >= 500) {
    logger.error('API Request Failed', logData);
  } else if (res.statusCode >= 400) {
    logger.warn('API Request Error', logData);
  } else {
    logger.info('API Request', logData);
  }
};

module.exports = {
  error,
  warn,
  info,
  debug,
  logAuth,
  logOrder,
  logPayment,
  logRequest,
  LOG_LEVELS,
  logger, // Export the winston logger instance for advanced usage
};
