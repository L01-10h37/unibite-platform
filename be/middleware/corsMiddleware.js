import cors from 'cors';
import environment from '../config/environment.js';

const corsOptions = {
  origin: (origin, callback) => {
    // Reflect the request origin — allows credentials and avoids wildcard when needed
    callback(null, true);
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

export const corsMiddleware = cors(corsOptions);

export default corsMiddleware;
