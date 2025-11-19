/**
 * Performance Monitoring Controller
 * Provides endpoints for viewing performance metrics
 * Validates: Requirements 14.5
 */

const PerformanceMetricsService = require('../services/PerformanceMetricsService');
const { getRedisClient } = require('../config/redis');
const mongoose = require('mongoose');

/**
 * Get cache statistics
 * GET /api/admin/performance/cache-stats
 */
const getCacheStats = async (req, res) => {
  try {
    const stats = await PerformanceMetricsService.getCacheStatistics();
    
    if (!stats) {
      return res.status(503).json({
        success: false,
        error: 'Unable to retrieve cache statistics',
      });
    }
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get performance summary
 * GET /api/admin/performance/summary
 */
const getPerformanceSummary = async (req, res) => {
  try {
    const summary = await PerformanceMetricsService.getPerformanceSummary();
    
    if (!summary) {
      return res.status(503).json({
        success: false,
        error: 'Unable to retrieve performance summary',
      });
    }
    
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get database connection status
 * GET /api/admin/performance/database-status
 */
const getDatabaseStatus = async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    
    const status = {
      state: states[dbState] || 'unknown',
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      collections: Object.keys(mongoose.connection.collections).length,
    };
    
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get Redis connection status
 * GET /api/admin/performance/redis-status
 */
const getRedisStatus = async (req, res) => {
  try {
    const redis = getRedisClient();
    
    if (!redis) {
      return res.json({
        success: true,
        data: {
          connected: false,
          message: 'Redis client not initialized',
        },
      });
    }
    
    const info = await redis.info('server');
    const lines = info.split('\r\n');
    const serverInfo = {};
    
    lines.forEach(line => {
      const [key, value] = line.split(':');
      if (key && value) {
        serverInfo[key] = value;
      }
    });
    
    res.json({
      success: true,
      data: {
        connected: redis.isOpen,
        version: serverInfo.redis_version,
        uptime: serverInfo.uptime_in_seconds,
        mode: serverInfo.redis_mode,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get system health check
 * GET /api/admin/performance/health
 */
const getHealthCheck = async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
      database: {
        connected: mongoose.connection.readyState === 1,
      },
      cache: {
        connected: false,
      },
    };
    
    // Check Redis connection
    try {
      const redis = getRedisClient();
      if (redis && redis.isOpen) {
        health.cache.connected = true;
      }
    } catch (error) {
      // Redis not available
    }
    
    // Determine overall status
    if (!health.database.connected) {
      health.status = 'unhealthy';
    } else if (!health.cache.connected) {
      health.status = 'degraded';
    }
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  getCacheStats,
  getPerformanceSummary,
  getDatabaseStatus,
  getRedisStatus,
  getHealthCheck,
};
