/**
 * @module tests/examples/harness
 *
 * How the example runner gets an Express app and reads or sets session state.
 *
 * The real harness, `server/src/testing/harness.ts`, is a **Phase 5 deliverable** (see
 * `docs/rooms/changing-sea/PLAN.md`). It must export {@link CreateTestHarness}. Until it exists,
 * {@link loadHarness} falls back to the plain `createApp()`, and any state access throws
 * {@link HarnessNotBuiltError}, so the failure message says exactly what is missing.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Express } from 'express';
import { createApp } from '../../src/app.js';
import type { ExampleAiSetup } from './loadExamples.js';

/** The AI options a harness accepts (spec §17). */
export interface HarnessAiOptions {
  enabled: boolean;
  /** Stands in for the real AI service. Receives only the visitor's text. */
  fallback: (text: string) => Promise<string>;
  /** Overrides the service's 5000 ms default, so the slow-stub example runs quickly. */
  timeoutMs?: number;
}

/** What a harness gives the runner. */
export interface TestHarness {
  /** The Express app to drive with Supertest. */
  app: Express;
  /** Merges a partial visit state over the session's start state. */
  setState(sessionId: string, partial: Record<string, unknown>): void;
  /** Returns the session's full visit state. */
  getState(sessionId: string): unknown;
  /** `false` while `server/src/testing/harness.ts` doesn't exist yet. */
  built: boolean;
}

/** The function `server/src/testing/harness.ts` must export as `createTestHarness`. */
export type CreateTestHarness = (options?: { ai?: HarnessAiOptions }) => Omit<TestHarness, 'built'>;

/** Absolute path of the Phase 5 harness module. */
export const HARNESS_FILE = fileURLToPath(new URL('../../src/testing/harness.ts', import.meta.url));

/** Thrown when an example needs session state before the Phase 5 harness exists. */
export class HarnessNotBuiltError extends Error {
  constructor(what: string) {
    super(
      `${what} needs the test harness, which isn't built yet ` +
        '(Phase 5: server/src/testing/harness.ts must export createTestHarness).',
    );
    this.name = 'HarnessNotBuiltError';
  }
}

/**
 * Loads the Phase 5 harness if it exists, or a fallback around `createApp()`.
 *
 * @param options - AI options for example 18; ignored by the fallback.
 * @returns A harness. Check `built` to know which one you got.
 */
export async function loadHarness(options?: { ai?: HarnessAiOptions }): Promise<TestHarness> {
  if (existsSync(HARNESS_FILE)) {
    const mod = (await import(pathToFileURL(HARNESS_FILE).href)) as {
      createTestHarness?: CreateTestHarness;
    };
    if (typeof mod.createTestHarness !== 'function') {
      throw new Error(`${HARNESS_FILE} exists but doesn't export createTestHarness`);
    }
    return { ...mod.createTestHarness(options), built: true };
  }
  return {
    app: createApp(),
    built: false,
    setState: () => {
      throw new HarnessNotBuiltError('Setting setup.state');
    },
    getState: () => {
      throw new HarnessNotBuiltError('Checking state');
    },
  };
}

/** An AI stub plus a record of how it was called. */
export interface AiStub {
  options: HarnessAiOptions;
  /** Number of calls so far. */
  calls: number;
  /** The last text it received. */
  lastInput?: string;
}

/** Timeout the examples use, so the slow stub doesn't make the test wait 5 seconds. */
export const EXAMPLE_AI_TIMEOUT_MS = 50;

/**
 * Builds the AI stub an example's `setup.ai` asks for.
 *
 * - `answer` resolves with `reply`;
 * - `error` rejects;
 * - `slow` never settles (the service's timeout must handle it).
 *
 * @param setup - The scenario's `setup.ai`.
 * @returns The stub, which records its calls.
 */
export function makeAiStub(setup: ExampleAiSetup): AiStub {
  const stub: AiStub = {
    calls: 0,
    options: {
      enabled: setup.enabled,
      timeoutMs: EXAMPLE_AI_TIMEOUT_MS,
      fallback: (text) => {
        stub.calls += 1;
        stub.lastInput = text;
        if (setup.stub === 'answer') return Promise.resolve(setup.reply ?? '');
        if (setup.stub === 'error') return Promise.reject(new Error('stubbed AI failure'));
        return new Promise<string>(() => {});
      },
    },
  };
  return stub;
}
