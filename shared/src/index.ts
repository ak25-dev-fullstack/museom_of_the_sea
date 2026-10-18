/**
 * @module @museum/shared
 *
 * Types shared by the client and the server. Only the *shapes that cross the
 * network* belong here (API requests and responses). Content types, such as
 * dialogue nodes, belong to the server, because the client never receives
 * the full dialogue graph.
 *
 * Add the session and node view types (e.g. `NodeView`, `SessionView`) here
 * as the session routes are built (see issues #9 and #10).
 */

/** Response body of `GET /api/health`. */
export interface HealthResponse {
  status: 'ok';
  /** Server uptime in seconds. */
  uptime: number;
}

/** Body of every error response sent by the API. */
export interface ApiErrorBody {
  error: {
    /** Machine-readable code, e.g. `NOT_FOUND` or `VALIDATION_ERROR`. */
    code: string;
    /** Human-readable message that is safe to show to the user. */
    message: string;
    /** Optional extra detail, e.g. which fields failed validation. */
    details?: unknown;
  };
}
