import express from 'express';
import 'dotenv/config';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerAutogen from 'swagger-autogen';
import swaggerUi from 'swagger-ui-express';
import environment from './config/environment.js';
import cookieParser from "cookie-parser";
import { connectDB } from './config/database.js';
import { corsMiddleware } from './middleware/corsMiddleware.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
import authRouter from './routes/auth.js';
import ordersRouter from './routes/order.js';
import commentRouter from './routes/comments.js';
import shopRouter from './routes/shops.js';
import categoriesRouter from './routes/categories.js';

const app = express();
const port = environment.port;
const api_url = environment.api_url;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerSpecPath = process.env.SWAGGER_SPEC_PATH || './docs/swagger.json';
const endpointsFile = ['./routes/index.js', './routes/users.js', './routes/auth.js', './routes/order.js', './routes/comments.js'];

// Tự động tạo endpoints cho swagger.json
// swaggerAutogen()(swaggerSpecPath, endpointsFile)

const loadSwaggerSpec = () => {
  const resolvedPath = path.resolve(__dirname, swaggerSpecPath);

  if (!fs.existsSync(resolvedPath)) {
    return {
      openapi: '3.0.3',
      info: {
        title: 'Mobile App Backend API',
        version: '1.0.0',
        description: `Swagger spec not found at ${swaggerSpecPath}. Add your JSON spec file and restart server.`,
      },
      paths: {},
    };
  }

  const fileContent = fs.readFileSync(resolvedPath, 'utf-8');
  return JSON.parse(fileContent);
};

const swaggerDocument = loadSwaggerSpec();

// Middlewares
app.use(morgan('combined')); // Thêm middleware morgan để log HTTP requests
app.use(express.json()); // Thêm middleware để parse JSON request body
app.use(express.urlencoded({ extended: true })); // Thêm middleware để parse URL-encoded request body
app.use(corsMiddleware); // Thêm middleware CORS tùy chỉnh
app.use(cookieParser()); // Thêm middleware để parse cookies

// Routes
app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/comment', commentRouter);
app.use('/api/shops', shopRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Get raw Swagger JSON
app.get('/api-docs.json', (req, res) => {
  res.json(swaggerDocument);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Kết nối MongoDB
    await connectDB();

    app.listen(port, "0.0.0.0", () => {
      logger.info(`✓ Server is running on port ${port} in ${environment.node_env} mode`);
      logger.info(`✓ CORS enabled for ${environment.frontend_url}`);
      logger.info(`✓ Swagger UI available at ${api_url}:${port}/api-docs`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();