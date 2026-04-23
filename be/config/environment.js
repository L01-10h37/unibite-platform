import dotenv from 'dotenv';

dotenv.config();

const environment = {
  node_env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 8080,
  frontend_url: process.env.FRONTEND_URL || 'http://localhost:3000',
  api_url: process.env.API_URL || 'http://localhost',
  api_key: process.env.API_KEY,
  jwt_secret: process.env.JWT_SECRET,
  log_level: process.env.LOG_LEVEL || 'info',
};

export default environment;
