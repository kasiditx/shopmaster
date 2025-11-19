/**
 * Input sanitization middleware to prevent XSS and NoSQL injection attacks
 * 
 * This middleware:
 * 1. Sanitizes user input to prevent NoSQL injection by removing $ and . characters
 * 2. Cleans user input to prevent XSS attacks by escaping HTML
 */

/**
 * Escape HTML characters to prevent XSS
 */
const escapeHtml = (str) => {
  if (typeof str !== 'string') return str;
  
  const htmlEscapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return str.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char]);
};

/**
 * MongoDB sanitization - removes $ and . from user input to prevent NoSQL injection
 * This is a custom implementation compatible with Express 5
 */
const sanitizeMongoInput = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
      // Skip if key contains $ or .
      if (key.includes('$') || key.includes('.')) {
        console.warn(`Sanitized NoSQL injection attempt: key "${key}"`);
        continue;
      }
      
      const value = obj[key];
      
      if (value && typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  };
  
  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query && Object.keys(req.query).length > 0) {
    const sanitizedQuery = sanitizeObject(req.query);
    // Replace query object properties
    Object.keys(req.query).forEach(key => delete req.query[key]);
    Object.assign(req.query, sanitizedQuery);
  }
  
  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

/**
 * XSS sanitization - escapes HTML in string values to prevent cross-site scripting
 * This is a custom implementation compatible with Express 5
 */
const sanitizeXSS = (req, res, next) => {
  const sanitizeStrings = (obj) => {
    if (!obj) return obj;
    
    if (typeof obj === 'string') {
      return escapeHtml(obj);
    }
    
    if (typeof obj !== 'object') return obj;
    
    const sanitized = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        sanitized[key] = escapeHtml(value);
      } else if (value && typeof value === 'object') {
        sanitized[key] = sanitizeStrings(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  };
  
  // Sanitize request body
  if (req.body) {
    req.body = sanitizeStrings(req.body);
  }
  
  // Sanitize query parameters
  if (req.query && Object.keys(req.query).length > 0) {
    const sanitizedQuery = sanitizeStrings(req.query);
    // Replace query object properties
    Object.keys(req.query).forEach(key => delete req.query[key]);
    Object.assign(req.query, sanitizedQuery);
  }
  
  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeStrings(req.params);
  }
  
  next();
};

/**
 * File upload sanitization
 * Validates file uploads to ensure they are safe
 */
const sanitizeFileUpload = (req, res, next) => {
  // Handle multipart form uploads (multer)
  if (req.files || req.file) {
    const files = req.files ? Object.values(req.files).flat() : [req.file];
    
    // Allowed file types for product images
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    
    // Maximum file size: 5MB
    const maxFileSize = 5 * 1024 * 1024;
    
    for (const file of files) {
      if (!file) continue;
      
      // Check file type
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: `File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`,
          },
        });
      }
      
      // Check file size
      if (file.size > maxFileSize) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: `File size ${file.size} bytes exceeds maximum allowed size of ${maxFileSize} bytes (5MB)`,
          },
        });
      }
      
      // Sanitize filename - remove special characters and spaces
      if (file.originalname) {
        file.originalname = file.originalname
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .replace(/_{2,}/g, '_');
      }
    }
  }
  
  // Handle base64 image uploads (used in this application)
  if (req.body && req.body.images && Array.isArray(req.body.images)) {
    const base64Regex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
    const maxBase64Size = 7 * 1024 * 1024; // ~5MB image = ~7MB base64
    
    for (const image of req.body.images) {
      // Skip if it's already a URL (http/https)
      if (typeof image === 'string' && image.startsWith('http')) {
        continue;
      }
      
      // Validate base64 format
      if (typeof image === 'string' && image.startsWith('data:')) {
        if (!base64Regex.test(image)) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_IMAGE_FORMAT',
              message: 'Invalid image format. Only JPEG, PNG, GIF, and WebP are allowed.',
            },
          });
        }
        
        // Check base64 size
        if (image.length > maxBase64Size) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'IMAGE_TOO_LARGE',
              message: 'Image size exceeds maximum allowed size of 5MB.',
            },
          });
        }
      }
    }
  }
  
  next();
};

module.exports = {
  sanitizeMongoInput,
  sanitizeXSS,
  sanitizeFileUpload,
};
