const InventoryService = require('../services/InventoryService');

/**
 * Get inventory dashboard
 * Returns all products with their current stock levels
 * @route GET /api/admin/inventory
 * @access Admin only
 */
const getInventoryDashboard = async (req, res) => {
  try {
    const inventoryData = await InventoryService.getInventoryDashboard();

    res.status(200).json({
      success: true,
      count: inventoryData.length,
      data: inventoryData
    });
  } catch (error) {
    console.error('getInventoryDashboard error:', error.message);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve inventory dashboard',
        details: error.message
      }
    });
  }
};

/**
 * Check for low stock products
 * Returns products where stock is at or below the threshold
 * @route GET /api/admin/inventory/low-stock
 * @access Admin only
 */
const checkLowStock = async (req, res) => {
  try {
    const lowStockProducts = await InventoryService.checkLowStock();

    res.status(200).json({
      success: true,
      count: lowStockProducts.length,
      data: lowStockProducts
    });
  } catch (error) {
    console.error('checkLowStock error:', error.message);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to check low stock products',
        details: error.message
      }
    });
  }
};

/**
 * Trigger low stock check and send alerts
 * Manually triggers the low stock check process
 * @route POST /api/admin/inventory/check-low-stock
 * @access Admin only
 */
const triggerLowStockCheck = async (req, res) => {
  try {
    const result = await InventoryService.performLowStockCheck();

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('triggerLowStockCheck error:', error.message);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to perform low stock check',
        details: error.message
      }
    });
  }
};

module.exports = {
  getInventoryDashboard,
  checkLowStock,
  triggerLowStockCheck
};
