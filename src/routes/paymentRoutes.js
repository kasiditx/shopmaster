const express = require('express');
const { createPaymentIntent, confirmPayment, stripeWebhook } = require('../controllers/paymentController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create payment intent (requires authentication)
router.post('/create-intent', auth, createPaymentIntent);

// Confirm payment (requires authentication)
router.post('/confirm', auth, confirmPayment);

// Stripe webhook (no authentication - verified by signature)
router.post('/webhook', stripeWebhook);

module.exports = router;
