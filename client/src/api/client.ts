/**
 * @module api/client
 *
 * The only place the frontend talks to the backend. Components call these
 * typed functions instead of using `fetch` directly, so error handling and
 * URLs stay in one place.
 */
import type { ApiErrorBody, HealthResponse } from '@museum/shared';

/** An error returned by the API (or a network failure, with status 0). */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Sends a request to the API and parses the JSON response.
 *
 * @param path - Path under `/api`, e.g. `/health`.
 * @param init - Optional fetch options (method, body, …).
 * @returns The parsed response body.
 * @throws {ApiError} If the network fails or the server returns an error status.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the museum server.');
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(
      res.status,
      body?.error.code ?? 'UNKNOWN_ERROR',
      body?.error.message ?? `Request failed with status ${res.status}.`,
    );
  }

  return (await res.json()) as T;
}

/** Checks that the backend is up. */
export function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/health');
}
