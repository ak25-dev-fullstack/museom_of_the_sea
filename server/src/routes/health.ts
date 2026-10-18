/**
 * @module routes/health
 *
 * `GET /api/health`: a liveness check used by the client and in tests.
 */
import { Router } from 'express';
import type { HealthResponse } from '@museum/shared';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  const body: HealthResponse = { status: 'ok', uptime: Math.round(process.uptime()) };
  res.json(body);
});
