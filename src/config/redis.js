const redis = require('redis');

let redisClient = null;

/**
 * Initialize Redis client connection
 * @returns {Promise<RedisClient>} Redis client instance
 */
const connectRedis = async () => {
  if (redisClient) {
    return redisClient;
  }

  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis: Too many reconnection attempts');
            return new Error('Too many reconnection attempts');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis: Connected successfully');
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis: Reconnecting...');
    });

    await redisClient.connect();
    
    return redisClient;
  } catch (error) {
    console.error('Redis connection error:', error);
    throw error;
  }
};

/**
 * Get Redis client instance
 * @returns {RedisClient} Redis client
 */
const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

/**
 * Close Redis connection
 */
const disconnectRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('Redis: Disconnected');
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  disconnectRedis
};
