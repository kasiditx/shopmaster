/**
 * Tests for Performance Metrics Service
 * Validates: Requirements 14.5
 */

const PerformanceMetricsService = require('../PerformanceMetricsService');

describe('PerformanceMetricsService', () => {
  describe('Service structure', () => {
    it('should have trackDatabaseQuery method', () => {
      expect(typeof PerformanceMetricsService.trackDatabaseQuery).toBe('function');
    });

    it('should have trackCacheOperation method', () => {
      expect(typeof PerformanceMetricsService.trackCacheOperation).toBe('function');
    });

    it('should have trackExternalAPI method', () => {
      expect(typeof PerformanceMetricsService.trackExternalAPI).toBe('function');
    });

    it('should have getCacheStatistics method', () => {
      expect(typeof PerformanceMetricsService.getCacheStatistics).toBe('function');
    });

    it('should have trackRequestRate method', () => {
      expect(typeof PerformanceMetricsService.trackRequestRate).toBe('function');
    });

    it('should have trackBusinessMetric method', () => {
      expect(typeof PerformanceMetricsService.trackBusinessMetric).toBe('function');
    });

    it('should have getPerformanceSummary method', () => {
      expect(typeof PerformanceMetricsService.getPerformanceSummary).toBe('function');
    });
  });

  describe('trackDatabaseQuery', () => {
    it('should execute query function and return result', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ data: 'test' });
      
      const result = await PerformanceMetricsService.trackDatabaseQuery(
        'testQuery',
        mockQuery
      );
      
      expect(mockQuery).toHaveBeenCalled();
      expect(result).toEqual({ data: 'test' });
    });

    it('should handle query errors', async () => {
      const mockQuery = jest.fn().mockRejectedValue(new Error('Query failed'));
      
      await expect(
        PerformanceMetricsService.trackDatabaseQuery('testQuery', mockQuery)
      ).rejects.toThrow('Query failed');
    });
  });

  describe('trackCacheOperation', () => {
    it('should execute cache operation and return result', async () => {
      const mockOperation = jest.fn().mockResolvedValue('cached-value');
      
      const result = await PerformanceMetricsService.trackCacheOperation(
        'GET',
        'test:key',
        mockOperation
      );
      
      expect(mockOperation).toHaveBeenCalled();
      expect(result).toBe('cached-value');
    });

    it('should handle cache operation errors', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Cache error'));
      
      await expect(
        PerformanceMetricsService.trackCacheOperation('GET', 'test:key', mockOperation)
      ).rejects.toThrow('Cache error');
    });
  });

  describe('trackExternalAPI', () => {
    it('should execute API call and return result', async () => {
      const mockAPI = jest.fn().mockResolvedValue({ status: 'success' });
      
      const result = await PerformanceMetricsService.trackExternalAPI(
        'TestService',
        '/api/test',
        mockAPI
      );
      
      expect(mockAPI).toHaveBeenCalled();
      expect(result).toEqual({ status: 'success' });
    });

    it('should handle API call errors', async () => {
      const mockAPI = jest.fn().mockRejectedValue(new Error('API error'));
      
      await expect(
        PerformanceMetricsService.trackExternalAPI('TestService', '/api/test', mockAPI)
      ).rejects.toThrow('API error');
    });
  });

  describe('getCacheStatistics', () => {
    it('should return null when Redis is not available', async () => {
      const stats = await PerformanceMetricsService.getCacheStatistics();
      expect(stats).toBeNull();
    });
  });

  describe('trackRequestRate', () => {
    it('should not throw when tracking request rate', () => {
      expect(() => {
        PerformanceMetricsService.trackRequestRate('GET', '/api/test', 200, 150);
      }).not.toThrow();
    });
  });

  describe('trackBusinessMetric', () => {
    it('should not throw when tracking business metric', () => {
      expect(() => {
        PerformanceMetricsService.trackBusinessMetric('order_completed', 100, {
          orderId: '123',
        });
      }).not.toThrow();
    });
  });

  describe('getPerformanceSummary', () => {
    it('should return performance summary', async () => {
      const summary = await PerformanceMetricsService.getPerformanceSummary();
      
      expect(summary).toBeDefined();
      expect(summary).toHaveProperty('timestamp');
      expect(summary).toHaveProperty('cache');
    });
  });
});
