const { getRedisClient } = require('../config/redis');
const Product = require('../models/Product');

/**
 * CartService - Handles shopping cart operations with Redis storage
 * Provides methods for cart management with 7-day TTL
 */
class CartService {
  /**
   * TTL for cart data (7 days in seconds)
   */
  static CART_TTL = 604800; // 7 days

  /**
   * Tax rate (10%)
   */
  static TAX_RATE = 0.10;

  /**
   * Shipping cost calculation
   */
  static SHIPPING_COST = 10.00;

  /**
   * Generate Redis key for user's cart
   * @param {string} userId - User ID
   * @returns {string} Redis key
   */
  static getCartKey(userId) {
    return `cart:${userId}`;
  }

  /**
   * Get user's cart from Redis
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Cart object with items and totals
   */
  static async getCart(userId) {
    try {
      const client = getRedisClient();
      const cartKey = CartService.getCartKey(userId);
      const cartData = await client.get(cartKey);

      if (!cartData) {
        return {
          userId,
          items: [],
          subtotal: 0,
          tax: 0,
          shippingCost: 0,
          total: 0,
          updatedAt: new Date().toISOString()
        };
      }

      const cart = JSON.parse(cartData);
      
      // Validate cart and recalculate totals
      const validatedCart = await CartService.validateAndCalculate(cart);
      
      return validatedCart;
    } catch (error) {
      console.error(`CartService.getCart error for user "${userId}":`, error.message);
      throw new Error('Failed to retrieve cart');
    }
  }

  /**
   * Add item to cart
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @param {number} quantity - Quantity to add
   * @returns {Promise<Object>} Updated cart
   */
  static async addToCart(userId, productId, quantity = 1) {
    try {
      // Validate product exists and has stock
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      if (!product.active) {
        throw new Error('Product is not available');
      }

      if (product.stock < quantity) {
        throw new Error('Insufficient stock available');
      }

      // Get current cart
      const cart = await CartService.getCart(userId);

      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(
        item => item.productId === productId
      );

      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;
        
        // Check stock availability for new quantity
        if (product.stock < newQuantity) {
          throw new Error('Insufficient stock available');
        }
        
        cart.items[existingItemIndex].quantity = newQuantity;
        cart.items[existingItemIndex].price = product.price; // Update price in case it changed
      } else {
        // Add new item to cart
        cart.items.push({
          productId,
          name: product.name,
          price: product.price,
          quantity,
          image: product.images && product.images.length > 0 ? product.images[0] : null,
          addedAt: new Date().toISOString()
        });
      }

      cart.updatedAt = new Date().toISOString();

      // Validate and calculate totals
      const validatedCart = await CartService.validateAndCalculate(cart);

      // Save to Redis
      await CartService.saveCart(userId, validatedCart);

      return validatedCart;
    } catch (error) {
      console.error(`CartService.addToCart error:`, error.message);
      throw error;
    }
  }

  /**
   * Update cart item quantity
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @param {number} quantity - New quantity
   * @returns {Promise<Object>} Updated cart
   */
  static async updateCartItem(userId, productId, quantity) {
    try {
      if (quantity < 1) {
        throw new Error('Quantity must be at least 1');
      }

      // Validate product and stock
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      if (product.stock < quantity) {
        throw new Error('Insufficient stock available');
      }

      // Get current cart
      const cart = await CartService.getCart(userId);

      // Find item in cart
      const itemIndex = cart.items.findIndex(item => item.productId === productId);
      if (itemIndex < 0) {
        throw new Error('Item not found in cart');
      }

      // Update quantity and price
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].price = product.price; // Update price in case it changed
      cart.updatedAt = new Date().toISOString();

      // Validate and calculate totals
      const validatedCart = await CartService.validateAndCalculate(cart);

      // Save to Redis
      await CartService.saveCart(userId, validatedCart);

      return validatedCart;
    } catch (error) {
      console.error(`CartService.updateCartItem error:`, error.message);
      throw error;
    }
  }

  /**
   * Remove item from cart
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Updated cart
   */
  static async removeFromCart(userId, productId) {
    try {
      // Get current cart
      const cart = await CartService.getCart(userId);

      // Filter out the item
      const originalLength = cart.items.length;
      cart.items = cart.items.filter(item => item.productId !== productId);

      if (cart.items.length === originalLength) {
        throw new Error('Item not found in cart');
      }

      cart.updatedAt = new Date().toISOString();

      // Validate and calculate totals
      const validatedCart = await CartService.validateAndCalculate(cart);

      // Save to Redis
      await CartService.saveCart(userId, validatedCart);

      return validatedCart;
    } catch (error) {
      console.error(`CartService.removeFromCart error:`, error.message);
      throw error;
    }
  }

  /**
   * Clear entire cart
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Empty cart
   */
  static async clearCart(userId) {
    try {
      const client = getRedisClient();
      const cartKey = CartService.getCartKey(userId);
      
      await client.del(cartKey);

      return {
        userId,
        items: [],
        subtotal: 0,
        tax: 0,
        shippingCost: 0,
        total: 0,
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`CartService.clearCart error:`, error.message);
      throw new Error('Failed to clear cart');
    }
  }

  /**
   * Validate cart items and calculate totals
   * @param {Object} cart - Cart object
   * @returns {Promise<Object>} Validated cart with calculated totals
   */
  static async validateAndCalculate(cart) {
    try {
      // Validate each item's stock availability
      const validatedItems = [];
      const productIds = cart.items.map(item => item.productId);
      
      // Fetch all products at once for efficiency
      const products = await Product.find({ _id: { $in: productIds } }).lean();
      const productMap = new Map(products.map(p => [p._id.toString(), p]));

      for (const item of cart.items) {
        const product = productMap.get(item.productId);
        
        if (!product || !product.active) {
          // Skip items that are no longer available
          continue;
        }

        // Check stock availability
        if (product.stock === 0) {
          // Mark item as out of stock but keep in cart
          validatedItems.push({
            ...item,
            outOfStock: true,
            availableStock: 0
          });
        } else if (product.stock < item.quantity) {
          // Adjust quantity to available stock
          validatedItems.push({
            ...item,
            quantity: product.stock,
            availableStock: product.stock,
            quantityAdjusted: true
          });
        } else {
          // Item is valid
          validatedItems.push({
            ...item,
            outOfStock: false,
            availableStock: product.stock
          });
        }
      }

      cart.items = validatedItems;

      // Calculate totals
      const subtotal = cart.items
        .filter(item => !item.outOfStock)
        .reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const tax = subtotal * CartService.TAX_RATE;
      const shippingCost = subtotal > 0 ? CartService.SHIPPING_COST : 0;
      const total = subtotal + tax + shippingCost;

      return {
        ...cart,
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        shippingCost: Math.round(shippingCost * 100) / 100,
        total: Math.round(total * 100) / 100
      };
    } catch (error) {
      console.error(`CartService.validateAndCalculate error:`, error.message);
      throw error;
    }
  }

  /**
   * Save cart to Redis
   * @param {string} userId - User ID
   * @param {Object} cart - Cart object
   * @returns {Promise<boolean>} Success status
   */
  static async saveCart(userId, cart) {
    try {
      const client = getRedisClient();
      const cartKey = CartService.getCartKey(userId);
      const cartData = JSON.stringify(cart);
      
      await client.setEx(cartKey, CartService.CART_TTL, cartData);
      return true;
    } catch (error) {
      console.error(`CartService.saveCart error:`, error.message);
      throw new Error('Failed to save cart');
    }
  }
}

module.exports = CartService;
