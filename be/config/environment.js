import dotenv from 'dotenv';

dotenv.config();

const environment = {
  node_env: process.env.NODE_ENV || 'development',
  api_url: process.env.API_URL || 'http://localhost',
  frontend_url: process.env.FRONTEND_URL || 'http://localhost',
  port: process.env.PORT || 8080,
  frontend_port: process.env.FRONTEND_PORT || 8081,
  api_key: process.env.API_KEY,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  database_url: process.env.DATABASE_URL,
  log_level: process.env.LOG_LEVEL || 'info',
  elasticsearch_url: process.env.ELASTICSEARCH_URL,
  elastic_api_key: process.env.ELASTIC_API_KEY,
  // Redis Configuration
  redis_url: process.env.REDIS_URL,
  // Cloudinary Configuration
  cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,
  // VNPay configuration
  vnp_TmnCode: process.env.VNP_TMNCODE,
  vnp_HashSecret: process.env.VNP_HASHSECRET,
  vnp_Url: process.env.VNP_URL,
  vnp_ReturnUrl: process.env.VNP_RETURNURL
};

export default environment;
