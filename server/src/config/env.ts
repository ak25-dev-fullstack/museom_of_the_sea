/**
 * @module config/env
 *
 * Loads and validates environment variables once at startup, so the rest of
 * the server can rely on a typed `env` object instead of reading
 * `process.env` directly. Secrets (e.g. an optional AI API key) must only
 * ever be read here, never hard-coded.
 */
import { z } from 'zod';

// Load `server/.env` if it exists. Variables already set (e.g. in CI) win.
try {
  process.loadEnvFile();
} catch {
  // No .env file: fall back to the defaults below.
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
});

/** Validated environment configuration. */
export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration. See server/.env.example.');
}

export const env: Env = parsed.data;
