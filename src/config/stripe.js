const stripe = require('stripe');

let stripeClient = null;

/**
 * Initialize Stripe client
 * @returns {Object} Stripe client instance
 */
const initializeStripe = () => {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
  }

  stripeClient = stripe(secretKey, {
    apiVersion: '2023-10-16', // Use latest stable API version
    typescript: false
  });

  console.log('Stripe: Initialized successfully');
  return stripeClient;
};

/**
 * Get Stripe client instance
 * @returns {Object} Stripe client
 */
const getStripeClient = () => {
  if (!stripeClient) {
    return initializeStripe();
  }
  return stripeClient;
};

/**
 * Stripe webhook signature verification
 * @param {string} payload - Raw request body
 * @param {string} signature - Stripe signature header
 * @returns {Object} Verified event object
 */
const verifyWebhookSignature = (payload, signature) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not defined in environment variables');
  }

  try {
    const client = getStripeClient();
    const event = client.webhooks.constructEvent(payload, signature, webhookSecret);
    return event;
  } catch (error) {
    console.error('Stripe webhook verification error:', error);
    throw error;
  }
};

module.exports = {
  initializeStripe,
  getStripeClient,
  verifyWebhookSignature
};
