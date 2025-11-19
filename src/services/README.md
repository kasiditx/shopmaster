# CacheService

The CacheService provides a robust caching layer using Redis for the E-commerce platform. It handles all caching operations with built-in error handling for Redis connection failures.

## Features

- **Get/Set/Delete operations**: Basic cache operations with automatic JSON serialization
- **Pattern-based invalidation**: Invalidate multiple cache keys matching a pattern
- **Configurable TTL**: Different TTL values for different cache types
- **Error handling**: Gracefully handles Redis connection failures without breaking the application
- **Connection status**: Check if Redis is connected

## Usage

### Basic Operations

```javascript
const CacheService = require('./services/CacheService');

// Set a value with default TTL (5 minutes)
await CacheService.set('product:123', { id: 123, name: 'Product' });

// Set a value with custom TTL
await CacheService.set('product:123', productData, CacheService.TTL.PRODUCT_DETAIL);

// Get a value
const product = await CacheService.get('product:123');

// Delete a value
await CacheService.delete('product:123');
```

### Pattern-Based Invalidation

```javascript
// Invalidate all product caches
await CacheService.invalidatePattern('product:*');

// Invalidate all caches for a specific user's cart
await CacheService.invalidatePattern('cart:user:123:*');
```

### TTL Configurations

The service provides predefined TTL values for different cache types:

- `PRODUCT_LIST`: 300 seconds (5 minutes)
- `PRODUCT_DETAIL`: 600 seconds (10 minutes)
- `SEARCH_RESULTS`: 180 seconds (3 minutes)
- `CART`: 604800 seconds (7 days)
- `SESSION`: 86400 seconds (24 hours)
- `USER_PROFILE`: 1800 seconds (30 minutes)
- `DEFAULT`: 300 seconds (5 minutes)

### Error Handling

The CacheService is designed to fail gracefully. If Redis is unavailable:

- `get()` returns `null` (allowing fallback to database)
- `set()` returns `false` (operation failed but app continues)
- `delete()` returns `false`
- `invalidatePattern()` returns `0` (no keys deleted)
- `isConnected()` returns `false`

This ensures that caching failures don't break the application - the app will simply fall back to database queries.

### Example: Product Service Integration

```javascript
const CacheService = require('./services/CacheService');
const Product = require('./models/Product');

class ProductService {
  async getProduct(productId) {
    // Try to get from cache first
    const cacheKey = `product:${productId}`;
    const cached = await CacheService.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    // If not in cache, get from database
    const product = await Product.findById(productId);
    
    // Store in cache for future requests
    if (product) {
      await CacheService.set(cacheKey, product, CacheService.TTL.PRODUCT_DETAIL);
    }
    
    return product;
  }

  async updateProduct(productId, updates) {
    // Update in database
    const product = await Product.findByIdAndUpdate(productId, updates, { new: true });
    
    // Invalidate related caches
    await CacheService.delete(`product:${productId}`);
    await CacheService.invalidatePattern('product:list:*');
    
    return product;
  }
}
```

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 1.5**: Cache utilization for frequently accessed data
- **Requirement 8.2**: Cache invalidation on product updates
- **Requirement 14.1**: Performance optimization through caching

## Testing

Unit tests are provided in `src/services/__tests__/CacheService.test.js`. These tests verify:

- Service structure and method availability
- Error handling when Redis is unavailable
- TTL configuration values

For integration testing with a real Redis instance, ensure Redis is running locally or in your test environment.

## Notes

- The service uses Redis SCAN command instead of KEYS for pattern matching, which is safer for production use
- All values are automatically serialized to JSON when stored and deserialized when retrieved
- The service logs errors to console but doesn't throw exceptions, ensuring application stability
