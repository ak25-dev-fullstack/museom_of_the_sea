/**
 * @module middleware/notFound
 *
 * Catches requests that matched no route and forwards a 404 `HttpError` to
 * the error handler.
 */
import type { RequestHandler } from 'express';
import { HttpError } from '../errors.js';

export const notFound: RequestHandler = (req, _res, next) => {
  next(new HttpError(404, 'NOT_FOUND', `No route for ${req.method} ${req.path}`));
};
