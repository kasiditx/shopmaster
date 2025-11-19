const Order = require('../models/Order');
const Product = require('../models/Product');
const CartService = require('./CartService');
const NotificationService = require('./NotificationService');

/**
 * OrderService - Handles order management operations
 * Provides methods for creating, retrieving, updating, and canceling orders
 */
class OrderService {
  /**
   * Create a new order from cart
   * @param {string} userId - User ID
   * @param {Object} cartData - Cart data with items
   * @param {Object} shippingAddress - Shipping address
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @returns {Promise<Object>} Created order
   */
  static async createOrder(userId, cartData, shippingAddress, paymentIntentId) {
    try {
      // Validate cart has items
      if (!cartData.items || cartData.items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Validate shipping address
      if (!shippingAddress || !shippingAddress.line1 || !shippingAddress.city || 
          !shippingAddress.state || !shippingAddress.postalCode || !shippingAddress.country) {
        throw new Error('Complete shipping address is required');
      }

      // Prepare order items and validate stock
      const orderItems = [];
      const productIds = cartData.items.map(item => item.productId);
      const products = await Product.find({ _id: { $in: productIds } });
      const productMap = new Map(products.map(p => [p._id.toString(), p]));

      for (const cartItem of cartData.items) {
        const product = productMap.get(cartItem.productId);
        
        if (!product) {
          throw new Error(`Product ${cartItem.productId} not found`);
        }

        if (!product.active) {
          throw new Error(`Product ${product.name} is not available`);
        }

        if (product.stock < cartItem.quantity) {
          throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${cartItem.quantity}`);
        }

        orderItems.push({
          product: product._id,
          name: product.name,
          price: product.price,
          qty: cartItem.quantity
        });
      }

      // Create order
      const order = new Order({
        user: userId,
        items: orderItems,
        subtotal: cartData.subtotal,
        tax: cartData.tax,
        shippingCost: cartData.shippingCost,
        total: cartData.total,
        status: 'pending',
        paymentIntentId,
        paymentStatus: 'pending',
        shippingAddress,
        statusHistory: [{
          status: 'pending',
          timestamp: new Date(),
          note: 'Order created'
        }]
      });

      // Save order (this will generate the order number via pre-save hook)
      await order.save();

      // Reduce inventory for all products
      for (const item of orderItems) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.qty } }
        );
      }

      console.log(`OrderService: Created order ${order.orderNumber} for user ${userId}`);

      // Populate user for notification (if populate method exists)
      if (typeof order.populate === 'function') {
        await order.populate('user', 'name email');
        
        // Send order confirmation notification
        try {
          await NotificationService.sendOrderConfirmation(order, order.user);
        } catch (notificationError) {
          // Log error but don't fail the order creation
          console.error('Failed to send order confirmation notification:', notificationError.message);
        }
      }

      return order;
    } catch (error) {
      console.error('OrderService.createOrder error:', error.message);
      throw error;
    }
  }

  /**
   * Get order by ID
   * @param {string} orderId - Order ID
   * @param {string} userId - User ID (optional, for authorization check)
   * @returns {Promise<Object>} Order object
   */
  static async getOrder(orderId, userId = null) {
    try {
      const query = { _id: orderId };
      
      // If userId provided, ensure user can only access their own orders
      if (userId) {
        query.user = userId;
      }

      const order = await Order.findOne(query)
        .populate('user', 'name email')
        .populate('items.product', 'name images');

      if (!order) {
        throw new Error('Order not found');
      }

      return order;
    } catch (error) {
      console.error('OrderService.getOrder error:', error.message);
      throw error;
    }
  }

  /**
   * Get all orders for a user
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters (status, dateFrom, dateTo)
   * @returns {Promise<Array>} Array of orders
   */
  static async getUserOrders(userId, filters = {}) {
    try {
      const query = { user: userId };

      // Apply status filter
      if (filters.status) {
        query.status = filters.status;
      }

      // Apply date range filter
      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) {
          query.createdAt.$gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          query.createdAt.$lte = new Date(filters.dateTo);
        }
      }

      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .populate('items.product', 'name images');

      return orders;
    } catch (error) {
      console.error('OrderService.getUserOrders error:', error.message);
      throw error;
    }
  }

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {string} newStatus - New status
   * @param {string} note - Optional note for status change
   * @returns {Promise<Object>} Updated order
   */
  static async updateOrderStatus(orderId, newStatus, note = '') {
    try {
      // Validate status
      const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status: ${newStatus}`);
      }

      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Don't allow status changes for cancelled orders
      if (order.status === 'cancelled' && newStatus !== 'cancelled') {
        throw new Error('Cannot change status of cancelled order');
      }

      // Update status
      order.status = newStatus;
      order.statusHistory.push({
        status: newStatus,
        timestamp: new Date(),
        note: note || `Status changed to ${newStatus}`
      });

      await order.save();

      console.log(`OrderService: Updated order ${order.orderNumber} status to ${newStatus}`);

      // Populate user for notification (if populate method exists)
      if (typeof order.populate === 'function') {
        await order.populate('user', 'name email');
        
        // Send notification to customer
        try {
          await NotificationService.notifyOrderStatusChange(order, order.user);
        } catch (notificationError) {
          // Log error but don't fail the order status update
          console.error('Failed to send order status notification:', notificationError.message);
        }
      }

      return order;
    } catch (error) {
      console.error('OrderService.updateOrderStatus error:', error.message);
      throw error;
    }
  }

  /**
   * Cancel an order (only if status is 'pending')
   * @param {string} orderId - Order ID
   * @param {string} userId - User ID (for authorization)
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Cancelled order
   */
  static async cancelOrder(orderId, userId, reason = 'Cancelled by customer') {
    try {
      const order = await Order.findOne({ _id: orderId, user: userId });
      
      if (!order) {
        throw new Error('Order not found');
      }

      // Only allow cancellation of pending orders
      if (order.status !== 'pending') {
        throw new Error(`Cannot cancel order with status: ${order.status}. Only pending orders can be cancelled.`);
      }

      // Update order status to cancelled
      order.status = 'cancelled';
      order.statusHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        note: reason
      });

      await order.save();

      // Restore inventory for all products
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.qty } }
        );
      }

      console.log(`OrderService: Cancelled order ${order.orderNumber} and restored inventory`);

      return order;
    } catch (error) {
      console.error('OrderService.cancelOrder error:', error.message);
      throw error;
    }
  }

  /**
   * Get order by order number
   * @param {string} orderNumber - Order number
   * @returns {Promise<Object>} Order object
   */
  static async getOrderByNumber(orderNumber) {
    try {
      const order = await Order.findOne({ orderNumber })
        .populate('user', 'name email')
        .populate('items.product', 'name images');

      if (!order) {
        throw new Error('Order not found');
      }

      return order;
    } catch (error) {
      console.error('OrderService.getOrderByNumber error:', error.message);
      throw error;
    }
  }

  /**
   * Get all orders with filtering (admin only)
   * @param {Object} filters - Filters (status, dateFrom, dateTo, customer)
   * @param {Object} pagination - Pagination options (page, limit)
   * @returns {Promise<Object>} Orders with pagination metadata
   */
  static async getAllOrders(filters = {}, pagination = {}) {
    try {
      const query = {};

      // Apply status filter
      if (filters.status) {
        query.status = filters.status;
      }

      // Apply date range filter
      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) {
          query.createdAt.$gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          query.createdAt.$lte = new Date(filters.dateTo);
        }
      }

      // Apply customer filter (by user ID)
      if (filters.customer) {
        query.user = filters.customer;
      }

      // Pagination
      const page = parseInt(pagination.page) || 1;
      const limit = parseInt(pagination.limit) || 20;
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const totalOrders = await Order.countDocuments(query);
      const totalPages = Math.ceil(totalOrders / limit);

      // Get orders
      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email')
        .populate('items.product', 'name images');

      return {
        orders,
        pagination: {
          currentPage: page,
          totalPages,
          totalOrders,
          ordersPerPage: limit
        }
      };
    } catch (error) {
      console.error('OrderService.getAllOrders error:', error.message);
      throw error;
    }
  }

  /**
   * Search orders by order number or customer email (admin only)
   * @param {string} searchTerm - Search term (order number or email)
   * @returns {Promise<Array>} Array of matching orders
   */
  static async searchOrders(searchTerm) {
    try {
      if (!searchTerm || searchTerm.trim() === '') {
        throw new Error('Search term is required');
      }

      const trimmedTerm = searchTerm.trim();

      // First, try to find by order number (exact match)
      let orders = await Order.find({ orderNumber: trimmedTerm })
        .populate('user', 'name email')
        .populate('items.product', 'name images');

      // If no orders found by order number, search by customer email
      if (orders.length === 0) {
        // Find users with matching email
        const User = require('../models/User');
        const users = await User.find({ 
          email: { $regex: trimmedTerm, $options: 'i' } 
        }).select('_id');

        if (users.length > 0) {
          const userIds = users.map(u => u._id);
          orders = await Order.find({ user: { $in: userIds } })
            .sort({ createdAt: -1 })
            .populate('user', 'name email')
            .populate('items.product', 'name images');
        }
      }

      return orders;
    } catch (error) {
      console.error('OrderService.searchOrders error:', error.message);
      throw error;
    }
  }

  /**
   * Generate sales report for a date range (admin only)
   * @param {Date} dateFrom - Start date
   * @param {Date} dateTo - End date
   * @returns {Promise<Object>} Sales report with revenue, order count, and top products
   */
  static async generateSalesReport(dateFrom, dateTo) {
    try {
      // Validate dates
      if (!dateFrom || !dateTo) {
        throw new Error('Date range is required');
      }

      const startDate = new Date(dateFrom);
      const endDate = new Date(dateTo);

      if (startDate > endDate) {
        throw new Error('Start date must be before end date');
      }

      // Get all completed orders in date range (exclude cancelled and pending)
      const orders = await Order.find({
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $in: ['paid', 'processing', 'shipped', 'delivered'] }
      }).populate('items.product', 'name');

      // Calculate total revenue
      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

      // Calculate order count
      const orderCount = orders.length;

      // Calculate top-selling products by quantity sold
      const productSales = {};
      
      orders.forEach(order => {
        order.items.forEach(item => {
          const productId = item.product?._id?.toString() || 'unknown';
          const productName = item.product?.name || item.name;
          
          if (!productSales[productId]) {
            productSales[productId] = {
              productId,
              productName,
              quantitySold: 0,
              revenue: 0
            };
          }
          
          productSales[productId].quantitySold += item.qty;
          productSales[productId].revenue += item.price * item.qty;
        });
      });

      // Convert to array and sort by quantity sold
      const topProducts = Object.values(productSales)
        .sort((a, b) => b.quantitySold - a.quantitySold)
        .slice(0, 10); // Top 10 products

      // Calculate average order value
      const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

      return {
        dateRange: {
          from: startDate,
          to: endDate
        },
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        orderCount,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        topProducts
      };
    } catch (error) {
      console.error('OrderService.generateSalesReport error:', error.message);
      throw error;
    }
  }
}

module.exports = OrderService;
