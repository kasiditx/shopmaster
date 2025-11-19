const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getRedisClient } = require('../config/redis');
const User = require('../models/User');
const { ValidationError, AuthenticationError } = require('../utils/errors');

/**
 * AuthService handles authentication, token generation, and rate limiting
 * Implements JWT access tokens (15 min) and refresh tokens (7 days)
 */
class AuthService {
  /**
   * Token expiration times
   */
  static ACCESS_TOKEN_EXPIRE = '15m';
  static REFRESH_TOKEN_EXPIRE = '7d';
  static REFRESH_TOKEN_EXPIRE_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds

  /**
   * Rate limiting configuration
   */
  static LOGIN_RATE_LIMIT_WINDOW = 15 * 60; // 15 minutes in seconds
  static LOGIN_RATE_LIMIT_MAX = 5; // Max 5 attempts per window

  /**
   * Generate JWT access token
   * @param {Object} user - User object
   * @returns {string} JWT access token
   */
  static generateAccessToken(user) {
    return jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: this.ACCESS_TOKEN_EXPIRE }
    );
  }

  /**
   * Generate JWT refresh token
   * @param {Object} user - User object
   * @returns {string} JWT refresh token
   */
  static generateRefreshToken(user) {
    return jwt.sign(
      { id: user._id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRE }
    );
  }

  /**
   * Store refresh token in Redis with user ID
   * @param {string} userId - User ID
   * @param {string} refreshToken - Refresh token to store
   * @returns {Promise<void>}
   */
  static async storeRefreshToken(userId, refreshToken) {
    const redisClient = getRedisClient();
    const key = `refresh_token:${userId}`;
    
    // Store refresh token with expiration
    await redisClient.setEx(
      key,
      this.REFRESH_TOKEN_EXPIRE_SECONDS,
      refreshToken
    );
  }

  /**
   * Verify and retrieve refresh token from Redis
   * @param {string} userId - User ID
   * @param {string} refreshToken - Refresh token to verify
   * @returns {Promise<boolean>} True if token is valid
   */
  static async verifyRefreshToken(userId, refreshToken) {
    const redisClient = getRedisClient();
    const key = `refresh_token:${userId}`;
    
    const storedToken = await redisClient.get(key);
    return storedToken === refreshToken;
  }

  /**
   * Delete refresh token from Redis (logout)
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  static async deleteRefreshToken(userId) {
    const redisClient = getRedisClient();
    const key = `refresh_token:${userId}`;
    await redisClient.del(key);
  }

  /**
   * Check rate limit for login attempts
   * @param {string} ipAddress - IP address to check
   * @returns {Promise<{allowed: boolean, remaining: number}>}
   */
  static async checkLoginRateLimit(ipAddress) {
    const redisClient = getRedisClient();
    const key = `login_attempts:${ipAddress}`;
    
    const attempts = await redisClient.get(key);
    const currentAttempts = attempts ? parseInt(attempts, 10) : 0;
    
    if (currentAttempts >= this.LOGIN_RATE_LIMIT_MAX) {
      return { allowed: false, remaining: 0 };
    }
    
    return { 
      allowed: true, 
      remaining: this.LOGIN_RATE_LIMIT_MAX - currentAttempts 
    };
  }

  /**
   * Increment login attempt counter
   * @param {string} ipAddress - IP address
   * @returns {Promise<void>}
   */
  static async incrementLoginAttempts(ipAddress) {
    const redisClient = getRedisClient();
    const key = `login_attempts:${ipAddress}`;
    
    const attempts = await redisClient.get(key);
    const currentAttempts = attempts ? parseInt(attempts, 10) : 0;
    
    if (currentAttempts === 0) {
      // First attempt, set with expiration
      await redisClient.setEx(key, this.LOGIN_RATE_LIMIT_WINDOW, '1');
    } else {
      // Increment existing counter
      await redisClient.incr(key);
    }
  }

  /**
   * Reset login attempts (on successful login)
   * @param {string} ipAddress - IP address
   * @returns {Promise<void>}
   */
  static async resetLoginAttempts(ipAddress) {
    const redisClient = getRedisClient();
    const key = `login_attempts:${ipAddress}`;
    await redisClient.del(key);
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<{user: Object, accessToken: string, refreshToken: string}>}
   */
  static async register(userData) {
    const { name, email, password } = userData;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ValidationError('Email already registered', { email });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await User.create({ name, email, passwordHash });
    
    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    
    // Store refresh token
    await this.storeRefreshToken(user._id.toString(), refreshToken);
    
    return { user, accessToken, refreshToken };
  }

  /**
   * Login user with rate limiting
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} ipAddress - Client IP address
   * @returns {Promise<{user: Object, accessToken: string, refreshToken: string}>}
   */
  static async login(email, password, ipAddress) {
    // Check rate limit
    const rateLimit = await this.checkLoginRateLimit(ipAddress);
    if (!rateLimit.allowed) {
      const error = new Error('Too many login attempts. Please try again later.');
      error.statusCode = 429;
      throw error;
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      await this.incrementLoginAttempts(ipAddress);
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }
    
    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await this.incrementLoginAttempts(ipAddress);
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }
    
    // Reset login attempts on successful login
    await this.resetLoginAttempts(ipAddress);
    
    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    
    // Store refresh token (implements token rotation)
    await this.storeRefreshToken(user._id.toString(), refreshToken);
    
    return { user, accessToken, refreshToken };
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<{accessToken: string, refreshToken: string}>}
   */
  static async refreshAccessToken(refreshToken) {
    try {
      // Verify refresh token
      const payload = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );
      
      // Check token type
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      // Verify token exists in Redis
      const isValid = await this.verifyRefreshToken(payload.id, refreshToken);
      if (!isValid) {
        throw new Error('Invalid or expired refresh token');
      }
      
      // Get user
      const user = await User.findById(payload.id);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Generate new tokens (token rotation)
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);
      
      // Store new refresh token
      await this.storeRefreshToken(user._id.toString(), newRefreshToken);
      
      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      const err = new Error('Invalid or expired refresh token');
      err.statusCode = 401;
      throw err;
    }
  }

  /**
   * Logout user by deleting refresh token
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  static async logout(userId) {
    await this.deleteRefreshToken(userId);
  }

  /**
   * Verify JWT access token
   * @param {string} token - Access token
   * @returns {Promise<Object>} Decoded token payload
   */
  static async verifyAccessToken(token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      return payload;
    } catch (error) {
      const err = new Error('Invalid or expired token');
      err.statusCode = 401;
      throw err;
    }
  }
}

module.exports = AuthService;
