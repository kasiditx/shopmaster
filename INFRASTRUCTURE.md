# Infrastructure Setup Documentation

This document describes the infrastructure components configured for the E-commerce platform.

## Installed Dependencies

### Production Dependencies

- **redis** (^5.9.0): In-memory data store for caching and session management
- **socket.io** (^4.8.1): Real-time bidirectional event-based communication
- **nodemailer** (^7.0.10): Email sending service
- **cloudinary** (^2.8.0): Cloud-based image and video management
- **stripe** (^18.1.0): Payment processing (already installed)

### Development Dependencies

- **jest** (^30.2.0): JavaScript testing framework
- **supertest** (^7.1.4): HTTP assertion library for API testing
- **fast-check** (^4.3.0): Property-based testing library
- **@types/jest** (^30.0.0): TypeScript definitions for Jest

### Frontend Dependencies

- **socket.io-client** (^4.8.1): Socket.io client for real-time communication

## Configuration Files

### 1. Redis Configuration (`src/config/redis.js`)

Provides Redis client initialization and management:

```javascript
const { connectRedis, getRedisClient, disconnectRedis } = require('./config/redis');

// Initialize connection
await connectRedis();

// Get client instance
const client = getRedisClient();

// Use Redis
await client.set('key', 'value');
const value = await client.get('key');
```

**Features:**
- Automatic reconnection with exponential backoff
- Error handling and logging
- Connection lifecycle management

### 2. Socket.io Configuration (`src/config/socket.js`)

Provides WebSocket server initialization:

```javascript
const { initializeSocket, emitToUser, emitToProduct } = require('./config/socket');

// Initialize with HTTP server
const io = initializeSocket(httpServer);

// Emit to specific user
emitToUser(userId, 'notification', { message: 'Hello!' });

// Emit to product room
emitToProduct(productId, 'stock-update', { stock: 10 });
```

**Features:**
- JWT authentication middleware
- User-specific rooms
- Product subscription rooms
- CORS configuration

### 3. Email Configuration (`src/config/email.js`)

Provides email sending functionality:

```javascript
const { sendEmail, emailTemplates } = require('./config/email');

// Send email
await sendEmail({
  to: 'customer@example.com',
  subject: 'Order Confirmation',
  html: '<h1>Thank you for your order!</h1>'
});

// Use template
const template = emailTemplates.orderConfirmation(orderData);
await sendEmail({ to: customer.email, ...template });
```

**Available Templates:**
- Order confirmation
- Order status update
- Price drop alert
- Stock available alert
- Low stock alert (admin)

### 4. Cloudinary Configuration (`src/config/cloudinary.js`)

Provides image upload and management:

```javascript
const { uploadImage, deleteImage, getOptimizedImageUrl } = require('./config/cloudinary');

// Upload image
const result = await uploadImage('/path/to/image.jpg', {
  folder: 'ecommerce/products'
});

// Delete image
await deleteImage(result.publicId);

// Get optimized URL
const url = getOptimizedImageUrl(publicId, {
  width: 500,
  height: 500,
  crop: 'fill'
});
```

**Features:**
- Automatic image optimization
- Format conversion (WebP, AVIF)
- Quality optimization
- CDN delivery

### 5. Stripe Configuration (`src/config/stripe.js`)

Provides payment processing:

```javascript
const { getStripeClient, verifyWebhookSignature } = require('./config/stripe');

// Create payment intent
const stripe = getStripeClient();
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000,
  currency: 'usd'
});

// Verify webhook
const event = verifyWebhookSignature(req.body, req.headers['stripe-signature']);
```

## Environment Variables

All required environment variables are documented in `.env.example`:

```bash
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database Configuration
MONGO_URI=mongodb://localhost:27017/shopmaster

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# Email Configuration
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email_user_here
EMAIL_PASSWORD=your_email_password_here
EMAIL_FROM="E-commerce Platform <noreply@ecommerce.com>"

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
CLOUDINARY_API_KEY=your_cloudinary_api_key_here
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here
```

## Testing Infrastructure

### Jest Configuration (`jest.config.js`)

- Test environment: Node.js
- Coverage threshold: 80%
- Test timeout: 10 seconds
- Setup file: `jest.setup.js`

### Test Helpers (`src/utils/testHelpers.js`)

Provides fast-check arbitraries for property-based testing:

- `userArbitrary`: Random user data
- `productArbitrary`: Random product data
- `cartItemArbitrary`: Random cart items
- `orderArbitrary`: Random orders
- `reviewArbitrary`: Random reviews
- `priceArbitrary`: Random prices
- `emailArbitrary`: Random email addresses
- And more...

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPatterns=filename.test.js
```

## Usage in Server

To integrate all services in your main server file:

```javascript
const express = require('express');
const http = require('http');
const config = require('./src/config');

const app = express();
const server = http.createServer(app);

// Initialize services
async function initializeServices() {
  try {
    // Connect to Redis
    await config.redis.connect();
    
    // Initialize Socket.io
    config.socket.initialize(server);
    
    // Initialize email service
    config.email.initialize();
    
    // Initialize Cloudinary
    config.cloudinary.initialize();
    
    // Initialize Stripe
    config.stripe.initialize();
    
    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Service initialization error:', error);
    process.exit(1);
  }
}

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  await initializeServices();
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await config.redis.disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
```

## Next Steps

1. **Configure environment variables**: Copy `.env.example` to `.env` and fill in actual values
2. **Install external services**:
   - Install and start Redis: `redis-server`
   - Sign up for Stripe account and get API keys
   - Sign up for Cloudinary account and get credentials
   - Configure email service (or use Ethereal for testing)
3. **Update server.js**: Integrate the configuration modules
4. **Write tests**: Use the test helpers for property-based testing
5. **Implement services**: Build the business logic using these infrastructure components

## Troubleshooting

### Redis Connection Issues

- Ensure Redis is running: `redis-cli ping` should return `PONG`
- Check Redis URL in environment variables
- Verify firewall settings

### Socket.io Connection Issues

- Verify CORS configuration matches client URL
- Check JWT token is being sent correctly
- Ensure server is using HTTP server instance, not Express app

### Email Sending Issues

- For development, use Ethereal Email (https://ethereal.email/)
- For production, configure a real SMTP service
- Check email credentials and host settings

### Cloudinary Upload Issues

- Verify API credentials are correct
- Check file size limits
- Ensure proper folder permissions

### Stripe Payment Issues

- Use test mode keys for development
- Verify webhook secret matches Stripe dashboard
- Check API version compatibility

## Security Considerations

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Use environment-specific keys** - Different keys for dev/staging/production
3. **Rotate secrets regularly** - Especially JWT secrets and API keys
4. **Enable HTTPS in production** - Required for Stripe and secure WebSocket
5. **Validate webhook signatures** - Always verify Stripe webhook signatures
6. **Sanitize user inputs** - Prevent XSS and injection attacks
7. **Rate limit API endpoints** - Prevent abuse and DDoS attacks
