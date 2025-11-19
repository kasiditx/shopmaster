const express = require('express');
const { 
  getAllOrders,
  updateOrderStatus,
  searchOrders,
  generateSalesReport
} = require('../controllers/orderController');
const {
  getInventoryDashboard,
  checkLowStock,
  triggerLowStockCheck
} = require('../controllers/inventoryController');
const {
  getCacheStats,
  getPerformanceSummary,
  getDatabaseStatus,
  getRedisStatus,
  getHealthCheck
} = require('../controllers/performanceController');
const { auth, admin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(auth);
router.use(admin);

// Admin order management routes
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/orders/search', searchOrders);

// Admin reports routes
router.get('/reports/sales', generateSalesReport);

// Admin inventory management routes
router.get('/inventory', getInventoryDashboard);
router.get('/inventory/low-stock', checkLowStock);
router.post('/inventory/check-low-stock', triggerLowStockCheck);

// Admin performance monitoring routes
router.get('/performance/cache-stats', getCacheStats);
router.get('/performance/summary', getPerformanceSummary);
router.get('/performance/database-status', getDatabaseStatus);
router.get('/performance/redis-status', getRedisStatus);
router.get('/performance/health', getHealthCheck);

module.exports = router;
