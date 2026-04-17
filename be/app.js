import express from 'express';
import 'dotenv/config';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import environment from './config/environment.js';
import { connectDB } from './config/database.js';
import { corsMiddleware } from './middleware/corsMiddleware.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';

const app = express();
const port = environment.port;
const api_url = environment.api_url;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerSpecPath = process.env.SWAGGER_SPEC_PATH || './docs/swagger.json';

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

// Middleware
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(corsMiddleware);

// Routes
app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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

    app.listen(port, () => {
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