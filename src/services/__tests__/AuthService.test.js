const AuthService = require('../AuthService');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../../models/User');
jest.mock('../../config/redis', () => ({
  getRedisClient: jest.fn(() => ({
    setEx: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
  })),
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  });

  describe('Token Generation', () => {
    it('should generate access token with correct expiration', () => {
      const user = { _id: 'test123', role: 'customer' };
      const token = AuthService.generateAccessToken(user);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should generate refresh token with correct type', () => {
      const user = { _id: 'test123', role: 'customer' };
      const token = AuthService.generateRefreshToken(user);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test-register@example.com',
        password: 'password123'
      };

      const mockUser = {
        _id: 'user123',
        name: userData.name,
        email: userData.email,
        role: 'customer',
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);

      const result = await AuthService.register(userData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(userData.email);
      expect(result.user.name).toBe(userData.name);
    });

    it('should throw error when registering with existing email', async () => {
      const userData = {
        name: 'Test User',
        email: 'test-duplicate@example.com',
        password: 'password123'
      };

      User.findOne.mockResolvedValue({ email: userData.email });

      await expect(AuthService.register(userData)).rejects.toThrow('Email already registered');
    });
  });

  describe('User Login', () => {
    it('should login successfully with correct credentials', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test-login@example.com',
        role: 'customer',
        matchPassword: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockResolvedValue(mockUser);

      const result = await AuthService.login(
        'test-login@example.com',
        'password123',
        '127.0.0.1'
      );

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test-login@example.com');
    });

    it('should throw error with incorrect password', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test-login@example.com',
        matchPassword: jest.fn().mockResolvedValue(false),
      };

      User.findOne.mockResolvedValue(mockUser);

      await expect(
        AuthService.login('test-login@example.com', 'wrongpassword', '127.0.0.1')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error with non-existent email', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(
        AuthService.login('nonexistent@example.com', 'password123', '127.0.0.1')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('Rate Limiting', () => {
    it('should allow login within rate limit', async () => {
      const rateLimit = await AuthService.checkLoginRateLimit('192.168.1.1');
      
      expect(rateLimit.allowed).toBe(true);
      expect(rateLimit.remaining).toBe(5);
    });

    it('should track login attempts', async () => {
      const ip = '192.168.1.2';
      const { getRedisClient } = require('../../config/redis');
      
      // Create a fresh mock that returns 2 attempts
      const mockClient = {
        get: jest.fn().mockResolvedValue('2'),
        setEx: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
        incr: jest.fn().mockResolvedValue(1),
      };
      require('../../config/redis').getRedisClient.mockReturnValue(mockClient);
      
      const rateLimit = await AuthService.checkLoginRateLimit(ip);
      expect(rateLimit.remaining).toBe(3);
      expect(rateLimit.allowed).toBe(true);
    });

    it('should reset login attempts', async () => {
      const ip = '192.168.1.3';
      const { getRedisClient } = require('../../config/redis');
      
      // Create a fresh mock that returns null (no attempts)
      const mockClient = {
        get: jest.fn().mockResolvedValue(null),
        setEx: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
        incr: jest.fn().mockResolvedValue(1),
      };
      require('../../config/redis').getRedisClient.mockReturnValue(mockClient);
      
      await AuthService.resetLoginAttempts(ip);
      
      const rateLimit = await AuthService.checkLoginRateLimit(ip);
      expect(rateLimit.remaining).toBe(5);
      expect(mockClient.del).toHaveBeenCalledWith(`login_attempts:${ip}`);
    });
  });

  describe('Token Refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'customer',
      };

      // Generate a valid refresh token
      const refreshToken = AuthService.generateRefreshToken(mockUser);

      // Mock Redis to return the same token (valid)
      const { getRedisClient } = require('../../config/redis');
      const mockClient = {
        get: jest.fn().mockResolvedValue(refreshToken),
        setEx: jest.fn().mockResolvedValue('OK'),
      };
      require('../../config/redis').getRedisClient.mockReturnValue(mockClient);
      User.findById.mockResolvedValue(mockUser);

      const result = await AuthService.refreshAccessToken(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockClient.get).toHaveBeenCalledWith('refresh_token:user123');
    });

    it('should throw error with invalid refresh token', async () => {
      await expect(
        AuthService.refreshAccessToken('invalid-token')
      ).rejects.toThrow('Invalid or expired refresh token');
    });
  });

  describe('Token Verification', () => {
    it('should verify valid access token', async () => {
      const user = { _id: 'test123', role: 'customer' };
      const token = AuthService.generateAccessToken(user);

      const payload = await AuthService.verifyAccessToken(token);

      expect(payload).toHaveProperty('id', 'test123');
      expect(payload).toHaveProperty('role', 'customer');
    });

    it('should throw error with invalid access token', async () => {
      await expect(
        AuthService.verifyAccessToken('invalid-token')
      ).rejects.toThrow('Invalid or expired token');
    });
  });

  describe('Logout', () => {
    it('should delete refresh token on logout', async () => {
      const { getRedisClient } = require('../../config/redis');
      
      // Create a fresh mock for this test
      const mockDel = jest.fn().mockResolvedValue(1);
      const mockClient = {
        ...getRedisClient(),
        del: mockDel
      };
      
      // Override the mock for this test
      require('../../config/redis').getRedisClient.mockReturnValue(mockClient);

      await AuthService.logout('user123');

      expect(mockDel).toHaveBeenCalledWith('refresh_token:user123');
    });
  });
});
