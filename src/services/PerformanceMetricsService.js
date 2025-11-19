/**
 * Performance Metrics Service
 * Tracks custom performance metrics for monitoring
 * Validates: Requirements 14.5
 */

const { getAPM, startSpan, setLabel, setCustomContext } = require('../config/apm');
const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

class PerformanceMetricsService {
  /**
   * Track database query performance
   * @param {string} queryName - Name of the query
   * @param {Function} queryFn - Query function to execute
   * @param {Object} context - Additional context
   */
  static async trackDatabaseQuery(queryName, queryFn, context = {}) {
    const apm = getAPM();
    const span = apm ? apm.startSpan(`DB: ${queryName}`, 'db', 'mongodb', 'query') : null;
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      if (span) {
        span.addLabels({
          'db.query': queryName,
          'db.duration': duration,
          ...context,
        });
        span.end();
      }
      
      // Log slow queries (> 1 second)
      if (duration > 1000) {
        logger.warn('Slow database query detected', {
          query: queryName,
          duration: `${duration}ms`,
          ...context,
        });
      }
      
      return result;
    } catch (error) {
      if (span) {
        span.end();
      }
      
      logger.error('Database query failed', {
        query: queryName,
        error: error.message,
        ...context,
      });
      
      throw error;
    }
  }
  
  /**
   * Track cache operations and hit/miss rates
   * @param {string} operation - Cache operation (get, set, delete)
   * @param {string} key - Cache key
   * @param {Function} operationFn - Operation function to execute
   */
  static async trackCacheOperation(operation, key, operationFn) {
    const apm = getAPM();
    const span = apm ? apm.startSpan(`Cache: ${operation}`, 'cache', 'redis', operation.toLowerCase()) : null;
    const startTime = Date.now();
    
    try {
      const result = await operationFn();
      const duration = Date.now() - startTime;
      
      if (span) {
        const labels = {
          'cache.operation': operation,
          'cache.key': key,
          'cache.duration': duration,
        };
        
        // Track cache hit/miss for GET operations
        if (operation === 'GET') {
          labels['cache.hit'] = result !== null && result !== undefined;
        }
        
        span.addLabels(labels);
        span.end();
      }
      
      return result;
    } catch (error) {
      if (span) {
        span.end();
      }
      
      logger.error('Cache operation failed', {
        operation,
        key,
        error: error.message,
      });
      
      throw error;
    }
  }
  
  /**
   * Track external API calls
   * @param {string} serviceName - Name of external service
   * @param {string} endpoint - API endpoint
   * @param {Function} apiFn - API call function
   */
  static async trackExternalAPI(serviceName, endpoint, apiFn) {
    const apm = getAPM();
    const span = apm ? apm.startSpan(`External: ${serviceName}`, 'external', 'http', 'request') : null;
    const startTime = Date.now();
    
    try {
      const result = await apiFn();
      const duration = Date.now() - startTime;
      
      if (span) {
        span.addLabels({
          'external.service': serviceName,
          'external.endpoint': endpoint,
          'external.duration': duration,
        });
        span.end();
      }
      
      // Log slow external API calls (> 2 seconds)
      if (duration > 2000) {
        logger.warn('Slow external API call detected', {
          service: serviceName,
          endpoint,
          duration: `${duration}ms`,
        });
      }
      
      return result;
    } catch (error) {
      if (span) {
        span.end();
      }
      
      logger.error('External API call failed', {
        service: serviceName,
        endpoint,
        error: error.message,
      });
      
      throw error;
    }
  }
  
  /**
   * Get cache hit/miss statistics
   * This is a helper method to calculate cache performance
   */
  static async getCacheStatistics() {
    try {
      const redis = getRedisClient();
      if (!redis) {
        return null;
      }
      
      // Get Redis INFO stats
      const info = await redis.info('stats');
      
      // Parse the info string
      const stats = {};
      info.split('\r\n').forEach(line => {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = value;
        }
      });
      
      // Calculate hit rate
      const hits = parseInt(stats.keyspace_hits || 0);
      const misses = parseInt(stats.keyspace_misses || 0);
      const total = hits + misses;
      const hitRate = total > 0 ? (hits / total * 100).toFixed(2) : 0;
      
      return {
        hits,
        misses,
        total,
        hitRate: `${hitRate}%`,
      };
    } catch (error) {
      logger.error('Failed to get cache statistics', {
        error: error.message,
      });
      return null;
    }
  }
  
  /**
   * Track request rate
   * This method can be called periodically to log request metrics
   */
  static trackRequestRate(method, path, statusCode, duration) {
    const apm = getAPM();
    
    if (apm) {
      setLabel('http.method', method);
      setLabel('http.path', path);
      setLabel('http.status_code', statusCode);
      setLabel('http.response_time', duration);
    }
    
    // Log request metrics
    logger.info('Request completed', {
      method,
      path,
      statusCode,
      duration: `${duration}ms`,
      category: 'performance',
    });
  }
  
  /**
   * Track business metrics
   * @param {string} metricName - Name of the metric
   * @param {number} value - Metric value
   * @param {Object} labels - Additional labels
   */
  static trackBusinessMetric(metricName, value, labels = {}) {
    const apm = getAPM();
    
    if (apm) {
      setCustomContext({
        metric: metricName,
        value,
        ...labels,
      });
    }
    
    logger.info('Business metric', {
      metric: metricName,
      value,
      ...labels,
      category: 'business_metric',
    });
  }
  
  /**
   * Get performance summary
   * Returns a summary of key performance metrics
   */
  static async getPerformanceSummary() {
    try {
      const cacheStats = await this.getCacheStatistics();
      
      return {
        timestamp: new Date().toISOString(),
        cache: cacheStats,
        // Add more metrics as needed
      };
    } catch (error) {
      logger.error('Failed to get performance summary', {
        error: error.message,
      });
      return null;
    }
  }
}

module.exports = PerformanceMetricsService;
