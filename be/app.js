import express from 'express';
import 'dotenv/config';
import morgan from 'morgan';
import environment from './config/environment.js';
import { connectDB } from './config/database.js';
import { corsMiddleware } from './middleware/corsMiddleware.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';

const app = express();
const port = environment.port;

// Middleware
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(corsMiddleware);

// Routes
app.use('/', indexRouter);
app.use('/api/users', usersRouter);

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
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();