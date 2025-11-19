const Product = require('../models/Product');
const User = require('../models/User');
const NotificationService = require('./NotificationService');

/**
 * InventoryService - Handles inventory management and low stock alerts
 * Provides methods for monitoring inventory levels and sending alerts
 */
class InventoryService {
  /**
   * Get inventory dashboard data
   * Returns all products with their current stock levels
   * @returns {Promise<Array>} Array of products with inventory information
   */
  static async getInventoryDashboard() {
    try {
      const products = await Product.find({ active: true })
        .select('name category stock lowStockThreshold price updatedAt')
        .sort({ stock: 1 }) // Sort by stock ascending to show low stock items first
        .lean();

      // Add low stock indicator to each product
      const inventoryData = products.map(product => ({
        ...product,
        isLowStock: product.stock <= product.lowStockThreshold,
        stockStatus: product.stock === 0 
          ? 'out_of_stock' 
          : product.stock <= product.lowStockThreshold 
            ? 'low_stock' 
            : 'in_stock'
      }));

      return inventoryData;
    } catch (error) {
      console.error('InventoryService.getInventoryDashboard error:', error.message);
      throw error;
    }
  }

  /**
   * Check for products with low stock
   * Returns products where stock is at or below the threshold
   * @returns {Promise<Array>} Array of low stock products
   */
  static async checkLowStock() {
    try {
      // Find products where stock is at or below the threshold and greater than 0
      const lowStockProducts = await Product.find({
        active: true,
        $expr: { $lte: ['$stock', '$lowStockThreshold'] },
        stock: { $gt: 0 } // Exclude out of stock items
      })
        .select('name category stock lowStockThreshold price')
        .lean();

      console.log(`InventoryService: Found ${lowStockProducts.length} low stock products`);

      return lowStockProducts;
    } catch (error) {
      console.error('InventoryService.checkLowStock error:', error.message);
      throw error;
    }
  }

  /**
   * Send low stock alert to admin users
   * @param {Object} product - Product object with low stock
   * @returns {Promise<Object>} Result object with notification status
   */
  static async sendLowStockAlert(product) {
    try {
      // Get all admin users
      const adminUsers = await User.find({ role: 'admin' })
        .select('email')
        .lean();

      if (adminUsers.length === 0) {
        console.warn('InventoryService: No admin users found to send low stock alert');
        return {
          success: false,
          message: 'No admin users found'
        };
      }

      const adminEmails = adminUsers.map(admin => admin.email);

      // Send notification via NotificationService
      const results = await NotificationService.notifyLowStock(product, adminEmails);

      console.log(`InventoryService: Sent low stock alert for product ${product.name} to ${adminEmails.length} admins`);

      return {
        success: true,
        product: {
          id: product._id,
          name: product.name,
          stock: product.stock,
          threshold: product.lowStockThreshold
        },
        notificationsSent: results.length,
        results
      };
    } catch (error) {
      console.error('InventoryService.sendLowStockAlert error:', error.message);
      throw error;
    }
  }

  /**
   * Perform periodic low stock check and send alerts
   * This method should be called by a scheduled job
   * @returns {Promise<Object>} Summary of alerts sent
   */
  static async performLowStockCheck() {
    try {
      console.log('InventoryService: Starting periodic low stock check...');

      const lowStockProducts = await this.checkLowStock();

      if (lowStockProducts.length === 0) {
        console.log('InventoryService: No low stock products found');
        return {
          success: true,
          productsChecked: 0,
          alertsSent: 0,
          products: []
        };
      }

      const alertResults = [];

      // Send alert for each low stock product
      for (const product of lowStockProducts) {
        try {
          const result = await this.sendLowStockAlert(product);
          alertResults.push(result);
        } catch (error) {
          console.error(`Failed to send alert for product ${product.name}:`, error.message);
          alertResults.push({
            success: false,
            product: {
              id: product._id,
              name: product.name
            },
            error: error.message
          });
        }
      }

      const successfulAlerts = alertResults.filter(r => r.success).length;

      console.log(`InventoryService: Completed low stock check. Sent ${successfulAlerts}/${lowStockProducts.length} alerts`);

      return {
        success: true,
        productsChecked: lowStockProducts.length,
        alertsSent: successfulAlerts,
        products: lowStockProducts.map(p => ({
          id: p._id,
          name: p.name,
          stock: p.stock,
          threshold: p.lowStockThreshold
        })),
        results: alertResults
      };
    } catch (error) {
      console.error('InventoryService.performLowStockCheck error:', error.message);
      throw error;
    }
  }

  /**
   * Schedule periodic low stock checks
   * Sets up an interval to check for low stock products
   * @param {number} intervalMinutes - Interval in minutes (default: 60)
   * @returns {NodeJS.Timeout} Interval ID that can be used to clear the interval
   */
  static scheduleLowStockChecks(intervalMinutes = 60) {
    console.log(`InventoryService: Scheduling low stock checks every ${intervalMinutes} minutes`);

    // Perform initial check
    this.performLowStockCheck().catch(error => {
      console.error('Initial low stock check failed:', error.message);
    });

    // Schedule periodic checks
    const intervalMs = intervalMinutes * 60 * 1000;
    const intervalId = setInterval(() => {
      this.performLowStockCheck().catch(error => {
        console.error('Scheduled low stock check failed:', error.message);
      });
    }, intervalMs);

    return intervalId;
  }
}

module.exports = InventoryService;
