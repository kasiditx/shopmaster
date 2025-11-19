const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

/**
 * ReviewService - Handles product review operations
 * Provides methods for creating, retrieving, updating, and deleting reviews
 */
class ReviewService {
  /**
   * Check if a user can review a product (must have purchased it)
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Object with canReview boolean and order ID if applicable
   */
  async canUserReview(userId, productId) {
    try {
      // Find a completed order containing this product for this user
      const order = await Order.findOne({
        user: userId,
        'items.product': productId,
        status: { $in: ['paid', 'processing', 'shipped', 'delivered'] }
      });

      if (!order) {
        return { canReview: false, orderId: null };
      }

      // Check if user has already reviewed this product
      const existingReview = await Review.findOne({
        user: userId,
        product: productId
      });

      if (existingReview) {
        return { canReview: false, orderId: order._id, alreadyReviewed: true };
      }

      return { canReview: true, orderId: order._id };
    } catch (error) {
      console.error('ReviewService.canUserReview error:', error.message);
      throw error;
    }
  }

  /**
   * Create a new review
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @param {number} rating - Rating (1-5)
   * @param {string} comment - Review comment
   * @returns {Promise<Object>} Created review
   */
  async createReview(userId, productId, rating, comment) {
    try {
      // Validate rating
      if (!rating || rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Check if user can review this product
      const { canReview, orderId, alreadyReviewed } = await this.canUserReview(userId, productId);

      if (alreadyReviewed) {
        throw new Error('You have already reviewed this product');
      }

      if (!canReview) {
        throw new Error('You can only review products you have purchased');
      }

      // Verify product exists
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Create review
      const review = await Review.create({
        user: userId,
        product: productId,
        order: orderId,
        rating,
        comment: comment || '',
        verified: true
      });

      // Update product average rating and review count
      await this.updateProductRating(productId);

      console.log(`ReviewService: Created review for product ${productId} by user ${userId}`);

      // Populate user information
      await review.populate('user', 'name');

      return review;
    } catch (error) {
      console.error('ReviewService.createReview error:', error.message);
      throw error;
    }
  }

  /**
   * Get reviews for a product with pagination
   * @param {string} productId - Product ID
   * @param {Object} options - Pagination options
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.limit - Items per page (default: 10)
   * @returns {Promise<Object>} Reviews with pagination metadata
   */
  async getProductReviews(productId, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;

      // Pagination
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
      const skip = (pageNum - 1) * limitNum;

      // Verify product exists
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Get reviews sorted by most recent first
      const [reviews, total] = await Promise.all([
        Review.find({ product: productId })
          .populate('user', 'name')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Review.countDocuments({ product: productId })
      ]);

      const totalPages = Math.ceil(total / limitNum) || 1;

      return {
        reviews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      };
    } catch (error) {
      console.error('ReviewService.getProductReviews error:', error.message);
      throw error;
    }
  }

  /**
   * Update a review
   * @param {string} reviewId - Review ID
   * @param {string} userId - User ID (for authorization)
   * @param {Object} updates - Updates (rating, comment)
   * @returns {Promise<Object>} Updated review
   */
  async updateReview(reviewId, userId, updates) {
    try {
      // Find review and verify ownership
      const review = await Review.findOne({ _id: reviewId, user: userId });

      if (!review) {
        throw new Error('Review not found or you do not have permission to update it');
      }

      // Validate rating if provided
      if (updates.rating !== undefined) {
        if (updates.rating < 1 || updates.rating > 5) {
          throw new Error('Rating must be between 1 and 5');
        }
        review.rating = updates.rating;
      }

      // Update comment if provided
      if (updates.comment !== undefined) {
        review.comment = updates.comment;
      }

      await review.save();

      // Update product average rating if rating changed
      if (updates.rating !== undefined) {
        await this.updateProductRating(review.product.toString());
      }

      console.log(`ReviewService: Updated review ${reviewId}`);

      // Populate user information
      await review.populate('user', 'name');

      return review;
    } catch (error) {
      console.error('ReviewService.updateReview error:', error.message);
      throw error;
    }
  }

  /**
   * Delete a review
   * @param {string} reviewId - Review ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} Deleted review
   */
  async deleteReview(reviewId, userId) {
    try {
      // Find review and verify ownership
      const review = await Review.findOne({ _id: reviewId, user: userId });

      if (!review) {
        throw new Error('Review not found or you do not have permission to delete it');
      }

      const productId = review.product.toString();

      // Delete review
      await Review.deleteOne({ _id: reviewId });

      // Update product average rating
      await this.updateProductRating(productId);

      console.log(`ReviewService: Deleted review ${reviewId}`);

      return review;
    } catch (error) {
      console.error('ReviewService.deleteReview error:', error.message);
      throw error;
    }
  }

  /**
   * Update product's average rating and review count
   * @param {string} productId - Product ID
   * @returns {Promise<void>}
   */
  async updateProductRating(productId) {
    try {
      // Calculate average rating
      const result = await Review.aggregate([
        { $match: { product: productId } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            reviewCount: { $sum: 1 }
          }
        }
      ]);

      let averageRating = 0;
      let reviewCount = 0;

      if (result.length > 0) {
        averageRating = Math.round(result[0].averageRating * 10) / 10; // Round to 1 decimal
        reviewCount = result[0].reviewCount;
      }

      // Update product
      await Product.findByIdAndUpdate(productId, {
        averageRating,
        reviewCount
      });

      console.log(`ReviewService: Updated product ${productId} rating to ${averageRating} (${reviewCount} reviews)`);
    } catch (error) {
      console.error('ReviewService.updateProductRating error:', error.message);
      throw error;
    }
  }
}

module.exports = new ReviewService();
