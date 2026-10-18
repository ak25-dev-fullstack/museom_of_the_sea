/**
 * @module middleware/validate
 *
 * Request validation with Zod. Use it in a route to reject bad input with a
 * 400 before it ever reaches the conversation engine.
 *
 * @example
 * const choiceBody = z.object({ choiceId: z.string().min(1).max(100) });
 * router.post('/:id/choices', validate({ body: choiceBody }), handler);
 */
import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { HttpError } from '../errors.js';

/** Zod schemas for the parts of a request to validate. */
export interface ValidationSchemas {
  body?: ZodType;
  params?: ZodType;
}

/**
 * Builds middleware that validates `req.body` and/or `req.params`.
 * On success the parsed (and therefore trusted) values replace the originals.
 *
 * @param schemas - Zod schemas for the body and/or the route params.
 * @returns Express middleware that calls `next` with a 400 on invalid input.
 */
export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req, _res, next) => {
    for (const part of ['params', 'body'] as const) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part]);
      if (!result.success) {
        return next(
          new HttpError(400, 'VALIDATION_ERROR', `Invalid request ${part}.`, result.error.issues),
        );
      }
      if (part === 'body') req.body = result.data;
      else Object.assign(req.params, result.data);
    }
    next();
  };
}
