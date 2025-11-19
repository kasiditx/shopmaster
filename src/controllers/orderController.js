const OrderService = require('../services/OrderService');
const CartService = require('../services/CartService');
const { logOrder } = require('../utils/logger');

/**
 * Create a new order
 * @route POST /api/orders
 * @access Private
 */
const createOrder = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { shippingAddress, paymentIntentId } = req.body;

    // Validate shipping address
    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Shipping address is required'
        }
      });
    }

    // Validate required address fields
    const requiredFields = ['line1', 'city', 'state', 'postalCode', 'country'];
    const missingFields = requiredFields.filter(field => !shippingAddress[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: `Missing required address fields: ${missingFields.join(', ')}`
        }
      });
    }

    // Get cart data
    const cart = await CartService.getCart(userId);
    
    if (!cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Cart is empty'
        }
      });
    }

    // Check for out of stock items
    const outOfStockItems = cart.items.filter(item => item.outOfStock);
    if (outOfStockItems.length > 0) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'OUT_OF_STOCK',
          message: 'Some items in cart are out of stock',
          details: { outOfStockItems }
        }
      });
    }

    // Create order
    const order = await OrderService.createOrder(
      userId,
      cart,
      shippingAddress,
      paymentIntentId
    );

    // Log order creation
    logOrder('Order created', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId,
      total: order.total,
      itemCount: order.items.length,
    });

    // Clear cart after successful order creation
    await CartService.clearCart(userId);

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('createOrder error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: error.message
        }
      });
    }
    
    if (error.message.includes('not available') || error.message.includes('Insufficient stock')) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_STOCK',
          message: error.message
        }
      });
    }
    
    if (error.message.includes('required')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: error.message
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create order'
      }
    });
  }
};

/**
 * Get user's orders
 * @route GET /api/orders
 * @access Private
 */
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { status, dateFrom, dateTo } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;

    const orders = await OrderService.getUserOrders(userId, filters);
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('getMyOrders error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve orders'
      }
    });
  }
};

/**
 * Get order by ID
 * @route GET /api/orders/:id
 * @access Private
 */
const getOrderById = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { id } = req.params;

    const order = await OrderService.getOrder(id, userId);
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('getOrderById error:', error);
    
    if (error.message === 'Order not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve order'
      }
    });
  }
};

/**
 * Cancel an order
 * @route PUT /api/orders/:id/cancel
 * @access Private
 */
const cancelOrder = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { id } = req.params;
    const { reason } = req.body;

    const order = await OrderService.cancelOrder(
      id,
      userId,
      reason || 'Cancelled by customer'
    );
    
    // Log order cancellation
    logOrder('Order cancelled', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId,
      reason: reason || 'Cancelled by customer',
    });
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('cancelOrder error:', error);
    
    if (error.message === 'Order not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }
    
    if (error.message.includes('Cannot cancel')) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'INVALID_OPERATION',
          message: error.message
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to cancel order'
      }
    });
  }
};

/**
 * Get all orders with filtering (admin only)
 * @route GET /api/admin/orders
 * @access Private/Admin
 */
const getAllOrders = async (req, res) => {
  try {
    const { status, dateFrom, dateTo, customer, page, limit } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (customer) filters.customer = customer;

    const pagination = {};
    if (page) pagination.page = page;
    if (limit) pagination.limit = limit;

    const result = await OrderService.getAllOrders(filters, pagination);
    
    res.json({
      success: true,
      data: result.orders,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('getAllOrders error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve orders'
      }
    });
  }
};

/**
 * Update order status (admin only)
 * @route PUT /api/admin/orders/:id/status
 * @access Private/Admin
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Status is required'
        }
      });
    }

    const order = await OrderService.updateOrderStatus(id, status, note);
    
    // Log order status update
    logOrder('Order status updated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      oldStatus: order.statusHistory[order.statusHistory.length - 2]?.status,
      newStatus: status,
      note,
      adminId: req.user._id,
    });
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    
    if (error.message === 'Order not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }
    
    if (error.message.includes('Invalid status') || error.message.includes('Cannot change')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: error.message
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update order status'
      }
    });
  }
};

/**
 * Search orders by order number or customer email (admin only)
 * @route GET /api/admin/orders/search
 * @access Private/Admin
 */
const searchOrders = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Search query parameter "q" is required'
        }
      });
    }

    const orders = await OrderService.searchOrders(q);
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('searchOrders error:', error);
    
    if (error.message.includes('required')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: error.message
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to search orders'
      }
    });
  }
};

/**
 * Generate sales report (admin only)
 * @route GET /api/admin/reports/sales
 * @access Private/Admin
 */
const generateSalesReport = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Both dateFrom and dateTo query parameters are required'
        }
      });
    }

    const report = await OrderService.generateSalesReport(dateFrom, dateTo);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('generateSalesReport error:', error);
    
    if (error.message.includes('required') || error.message.includes('before')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: error.message
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate sales report'
      }
    });
  }
};

module.exports = { 
  createOrder, 
  getMyOrders, 
  getOrderById,
  cancelOrder,
  // Admin endpoints
  getAllOrders,
  updateOrderStatus,
  searchOrders,
  generateSalesReport
};
