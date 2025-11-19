const { getStripeClient } = require('../config/stripe');
const Order = require('../models/Order');

/**
 * PaymentService - Handles payment processing with Stripe
 * Provides methods for creating payment intents, confirming payments, and handling webhooks
 */
class PaymentService {
  /**
   * Create a payment intent with Stripe
   * @param {number} amount - Amount in dollars (will be converted to cents)
   * @param {string} currency - Currency code (default: 'usd')
   * @param {Object} metadata - Additional metadata for the payment
   * @returns {Promise<Object>} Payment intent object
   */
  static async createPaymentIntent(amount, currency = 'usd', metadata = {}) {
    try {
      // Validate amount
      if (!amount || amount <= 0) {
        throw new Error('Invalid amount: must be greater than 0');
      }

      // Convert amount to cents (Stripe expects amounts in smallest currency unit)
      const amountInCents = Math.round(amount * 100);

      const stripe = getStripeClient();

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      console.log(`PaymentService: Created payment intent ${paymentIntent.id} for amount ${amount} ${currency}`);

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      };
    } catch (error) {
      console.error('PaymentService.createPaymentIntent error:', error.message);
      
      // Handle Stripe-specific errors
      if (error.type === 'StripeCardError') {
        throw new Error(`Card error: ${error.message}`);
      } else if (error.type === 'StripeInvalidRequestError') {
        throw new Error(`Invalid request: ${error.message}`);
      } else if (error.type === 'StripeAPIError') {
        throw new Error('Payment service temporarily unavailable');
      } else if (error.type === 'StripeConnectionError') {
        throw new Error('Network error connecting to payment service');
      } else if (error.type === 'StripeAuthenticationError') {
        throw new Error('Payment service authentication failed');
      }
      
      throw new Error(`Payment intent creation failed: ${error.message}`);
    }
  }

  /**
   * Confirm a payment intent
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} Confirmed payment intent
   */
  static async confirmPayment(paymentIntentId) {
    try {
      if (!paymentIntentId) {
        throw new Error('Payment intent ID is required');
      }

      const stripe = getStripeClient();

      // Retrieve the payment intent to check its status
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      console.log(`PaymentService: Confirming payment intent ${paymentIntentId}, current status: ${paymentIntent.status}`);

      // Check if payment is already successful
      if (paymentIntent.status === 'succeeded') {
        return {
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        };
      }

      // If payment requires confirmation, confirm it
      if (paymentIntent.status === 'requires_confirmation') {
        const confirmedIntent = await stripe.paymentIntents.confirm(paymentIntentId);
        
        return {
          paymentIntentId: confirmedIntent.id,
          status: confirmedIntent.status,
          amount: confirmedIntent.amount,
          currency: confirmedIntent.currency,
        };
      }

      // Return current status for other states
      return {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      };
    } catch (error) {
      console.error('PaymentService.confirmPayment error:', error.message);
      
      // Handle Stripe-specific errors
      if (error.type === 'StripeCardError') {
        throw new Error(`Card error: ${error.message}`);
      } else if (error.type === 'StripeInvalidRequestError') {
        throw new Error(`Invalid payment intent: ${error.message}`);
      }
      
      throw new Error(`Payment confirmation failed: ${error.message}`);
    }
  }

  /**
   * Handle Stripe webhook events
   * @param {Object} event - Stripe webhook event
   * @returns {Promise<Object>} Processing result
   */
  static async handleWebhook(event) {
    try {
      console.log(`PaymentService: Processing webhook event ${event.type} (${event.id})`);

      switch (event.type) {
        case 'payment_intent.succeeded':
          return await PaymentService.handlePaymentSuccess(event.data.object);
        
        case 'payment_intent.payment_failed':
          return await PaymentService.handlePaymentFailure(event.data.object);
        
        case 'payment_intent.canceled':
          return await PaymentService.handlePaymentCanceled(event.data.object);
        
        case 'charge.refunded':
          return await PaymentService.handleRefund(event.data.object);
        
        default:
          console.log(`PaymentService: Unhandled webhook event type: ${event.type}`);
          return { received: true, processed: false };
      }
    } catch (error) {
      console.error('PaymentService.handleWebhook error:', error.message);
      throw error;
    }
  }

  /**
   * Handle successful payment
   * @param {Object} paymentIntent - Payment intent object from webhook
   * @returns {Promise<Object>} Processing result
   */
  static async handlePaymentSuccess(paymentIntent) {
    try {
      const { id: paymentIntentId, metadata } = paymentIntent;

      console.log(`PaymentService: Payment succeeded for intent ${paymentIntentId}`);

      // Find order by payment intent ID
      const order = await Order.findOne({ paymentIntentId });

      if (!order) {
        console.warn(`PaymentService: No order found for payment intent ${paymentIntentId}`);
        return { received: true, processed: false, reason: 'Order not found' };
      }

      // Update order payment status
      order.paymentStatus = 'completed';
      order.status = 'paid';
      order.statusHistory.push({
        status: 'paid',
        timestamp: new Date(),
        note: 'Payment completed successfully',
      });

      await order.save();

      console.log(`PaymentService: Updated order ${order.orderNumber} to paid status`);

      return {
        received: true,
        processed: true,
        orderId: order._id,
        orderNumber: order.orderNumber,
      };
    } catch (error) {
      console.error('PaymentService.handlePaymentSuccess error:', error.message);
      throw error;
    }
  }

  /**
   * Handle failed payment
   * @param {Object} paymentIntent - Payment intent object from webhook
   * @returns {Promise<Object>} Processing result
   */
  static async handlePaymentFailure(paymentIntent) {
    try {
      const { id: paymentIntentId, last_payment_error } = paymentIntent;

      console.log(`PaymentService: Payment failed for intent ${paymentIntentId}`);

      // Find order by payment intent ID
      const order = await Order.findOne({ paymentIntentId });

      if (!order) {
        console.warn(`PaymentService: No order found for payment intent ${paymentIntentId}`);
        return { received: true, processed: false, reason: 'Order not found' };
      }

      // Update order payment status
      order.paymentStatus = 'failed';
      order.statusHistory.push({
        status: 'payment_failed',
        timestamp: new Date(),
        note: last_payment_error ? last_payment_error.message : 'Payment failed',
      });

      await order.save();

      console.log(`PaymentService: Updated order ${order.orderNumber} to failed payment status`);

      return {
        received: true,
        processed: true,
        orderId: order._id,
        orderNumber: order.orderNumber,
      };
    } catch (error) {
      console.error('PaymentService.handlePaymentFailure error:', error.message);
      throw error;
    }
  }

  /**
   * Handle canceled payment
   * @param {Object} paymentIntent - Payment intent object from webhook
   * @returns {Promise<Object>} Processing result
   */
  static async handlePaymentCanceled(paymentIntent) {
    try {
      const { id: paymentIntentId } = paymentIntent;

      console.log(`PaymentService: Payment canceled for intent ${paymentIntentId}`);

      // Find order by payment intent ID
      const order = await Order.findOne({ paymentIntentId });

      if (!order) {
        console.warn(`PaymentService: No order found for payment intent ${paymentIntentId}`);
        return { received: true, processed: false, reason: 'Order not found' };
      }

      // Update order status
      order.status = 'cancelled';
      order.paymentStatus = 'failed';
      order.statusHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        note: 'Payment was canceled',
      });

      await order.save();

      console.log(`PaymentService: Updated order ${order.orderNumber} to canceled status`);

      return {
        received: true,
        processed: true,
        orderId: order._id,
        orderNumber: order.orderNumber,
      };
    } catch (error) {
      console.error('PaymentService.handlePaymentCanceled error:', error.message);
      throw error;
    }
  }

  /**
   * Handle refund
   * @param {Object} charge - Charge object from webhook
   * @returns {Promise<Object>} Processing result
   */
  static async handleRefund(charge) {
    try {
      const { payment_intent: paymentIntentId, amount_refunded } = charge;

      console.log(`PaymentService: Refund processed for payment intent ${paymentIntentId}, amount: ${amount_refunded}`);

      // Find order by payment intent ID
      const order = await Order.findOne({ paymentIntentId });

      if (!order) {
        console.warn(`PaymentService: No order found for payment intent ${paymentIntentId}`);
        return { received: true, processed: false, reason: 'Order not found' };
      }

      // Update order payment status
      order.paymentStatus = 'refunded';
      order.statusHistory.push({
        status: 'refunded',
        timestamp: new Date(),
        note: `Refund processed: ${amount_refunded / 100} ${charge.currency}`,
      });

      await order.save();

      console.log(`PaymentService: Updated order ${order.orderNumber} to refunded status`);

      return {
        received: true,
        processed: true,
        orderId: order._id,
        orderNumber: order.orderNumber,
      };
    } catch (error) {
      console.error('PaymentService.handleRefund error:', error.message);
      throw error;
    }
  }

  /**
   * Retrieve payment intent details
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} Payment intent details
   */
  static async getPaymentIntent(paymentIntentId) {
    try {
      if (!paymentIntentId) {
        throw new Error('Payment intent ID is required');
      }

      const stripe = getStripeClient();
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        metadata: paymentIntent.metadata,
      };
    } catch (error) {
      console.error('PaymentService.getPaymentIntent error:', error.message);
      throw new Error(`Failed to retrieve payment intent: ${error.message}`);
    }
  }
}

module.exports = PaymentService;
