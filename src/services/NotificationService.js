const { emitToUser, getIO } = require('../config/socket');
const { sendEmail, emailTemplates } = require('../config/email');

/**
 * NotificationService - Handles real-time and email notifications
 * Provides methods for sending notifications via WebSocket and email
 */
class NotificationService {
  /**
   * Send WebSocket notification to a specific user
   * @param {string} userId - User ID
   * @param {string} event - Event name
   * @param {Object} data - Notification data
   * @returns {Promise<Object>} Result object
   */
  static async sendWebSocketNotification(userId, event, data) {
    try {
      // Check if Socket.io is initialized
      const io = getIO();
      
      // Emit to user's room
      emitToUser(userId, event, {
        ...data,
        timestamp: new Date().toISOString()
      });

      console.log(`NotificationService: Sent WebSocket notification to user ${userId}, event: ${event}`);
      
      return {
        success: true,
        method: 'websocket',
        userId,
        event
      };
    } catch (error) {
      console.error('NotificationService.sendWebSocketNotification error:', error.message);
      // Don't throw error, just log it - we'll fall back to email
      return {
        success: false,
        method: 'websocket',
        error: error.message
      };
    }
  }

  /**
   * Send email notification
   * @param {string} to - Recipient email address
   * @param {string} subject - Email subject
   * @param {string} html - HTML content
   * @param {string} text - Plain text content (optional)
   * @returns {Promise<Object>} Result object
   */
  static async sendEmailNotification(to, subject, html, text = null) {
    try {
      const result = await sendEmail({ to, subject, html, text });
      
      console.log(`NotificationService: Sent email to ${to}, subject: ${subject}`);
      
      return {
        success: true,
        method: 'email',
        to,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('NotificationService.sendEmailNotification error:', error.message);
      throw error;
    }
  }

  /**
   * Send notification with email fallback
   * Tries WebSocket first, falls back to email if user is not connected
   * @param {string} userId - User ID
   * @param {string} userEmail - User email address
   * @param {string} event - Event name
   * @param {Object} data - Notification data
   * @param {Object} emailTemplate - Email template object with subject and html
   * @returns {Promise<Object>} Result object
   */
  static async sendNotificationWithFallback(userId, userEmail, event, data, emailTemplate) {
    try {
      // Try WebSocket first
      const wsResult = await this.sendWebSocketNotification(userId, event, data);
      
      // Check if user is connected via WebSocket
      const io = getIO();
      const userRoom = `user:${userId}`;
      const sockets = await io.in(userRoom).fetchSockets();
      const isUserConnected = sockets.length > 0;

      // If user is not connected, send email as fallback
      if (!isUserConnected && emailTemplate) {
        console.log(`NotificationService: User ${userId} not connected, sending email fallback`);
        const emailResult = await this.sendEmailNotification(
          userEmail,
          emailTemplate.subject,
          emailTemplate.html,
          emailTemplate.text
        );
        
        return {
          success: true,
          methods: ['email'],
          websocketAttempted: true,
          emailSent: true,
          ...emailResult
        };
      }

      return {
        success: true,
        methods: ['websocket'],
        websocketSent: true,
        emailSent: false
      };
    } catch (error) {
      console.error('NotificationService.sendNotificationWithFallback error:', error.message);
      throw error;
    }
  }

  /**
   * Notify user about order status change
   * @param {Object} order - Order object
   * @param {Object} user - User object with email
   * @returns {Promise<Object>} Result object
   */
  static async notifyOrderStatusChange(order, user) {
    try {
      const event = 'order:status_changed';
      const data = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        message: `Your order ${order.orderNumber} status has been updated to ${order.status}`
      };

      const emailTemplate = emailTemplates.orderStatusUpdate({
        orderNumber: order.orderNumber,
        status: order.status
      });

      return await this.sendNotificationWithFallback(
        user._id.toString(),
        user.email,
        event,
        data,
        emailTemplate
      );
    } catch (error) {
      console.error('NotificationService.notifyOrderStatusChange error:', error.message);
      throw error;
    }
  }

  /**
   * Notify user about price change for wishlist item
   * @param {string} userId - User ID
   * @param {string} userEmail - User email
   * @param {Object} product - Product object
   * @param {number} oldPrice - Old price
   * @returns {Promise<Object>} Result object
   */
  static async notifyPriceChange(userId, userEmail, product, oldPrice) {
    try {
      const event = 'product:price_changed';
      const data = {
        productId: product._id,
        productName: product.name,
        oldPrice,
        newPrice: product.price,
        message: `Price drop! ${product.name} is now $${product.price.toFixed(2)} (was $${oldPrice.toFixed(2)})`
      };

      const emailTemplate = emailTemplates.priceDropAlert({
        name: product.name,
        price: product.price
      });

      return await this.sendNotificationWithFallback(
        userId,
        userEmail,
        event,
        data,
        emailTemplate
      );
    } catch (error) {
      console.error('NotificationService.notifyPriceChange error:', error.message);
      throw error;
    }
  }

  /**
   * Notify user about stock availability for wishlist item
   * @param {string} userId - User ID
   * @param {string} userEmail - User email
   * @param {Object} product - Product object
   * @returns {Promise<Object>} Result object
   */
  static async notifyStockAvailable(userId, userEmail, product) {
    try {
      const event = 'wishlist:stock_available';
      const data = {
        productId: product._id,
        productName: product.name,
        stock: product.stock,
        message: `Good news! ${product.name} is back in stock`
      };

      const emailTemplate = emailTemplates.stockAvailableAlert({
        name: product.name
      });

      return await this.sendNotificationWithFallback(
        userId,
        userEmail,
        event,
        data,
        emailTemplate
      );
    } catch (error) {
      console.error('NotificationService.notifyStockAvailable error:', error.message);
      throw error;
    }
  }

  /**
   * Notify admin about low stock
   * @param {Object} product - Product object
   * @param {Array} adminEmails - Array of admin email addresses
   * @returns {Promise<Array>} Array of result objects
   */
  static async notifyLowStock(product, adminEmails) {
    try {
      const results = [];

      // Send WebSocket notification to all admins
      const io = getIO();
      io.emit('inventory:low_stock', {
        productId: product._id,
        productName: product.name,
        stock: product.stock,
        threshold: product.lowStockThreshold,
        message: `Low stock alert: ${product.name} (${product.stock} remaining)`,
        timestamp: new Date().toISOString()
      });

      console.log(`NotificationService: Broadcast low stock alert for product ${product.name}`);

      // Send email to all admin users
      const emailTemplate = emailTemplates.lowStockAlert({
        name: product.name,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold
      });

      for (const email of adminEmails) {
        try {
          const emailResult = await this.sendEmailNotification(
            email,
            emailTemplate.subject,
            emailTemplate.html
          );
          results.push(emailResult);
        } catch (error) {
          console.error(`Failed to send low stock email to ${email}:`, error.message);
          results.push({
            success: false,
            method: 'email',
            to: email,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('NotificationService.notifyLowStock error:', error.message);
      throw error;
    }
  }

  /**
   * Send order confirmation notification
   * @param {Object} order - Order object
   * @param {Object} user - User object with email
   * @returns {Promise<Object>} Result object
   */
  static async sendOrderConfirmation(order, user) {
    try {
      const event = 'notification';
      const data = {
        type: 'order_confirmation',
        orderId: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        message: `Order ${order.orderNumber} confirmed! Total: $${order.total.toFixed(2)}`
      };

      const emailTemplate = emailTemplates.orderConfirmation({
        orderNumber: order.orderNumber,
        total: order.total
      });

      return await this.sendNotificationWithFallback(
        user._id.toString(),
        user.email,
        event,
        data,
        emailTemplate
      );
    } catch (error) {
      console.error('NotificationService.sendOrderConfirmation error:', error.message);
      throw error;
    }
  }
}

module.exports = NotificationService;
