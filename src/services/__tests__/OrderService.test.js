const OrderService = require('../OrderService');
const Order = require('../../models/Order');
const Product = require('../../models/Product');
const CartService = require('../CartService');

// Mock dependencies
jest.mock('../../models/Order');
jest.mock('../../models/Product');
jest.mock('../CartService');

describe('OrderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create an order successfully', async () => {
      const userId = 'user123';
      const cartData = {
        items: [
          { productId: 'prod1', quantity: 2, price: 50 }
        ],
        subtotal: 100,
        tax: 10,
        shippingCost: 10,
        total: 120
      };
      const shippingAddress = {
        line1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA'
      };
      const paymentIntentId = 'pi_test123';

      const mockProduct = {
        _id: 'prod1',
        name: 'Test Product',
        price: 50,
        stock: 10,
        active: true
      };

      const mockOrder = {
        _id: 'order123',
        orderNumber: 'ORD-123',
        user: userId,
        items: [{
          product: 'prod1',
          name: 'Test Product',
          price: 50,
          qty: 2
        }],
        subtotal: 100,
        tax: 10,
        shippingCost: 10,
        total: 120,
        status: 'pending',
        paymentIntentId,
        shippingAddress,
        statusHistory: [{
          status: 'pending',
          timestamp: expect.any(Date),
          note: 'Order created'
        }],
        save: jest.fn().mockResolvedValue(true)
      };

      Product.find.mockResolvedValue([mockProduct]);
      Product.findByIdAndUpdate.mockResolvedValue(mockProduct);
      Order.mockImplementation(() => mockOrder);

      const result = await OrderService.createOrder(userId, cartData, shippingAddress, paymentIntentId);

      expect(result).toBeDefined();
      expect(result.orderNumber).toBe('ORD-123');
      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        'prod1',
        { $inc: { stock: -2 } }
      );
    });

    it('should throw error if cart is empty', async () => {
      const userId = 'user123';
      const cartData = { items: [] };
      const shippingAddress = {
        line1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA'
      };

      await expect(
        OrderService.createOrder(userId, cartData, shippingAddress, 'pi_test')
      ).rejects.toThrow('Cart is empty');
    });

    it('should throw error if shipping address is incomplete', async () => {
      const userId = 'user123';
      const cartData = {
        items: [{ productId: 'prod1', quantity: 2 }]
      };
      const incompleteAddress = {
        line1: '123 Main St'
        // Missing required fields
      };

      await expect(
        OrderService.createOrder(userId, cartData, incompleteAddress, 'pi_test')
      ).rejects.toThrow('Complete shipping address is required');
    });

    it('should throw error if product is out of stock', async () => {
      const userId = 'user123';
      const cartData = {
        items: [{ productId: 'prod1', quantity: 10 }],
        subtotal: 100,
        tax: 10,
        shippingCost: 10,
        total: 120
      };
      const shippingAddress = {
        line1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA'
      };

      const mockProduct = {
        _id: 'prod1',
        name: 'Test Product',
        price: 50,
        stock: 5, // Less than requested
        active: true
      };

      Product.find.mockResolvedValue([mockProduct]);

      await expect(
        OrderService.createOrder(userId, cartData, shippingAddress, 'pi_test')
      ).rejects.toThrow('Insufficient stock');
    });
  });

  describe('getOrder', () => {
    it('should retrieve an order by ID', async () => {
      const orderId = 'order123';
      const userId = 'user123';

      const mockOrder = {
        _id: orderId,
        user: userId,
        orderNumber: 'ORD-123',
        total: 120
      };

      const mockQuery = {
        populate: jest.fn().mockReturnThis()
      };
      // Chain the populate calls
      mockQuery.populate.mockReturnValueOnce(mockQuery);
      mockQuery.populate.mockResolvedValueOnce(mockOrder);

      Order.findOne.mockReturnValue(mockQuery);

      const result = await OrderService.getOrder(orderId, userId);

      expect(result).toBeDefined();
      expect(result._id).toBe(orderId);
      expect(Order.findOne).toHaveBeenCalledWith({ _id: orderId, user: userId });
    });

    it('should throw error if order not found', async () => {
      const orderId = 'order123';
      const userId = 'user123';

      const mockQuery = {
        populate: jest.fn().mockReturnThis()
      };
      // Chain the populate calls
      mockQuery.populate.mockReturnValueOnce(mockQuery);
      mockQuery.populate.mockResolvedValueOnce(null);

      Order.findOne.mockReturnValue(mockQuery);

      await expect(
        OrderService.getOrder(orderId, userId)
      ).rejects.toThrow('Order not found');
    });
  });

  describe('getUserOrders', () => {
    it('should retrieve all orders for a user', async () => {
      const userId = 'user123';

      const mockOrders = [
        { _id: 'order1', orderNumber: 'ORD-001', total: 100 },
        { _id: 'order2', orderNumber: 'ORD-002', total: 200 }
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockOrders)
      };

      Order.find.mockReturnValue(mockQuery);

      const result = await OrderService.getUserOrders(userId);

      expect(result).toHaveLength(2);
      expect(Order.find).toHaveBeenCalledWith({ user: userId });
    });

    it('should filter orders by status', async () => {
      const userId = 'user123';
      const filters = { status: 'delivered' };

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([])
      };

      Order.find.mockReturnValue(mockQuery);

      await OrderService.getUserOrders(userId, filters);

      expect(Order.find).toHaveBeenCalledWith({
        user: userId,
        status: 'delivered'
      });
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      const orderId = 'order123';
      const newStatus = 'shipped';

      const mockOrder = {
        _id: orderId,
        status: 'processing',
        statusHistory: [],
        save: jest.fn().mockResolvedValue(true)
      };

      Order.findById.mockResolvedValue(mockOrder);

      const result = await OrderService.updateOrderStatus(orderId, newStatus, 'Order shipped');

      expect(result.status).toBe('shipped');
      expect(result.statusHistory).toHaveLength(1);
      expect(result.statusHistory[0].status).toBe('shipped');
      expect(mockOrder.save).toHaveBeenCalled();
    });

    it('should throw error for invalid status', async () => {
      const orderId = 'order123';
      const invalidStatus = 'invalid_status';

      await expect(
        OrderService.updateOrderStatus(orderId, invalidStatus)
      ).rejects.toThrow('Invalid status');
    });

    it('should not allow status change for cancelled orders', async () => {
      const orderId = 'order123';
      const newStatus = 'shipped';

      const mockOrder = {
        _id: orderId,
        status: 'cancelled',
        statusHistory: []
      };

      Order.findById.mockResolvedValue(mockOrder);

      await expect(
        OrderService.updateOrderStatus(orderId, newStatus)
      ).rejects.toThrow('Cannot change status of cancelled order');
    });
  });

  describe('cancelOrder', () => {
    it('should cancel a pending order and restore inventory', async () => {
      const orderId = 'order123';
      const userId = 'user123';

      const mockOrder = {
        _id: orderId,
        user: userId,
        status: 'pending',
        orderNumber: 'ORD-123',
        items: [
          { product: 'prod1', qty: 2 },
          { product: 'prod2', qty: 1 }
        ],
        statusHistory: [],
        save: jest.fn().mockResolvedValue(true)
      };

      Order.findOne.mockResolvedValue(mockOrder);
      Product.findByIdAndUpdate.mockResolvedValue({});

      const result = await OrderService.cancelOrder(orderId, userId, 'Customer request');

      expect(result.status).toBe('cancelled');
      expect(result.statusHistory).toHaveLength(1);
      expect(Product.findByIdAndUpdate).toHaveBeenCalledTimes(2);
      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        'prod1',
        { $inc: { stock: 2 } }
      );
      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        'prod2',
        { $inc: { stock: 1 } }
      );
    });

    it('should throw error if order is not pending', async () => {
      const orderId = 'order123';
      const userId = 'user123';

      const mockOrder = {
        _id: orderId,
        user: userId,
        status: 'shipped'
      };

      Order.findOne.mockResolvedValue(mockOrder);

      await expect(
        OrderService.cancelOrder(orderId, userId)
      ).rejects.toThrow('Cannot cancel order with status: shipped');
    });

    it('should throw error if order not found', async () => {
      const orderId = 'order123';
      const userId = 'user123';

      Order.findOne.mockResolvedValue(null);

      await expect(
        OrderService.cancelOrder(orderId, userId)
      ).rejects.toThrow('Order not found');
    });
  });

  describe('getOrderByNumber', () => {
    it('should retrieve an order by order number', async () => {
      const orderNumber = 'ORD-123';

      const mockOrder = {
        _id: 'order123',
        orderNumber,
        total: 120
      };

      const mockQuery = {
        populate: jest.fn().mockReturnThis()
      };
      // Chain the populate calls
      mockQuery.populate.mockReturnValueOnce(mockQuery);
      mockQuery.populate.mockResolvedValueOnce(mockOrder);

      Order.findOne.mockReturnValue(mockQuery);

      const result = await OrderService.getOrderByNumber(orderNumber);

      expect(result).toBeDefined();
      expect(result.orderNumber).toBe(orderNumber);
      expect(Order.findOne).toHaveBeenCalledWith({ orderNumber });
    });
  });

  describe('getAllOrders (Admin)', () => {
    it('should retrieve all orders with pagination', async () => {
      const mockOrders = [
        { _id: 'order1', orderNumber: 'ORD-001', total: 100 },
        { _id: 'order2', orderNumber: 'ORD-002', total: 200 }
      ];

      Order.countDocuments.mockResolvedValue(2);

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis()
      };
      mockQuery.populate.mockReturnValueOnce(mockQuery);
      mockQuery.populate.mockResolvedValueOnce(mockOrders);

      Order.find.mockReturnValue(mockQuery);

      const result = await OrderService.getAllOrders({}, { page: 1, limit: 20 });

      expect(result.orders).toHaveLength(2);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.totalOrders).toBe(2);
    });

    it('should filter orders by status', async () => {
      const filters = { status: 'delivered' };

      Order.countDocuments.mockResolvedValue(0);

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis()
      };
      mockQuery.populate.mockReturnValueOnce(mockQuery);
      mockQuery.populate.mockResolvedValueOnce([]);

      Order.find.mockReturnValue(mockQuery);

      await OrderService.getAllOrders(filters, {});

      expect(Order.find).toHaveBeenCalledWith({ status: 'delivered' });
    });

    it('should filter orders by date range', async () => {
      const filters = {
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31'
      };

      Order.countDocuments.mockResolvedValue(0);

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis()
      };
      mockQuery.populate.mockReturnValueOnce(mockQuery);
      mockQuery.populate.mockResolvedValueOnce([]);

      Order.find.mockReturnValue(mockQuery);

      await OrderService.getAllOrders(filters, {});

      expect(Order.find).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: expect.objectContaining({
            $gte: expect.any(Date),
            $lte: expect.any(Date)
          })
        })
      );
    });
  });

  describe('searchOrders (Admin)', () => {
    it('should search orders by order number', async () => {
      const searchTerm = 'ORD-123';

      const mockOrder = {
        _id: 'order123',
        orderNumber: searchTerm,
        total: 120
      };

      const mockQuery = {
        populate: jest.fn().mockReturnThis()
      };
      mockQuery.populate.mockReturnValueOnce(mockQuery);
      mockQuery.populate.mockResolvedValueOnce([mockOrder]);

      Order.find.mockReturnValue(mockQuery);

      const result = await OrderService.searchOrders(searchTerm);

      expect(result).toHaveLength(1);
      expect(result[0].orderNumber).toBe(searchTerm);
      expect(Order.find).toHaveBeenCalledWith({ orderNumber: searchTerm });
    });

    it('should throw error if search term is empty', async () => {
      await expect(
        OrderService.searchOrders('')
      ).rejects.toThrow('Search term is required');
    });
  });

  describe('generateSalesReport (Admin)', () => {
    it('should generate sales report for date range', async () => {
      const dateFrom = '2024-01-01';
      const dateTo = '2024-01-31';

      const mockOrders = [
        {
          _id: 'order1',
          total: 100,
          status: 'delivered',
          items: [
            { product: { _id: 'prod1', name: 'Product 1' }, qty: 2, price: 50 }
          ]
        },
        {
          _id: 'order2',
          total: 200,
          status: 'delivered',
          items: [
            { product: { _id: 'prod1', name: 'Product 1' }, qty: 1, price: 50 },
            { product: { _id: 'prod2', name: 'Product 2' }, qty: 3, price: 50 }
          ]
        }
      ];

      const mockQuery = {
        populate: jest.fn().mockResolvedValue(mockOrders)
      };

      Order.find.mockReturnValue(mockQuery);

      const result = await OrderService.generateSalesReport(dateFrom, dateTo);

      expect(result).toBeDefined();
      expect(result.totalRevenue).toBe(300);
      expect(result.orderCount).toBe(2);
      expect(result.averageOrderValue).toBe(150);
      expect(result.topProducts).toBeDefined();
      expect(result.topProducts.length).toBeGreaterThan(0);
    });

    it('should throw error if date range is missing', async () => {
      await expect(
        OrderService.generateSalesReport(null, null)
      ).rejects.toThrow('Date range is required');
    });

    it('should throw error if start date is after end date', async () => {
      const dateFrom = '2024-02-01';
      const dateTo = '2024-01-01';

      await expect(
        OrderService.generateSalesReport(dateFrom, dateTo)
      ).rejects.toThrow('Start date must be before end date');
    });

    it('should exclude cancelled and pending orders from report', async () => {
      const dateFrom = '2024-01-01';
      const dateTo = '2024-01-31';

      const mockQuery = {
        populate: jest.fn().mockResolvedValue([])
      };

      Order.find.mockReturnValue(mockQuery);

      await OrderService.generateSalesReport(dateFrom, dateTo);

      expect(Order.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: { $in: ['paid', 'processing', 'shipped', 'delivered'] }
        })
      );
    });
  });
});
