const Product = require('../models/Product');
const CacheService = require('./CacheService');
const { uploadImage, uploadMultipleImages, deleteImage } = require('../config/cloudinary');
const { emitToProduct } = require('../config/socket');

/**
 * ProductService handles product search, filtering, and pagination
 */
class ProductService {
  /**
   * Search and filter products with pagination
   * @param {Object} options - Search options
   * @param {string} options.query - Search query for name/description
   * @param {string} options.category - Filter by category
   * @param {number} options.minPrice - Minimum price filter
   * @param {number} options.maxPrice - Maximum price filter
   * @param {number} options.minRating - Minimum rating filter
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.limit - Items per page (default: 20)
   * @returns {Promise<Object>} Search results with pagination metadata
   */
  async searchProducts(options = {}) {
    const {
      query = '',
      category = '',
      minPrice,
      maxPrice,
      minRating,
      page = 1,
      limit = 20,
    } = options;

    // Build MongoDB query
    const filter = { active: true };

    // Text search on name and description (case-insensitive)
    if (query && query.trim()) {
      filter.$or = [
        { name: { $regex: query.trim(), $options: 'i' } },
        { description: { $regex: query.trim(), $options: 'i' } },
      ];
    }

    // Category filter
    if (category && category.trim()) {
      filter.category = category.trim();
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined && minPrice >= 0) {
        filter.price.$gte = minPrice;
      }
      if (maxPrice !== undefined && maxPrice >= 0) {
        filter.price.$lte = maxPrice;
      }
    }

    // Rating filter
    if (minRating !== undefined && minRating >= 0) {
      filter.averageRating = { $gte: minRating };
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination
    const [products, total] = await Promise.all([
      Product.find(filter)
        .select('name description price images stock category averageRating reviewCount')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 })
        .lean(),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };
  }

  /**
   * Get a single product by ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object|null>} Product or null if not found
   */
  async getProductById(productId) {
    return Product.findById(productId).lean();
  }

  /**
   * Create a new product (Admin operation)
   * @param {Object} productData - Product data
   * @param {string} productData.name - Product name
   * @param {string} productData.description - Product description
   * @param {number} productData.price - Product price
   * @param {string} productData.category - Product category
   * @param {Array<string>} productData.images - Image URLs or base64 strings
   * @param {number} productData.stock - Initial stock quantity
   * @param {Array<string>} productData.tags - Product tags
   * @param {number} productData.lowStockThreshold - Low stock threshold
   * @returns {Promise<Object>} Created product
   */
  async createProduct(productData) {
    // Handle image uploads if images are provided as base64 or file paths
    let imageUrls = productData.images || [];
    
    if (imageUrls.length > 0 && imageUrls.some(img => !img.startsWith('http'))) {
      // Upload images to Cloudinary
      const uploadResults = await uploadMultipleImages(imageUrls);
      imageUrls = uploadResults.map(result => result.url);
    }

    const product = await Product.create({
      ...productData,
      images: imageUrls,
      active: true,
      averageRating: 0,
      reviewCount: 0,
    });

    // Invalidate product list cache
    await CacheService.invalidatePattern('product:list:*');

    return product.toObject();
  }

  /**
   * Update a product (Admin operation)
   * @param {string} productId - Product ID
   * @param {Object} updates - Product updates
   * @returns {Promise<Object|null>} Updated product or null if not found
   */
  async updateProduct(productId, updates) {
    // Handle image uploads if new images are provided
    if (updates.images && updates.images.length > 0) {
      const needsUpload = updates.images.some(img => !img.startsWith('http'));
      
      if (needsUpload) {
        // Upload new images to Cloudinary
        const uploadResults = await uploadMultipleImages(updates.images);
        updates.images = uploadResults.map(result => result.url);
      }
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      updates,
      { new: true, runValidators: true }
    ).lean();

    if (product) {
      // Invalidate cache for this product and all product listings
      await CacheService.delete(`product:detail:${productId}`);
      await CacheService.invalidatePattern('product:list:*');
    }

    return product;
  }

  /**
   * Delete a product (Admin operation)
   * Soft delete by setting active to false
   * @param {string} productId - Product ID
   * @returns {Promise<Object|null>} Deleted product or null if not found
   */
  async deleteProduct(productId) {
    // Soft delete: set active to false instead of removing from database
    const product = await Product.findByIdAndUpdate(
      productId,
      { active: false },
      { new: true }
    ).lean();

    if (product) {
      // Invalidate cache for this product and all product listings
      await CacheService.delete(`product:detail:${productId}`);
      await CacheService.invalidatePattern('product:list:*');
    }

    return product;
  }

  /**
   * Update product stock (Admin operation)
   * Broadcasts inventory change via WebSocket to all connected clients viewing the product
   * @param {string} productId - Product ID
   * @param {number} quantity - New stock quantity
   * @returns {Promise<Object|null>} Updated product or null if not found
   */
  async updateStock(productId, quantity) {
    const product = await Product.findByIdAndUpdate(
      productId,
      { stock: quantity, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).lean();

    if (product) {
      // Invalidate cache for this product
      await CacheService.delete(`product:detail:${productId}`);
      await CacheService.invalidatePattern('product:list:*');

      // Broadcast inventory change via WebSocket
      emitToProduct(productId, 'product:stock_updated', {
        productId: product._id,
        stock: product.stock,
        name: product.name,
        updatedAt: product.updatedAt,
      });
    }

    return product;
  }
}

module.exports = new ProductService();
