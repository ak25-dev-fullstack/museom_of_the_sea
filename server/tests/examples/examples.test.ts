/**
 * The enabled example conversations, run as part of `npm test` and CI. See `enabled.ts`.
 */
import { describe, it } from 'vitest';
import { enabledExamples } from './enabled.js';
import { defineExampleSuite } from './suite.js';

if (enabledExamples.length === 0) {
  describe('example conversations', () => {
    it.todo('none enabled yet: each slice adds its example ids to tests/examples/enabled.ts');
  });
} else {
  defineExampleSuite(enabledExamples);
}
