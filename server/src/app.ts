/**
 * @module app
 *
 * Builds the Express application without starting it, so tests can drive it
 * with Supertest and `index.ts` can start it for real.
 *
 * Middleware order matters: security headers → CORS → body parsing → rate
 * limiting → routes → 404 → error handler.
 */
import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

/**
 * Creates a fully configured Express app.
 *
 * @returns The Express app, ready to `listen` or to pass to Supertest.
 */
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN }));
  app.use(express.json({ limit: '10kb' }));

  app.use(
    '/api',
    rateLimit({
      windowMs: 60_000,
      limit: 120,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      skip: () => env.NODE_ENV === 'test',
      message: { error: { code: 'RATE_LIMITED', message: 'Too many requests. Slow down.' } },
    }),
  );

  app.use('/api/health', healthRouter);
  // TODO(#9, #10): mount session routes here, e.g. app.use('/api/sessions', sessionsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
