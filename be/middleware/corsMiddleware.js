import cors from 'cors';
import environment from '../config/environment.js';

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
};

export const corsMiddleware = cors(corsOptions);

export default corsMiddleware;
