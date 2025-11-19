# Performance Monitoring Setup

This document describes the performance monitoring setup for the ShopMaster E-commerce platform using Elastic APM.

## Overview

The application uses Elastic APM (Application Performance Monitoring) to track:
- Request rates and response times
- Database query performance
- Cache hit/miss rates
- External API call performance
- Custom business metrics

## Features

### 1. Request Monitoring
- Automatic tracking of all HTTP requests
- Response time measurement
- Status code tracking
- Route-based transaction naming

### 2. Database Query Monitoring
- MongoDB query performance tracking
- Slow query detection (> 1 second)
- Query duration metrics
- Automatic error capture

### 3. Cache Performance Monitoring
- Redis operation tracking
- Cache hit/miss rate calculation
- Operation duration measurement
- Cache statistics endpoint

### 4. External API Monitoring
- External service call tracking
- Slow API call detection (> 2 seconds)
- Service-specific metrics

### 5. Custom Metrics
- Business metric tracking
- Custom transaction support
- Label and context support

## Setup

### 1. Install Elastic APM Server

#### Option A: Docker (Recommended for Development)

```bash
docker run -d \
  --name apm-server \
  -p 8200:8200 \
  docker.elastic.co/apm/apm-server:8.11.0 \
  --strict.perms=false \
  -e output.elasticsearch.hosts=["http://elasticsearch:9200"]
```

#### Option B: Elastic Cloud

Sign up for Elastic Cloud at https://cloud.elastic.co and get your APM server URL and secret token.

#### Option C: Self-Hosted

Download and install from https://www.elastic.co/downloads/apm

### 2. Configure Environment Variables

Add the following to your `.env` file:

```bash
# Elastic APM Configuration
ELASTIC_APM_SERVER_URL=http://localhost:8200
ELASTIC_APM_SERVICE_NAME=shopmaster-ecommerce
ELASTIC_APM_SECRET_TOKEN=your_secret_token_here
ELASTIC_APM_TRANSACTION_SAMPLE_RATE=1.0
ELASTIC_APM_LOG_LEVEL=info
ELASTIC_APM_ACTIVE=true
```

### 3. Start the Application

The APM agent is automatically initialized when the application starts. No additional code changes are required.

```bash
npm start
```

## Viewing Metrics

### Elastic APM UI

1. Open Kibana (usually at http://localhost:5601)
2. Navigate to Observability > APM
3. Select your service (shopmaster-ecommerce)

### Available Dashboards

#### 1. Service Overview
- Request rate (requests per minute)
- Average response time
- Error rate
- Transaction distribution

#### 2. Transactions
- Transaction list with duration
- Slow transactions
- Transaction traces
- Span timeline

#### 3. Errors
- Error list with stack traces
- Error rate over time
- Error distribution by type

#### 4. Metrics
- System metrics (CPU, memory)
- JVM metrics (if applicable)
- Custom metrics

#### 5. Service Map
- Service dependencies
- External service calls
- Database connections

## Custom Tracking

### Track Database Queries

```javascript
const PerformanceMetricsService = require('./services/PerformanceMetricsService');

// Track a database query
const result = await PerformanceMetricsService.trackDatabaseQuery(
  'findProducts',
  async () => {
    return await Product.find({ category: 'electronics' });
  },
  { category: 'electronics' }
);
```

### Track Cache Operations

```javascript
// Track a cache operation
const cachedData = await PerformanceMetricsService.trackCacheOperation(
  'GET',
  'product:123',
  async () => {
    return await CacheService.get('product:123');
  }
);
```

### Track External API Calls

```javascript
// Track an external API call
const result = await PerformanceMetricsService.trackExternalAPI(
  'Stripe',
  '/v1/payment_intents',
  async () => {
    return await stripe.paymentIntents.create({ amount: 1000 });
  }
);
```

### Track Business Metrics

```javascript
// Track a business metric
PerformanceMetricsService.trackBusinessMetric(
  'order_completed',
  order.total,
  {
    orderId: order._id,
    userId: order.user,
    items: order.items.length
  }
);
```

### Custom Transactions

```javascript
const { startTransaction } = require('./config/apm');

// Start a custom transaction
const transaction = startTransaction('process-orders', 'background-job');

try {
  // Your code here
  await processOrders();
  
  if (transaction) {
    transaction.result = 'success';
    transaction.end();
  }
} catch (error) {
  if (transaction) {
    transaction.result = 'error';
    transaction.end();
  }
  throw error;
}
```

### Custom Spans

```javascript
const { startSpan } = require('./config/apm');

// Start a custom span
const span = startSpan('calculate-shipping', 'custom', 'business-logic', 'calculate');

try {
  const shippingCost = calculateShipping(order);
  
  if (span) {
    span.addLabels({
      'order.id': order._id,
      'shipping.cost': shippingCost
    });
    span.end();
  }
  
  return shippingCost;
} catch (error) {
  if (span) span.end();
  throw error;
}
```

## Performance Metrics API

### Get Cache Statistics

```javascript
GET /api/admin/performance/cache-stats
```

Response:
```json
{
  "hits": 1500,
  "misses": 500,
  "total": 2000,
  "hitRate": "75.00%"
}
```

### Get Performance Summary

```javascript
GET /api/admin/performance/summary
```

Response:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "cache": {
    "hits": 1500,
    "misses": 500,
    "total": 2000,
    "hitRate": "75.00%"
  }
}
```

## Best Practices

### 1. Transaction Sampling

In production, use a lower sample rate to reduce overhead:

```bash
ELASTIC_APM_TRANSACTION_SAMPLE_RATE=0.1  # 10% of transactions
```

### 2. Sensitive Data

The APM agent automatically filters sensitive data like passwords, tokens, and credit card numbers. Additional fields can be configured in `src/config/apm.js`:

```javascript
sanitizeFieldNames: [
  'password',
  'secret',
  'token',
  // Add more fields here
]
```

### 3. Error Handling

Always capture errors with context:

```javascript
const { captureError } = require('./config/apm');

try {
  // Your code
} catch (error) {
  captureError(error, {
    custom: {
      userId: req.user?.id,
      action: 'checkout',
      orderId: order._id
    }
  });
  throw error;
}
```

### 4. Performance Optimization

- Use spans to identify slow operations
- Monitor database query performance
- Track cache hit rates
- Optimize slow transactions

### 5. Alerting

Set up alerts in Kibana for:
- High error rates (> 5%)
- Slow response times (> 2 seconds)
- Low cache hit rates (< 70%)
- High database query times (> 1 second)

## Troubleshooting

### APM Agent Not Connecting

1. Check APM server URL is correct
2. Verify APM server is running
3. Check network connectivity
4. Review APM agent logs

### No Data in Kibana

1. Ensure `ELASTIC_APM_ACTIVE=true`
2. Check transaction sample rate
3. Verify service name matches
4. Wait a few minutes for data to appear

### High Overhead

1. Reduce transaction sample rate
2. Disable unnecessary instrumentations
3. Increase metrics interval
4. Reduce span frames min duration

## Monitoring Checklist

- [ ] APM server is running
- [ ] Environment variables are configured
- [ ] Application is sending data to APM
- [ ] Kibana dashboards are accessible
- [ ] Alerts are configured
- [ ] Team has access to Kibana
- [ ] Documentation is up to date

## Additional Resources

- [Elastic APM Documentation](https://www.elastic.co/guide/en/apm/get-started/current/index.html)
- [Node.js APM Agent Reference](https://www.elastic.co/guide/en/apm/agent/nodejs/current/index.html)
- [APM Best Practices](https://www.elastic.co/guide/en/apm/guide/current/apm-best-practices.html)
- [Kibana APM UI](https://www.elastic.co/guide/en/kibana/current/xpack-apm.html)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Elastic APM documentation
3. Contact the development team
4. Open an issue in the project repository
