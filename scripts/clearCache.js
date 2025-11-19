require('dotenv').config();
const { connectRedis, getRedisClient, disconnectRedis } = require('../src/config/redis');

async function clearCache() {
  try {
    await connectRedis();
    const redis = getRedisClient();
    
    console.log('🗑️  Clearing Redis cache...');
    
    // Get all keys matching product patterns
    const productKeys = await redis.keys('product:*');
    
    if (productKeys.length > 0) {
      console.log(`Found ${productKeys.length} product cache keys`);
      await redis.del(productKeys);
      console.log('✅ Product cache cleared!');
    } else {
      console.log('No product cache keys found');
    }
    
    // Clear all cache (optional)
    // await redis.flushAll();
    // console.log('✅ All cache cleared!');
    
    await disconnectRedis();
    process.exit(0);
  } catch (error) {
    console.error('Error clearing cache:', error);
    process.exit(1);
  }
}

clearCache();
