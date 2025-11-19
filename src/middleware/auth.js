const AuthService = require('../services/AuthService');
const User = require('../models/User');

/**
 * Authentication middleware
 * Verifies JWT access token from Authorization header
 */
const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      error: {
        code: 'TOKEN_INVALID',
        message: 'Unauthorized'
      }
    });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    // Verify access token
    const payload = await AuthService.verifyAccessToken(token);
    
    // Get user from database
    req.user = await User.findById(payload.id).select('-passwordHash');
    
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: {
          code: 'TOKEN_INVALID',
          message: 'Unauthorized'
        }
      });
    }
    
    next();
  } catch (err) {
    return res.status(401).json({ 
      success: false,
      error: {
        code: err.statusCode === 401 ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
        message: 'Unauthorized'
      }
    });
  }
};

/**
 * Admin authorization middleware
 * Must be used after auth middleware
 */
const admin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Forbidden'
      }
    });
  }
  next();
};

module.exports = { auth, admin };
