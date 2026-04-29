import dotenv from 'dotenv';

dotenv.config();

const environment = {
  node_env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 8080,
  api_url: process.env.API_URL || 'http://localhost',
  api_key: process.env.API_KEY,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  database_url: process.env.DATABASE_URL,
  log_level: process.env.LOG_LEVEL || 'info',
};

export default environment;
