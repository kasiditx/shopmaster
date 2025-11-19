// Jest setup file for global test configuration
// This file runs before each test suite

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.MONGODB_URI = 'mongodb://localhost:27017/ecommerce-test';
process.env.REDIS_URL = 'redis://localhost:6379';

// Increase timeout for integration tests
jest.setTimeout(10000);

// Mock console methods to reduce noise in test output (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };
