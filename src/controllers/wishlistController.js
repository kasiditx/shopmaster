const WishlistService = require('../services/WishlistService');

/**
 * Get user's wishlist
 * @route GET /api/wishlist
 * @access Private
 */
const getWishlist = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const wishlist = await WishlistService.getWishlist(userId);
    
    res.json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    console.error('getWishlist error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve wishlist'
      }
    });
  }
};

/**
 * Add product to wishlist
 * @route POST /api/wishlist/:productId
 * @access Private
 */
const addToWishlist = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { productId } = req.params;

    // Validation
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Product ID is required'
        }
      });
    }

    const wishlist = await WishlistService.addToWishlist(userId, productId);
    
    res.status(201).json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    console.error('addToWishlist error:', error);
    
    if (error.message === 'Product not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Product not found'
        }
      });
    }
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    if (error.message === 'Product is not available') {
      return res.status(422).json({
        success: false,
        error: {
          code: 'PRODUCT_UNAVAILABLE',
          message: 'Product is not available'
        }
      });
    }
    
    if (error.message === 'Product already in wishlist') {
      return res.status(422).json({
        success: false,
        error: {
          code: 'ALREADY_IN_WISHLIST',
          message: 'Product already in wishlist'
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to add product to wishlist'
      }
    });
  }
};

/**
 * Remove product from wishlist
 * @route DELETE /api/wishlist/:productId
 * @access Private
 */
const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { productId } = req.params;

    const wishlist = await WishlistService.removeFromWishlist(userId, productId);
    
    res.json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    console.error('removeFromWishlist error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    if (error.message === 'Product not found in wishlist') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Product not found in wishlist'
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to remove product from wishlist'
      }
    });
  }
};

/**
 * Move product from wishlist to cart
 * @route POST /api/wishlist/:productId/move-to-cart
 * @access Private
 */
const moveToCart = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { productId } = req.params;
    const { removeFromWishlist = true } = req.body;

    const result = await WishlistService.moveToCart(userId, productId, removeFromWishlist);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('moveToCart error:', error);
    
    if (error.message === 'Product not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Product not found'
        }
      });
    }
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    if (error.message === 'Product is not available') {
      return res.status(422).json({
        success: false,
        error: {
          code: 'PRODUCT_UNAVAILABLE',
          message: 'Product is not available'
        }
      });
    }
    
    if (error.message === 'Product not found in wishlist') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Product not found in wishlist'
        }
      });
    }
    
    if (error.message === 'Insufficient stock available') {
      return res.status(422).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_STOCK',
          message: 'Insufficient stock available'
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to move product to cart'
      }
    });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveToCart
};
