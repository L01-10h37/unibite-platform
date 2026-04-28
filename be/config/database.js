import mongoose from 'mongoose';
import environment from './environment.js';
import { logger } from '../utils/logger.js';

const database_url = environment.database_url;

/**
 * Kết nối MongoDB
 */
export const connectDB = async () => {
  try {
    if (!database_url) {
      throw new Error('DATABASE_URL is not defined in .env');
    }

    await mongoose.connect(database_url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('✓ MongoDB connected successfully');
    logger.info(`✓ Database: ${mongoose.connection.name}`);
    logger.info(`✓ Host: ${mongoose.connection.host}`);

    return mongoose.connection;
  } catch (error) {
    logger.error('MongoDB connection failed', error.message);
    process.exit(1);
  }
};

/**
 * Ngắt kết nối MongoDB
 */
export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('✓ MongoDB disconnected successfully');
  } catch (error) {
    logger.error('MongoDB disconnection failed', error.message);
    process.exit(1);
  }
};

/**
 * Lắng nghe sự kiện MongoDB
 */
mongoose.connection.on('connected', () => {
  logger.info('Mongoose connected');
});

mongoose.connection.on('error', (error) => {
  logger.error('Mongoose connection error', error.message);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose disconnected');
});

export default {
  connectDB,
  disconnectDB,
};
