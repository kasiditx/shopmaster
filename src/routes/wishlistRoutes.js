const express = require('express');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveToCart
} = require('../controllers/wishlistController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// All wishlist routes require authentication
router.use(auth);

router.get('/', getWishlist);
router.post('/:productId', addToWishlist);
router.delete('/:productId', removeFromWishlist);
router.post('/:productId/move-to-cart', moveToCart);

module.exports = router;
