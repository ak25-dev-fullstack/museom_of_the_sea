/**
 * @module middleware/errorHandler
 *
 * The last middleware in the chain. Converts any thrown error into the
 * standard {@link ApiErrorBody} JSON shape. Unexpected errors are logged and
 * returned as a generic 500, so internal details never leak to the client.
 */
import type { ErrorRequestHandler } from 'express';
import type { ApiErrorBody } from '@museum/shared';
import { HttpError } from '../errors.js';
import { env } from '../config/env.js';

/** Shape of the error Express's JSON body parser throws on malformed input. */
interface BodyParserError extends Error {
  type?: string;
  status?: number;
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let status = 500;
  let body: ApiErrorBody = {
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' },
  };

  if (err instanceof HttpError) {
    status = err.status;
    body = { error: { code: err.code, message: err.message, details: err.details } };
  } else if ((err as BodyParserError).type === 'entity.parse.failed') {
    status = 400;
    body = { error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON.' } };
  } else if ((err as BodyParserError).type === 'entity.too.large') {
    status = 413;
    body = { error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large.' } };
  }

  if (status >= 500 && env.NODE_ENV !== 'test') {
    console.error(err);
  }

  res.status(status).json(body);
};
