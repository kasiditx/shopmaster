const User = require('../models/User');
const Product = require('../models/Product');
const CartService = require('./CartService');

/**
 * WishlistService - Handles wishlist operations
 * Provides methods for managing user wishlists stored in User model
 */
class WishlistService {
  /**
   * Get user's wishlist with product details and stock status
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Wishlist with products
   */
  static async getWishlist(userId) {
    try {
      const user = await User.findById(userId)
        .populate({
          path: 'wishlist',
          select: 'name description price images stock category averageRating reviewCount active'
        })
        .lean();

      if (!user) {
        throw new Error('User not found');
      }

      // Filter out inactive products and add stock status
      const wishlistItems = (user.wishlist || [])
        .filter(product => product && product.active)
        .map(product => ({
          ...product,
          inStock: product.stock > 0,
          stockStatus: product.stock === 0 ? 'out_of_stock' : 
                      product.stock <= product.lowStockThreshold ? 'low_stock' : 'in_stock'
        }));

      return {
        userId,
        items: wishlistItems,
        count: wishlistItems.length
      };
    } catch (error) {
      console.error(`WishlistService.getWishlist error for user "${userId}":`, error.message);
      throw error;
    }
  }

  /**
   * Add product to wishlist
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Updated wishlist
   */
  static async addToWishlist(userId, productId) {
    try {
      // Validate product exists and is active
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      if (!product.active) {
        throw new Error('Product is not available');
      }

      // Get user and check if product is already in wishlist
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if product already in wishlist
      const productIdStr = productId.toString();
      const alreadyInWishlist = user.wishlist.some(
        id => id.toString() === productIdStr
      );

      if (alreadyInWishlist) {
        throw new Error('Product already in wishlist');
      }

      // Add to wishlist
      user.wishlist.push(productId);
      await user.save();

      // Return updated wishlist
      return await WishlistService.getWishlist(userId);
    } catch (error) {
      console.error(`WishlistService.addToWishlist error:`, error.message);
      throw error;
    }
  }

  /**
   * Remove product from wishlist
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Updated wishlist
   */
  static async removeFromWishlist(userId, productId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if product is in wishlist
      const productIdStr = productId.toString();
      const productIndex = user.wishlist.findIndex(
        id => id.toString() === productIdStr
      );

      if (productIndex === -1) {
        throw new Error('Product not found in wishlist');
      }

      // Remove from wishlist
      user.wishlist.splice(productIndex, 1);
      await user.save();

      // Return updated wishlist
      return await WishlistService.getWishlist(userId);
    } catch (error) {
      console.error(`WishlistService.removeFromWishlist error:`, error.message);
      throw error;
    }
  }

  /**
   * Move product from wishlist to cart
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @param {boolean} removeFromWishlist - Whether to remove from wishlist after adding to cart
   * @returns {Promise<Object>} Result with cart and wishlist
   */
  static async moveToCart(userId, productId, removeFromWishlist = true) {
    try {
      // Validate product exists
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      if (!product.active) {
        throw new Error('Product is not available');
      }

      // Check if product is in wishlist
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const productIdStr = productId.toString();
      const inWishlist = user.wishlist.some(
        id => id.toString() === productIdStr
      );

      if (!inWishlist) {
        throw new Error('Product not found in wishlist');
      }

      // Add to cart (quantity 1)
      const cart = await CartService.addToCart(userId, productId, 1);

      // Optionally remove from wishlist
      let wishlist;
      if (removeFromWishlist) {
        wishlist = await WishlistService.removeFromWishlist(userId, productId);
      } else {
        wishlist = await WishlistService.getWishlist(userId);
      }

      return {
        cart,
        wishlist,
        movedToCart: true
      };
    } catch (error) {
      console.error(`WishlistService.moveToCart error:`, error.message);
      throw error;
    }
  }
}

module.exports = WishlistService;
