const express = require('express');
const {
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Review management routes
router.put('/:id', auth, updateReview);
router.delete('/:id', auth, deleteReview);

module.exports = router;
