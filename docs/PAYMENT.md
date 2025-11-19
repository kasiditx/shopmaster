# Payment Integration with Stripe

This document describes the payment integration implementation using Stripe.

## Overview

The payment system is built using Stripe's Payment Intents API, which provides a secure and flexible way to handle payments. The implementation includes:

- Creating payment intents
- Confirming payments
- Handling webhook events for payment status updates
- Automatic order status updates based on payment events

## Environment Variables

Add the following environment variables to your `.env` file:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## API Endpoints

### 1. Create Payment Intent

**Endpoint:** `POST /api/payment/create-intent`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "amount": 100.50,
  "currency": "usd",
  "orderId": "order_id_here",
  "orderNumber": "ORD-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentIntentId": "pi_xxx",
    "amount": 10050,
    "currency": "usd",
    "status": "requires_payment_method"
  }
}
```

**Usage:**
- Call this endpoint when the user initiates checkout
- The `clientSecret` should be passed to Stripe.js on the frontend to collect payment details
- The `amount` is in dollars and will be converted to cents automatically

### 2. Confirm Payment

**Endpoint:** `POST /api/payment/confirm`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "paymentIntentId": "pi_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentIntentId": "pi_xxx",
    "status": "succeeded",
    "amount": 10050,
    "currency": "usd"
  }
}
```

**Usage:**
- This endpoint can be used to check the status of a payment intent
- If the payment requires confirmation, it will be confirmed automatically
- If the payment is already successful, it returns the current status

### 3. Stripe Webhook

**Endpoint:** `POST /api/payment/webhook`

**Authentication:** None (verified by Stripe signature)

**Headers:**
```
stripe-signature: t=xxx,v1=xxx
```

**Request Body:** Raw Stripe event JSON

**Response:**
```json
{
  "success": true,
  "data": {
    "received": true,
    "processed": true,
    "orderId": "order_id",
    "orderNumber": "ORD-123"
  }
}
```

**Supported Events:**
- `payment_intent.succeeded` - Updates order to "paid" status
- `payment_intent.payment_failed` - Updates order payment status to "failed"
- `payment_intent.canceled` - Updates order to "cancelled" status
- `charge.refunded` - Updates order payment status to "refunded"

**Setup:**
1. Configure webhook endpoint in Stripe Dashboard: `https://yourdomain.com/api/payment/webhook`
2. Select the events you want to receive
3. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET` environment variable

## Frontend Integration

### Using Stripe.js

```javascript
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripe = await loadStripe('pk_test_...');

// Create payment intent
const response = await fetch('/api/payment/create-intent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    amount: 100.50,
    currency: 'usd',
    orderId: orderId
  })
});

const { data } = await response.json();
const { clientSecret } = data;

// Confirm payment with Stripe Elements
const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
    billing_details: {
      name: 'Customer Name',
      email: 'customer@example.com'
    }
  }
});

if (error) {
  // Handle error
  console.error(error.message);
} else if (paymentIntent.status === 'succeeded') {
  // Payment successful
  console.log('Payment succeeded!');
}
```

## PaymentService Methods

### `createPaymentIntent(amount, currency, metadata)`

Creates a new payment intent with Stripe.

**Parameters:**
- `amount` (number): Amount in dollars (will be converted to cents)
- `currency` (string): Currency code (default: 'usd')
- `metadata` (object): Additional metadata to attach to the payment intent

**Returns:** Promise<Object> with payment intent details

**Example:**
```javascript
const paymentIntent = await PaymentService.createPaymentIntent(
  100.50,
  'usd',
  { orderId: 'order123', userId: 'user456' }
);
```

### `confirmPayment(paymentIntentId)`

Confirms a payment intent or retrieves its current status.

**Parameters:**
- `paymentIntentId` (string): The payment intent ID

**Returns:** Promise<Object> with payment intent status

**Example:**
```javascript
const result = await PaymentService.confirmPayment('pi_xxx');
console.log(result.status); // 'succeeded', 'requires_payment_method', etc.
```

### `handleWebhook(event)`

Processes Stripe webhook events and updates order status accordingly.

**Parameters:**
- `event` (object): Verified Stripe webhook event

**Returns:** Promise<Object> with processing result

**Example:**
```javascript
const event = verifyWebhookSignature(req.body, signature);
const result = await PaymentService.handleWebhook(event);
```

### `getPaymentIntent(paymentIntentId)`

Retrieves payment intent details from Stripe.

**Parameters:**
- `paymentIntentId` (string): The payment intent ID

**Returns:** Promise<Object> with payment intent details

**Example:**
```javascript
const details = await PaymentService.getPaymentIntent('pi_xxx');
console.log(details.amount, details.status);
```

## Error Handling

The PaymentService handles various Stripe error types:

- **StripeCardError**: Card-related errors (declined, insufficient funds, etc.)
- **StripeInvalidRequestError**: Invalid API request parameters
- **StripeAPIError**: Stripe API temporarily unavailable
- **StripeConnectionError**: Network connectivity issues
- **StripeAuthenticationError**: Invalid API key

All errors are logged and re-thrown with user-friendly messages.

## Testing

### Unit Tests

Run the PaymentService tests:
```bash
npm test -- PaymentService.test.js
```

### Testing with Stripe Test Mode

Use Stripe's test card numbers:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Insufficient funds: `4000 0000 0000 9995`

### Testing Webhooks Locally

Use Stripe CLI to forward webhooks to your local server:
```bash
stripe listen --forward-to localhost:5000/api/payment/webhook
```

## Security Considerations

1. **Webhook Signature Verification**: All webhook requests are verified using Stripe's signature to prevent tampering
2. **Raw Body for Webhooks**: The webhook endpoint receives raw body data for signature verification
3. **No Card Storage**: Credit card details are never stored in the database - only payment intent IDs
4. **HTTPS Required**: In production, all payment endpoints must use HTTPS
5. **Authentication**: Payment intent creation requires user authentication

## Order Status Flow

1. User initiates checkout → Order created with status "pending"
2. Payment intent created → Order gets `paymentIntentId`
3. User completes payment → Stripe sends `payment_intent.succeeded` webhook
4. Webhook handler updates order → Order status changes to "paid"
5. If payment fails → Order payment status set to "failed"

## Troubleshooting

### Webhook Not Receiving Events

1. Check that webhook URL is correct in Stripe Dashboard
2. Verify `STRIPE_WEBHOOK_SECRET` is set correctly
3. Check server logs for webhook verification errors
4. Use Stripe CLI to test webhooks locally

### Payment Intent Creation Fails

1. Verify `STRIPE_SECRET_KEY` is set correctly
2. Check that amount is greater than 0
3. Ensure currency code is valid (3-letter ISO code)
4. Check Stripe Dashboard for API errors

### Order Not Updating After Payment

1. Check webhook is configured and receiving events
2. Verify order has correct `paymentIntentId`
3. Check server logs for webhook processing errors
4. Ensure Order model is properly saved after updates

## References

- [Stripe Payment Intents API](https://stripe.com/docs/payments/payment-intents)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe.js Reference](https://stripe.com/docs/js)
- [Stripe Test Cards](https://stripe.com/docs/testing)
