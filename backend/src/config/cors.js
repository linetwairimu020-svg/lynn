import cors from 'cors';
import { config } from './env.js';
import { HttpError } from '../middleware/errorHandler.js';

export const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin || config.corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new HttpError(403, 'ORIGIN_NOT_ALLOWED', 'This origin is not allowed.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
  optionsSuccessStatus: 204,
});
