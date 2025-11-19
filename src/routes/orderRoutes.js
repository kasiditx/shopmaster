const express = require('express');
const { 
  createOrder, 
  getMyOrders, 
  getOrderById, 
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  searchOrders,
  generateSalesReport
} = require('../controllers/orderController');
const { auth, admin } = require('../middleware/auth');

const router = express.Router();

// All order routes require authentication
router.use(auth);

// Customer order routes
router.post('/', createOrder);
router.get('/stats', (req, res) => {
  // Return basic stats for the current user
  res.json({
    success: true,
    stats: {
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalSpent: 0
    }
  });
});
router.get('/', getMyOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);

module.exports = router;
