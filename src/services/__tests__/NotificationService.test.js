const NotificationService = require('../NotificationService');
const { getIO, emitToUser } = require('../../config/socket');
const { sendEmail, emailTemplates } = require('../../config/email');

// Mock dependencies
jest.mock('../../config/socket');
jest.mock('../../config/email');

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendWebSocketNotification', () => {
    it('should send WebSocket notification successfully', async () => {
      const mockIO = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn()
      };
      getIO.mockReturnValue(mockIO);
      emitToUser.mockImplementation(() => {});

      const userId = 'user123';
      const event = 'test:event';
      const data = { message: 'Test notification' };

      const result = await NotificationService.sendWebSocketNotification(userId, event, data);

      expect(result.success).toBe(true);
      expect(result.method).toBe('websocket');
      expect(result.userId).toBe(userId);
      expect(result.event).toBe(event);
      expect(emitToUser).toHaveBeenCalledWith(userId, event, expect.objectContaining({
        message: 'Test notification',
        timestamp: expect.any(String)
      }));
    });

    it('should handle WebSocket errors gracefully', async () => {
      getIO.mockImplementation(() => {
        throw new Error('Socket.io not initialized');
      });

      const result = await NotificationService.sendWebSocketNotification('user123', 'test:event', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Socket.io not initialized');
    });
  });

  describe('sendEmailNotification', () => {
    it('should send email notification successfully', async () => {
      const mockEmailResult = {
        success: true,
        messageId: 'msg123'
      };
      sendEmail.mockResolvedValue(mockEmailResult);

      const to = 'test@example.com';
      const subject = 'Test Subject';
      const html = '<p>Test email</p>';

      const result = await NotificationService.sendEmailNotification(to, subject, html);

      expect(result.success).toBe(true);
      expect(result.method).toBe('email');
      expect(result.to).toBe(to);
      expect(result.messageId).toBe('msg123');
      expect(sendEmail).toHaveBeenCalledWith({
        to,
        subject,
        html,
        text: null
      });
    });

    it('should throw error if email sending fails', async () => {
      sendEmail.mockRejectedValue(new Error('Email service unavailable'));

      await expect(
        NotificationService.sendEmailNotification('test@example.com', 'Subject', '<p>Body</p>')
      ).rejects.toThrow('Email service unavailable');
    });
  });

  describe('sendNotificationWithFallback', () => {
    it('should send WebSocket notification when user is connected', async () => {
      const mockIO = {
        in: jest.fn().mockReturnThis(),
        fetchSockets: jest.fn().mockResolvedValue([{ id: 'socket1' }])
      };
      getIO.mockReturnValue(mockIO);
      emitToUser.mockImplementation(() => {});

      const userId = 'user123';
      const userEmail = 'test@example.com';
      const event = 'test:event';
      const data = { message: 'Test' };
      const emailTemplate = { subject: 'Test', html: '<p>Test</p>' };

      const result = await NotificationService.sendNotificationWithFallback(
        userId,
        userEmail,
        event,
        data,
        emailTemplate
      );

      expect(result.success).toBe(true);
      expect(result.methods).toContain('websocket');
      expect(result.websocketSent).toBe(true);
      expect(result.emailSent).toBe(false);
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it('should fall back to email when user is not connected', async () => {
      const mockIO = {
        in: jest.fn().mockReturnThis(),
        fetchSockets: jest.fn().mockResolvedValue([]) // No connected sockets
      };
      getIO.mockReturnValue(mockIO);
      emitToUser.mockImplementation(() => {});
      sendEmail.mockResolvedValue({ success: true, messageId: 'msg123' });

      const userId = 'user123';
      const userEmail = 'test@example.com';
      const event = 'test:event';
      const data = { message: 'Test' };
      const emailTemplate = { subject: 'Test', html: '<p>Test</p>' };

      const result = await NotificationService.sendNotificationWithFallback(
        userId,
        userEmail,
        event,
        data,
        emailTemplate
      );

      expect(result.success).toBe(true);
      expect(result.methods).toContain('email');
      expect(result.emailSent).toBe(true);
      expect(sendEmail).toHaveBeenCalledWith({
        to: userEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: null
      });
    });
  });

  describe('notifyOrderStatusChange', () => {
    it('should notify user about order status change', async () => {
      const mockIO = {
        in: jest.fn().mockReturnThis(),
        fetchSockets: jest.fn().mockResolvedValue([{ id: 'socket1' }])
      };
      getIO.mockReturnValue(mockIO);
      emitToUser.mockImplementation(() => {});
      emailTemplates.orderStatusUpdate = jest.fn().mockReturnValue({
        subject: 'Order Status Update',
        html: '<p>Status updated</p>'
      });

      const order = {
        _id: 'order123',
        orderNumber: 'ORD-123',
        status: 'shipped'
      };
      const user = {
        _id: 'user123',
        email: 'test@example.com'
      };

      const result = await NotificationService.notifyOrderStatusChange(order, user);

      expect(result.success).toBe(true);
      expect(emitToUser).toHaveBeenCalledWith(
        'user123',
        'order:status_changed',
        expect.objectContaining({
          orderId: 'order123',
          orderNumber: 'ORD-123',
          status: 'shipped'
        })
      );
    });
  });

  describe('notifyPriceChange', () => {
    it('should notify user about price change', async () => {
      const mockIO = {
        in: jest.fn().mockReturnThis(),
        fetchSockets: jest.fn().mockResolvedValue([{ id: 'socket1' }])
      };
      getIO.mockReturnValue(mockIO);
      emitToUser.mockImplementation(() => {});
      emailTemplates.priceDropAlert = jest.fn().mockReturnValue({
        subject: 'Price Drop',
        html: '<p>Price dropped</p>'
      });

      const product = {
        _id: 'prod123',
        name: 'Test Product',
        price: 50
      };

      const result = await NotificationService.notifyPriceChange(
        'user123',
        'test@example.com',
        product,
        100
      );

      expect(result.success).toBe(true);
      expect(emitToUser).toHaveBeenCalledWith(
        'user123',
        'product:price_changed',
        expect.objectContaining({
          productId: 'prod123',
          productName: 'Test Product',
          oldPrice: 100,
          newPrice: 50
        })
      );
    });
  });

  describe('notifyStockAvailable', () => {
    it('should notify user about stock availability', async () => {
      const mockIO = {
        in: jest.fn().mockReturnThis(),
        fetchSockets: jest.fn().mockResolvedValue([{ id: 'socket1' }])
      };
      getIO.mockReturnValue(mockIO);
      emitToUser.mockImplementation(() => {});
      emailTemplates.stockAvailableAlert = jest.fn().mockReturnValue({
        subject: 'Back in Stock',
        html: '<p>Product available</p>'
      });

      const product = {
        _id: 'prod123',
        name: 'Test Product',
        stock: 10
      };

      const result = await NotificationService.notifyStockAvailable(
        'user123',
        'test@example.com',
        product
      );

      expect(result.success).toBe(true);
      expect(emitToUser).toHaveBeenCalledWith(
        'user123',
        'wishlist:stock_available',
        expect.objectContaining({
          productId: 'prod123',
          productName: 'Test Product',
          stock: 10
        })
      );
    });
  });

  describe('notifyLowStock', () => {
    it('should notify admins about low stock', async () => {
      const mockIO = {
        emit: jest.fn()
      };
      getIO.mockReturnValue(mockIO);
      sendEmail.mockResolvedValue({ success: true, messageId: 'msg123' });
      emailTemplates.lowStockAlert = jest.fn().mockReturnValue({
        subject: 'Low Stock Alert',
        html: '<p>Low stock</p>'
      });

      const product = {
        _id: 'prod123',
        name: 'Test Product',
        stock: 5,
        lowStockThreshold: 10
      };
      const adminEmails = ['admin1@example.com', 'admin2@example.com'];

      const results = await NotificationService.notifyLowStock(product, adminEmails);

      expect(mockIO.emit).toHaveBeenCalledWith(
        'inventory:low_stock',
        expect.objectContaining({
          productId: 'prod123',
          productName: 'Test Product',
          stock: 5,
          threshold: 10
        })
      );
      expect(sendEmail).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });
  });

  describe('sendOrderConfirmation', () => {
    it('should send order confirmation notification', async () => {
      const mockIO = {
        in: jest.fn().mockReturnThis(),
        fetchSockets: jest.fn().mockResolvedValue([{ id: 'socket1' }])
      };
      getIO.mockReturnValue(mockIO);
      emitToUser.mockImplementation(() => {});
      emailTemplates.orderConfirmation = jest.fn().mockReturnValue({
        subject: 'Order Confirmation',
        html: '<p>Order confirmed</p>'
      });

      const order = {
        _id: 'order123',
        orderNumber: 'ORD-123',
        total: 150.00
      };
      const user = {
        _id: 'user123',
        email: 'test@example.com'
      };

      const result = await NotificationService.sendOrderConfirmation(order, user);

      expect(result.success).toBe(true);
      expect(emitToUser).toHaveBeenCalledWith(
        'user123',
        'notification',
        expect.objectContaining({
          type: 'order_confirmation',
          orderId: 'order123',
          orderNumber: 'ORD-123',
          total: 150.00
        })
      );
    });
  });
});
