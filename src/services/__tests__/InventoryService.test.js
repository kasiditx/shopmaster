const InventoryService = require('../InventoryService');
const Product = require('../../models/Product');
const User = require('../../models/User');
const NotificationService = require('../NotificationService');

jest.mock('../../models/Product');
jest.mock('../../models/User');
jest.mock('../NotificationService');

describe('InventoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInventoryDashboard', () => {
    it('should return all active products with inventory information', async () => {
      const mockProducts = [
        {
          _id: '1',
          name: 'Product 1',
          category: 'electronics',
          stock: 5,
          lowStockThreshold: 10,
          price: 100,
          updatedAt: new Date()
        },
        {
          _id: '2',
          name: 'Product 2',
          category: 'books',
          stock: 20,
          lowStockThreshold: 10,
          price: 50,
          updatedAt: new Date()
        }
      ];

      const mockFind = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockProducts)
      };

      Product.find.mockReturnValue(mockFind);

      const result = await InventoryService.getInventoryDashboard();

      expect(Product.find).toHaveBeenCalledWith({ active: true });
      expect(result).toHaveLength(2);
      expect(result[0].isLowStock).toBe(true);
      expect(result[0].stockStatus).toBe('low_stock');
      expect(result[1].isLowStock).toBe(false);
      expect(result[1].stockStatus).toBe('in_stock');
    });

    it('should mark out of stock products correctly', async () => {
      const mockProducts = [
        {
          _id: '1',
          name: 'Product 1',
          category: 'electronics',
          stock: 0,
          lowStockThreshold: 10,
          price: 100,
          updatedAt: new Date()
        }
      ];

      const mockFind = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockProducts)
      };

      Product.find.mockReturnValue(mockFind);

      const result = await InventoryService.getInventoryDashboard();

      expect(result[0].stockStatus).toBe('out_of_stock');
    });
  });

  describe('checkLowStock', () => {
    it('should return products with stock at or below threshold', async () => {
      const mockProducts = [
        {
          _id: '1',
          name: 'Low Stock Product',
          category: 'electronics',
          stock: 5,
          lowStockThreshold: 10,
          price: 100
        }
      ];

      const mockFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockProducts)
      };

      Product.find.mockReturnValue(mockFind);

      const result = await InventoryService.checkLowStock();

      expect(Product.find).toHaveBeenCalledWith({
        active: true,
        $expr: { $lte: ['$stock', '$lowStockThreshold'] },
        stock: { $gt: 0 }
      });
      expect(result).toEqual(mockProducts);
    });
  });

  describe('sendLowStockAlert', () => {
    it('should send alerts to all admin users', async () => {
      const mockProduct = {
        _id: '1',
        name: 'Low Stock Product',
        stock: 5,
        lowStockThreshold: 10
      };

      const mockAdmins = [
        { email: 'admin1@example.com' },
        { email: 'admin2@example.com' }
      ];

      const mockFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockAdmins)
      };

      User.find.mockReturnValue(mockFind);
      NotificationService.notifyLowStock.mockResolvedValue([
        { success: true },
        { success: true }
      ]);

      const result = await InventoryService.sendLowStockAlert(mockProduct);

      expect(User.find).toHaveBeenCalledWith({ role: 'admin' });
      expect(NotificationService.notifyLowStock).toHaveBeenCalledWith(
        mockProduct,
        ['admin1@example.com', 'admin2@example.com']
      );
      expect(result.success).toBe(true);
      expect(result.notificationsSent).toBe(2);
    });

    it('should handle case when no admin users exist', async () => {
      const mockProduct = {
        _id: '1',
        name: 'Low Stock Product',
        stock: 5,
        lowStockThreshold: 10
      };

      const mockFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      User.find.mockReturnValue(mockFind);

      const result = await InventoryService.sendLowStockAlert(mockProduct);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No admin users found');
      expect(NotificationService.notifyLowStock).not.toHaveBeenCalled();
    });
  });

  describe('performLowStockCheck', () => {
    it('should check for low stock and send alerts', async () => {
      const mockLowStockProducts = [
        {
          _id: '1',
          name: 'Product 1',
          stock: 5,
          lowStockThreshold: 10
        },
        {
          _id: '2',
          name: 'Product 2',
          stock: 3,
          lowStockThreshold: 10
        }
      ];

      const mockFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockLowStockProducts)
      };

      Product.find.mockReturnValue(mockFind);

      const mockAdmins = [{ email: 'admin@example.com' }];
      const mockUserFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockAdmins)
      };
      User.find.mockReturnValue(mockUserFind);

      NotificationService.notifyLowStock.mockResolvedValue([{ success: true }]);

      const result = await InventoryService.performLowStockCheck();

      expect(result.success).toBe(true);
      expect(result.productsChecked).toBe(2);
      expect(result.alertsSent).toBe(2);
    });

    it('should return success with zero alerts when no low stock products', async () => {
      const mockFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      Product.find.mockReturnValue(mockFind);

      const result = await InventoryService.performLowStockCheck();

      expect(result.success).toBe(true);
      expect(result.productsChecked).toBe(0);
      expect(result.alertsSent).toBe(0);
    });
  });

  describe('scheduleLowStockChecks', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should schedule periodic low stock checks', () => {
      const mockFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      Product.find.mockReturnValue(mockFind);

      const intervalId = InventoryService.scheduleLowStockChecks(60);

      expect(intervalId).toBeDefined();
      expect(typeof intervalId).toBe('object');

      clearInterval(intervalId);
    });
  });
});
