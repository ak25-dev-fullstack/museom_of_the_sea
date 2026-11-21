/**
 * Every example conversation, whether enabled or not. Run with `npm run test:examples`
 * (config: `server/vitest.examples.config.ts`). Expected to fail until the API is built in
 * Phase 5. It is not named `*.test.ts`, so plain `npm test` doesn't pick it up.
 */
import { defineExampleSuite } from './suite.js';

defineExampleSuite();
