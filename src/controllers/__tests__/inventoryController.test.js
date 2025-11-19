const {
  getInventoryDashboard,
  checkLowStock,
  triggerLowStockCheck
} = require('../inventoryController');
const InventoryService = require('../../services/InventoryService');

jest.mock('../../services/InventoryService');

describe('InventoryController', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getInventoryDashboard', () => {
    it('should return inventory dashboard data', async () => {
      const mockInventoryData = [
        {
          _id: '1',
          name: 'Product 1',
          stock: 5,
          lowStockThreshold: 10,
          isLowStock: true,
          stockStatus: 'low_stock'
        }
      ];

      InventoryService.getInventoryDashboard.mockResolvedValue(mockInventoryData);

      await getInventoryDashboard(req, res);

      expect(InventoryService.getInventoryDashboard).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: mockInventoryData
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      InventoryService.getInventoryDashboard.mockRejectedValue(error);

      await getInventoryDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve inventory dashboard',
          details: 'Database error'
        }
      });
    });
  });

  describe('checkLowStock', () => {
    it('should return low stock products', async () => {
      const mockLowStockProducts = [
        {
          _id: '1',
          name: 'Low Stock Product',
          stock: 5,
          lowStockThreshold: 10
        }
      ];

      InventoryService.checkLowStock.mockResolvedValue(mockLowStockProducts);

      await checkLowStock(req, res);

      expect(InventoryService.checkLowStock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: mockLowStockProducts
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      InventoryService.checkLowStock.mockRejectedValue(error);

      await checkLowStock(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check low stock products',
          details: 'Database error'
        }
      });
    });
  });

  describe('triggerLowStockCheck', () => {
    it('should trigger low stock check and return results', async () => {
      const mockResult = {
        success: true,
        productsChecked: 2,
        alertsSent: 2,
        products: [
          { id: '1', name: 'Product 1', stock: 5, threshold: 10 },
          { id: '2', name: 'Product 2', stock: 3, threshold: 10 }
        ]
      };

      InventoryService.performLowStockCheck.mockResolvedValue(mockResult);

      await triggerLowStockCheck(req, res);

      expect(InventoryService.performLowStockCheck).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Service error');
      InventoryService.performLowStockCheck.mockRejectedValue(error);

      await triggerLowStockCheck(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to perform low stock check',
          details: 'Service error'
        }
      });
    });
  });
});
