// config/database/redis.js
import { createClient } from 'redis';
import environment from './environment.js';
import { logger } from '../utils/logger.js';

const redis_url = environment.redis_url;

/**
 * Tạo Redis client
 */
let redisClient = null;

/**
 * Kết nối Redis
 */
export const connectRedis = async () => {
  try {
    if (!redis_url) {
      throw new Error('REDIS_URL is not defined in .env');
    }

    redisClient = createClient({
      url: redis_url,
      socket: {
        connectTimeout: 5000,
        keepAlive: 30000,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis max reconnection attempts reached');
            return new Error('Redis max reconnection attempts reached');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    // Lắng nghe sự kiện Redis
    redisClient.on('connect', () => {
      logger.info('Redis connecting...');
    });

    redisClient.on('ready', () => {
      logger.info('✓ Redis connected successfully');
    });

    redisClient.on('error', (error) => {
      logger.error('Redis connection error', error.message);
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis reconnecting...');
    });

    redisClient.on('end', () => {
      logger.warn('Redis connection ended');
    });

    // Kết nối
    await redisClient.connect();
    
    // Test connection
    await redisClient.ping();
    logger.info('✓ Redis ping successful');

    return redisClient;
  } catch (error) {
    logger.error('Redis connection failed', error.message);
    process.exit(1);
  }
};

/**
 * Ngắt kết nối Redis
 */
export const disconnectRedis = async () => {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit(); // Sử dụng quit thay vì disconnect để đảm bảo tất cả commands được xử lý
      logger.info('✓ Redis disconnected successfully');
    }
  } catch (error) {
    logger.error('Redis disconnection failed', error.message);
    process.exit(1);
  }
};

/**
 * Lấy Redis client instance
 */
export const getRedisClient = () => {
  if (!redisClient || !redisClient.isOpen) {
    throw new Error('Redis client is not connected');
  }
  return redisClient;
};

/**
 * Kiểm tra kết nối Redis
 */
export const isRedisConnected = () => {
  return redisClient && redisClient.isOpen;
};


export default {
  connectRedis,
  disconnectRedis,
  getRedisClient,
  isRedisConnected,
};