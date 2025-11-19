const { getRedisClient } = require('../config/redis');
const PerformanceMetricsService = require('./PerformanceMetricsService');

/**
 * CacheService - Handles caching operations with Redis
 * Provides methods for get, set, delete, and pattern-based invalidation
 * Validates: Requirements 1.5, 8.2, 14.1, 14.5
 */
class CacheService {
  /**
   * TTL configurations for different cache types (in seconds)
   */
  static TTL = {
    PRODUCT_LIST: process.env.NODE_ENV === 'development' ? 10 : 300,        // 10s dev / 5min prod
    PRODUCT_DETAIL: process.env.NODE_ENV === 'development' ? 10 : 600,      // 10s dev / 10min prod
    SEARCH_RESULTS: process.env.NODE_ENV === 'development' ? 10 : 180,      // 10s dev / 3min prod
    CART: 604800,             // 7 days for cart data
    SESSION: 86400,           // 24 hours for sessions
    USER_PROFILE: 1800,       // 30 minutes for user profiles
    DEFAULT: process.env.NODE_ENV === 'development' ? 10 : 300              // 10s dev / 5min prod
  };

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} Cached value or null if not found/error
   */
  static async get(key) {
    // Disable cache in development mode
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    
    return PerformanceMetricsService.trackCacheOperation('GET', key, async () => {
      try {
        const client = getRedisClient();
        const value = await client.get(key);
        
        if (!value) {
          return null;
        }

        // Try to parse JSON, return raw value if parsing fails
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      } catch (error) {
        console.error(`CacheService.get error for key "${key}":`, error.message);
        // Return null on error to allow fallback to database
        return null;
      }
    });
  }

  /**
   * Set value in cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (optional, uses DEFAULT if not provided)
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  static async set(key, value, ttl = null) {
    // Disable cache in development mode
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    return PerformanceMetricsService.trackCacheOperation('SET', key, async () => {
      try {
        const client = getRedisClient();
        const ttlToUse = ttl || CacheService.TTL.DEFAULT;
        
        // Serialize value to JSON if it's an object
        const serializedValue = typeof value === 'object' 
          ? JSON.stringify(value) 
          : String(value);

        await client.setEx(key, ttlToUse, serializedValue);
        return true;
      } catch (error) {
        console.error(`CacheService.set error for key "${key}":`, error.message);
        // Return false on error but don't throw - caching is not critical
        return false;
      }
    });
  }

  /**
   * Delete a specific key from cache
   * @param {string} key - Cache key to delete
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  static async delete(key) {
    return PerformanceMetricsService.trackCacheOperation('DELETE', key, async () => {
      try {
        const client = getRedisClient();
        await client.del(key);
        return true;
      } catch (error) {
        console.error(`CacheService.delete error for key "${key}":`, error.message);
        return false;
      }
    });
  }

  /**
   * Invalidate all cache keys matching a pattern
   * @param {string} pattern - Pattern to match (e.g., "product:*", "cart:user:123:*")
   * @returns {Promise<number>} Number of keys deleted, or 0 on error
   */
  static async invalidatePattern(pattern) {
    try {
      const client = getRedisClient();
      
      // Use SCAN to find all matching keys (safer than KEYS for production)
      const keys = [];
      let cursor = 0;

      do {
        const result = await client.scan(cursor, {
          MATCH: pattern,
          COUNT: 100
        });
        
        cursor = result.cursor;
        keys.push(...result.keys);
      } while (cursor !== 0);

      // Delete all matching keys
      if (keys.length > 0) {
        await client.del(keys);
        console.log(`CacheService: Invalidated ${keys.length} keys matching pattern "${pattern}"`);
        return keys.length;
      }

      return 0;
    } catch (error) {
      console.error(`CacheService.invalidatePattern error for pattern "${pattern}":`, error.message);
      return 0;
    }
  }

  /**
   * Check if Redis connection is available
   * @returns {boolean} True if connected, false otherwise
   */
  static isConnected() {
    try {
      const client = getRedisClient();
      return client.isOpen;
    } catch {
      return false;
    }
  }

  /**
   * Clear all cache (use with caution!)
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  static async clearAll() {
    try {
      const client = getRedisClient();
      await client.flushDb();
      console.log('CacheService: All cache cleared');
      return true;
    } catch (error) {
      console.error('CacheService.clearAll error:', error.message);
      return false;
    }
  }
}

module.exports = CacheService;
