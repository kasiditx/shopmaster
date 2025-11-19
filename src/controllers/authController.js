const AuthService = require('../services/AuthService');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/error');
const { ValidationError, AuthenticationError } = require('../utils/errors');
const { logAuth } = require('../utils/logger');

/**
 * Get client IP address from request
 * @param {Object} req - Express request object
 * @returns {string} IP address
 */
const getClientIp = (req) => {
  return req.ip || req.connection.remoteAddress || 'unknown';
};

/**
 * Register a new user
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  
  // Validate required fields
  if (!name || !email || !password) {
    throw new ValidationError('Name, email, and password are required', {
      missingFields: [!name && 'name', !email && 'email', !password && 'password'].filter(Boolean),
    });
  }
  
  // Register user
  const { user, accessToken, refreshToken } = await AuthService.register({
    name,
    email,
    password,
  });
  
  // Log registration event
  logAuth('User registered', {
    userId: user._id,
    email: user.email,
    ip: getClientIp(req),
  });
  
  // Set refresh token in httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  
  res.status(201).json({
    success: true,
    user,
    accessToken,
  });
});

/**
 * Login user with rate limiting
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = getClientIp(req);
  
  // Validate required fields
  if (!email || !password) {
    throw new ValidationError('Email and password are required', {
      missingFields: [!email && 'email', !password && 'password'].filter(Boolean),
    });
  }
  
  // Login user
  const { user, accessToken, refreshToken } = await AuthService.login(email, password, ipAddress);
  
  // Log login event
  logAuth('User logged in', {
    userId: user._id,
    email: user.email,
    ip: ipAddress,
  });
  
  // Set refresh token in httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  
  res.json({
    success: true,
    user,
    accessToken,
  });
});

/**
 * Refresh access token using refresh token from cookie
 */
const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    throw new AuthenticationError('Refresh token not found', 'TOKEN_INVALID');
  }
  
  // Refresh tokens
  const { accessToken, refreshToken: newRefreshToken } = await AuthService.refreshAccessToken(
    refreshToken
  );
  
  // Log token refresh event
  logAuth('Token refreshed', {
    userId: req.user?.id,
    ip: getClientIp(req),
  });
  
  // Set new refresh token in httpOnly cookie
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  
  res.json({
    success: true,
    accessToken,
  });
});

/**
 * Logout user by deleting refresh token
 */
const logout = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();
  
  // Delete refresh token from Redis
  await AuthService.logout(userId);
  
  // Log logout event
  logAuth('User logged out', {
    userId,
    ip: getClientIp(req),
  });
  
  // Clear refresh token cookie
  res.clearCookie('refreshToken');
  
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * Get current user
 */
const currentUser = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

module.exports = { register, login, refreshToken, logout, currentUser };
