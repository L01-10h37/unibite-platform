import dotenv from 'dotenv';

dotenv.config();

const database = {
  url: process.env.DATABASE_URL || 'mongodb://localhost:27017/mobile-app',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 27017,
  name: process.env.DB_NAME || 'mobile-app',
};

export default database;
