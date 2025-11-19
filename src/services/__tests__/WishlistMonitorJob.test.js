const WishlistMonitorJob = require('../WishlistMonitorJob');
const User = require('../../models/User');
const Product = require('../../models/Product');
const NotificationService = require('../NotificationService');

// Mock dependencies
jest.mock('../../models/User');
jest.mock('../../models/Product');
jest.mock('../NotificationService');

describe('WishlistMonitorJob', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Stop the job if it's running
    WishlistMonitorJob.stop();
    // Clear product states
    WishlistMonitorJob.clearStates();
  });

  afterEach(() => {
    // Ensure job is stopped after each test
    WishlistMonitorJob.stop();
  });

  describe('start and stop', () => {
    it('should start the job', () => {
      WishlistMonitorJob.start(1000);
      const status = WishlistMonitorJob.getStatus();
      expect(status.isRunning).toBe(true);
    });

    it('should not start if already running', () => {
      WishlistMonitorJob.start(1000);
      const consoleSpy = jest.spyOn(console, 'log');
      WishlistMonitorJob.start(1000);
      expect(consoleSpy).toHaveBeenCalledWith('WishlistMonitorJob: Already running');
      consoleSpy.mockRestore();
    });

    it('should stop the job', () => {
      WishlistMonitorJob.start(1000);
      WishlistMonitorJob.stop();
      const status = WishlistMonitorJob.getStatus();
      expect(status.isRunning).toBe(false);
    });

    it('should not stop if not running', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      WishlistMonitorJob.stop();
      expect(consoleSpy).toHaveBeenCalledWith('WishlistMonitorJob: Not running');
      consoleSpy.mockRestore();
    });
  });

  describe('run', () => {
    it('should handle no users with wishlists', async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      });

      await WishlistMonitorJob.run();

      expect(User.find).toHaveBeenCalledWith({
        wishlist: { $exists: true, $ne: [] }
      });
    });

    it('should send price change notification when price decreases', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'user@example.com',
        wishlist: [
          {
            _id: 'product123',
            name: 'Test Product',
            price: 80,
            stock: 10,
            active: true
          }
        ]
      };

      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockUser])
      });

      NotificationService.notifyPriceChange.mockResolvedValue({ success: true });

      // First run - establish baseline
      await WishlistMonitorJob.run();

      // Update price
      mockUser.wishlist[0].price = 60;

      // Second run - should detect price change
      await WishlistMonitorJob.run();

      expect(NotificationService.notifyPriceChange).toHaveBeenCalledWith(
        'user123',
        'user@example.com',
        expect.objectContaining({
          _id: 'product123',
          name: 'Test Product',
          price: 60
        }),
        80
      );
    });

    it('should not send price change notification when price increases', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'user@example.com',
        wishlist: [
          {
            _id: 'product123',
            name: 'Test Product',
            price: 80,
            stock: 10,
            active: true
          }
        ]
      };

      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockUser])
      });

      // First run - establish baseline
      await WishlistMonitorJob.run();

      // Update price (increase)
      mockUser.wishlist[0].price = 100;

      // Second run - should not send notification
      await WishlistMonitorJob.run();

      expect(NotificationService.notifyPriceChange).not.toHaveBeenCalled();
    });

    it('should send stock available notification when product comes back in stock', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'user@example.com',
        wishlist: [
          {
            _id: 'product123',
            name: 'Test Product',
            price: 100,
            stock: 0,
            active: true
          }
        ]
      };

      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockUser])
      });

      NotificationService.notifyStockAvailable.mockResolvedValue({ success: true });

      // First run - establish baseline (out of stock)
      await WishlistMonitorJob.run();

      // Update stock (back in stock)
      mockUser.wishlist[0].stock = 5;

      // Second run - should detect stock availability
      await WishlistMonitorJob.run();

      expect(NotificationService.notifyStockAvailable).toHaveBeenCalledWith(
        'user123',
        'user@example.com',
        expect.objectContaining({
          _id: 'product123',
          name: 'Test Product',
          stock: 5
        })
      );
    });

    it('should not send stock available notification when stock remains positive', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'user@example.com',
        wishlist: [
          {
            _id: 'product123',
            name: 'Test Product',
            price: 100,
            stock: 5,
            active: true
          }
        ]
      };

      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockUser])
      });

      // First run - establish baseline (in stock)
      await WishlistMonitorJob.run();

      // Update stock (still in stock)
      mockUser.wishlist[0].stock = 10;

      // Second run - should not send notification
      await WishlistMonitorJob.run();

      expect(NotificationService.notifyStockAvailable).not.toHaveBeenCalled();
    });

    it('should handle both price change and stock availability for same product', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'user@example.com',
        wishlist: [
          {
            _id: 'product123',
            name: 'Test Product',
            price: 100,
            stock: 0,
            active: true
          }
        ]
      };

      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockUser])
      });

      NotificationService.notifyPriceChange.mockResolvedValue({ success: true });
      NotificationService.notifyStockAvailable.mockResolvedValue({ success: true });

      // First run - establish baseline
      await WishlistMonitorJob.run();

      // Update both price and stock
      mockUser.wishlist[0].price = 80;
      mockUser.wishlist[0].stock = 5;

      // Second run - should detect both changes
      await WishlistMonitorJob.run();

      expect(NotificationService.notifyPriceChange).toHaveBeenCalled();
      expect(NotificationService.notifyStockAvailable).toHaveBeenCalled();
    });

    it('should skip inactive products', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'user@example.com',
        wishlist: [
          {
            _id: 'product123',
            name: 'Test Product',
            price: 100,
            stock: 10,
            active: false
          }
        ]
      };

      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockUser])
      });

      await WishlistMonitorJob.run();

      const status = WishlistMonitorJob.getStatus();
      expect(status.trackedProducts).toBe(0);
    });

    it('should handle multiple users with multiple products', async () => {
      const mockUsers = [
        {
          _id: 'user1',
          email: 'user1@example.com',
          wishlist: [
            {
              _id: 'product1',
              name: 'Product 1',
              price: 100,
              stock: 0,
              active: true
            }
          ]
        },
        {
          _id: 'user2',
          email: 'user2@example.com',
          wishlist: [
            {
              _id: 'product2',
              name: 'Product 2',
              price: 200,
              stock: 5,
              active: true
            }
          ]
        }
      ];

      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUsers)
      });

      NotificationService.notifyStockAvailable.mockResolvedValue({ success: true });
      NotificationService.notifyPriceChange.mockResolvedValue({ success: true });

      // First run - establish baseline
      await WishlistMonitorJob.run();

      // Update products
      mockUsers[0].wishlist[0].stock = 3; // Back in stock
      mockUsers[1].wishlist[0].price = 150; // Price decrease

      // Second run
      await WishlistMonitorJob.run();

      expect(NotificationService.notifyStockAvailable).toHaveBeenCalledTimes(1);
      expect(NotificationService.notifyPriceChange).toHaveBeenCalledTimes(1);
    });

    it('should handle notification errors gracefully', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'user@example.com',
        wishlist: [
          {
            _id: 'product123',
            name: 'Test Product',
            price: 100,
            stock: 10,
            active: true
          }
        ]
      };

      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockUser])
      });

      NotificationService.notifyPriceChange.mockRejectedValue(
        new Error('Notification failed')
      );

      // First run - establish baseline
      await WishlistMonitorJob.run();

      // Update price
      mockUser.wishlist[0].price = 80;

      // Second run - should handle error gracefully
      await expect(WishlistMonitorJob.run()).resolves.not.toThrow();
    });
  });

  describe('getStatus', () => {
    it('should return current status', () => {
      const status = WishlistMonitorJob.getStatus();
      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('trackedProducts');
      expect(status).toHaveProperty('lastStates');
    });
  });

  describe('clearStates', () => {
    it('should clear product states', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'user@example.com',
        wishlist: [
          {
            _id: 'product123',
            name: 'Test Product',
            price: 100,
            stock: 10,
            active: true
          }
        ]
      };

      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockUser])
      });

      await WishlistMonitorJob.run();

      let status = WishlistMonitorJob.getStatus();
      expect(status.trackedProducts).toBeGreaterThan(0);

      WishlistMonitorJob.clearStates();

      status = WishlistMonitorJob.getStatus();
      expect(status.trackedProducts).toBe(0);
    });
  });
});
