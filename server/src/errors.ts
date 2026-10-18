/**
 * @module errors
 *
 * Application error type. Throw (or pass to `next`) an `HttpError` anywhere in
 * a route, and the error-handling middleware turns it into a consistent JSON
 * response with the right status code.
 */

/** An error that maps directly to an HTTP response. */
export class HttpError extends Error {
  /**
   * @param status - HTTP status code, e.g. 400, 404, 409.
   * @param code - Machine-readable error code, e.g. `CHOICE_NOT_AVAILABLE`.
   * @param message - Message that is safe to show to the user.
   * @param details - Optional extra detail, e.g. validation issues.
   */
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
