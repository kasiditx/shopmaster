const ReviewService = require('../services/ReviewService');

/**
 * Get reviews for a product
 * GET /api/products/:id/reviews
 */
const getProductReviews = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { page, limit } = req.query;

    const result = await ReviewService.getProductReviews(productId, { page, limit });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('getProductReviews error:', error.message);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: {
        code: error.message.includes('not found') ? 'RESOURCE_NOT_FOUND' : 'INTERNAL_SERVER_ERROR',
        message: error.message
      }
    });
  }
};

/**
 * Create a review for a product
 * POST /api/products/:id/reviews
 */
const createReview = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!rating) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELD',
          message: 'Rating is required'
        }
      });
    }

    const review = await ReviewService.createReview(userId, productId, rating, comment);

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('createReview error:', error.message);
    
    let statusCode = 500;
    let errorCode = 'INTERNAL_SERVER_ERROR';

    if (error.message.includes('not found')) {
      statusCode = 404;
      errorCode = 'RESOURCE_NOT_FOUND';
    } else if (error.message.includes('already reviewed') || 
               error.message.includes('only review products you have purchased') ||
               error.message.includes('must be between')) {
      statusCode = 422;
      errorCode = 'CANNOT_REVIEW_UNPURCHASED';
    }

    res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: error.message
      }
    });
  }
};

/**
 * Update a review
 * PUT /api/reviews/:id
 */
const updateReview = async (req, res) => {
  try {
    const { id: reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    const updates = {};
    if (rating !== undefined) updates.rating = rating;
    if (comment !== undefined) updates.comment = comment;

    const review = await ReviewService.updateReview(reviewId, userId, updates);

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('updateReview error:', error.message);
    
    let statusCode = 500;
    let errorCode = 'INTERNAL_SERVER_ERROR';

    if (error.message.includes('not found') || error.message.includes('do not have permission')) {
      statusCode = 404;
      errorCode = 'RESOURCE_NOT_FOUND';
    } else if (error.message.includes('must be between')) {
      statusCode = 400;
      errorCode = 'INVALID_INPUT';
    }

    res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: error.message
      }
    });
  }
};

/**
 * Delete a review
 * DELETE /api/reviews/:id
 */
const deleteReview = async (req, res) => {
  try {
    const { id: reviewId } = req.params;
    const userId = req.user.id;

    await ReviewService.deleteReview(reviewId, userId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('deleteReview error:', error.message);
    
    let statusCode = 500;
    let errorCode = 'INTERNAL_SERVER_ERROR';

    if (error.message.includes('not found') || error.message.includes('do not have permission')) {
      statusCode = 404;
      errorCode = 'RESOURCE_NOT_FOUND';
    }

    res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: error.message
      }
    });
  }
};

module.exports = {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview
};
