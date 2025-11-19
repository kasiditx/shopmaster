const cloudinary = require('cloudinary').v2;

let isConfigured = false;

/**
 * Initialize Cloudinary configuration
 */
const initializeCloudinary = () => {
  if (isConfigured) {
    return;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });

  isConfigured = true;
  console.log('Cloudinary: Configured successfully');
};

/**
 * Upload image to Cloudinary
 * @param {string} filePath - Path to file or base64 string
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
const uploadImage = async (filePath, options = {}) => {
  try {
    if (!isConfigured) {
      initializeCloudinary();
    }

    const defaultOptions = {
      folder: 'ecommerce/products',
      resource_type: 'image',
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ],
      ...options
    };

    const result = await cloudinary.uploader.upload(filePath, defaultOptions);
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array<string>} filePaths - Array of file paths or base64 strings
 * @param {Object} options - Upload options
 * @returns {Promise<Array<Object>>} Array of upload results
 */
const uploadMultipleImages = async (filePaths, options = {}) => {
  try {
    const uploadPromises = filePaths.map(filePath => uploadImage(filePath, options));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Cloudinary multiple upload error:', error);
    throw error;
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image
 * @returns {Promise<Object>} Delete result
 */
const deleteImage = async (publicId) => {
  try {
    if (!isConfigured) {
      initializeCloudinary();
    }

    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {Array<string>} publicIds - Array of public IDs
 * @returns {Promise<Object>} Delete result
 */
const deleteMultipleImages = async (publicIds) => {
  try {
    if (!isConfigured) {
      initializeCloudinary();
    }

    const result = await cloudinary.api.delete_resources(publicIds);
    return result;
  } catch (error) {
    console.error('Cloudinary multiple delete error:', error);
    throw error;
  }
};

/**
 * Get optimized image URL with transformations
 * @param {string} publicId - Public ID of the image
 * @param {Object} transformations - Transformation options
 * @returns {string} Optimized image URL
 */
const getOptimizedImageUrl = (publicId, transformations = {}) => {
  if (!isConfigured) {
    initializeCloudinary();
  }

  const defaultTransformations = {
    quality: 'auto',
    fetch_format: 'auto',
    ...transformations
  };

  return cloudinary.url(publicId, defaultTransformations);
};

/**
 * Get responsive image URLs for different screen sizes
 * @param {string} publicId - Public ID of the image
 * @returns {Object} Object with URLs for different sizes
 */
const getResponsiveImageUrls = (publicId) => {
  if (!isConfigured) {
    initializeCloudinary();
  }

  return {
    thumbnail: cloudinary.url(publicId, {
      width: 150,
      height: 150,
      crop: 'fill',
      quality: 'auto',
      fetch_format: 'auto'
    }),
    small: cloudinary.url(publicId, {
      width: 400,
      height: 400,
      crop: 'limit',
      quality: 'auto',
      fetch_format: 'auto'
    }),
    medium: cloudinary.url(publicId, {
      width: 800,
      height: 800,
      crop: 'limit',
      quality: 'auto',
      fetch_format: 'auto'
    }),
    large: cloudinary.url(publicId, {
      width: 1200,
      height: 1200,
      crop: 'limit',
      quality: 'auto',
      fetch_format: 'auto'
    }),
    original: cloudinary.url(publicId, {
      quality: 'auto',
      fetch_format: 'auto'
    })
  };
};

module.exports = {
  initializeCloudinary,
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
  getOptimizedImageUrl,
  getResponsiveImageUrls,
  cloudinary
};
