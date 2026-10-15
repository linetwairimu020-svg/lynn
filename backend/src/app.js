import express from 'express';
import helmet from 'helmet';
import { corsMiddleware } from './config/cors.js';
import { HttpError, errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import healthRouter from './routes/health.routes.js';
import authRouter from './routes/auth.routes.js';
import adminRouter from './routes/admin.routes.js';
import contentRouter from './routes/content.routes.js';
import { config } from './config/env.js';

const app = express();

app.locals.corsOrigins = config.corsOrigins;
app.disable('x-powered-by');
app.use(helmet());
app.use(corsMiddleware);
app.use(express.json({
  limit: '16kb',
  strict: true,
  type: 'application/json',
}));
app.use((error, _request, _response, next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    next(new HttpError(400, 'INVALID_JSON', 'Request body must contain valid JSON.'));
    return;
  }
  if (error.type === 'entity.too.large') {
    next(new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Request body exceeds the 16kb limit.'));
    return;
  }
  next(error);
});

app.use('/api', healthRouter);
app.use('/api', authRouter);
app.use('/api', contentRouter);
app.use('/api/admin', adminRouter);
app.use(notFound);
app.use(errorHandler);

export default app;
