# Monitoring and Performance Setup

This document provides an overview of the monitoring and performance tracking setup for the ShopMaster E-commerce platform.

## Overview

The application uses a comprehensive monitoring stack to track:
- **Application Performance**: Request rates, response times, and throughput
- **Database Performance**: Query execution times and slow query detection
- **Cache Performance**: Hit/miss rates and operation latency
- **Error Tracking**: Application errors with stack traces and context
- **Business Metrics**: Custom metrics for business events

## Monitoring Stack

### 1. Elastic APM (Application Performance Monitoring)

**Purpose**: Track application performance, database queries, and cache operations

**Features**:
- Automatic HTTP request tracking
- Database query performance monitoring
- Cache operation tracking with hit/miss rates
- External API call monitoring
- Custom transaction and span support
- Distributed tracing

**Setup**: See [docs/PERFORMANCE_MONITORING.md](docs/PERFORMANCE_MONITORING.md)

**Dashboard**: Kibana APM UI

### 2. Sentry (Error Tracking)

**Purpose**: Track and monitor application errors

**Features**:
- Automatic error capture with stack traces
- Error grouping and deduplication
- Release tracking
- Performance monitoring
- User context and breadcrumbs
- Source map support

**Configuration**: `src/config/sentry.js`

**Dashboard**: Sentry.io

### 3. Winston (Application Logging)

**Purpose**: Structured application logging

**Features**:
- Multiple log levels (error, warn, info, debug)
- Separate log files by category (auth, transactions, errors)
- Daily log rotation
- JSON format for production
- Colored console output for development

**Configuration**: `src/utils/logger.js`

**Log Files**:
- `logs/error-YYYY-MM-DD.log` - Error logs
- `logs/combined-YYYY-MM-DD.log` - All logs
- `logs/auth-YYYY-MM-DD.log` - Authentication events
- `logs/transactions-YYYY-MM-DD.log` - Order and payment transactions

## Monitored Metrics

### Application Metrics

1. **Request Metrics**
   - Request rate (requests per minute)
   - Response time (average, p95, p99)
   - Status code distribution
   - Error rate

2. **Database Metrics**
   - Query execution time
   - Slow queries (> 1 second)
   - Connection pool usage
   - Query count by type

3. **Cache Metrics**
   - Cache hit rate
   - Cache miss rate
   - Operation latency (GET, SET, DELETE)
   - Cache size and memory usage

4. **External API Metrics**
   - API call duration
   - Success/failure rates
   - Slow API calls (> 2 seconds)
   - Service-specific metrics

### Business Metrics

1. **Order Metrics**
   - Order creation rate
   - Order completion rate
   - Average order value
   - Order cancellation rate

2. **Product Metrics**
   - Product views
   - Add to cart rate
   - Search queries
   - Popular products

3. **User Metrics**
   - User registrations
   - Login attempts
   - Active sessions
   - User engagement

## Performance Monitoring API

### Admin Endpoints

All endpoints require admin authentication.

#### Get Cache Statistics
```http
GET /api/admin/performance/cache-stats
```

Response:
```json
{
  "success": true,
  "data": {
    "hits": 1500,
    "misses": 500,
    "total": 2000,
    "hitRate": "75.00%"
  }
}
```

#### Get Performance Summary
```http
GET /api/admin/performance/summary
```

Response:
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "cache": {
      "hits": 1500,
      "misses": 500,
      "total": 2000,
      "hitRate": "75.00%"
    }
  }
}
```

#### Get Database Status
```http
GET /api/admin/performance/database-status
```

Response:
```json
{
  "success": true,
  "data": {
    "state": "connected",
    "host": "localhost",
    "name": "shopmaster",
    "collections": 5
  }
}
```

#### Get Redis Status
```http
GET /api/admin/performance/redis-status
```

Response:
```json
{
  "success": true,
  "data": {
    "connected": true,
    "version": "7.0.0",
    "uptime": "86400",
    "mode": "standalone"
  }
}
```

#### Health Check
```http
GET /api/admin/performance/health
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "uptime": 86400,
    "memory": {
      "used": 150,
      "total": 512,
      "unit": "MB"
    },
    "database": {
      "connected": true
    },
    "cache": {
      "connected": true
    }
  }
}
```

## Custom Tracking

### Track Database Queries

```javascript
const PerformanceMetricsService = require('./services/PerformanceMetricsService');

const products = await PerformanceMetricsService.trackDatabaseQuery(
  'findProducts',
  async () => {
    return await Product.find({ category: 'electronics' });
  },
  { category: 'electronics' }
);
```

### Track Cache Operations

```javascript
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

## Alerting

### Recommended Alerts

1. **High Error Rate**
   - Condition: Error rate > 5%
   - Action: Send alert to on-call team
   - Severity: Critical

2. **Slow Response Time**
   - Condition: P95 response time > 2 seconds
   - Action: Send alert to development team
   - Severity: Warning

3. **Low Cache Hit Rate**
   - Condition: Cache hit rate < 70%
   - Action: Send alert to development team
   - Severity: Warning

4. **Database Connection Issues**
   - Condition: Database disconnected
   - Action: Send alert to on-call team
   - Severity: Critical

5. **High Memory Usage**
   - Condition: Memory usage > 80%
   - Action: Send alert to operations team
   - Severity: Warning

6. **Slow Database Queries**
   - Condition: Query time > 1 second
   - Action: Log for review
   - Severity: Info

## Dashboards

### Kibana APM Dashboard

1. **Service Overview**
   - Request rate
   - Response time
   - Error rate
   - Transaction distribution

2. **Transactions**
   - Transaction list
   - Slow transactions
   - Transaction traces
   - Span timeline

3. **Errors**
   - Error list
   - Error rate
   - Error distribution

4. **Metrics**
   - System metrics
   - Custom metrics
   - JVM metrics

### Sentry Dashboard

1. **Issues**
   - Error list
   - Error frequency
   - Error trends

2. **Performance**
   - Transaction performance
   - Slow endpoints
   - Performance trends

3. **Releases**
   - Release tracking
   - Error rates by release
   - Performance by release

## Best Practices

### 1. Sampling

In production, use appropriate sampling rates to reduce overhead:

```bash
# APM
ELASTIC_APM_TRANSACTION_SAMPLE_RATE=0.1  # 10% of transactions

# Sentry
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% of transactions
```

### 2. Sensitive Data

Always filter sensitive data from logs and traces:
- Passwords
- API keys
- Credit card numbers
- Personal information

### 3. Performance Impact

Monitor the performance impact of monitoring tools:
- APM overhead: < 5% CPU
- Logging overhead: < 2% CPU
- Sentry overhead: < 1% CPU

### 4. Log Retention

Configure appropriate log retention:
- Error logs: 30 days
- Combined logs: 14 days
- Auth logs: 90 days
- Transaction logs: 90 days

### 5. Alert Fatigue

Avoid alert fatigue by:
- Setting appropriate thresholds
- Using alert aggregation
- Implementing alert escalation
- Regular alert review

## Troubleshooting

### APM Not Working

1. Check APM server URL is correct
2. Verify APM server is running
3. Check network connectivity
4. Review APM agent logs
5. Verify environment variables

### Logs Not Appearing

1. Check log directory permissions
2. Verify log level is appropriate
3. Check disk space
4. Review logger configuration

### High Memory Usage

1. Check for memory leaks
2. Review log retention settings
3. Monitor APM overhead
4. Check cache size

### Slow Performance

1. Review slow query logs
2. Check cache hit rates
3. Monitor external API calls
4. Review APM transaction traces

## Maintenance

### Daily Tasks

- Review error logs
- Check system health
- Monitor alert notifications

### Weekly Tasks

- Review performance trends
- Analyze slow queries
- Check cache performance
- Review business metrics

### Monthly Tasks

- Review and update alerts
- Analyze performance trends
- Optimize slow endpoints
- Update monitoring documentation

## Additional Resources

- [Elastic APM Documentation](https://www.elastic.co/guide/en/apm/get-started/current/index.html)
- [Sentry Documentation](https://docs.sentry.io/)
- [Winston Documentation](https://github.com/winstonjs/winston)
- [Performance Monitoring Guide](docs/PERFORMANCE_MONITORING.md)
- [Environment Configuration](ENVIRONMENT.md)

## Support

For monitoring issues:
1. Check this documentation
2. Review application logs
3. Check monitoring dashboards
4. Contact the development team
