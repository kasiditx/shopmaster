const express = require('express');
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
} = require('../controllers/productController');
const {
  getProductReviews,
  createReview,
} = require('../controllers/reviewController');
const { auth, admin } = require('../middleware/auth');
const { sanitizeFileUpload } = require('../middleware/sanitize');

const router = express.Router();

// Public routes
router.get('/', listProducts);
router.get('/:id', getProduct);

// Admin routes - with file upload sanitization for image uploads
router.post('/', auth, admin, sanitizeFileUpload, createProduct);
router.put('/:id', auth, admin, sanitizeFileUpload, updateProduct);
router.delete('/:id', auth, admin, deleteProduct);
router.put('/:id/stock', auth, admin, updateStock);

// Review routes
router.get('/:id/reviews', getProductReviews);
router.post('/:id/reviews', auth, createReview);

module.exports = router;
