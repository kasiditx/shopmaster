const PaymentService = require('../services/PaymentService');
const { verifyWebhookSignature } = require('../config/stripe');
const { logPayment } = require('../utils/logger');

/**
 * Create payment intent
 * POST /api/payment/create-intent
 */
const createPaymentIntent = async (req, res, next) => {
  try {
    const { amount, currency = 'usd', orderId, orderNumber } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Amount must be greater than 0',
        },
      });
    }

    // Create metadata
    const metadata = {
      userId: req.user._id.toString(),
      userEmail: req.user.email,
    };

    if (orderId) {
      metadata.orderId = orderId;
    }

    if (orderNumber) {
      metadata.orderNumber = orderNumber;
    }

    // Create payment intent
    const paymentIntent = await PaymentService.createPaymentIntent(
      amount,
      currency,
      metadata
    );

    // Log payment intent creation
    logPayment('Payment intent created', {
      paymentIntentId: paymentIntent.id,
      amount,
      currency,
      userId: req.user._id,
      orderId,
      orderNumber,
    });

    res.status(200).json({
      success: true,
      data: paymentIntent,
    });
  } catch (error) {
    console.error('createPaymentIntent error:', error.message);
    next(error);
  }
};

/**
 * Confirm payment
 * POST /api/payment/confirm
 */
const confirmPayment = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;

    // Validate payment intent ID
    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Payment intent ID is required',
        },
      });
    }

    // Confirm payment
    const result = await PaymentService.confirmPayment(paymentIntentId);

    // Log payment confirmation
    logPayment('Payment confirmed', {
      paymentIntentId,
      status: result.status,
      userId: req.user._id,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('confirmPayment error:', error.message);
    next(error);
  }
};

/**
 * Stripe webhook handler
 * POST /api/payment/webhook
 */
const stripeWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Missing stripe-signature header',
        },
      });
    }

    // Verify webhook signature and construct event
    // Note: req.body should be raw body for webhook verification
    const event = verifyWebhookSignature(req.body, signature);

    // Log webhook event
    logPayment('Webhook received', {
      eventType: event.type,
      eventId: event.id,
      paymentIntentId: event.data?.object?.id,
    });

    // Handle the event
    const result = await PaymentService.handleWebhook(event);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('stripeWebhook error:', error.message);
    
    // Return 400 for webhook verification errors
    if (error.message.includes('verification') || error.message.includes('signature')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEBHOOK_VERIFICATION_FAILED',
          message: 'Webhook signature verification failed',
        },
      });
    }

    next(error);
  }
};

module.exports = { createPaymentIntent, confirmPayment, stripeWebhook };
