import { defineConfig } from 'vitest/config';

/**
 * Vitest config for `npm run test:examples`: runs every example conversation in
 * `docs/rooms/changing-sea/examples/` through the API (see `tests/examples/all.examples.ts`).
 * Plain `npm test` uses `vitest.config.ts` and runs only the enabled examples.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/examples/all.examples.ts'],
  },
});
