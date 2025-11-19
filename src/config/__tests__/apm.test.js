/**
 * Tests for APM Configuration
 * Validates: Requirements 14.5
 */

const {
  initializeAPM,
  getAPM,
  startTransaction,
  startSpan,
  setCustomContext,
  setUserContext,
  setLabel,
  captureError,
  apmMiddleware,
  apmResponseMiddleware,
} = require('../apm');

describe('APM Configuration', () => {
  describe('APM initialization', () => {
    it('should have initializeAPM function', () => {
      expect(typeof initializeAPM).toBe('function');
    });

    it('should return null when APM server URL is not provided', () => {
      // APM is not initialized in test environment
      const apm = getAPM();
      expect(apm).toBeNull();
    });

    it('should have getAPM function', () => {
      expect(typeof getAPM).toBe('function');
    });
  });

  describe('APM helper functions', () => {
    it('should have startTransaction function', () => {
      expect(typeof startTransaction).toBe('function');
    });

    it('should have startSpan function', () => {
      expect(typeof startSpan).toBe('function');
    });

    it('should have setCustomContext function', () => {
      expect(typeof setCustomContext).toBe('function');
    });

    it('should have setUserContext function', () => {
      expect(typeof setUserContext).toBe('function');
    });

    it('should have setLabel function', () => {
      expect(typeof setLabel).toBe('function');
    });

    it('should have captureError function', () => {
      expect(typeof captureError).toBe('function');
    });
  });

  describe('APM middleware', () => {
    it('should have apmMiddleware function', () => {
      expect(typeof apmMiddleware).toBe('function');
    });

    it('should have apmResponseMiddleware function', () => {
      expect(typeof apmResponseMiddleware).toBe('function');
    });

    it('should call next when APM is not initialized', () => {
      const req = {};
      const res = {};
      const next = jest.fn();

      apmMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should call next in response middleware when APM is not initialized', () => {
      const req = {};
      const res = { end: jest.fn() };
      const next = jest.fn();

      apmResponseMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('APM helper functions without initialization', () => {
    it('should return null from startTransaction when APM is not initialized', () => {
      const transaction = startTransaction('test', 'custom');
      expect(transaction).toBeNull();
    });

    it('should return null from startSpan when APM is not initialized', () => {
      const span = startSpan('test', 'custom');
      expect(span).toBeNull();
    });

    it('should not throw when setCustomContext is called without APM', () => {
      expect(() => {
        setCustomContext({ test: 'value' });
      }).not.toThrow();
    });

    it('should not throw when setUserContext is called without APM', () => {
      expect(() => {
        setUserContext({ id: '123', name: 'Test User' });
      }).not.toThrow();
    });

    it('should not throw when setLabel is called without APM', () => {
      expect(() => {
        setLabel('test', 'value');
      }).not.toThrow();
    });

    it('should not throw when captureError is called without APM', () => {
      expect(() => {
        captureError(new Error('Test error'));
      }).not.toThrow();
    });
  });
});
