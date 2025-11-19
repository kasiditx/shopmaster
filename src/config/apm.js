/**
 * Elastic APM Configuration for Performance Monitoring
 * Monitors request rates, response times, database queries, and cache performance
 * Validates: Requirements 14.5
 */

let apm = null;

/**
 * Initialize Elastic APM
 * Must be called before any other modules are required
 */
const initializeAPM = () => {
  // Only initialize if APM server URL is provided
  if (!process.env.ELASTIC_APM_SERVER_URL) {
    console.log('Elastic APM server URL not provided, performance monitoring disabled');
    return null;
  }

  // Initialize APM
  apm = require('elastic-apm-node').start({
    // Service name (required)
    serviceName: process.env.ELASTIC_APM_SERVICE_NAME || 'shopmaster-ecommerce',
    
    // APM Server URL (required)
    serverUrl: process.env.ELASTIC_APM_SERVER_URL,
    
    // Secret token for authentication (optional)
    secretToken: process.env.ELASTIC_APM_SECRET_TOKEN,
    
    // Environment
    environment: process.env.NODE_ENV || 'development',
    
    // Service version
    serviceVersion: process.env.npm_package_version || '1.0.0',
    
    // Transaction sample rate (1.0 = 100%, 0.1 = 10%)
    transactionSampleRate: process.env.ELASTIC_APM_TRANSACTION_SAMPLE_RATE 
      ? parseFloat(process.env.ELASTIC_APM_TRANSACTION_SAMPLE_RATE) 
      : (process.env.NODE_ENV === 'production' ? 0.1 : 1.0),
    
    // Capture request body
    captureBody: 'errors',
    
    // Capture headers
    captureHeaders: true,
    
    // Error on aborted requests
    errorOnAbortedRequests: false,
    
    // Capture error log stack traces
    captureErrorLogStackTraces: 'always',
    
    // Stack trace limit
    stackTraceLimit: 50,
    
    // Transaction max spans
    transactionMaxSpans: 500,
    
    // Span frames min duration (ms)
    spanFramesMinDuration: '5ms',
    
    // Metrics interval (seconds)
    metricsInterval: '30s',
    
    // Disable instrumentations that we don't need
    disableInstrumentations: [],
    
    // Custom context for all transactions
    addPatch: (moduleName, handler) => {
      // Add custom patches if needed
    },
    
    // Filter sensitive data
    filterHttpHeaders: true,
    
    // Sanitize field names (remove sensitive data)
    sanitizeFieldNames: [
      'password',
      'passwd',
      'pwd',
      'secret',
      'token',
      'api_key',
      'apikey',
      'access_token',
      'auth',
      'credentials',
      'mysql_pwd',
      'stripeToken',
      'card',
      'cardNumber',
      'cvv',
      'ssn',
      'credit_card',
    ],
    
    // Log level
    logLevel: process.env.ELASTIC_APM_LOG_LEVEL || 'info',
    
    // Active (can be disabled via env var)
    active: process.env.ELASTIC_APM_ACTIVE !== 'false',
    
    // Cloud provider
    cloudProvider: 'auto',
    
    // Use path as transaction name
    usePathAsTransactionName: false,
  });

  console.log(`Elastic APM initialized for ${process.env.NODE_ENV || 'development'} environment`);
  return apm;
};

/**
 * Get APM instance
 */
const getAPM = () => {
  return apm;
};

/**
 * Start a custom transaction
 * @param {string} name - Transaction name
 * @param {string} type - Transaction type (e.g., 'request', 'background-job')
 * @returns {Transaction|null}
 */
const startTransaction = (name, type = 'custom') => {
  if (!apm) return null;
  return apm.startTransaction(name, type);
};

/**
 * Start a custom span within a transaction
 * @param {string} name - Span name
 * @param {string} type - Span type (e.g., 'db', 'cache', 'external')
 * @param {string} subtype - Span subtype (e.g., 'mongodb', 'redis')
 * @param {string} action - Span action (e.g., 'query', 'get', 'set')
 * @returns {Span|null}
 */
const startSpan = (name, type = 'custom', subtype = null, action = null) => {
  if (!apm) return null;
  return apm.startSpan(name, type, subtype, action);
};

/**
 * Set custom context for current transaction
 * @param {Object} context - Custom context data
 */
const setCustomContext = (context) => {
  if (!apm) return;
  apm.setCustomContext(context);
};

/**
 * Set user context for current transaction
 * @param {Object} user - User data
 */
const setUserContext = (user) => {
  if (!apm) return;
  
  if (user) {
    apm.setUserContext({
      id: user._id?.toString() || user.id,
      username: user.name,
      email: user.email,
    });
  }
};

/**
 * Set label for current transaction
 * @param {string} key - Label key
 * @param {string|number|boolean} value - Label value
 */
const setLabel = (key, value) => {
  if (!apm) return;
  apm.setLabel(key, value);
};

/**
 * Capture an error
 * @param {Error} error - Error object
 * @param {Object} options - Additional options
 */
const captureError = (error, options = {}) => {
  if (!apm) return;
  apm.captureError(error, options);
};

/**
 * Add filter to modify or drop transactions/spans/errors before sending
 * @param {Function} callback - Filter callback
 */
const addFilter = (callback) => {
  if (!apm) return;
  apm.addFilter(callback);
};

/**
 * Middleware to track MongoDB queries
 * Wraps mongoose queries to add APM spans
 */
const trackMongoQuery = (queryName, queryFn) => {
  return async (...args) => {
    const span = startSpan(`MongoDB ${queryName}`, 'db', 'mongodb', 'query');
    
    try {
      const result = await queryFn(...args);
      if (span) span.end();
      return result;
    } catch (error) {
      if (span) {
        span.end();
        captureError(error, {
          custom: {
            query: queryName,
            type: 'mongodb',
          },
        });
      }
      throw error;
    }
  };
};

/**
 * Middleware to track Redis operations
 * Wraps Redis operations to add APM spans
 */
const trackRedisOperation = (operationName, operationFn) => {
  return async (...args) => {
    const span = startSpan(`Redis ${operationName}`, 'cache', 'redis', operationName.toLowerCase());
    
    try {
      const result = await operationFn(...args);
      if (span) {
        span.end();
        // Track cache hit/miss
        if (operationName === 'GET') {
          setLabel('cache.hit', result !== null);
        }
      }
      return result;
    } catch (error) {
      if (span) {
        span.end();
        captureError(error, {
          custom: {
            operation: operationName,
            type: 'redis',
          },
        });
      }
      throw error;
    }
  };
};

/**
 * Express middleware to add custom transaction metadata
 */
const apmMiddleware = (req, res, next) => {
  if (!apm) return next();
  
  // Set transaction name based on route
  const transaction = apm.currentTransaction;
  if (transaction && req.route) {
    transaction.name = `${req.method} ${req.route.path}`;
  }
  
  // Add custom context
  setCustomContext({
    route: req.route?.path,
    params: req.params,
    query: req.query,
  });
  
  // Add user context if authenticated
  if (req.user) {
    setUserContext(req.user);
  }
  
  // Add labels
  setLabel('http.method', req.method);
  setLabel('http.path', req.path);
  
  next();
};

/**
 * Middleware to track response times and status codes
 */
const apmResponseMiddleware = (req, res, next) => {
  if (!apm) return next();
  
  const startTime = Date.now();
  
  // Capture original end function
  const originalEnd = res.end;
  
  res.end = function (...args) {
    const duration = Date.now() - startTime;
    
    // Add response metrics
    setLabel('http.status_code', res.statusCode);
    setLabel('http.response_time', duration);
    
    // Call original end
    originalEnd.apply(res, args);
  };
  
  next();
};

module.exports = {
  initializeAPM,
  getAPM,
  startTransaction,
  startSpan,
  setCustomContext,
  setUserContext,
  setLabel,
  captureError,
  addFilter,
  trackMongoQuery,
  trackRedisOperation,
  apmMiddleware,
  apmResponseMiddleware,
};
