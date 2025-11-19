const CartService = require('../services/CartService');
const { asyncHandler } = require('../middleware/error');
const { ValidationError } = require('../utils/errors');

/**
 * Get user's cart
 * @route GET /api/cart
 * @access Private
 */
const getCart = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();
  const cart = await CartService.getCart(userId);
  
  res.json({
    success: true,
    data: cart
  });
});

/**
 * Add item to cart
 * @route POST /api/cart/items
 * @access Private
 */
const addToCart = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();
  const { productId, quantity } = req.body;

  // Validation
  if (!productId) {
    throw new ValidationError('Product ID is required', { field: 'productId' });
  }

  const qty = parseInt(quantity, 10) || 1;
  if (qty < 1) {
    throw new ValidationError('Quantity must be at least 1', { field: 'quantity', value: qty });
  }

  const cart = await CartService.addToCart(userId, productId, qty);
  
  res.status(201).json({
    success: true,
    data: cart
  });
});

/**
 * Update cart item quantity
 * @route PUT /api/cart/items/:productId
 * @access Private
 */
const updateCartItem = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();
  const { productId } = req.params;
  const { quantity } = req.body;

  // Validation
  if (!quantity) {
    throw new ValidationError('Quantity is required', { field: 'quantity' });
  }

  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty < 1) {
    throw new ValidationError('Quantity must be at least 1', { field: 'quantity', value: qty });
  }

  const cart = await CartService.updateCartItem(userId, productId, qty);
  
  res.json({
    success: true,
    data: cart
  });
});

/**
 * Remove item from cart
 * @route DELETE /api/cart/items/:productId
 * @access Private
 */
const removeFromCart = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();
  const { productId } = req.params;

  const cart = await CartService.removeFromCart(userId, productId);
  
  res.json({
    success: true,
    data: cart
  });
});

/**
 * Clear entire cart
 * @route DELETE /api/cart
 * @access Private
 */
const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();
  const cart = await CartService.clearCart(userId);
  
  res.json({
    success: true,
    data: cart
  });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
