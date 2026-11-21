/**
 * @module tests/examples/loadExamples
 *
 * Reads the changing sea example conversations from
 * `docs/rooms/changing-sea/examples/NN-name.md`. Each file holds one ```json block in the format
 * described in that folder's `README.md`. This module only reads and checks the shape of the
 * files; running them is done by `suite.ts`.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/** Absolute path of the folder that holds the example files. */
export const EXAMPLES_DIR = fileURLToPath(
  new URL('../../../docs/rooms/changing-sea/examples/', import.meta.url),
);

/** One HTTP request in an example turn. */
export interface ExampleRequest {
  method: 'GET' | 'POST';
  /** Route path; `:id` is replaced by the scenario's session id. */
  path: string;
  /** JSON body. May contain `{ "$repeat": "a", "times": 301 }` placeholders. */
  body?: unknown;
  /** Sent as-is instead of `body`, to test malformed JSON. */
  rawBody?: string;
  contentType?: string;
}

/** What a turn expects. Only the listed keys are checked (see examples/README.md). */
export type ExampleExpect = { status: number } & Record<string, unknown>;

/** One visitor turn: a request and what should come back. */
export interface ExampleTurn {
  /** Plain-English description, shown in failure messages. */
  say: string;
  request: ExampleRequest;
  expect: ExampleExpect;
}

/** How a scenario's AI stub behaves (example 18). */
export interface ExampleAiSetup {
  enabled: boolean;
  stub: 'answer' | 'error' | 'slow';
  /** The stub's answer when `stub` is `answer`. */
  reply?: string;
}

/** How a scenario starts. */
export interface ExampleSetup {
  seed: number;
  /** `false`: don't create a session first (the first turn does it). */
  start?: boolean;
  /** Partial visit state merged over the start state. */
  state?: Record<string, unknown>;
  ai?: ExampleAiSetup;
}

/** One scenario: a setup and a sequence of turns. Becomes one test. */
export interface ExampleScenario {
  name: string;
  setup: ExampleSetup;
  turns: ExampleTurn[];
}

/** One example file. */
export interface Example {
  id: string;
  title: string;
  covers: string;
  scenarios: ExampleScenario[];
}

const JSON_BLOCK = /```json\n([\s\S]*?)\n```/;
const EXAMPLE_FILE = /^\d{2}-[a-z0-9-]+\.md$/;

/** Object check that also tells TypeScript the value is a plain record. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Parses and checks one example file.
 *
 * @param fileName - The file's name, e.g. `03-question-year-and-category.md`. The example's `id`
 *   must equal it without `.md`.
 * @param markdown - The file's contents.
 * @returns The parsed example.
 * @throws Error naming the file and the problem, if the JSON block is missing or malformed.
 */
export function parseExample(fileName: string, markdown: string): Example {
  const fail = (problem: string): never => {
    throw new Error(`Bad example file ${fileName}: ${problem}`);
  };

  const block = JSON_BLOCK.exec(markdown)?.[1];
  if (block === undefined) return fail('no ```json block found');

  let data: unknown;
  try {
    data = JSON.parse(block);
  } catch (err) {
    return fail(`JSON does not parse (${(err as Error).message})`);
  }

  if (!isRecord(data)) return fail('the JSON block is not an object');
  if (data.id !== fileName.replace(/\.md$/, '')) {
    fail(`id "${String(data.id)}" does not match the file name`);
  }
  if (!Array.isArray(data.scenarios) || data.scenarios.length === 0) {
    fail('"scenarios" must be a non-empty array');
  }

  (data.scenarios as unknown[]).forEach((scenario, s) => {
    const where = `scenario ${s + 1}`;
    if (!isRecord(scenario) || typeof scenario.name !== 'string') fail(`${where} has no name`);
    const sc = scenario as Record<string, unknown>;
    if (!isRecord(sc.setup) || typeof sc.setup.seed !== 'number') {
      fail(`${where} needs setup.seed`);
    }
    if (!Array.isArray(sc.turns) || sc.turns.length === 0) fail(`${where} has no turns`);
    (sc.turns as unknown[]).forEach((turn, t) => {
      const at = `${where}, turn ${t + 1}`;
      if (!isRecord(turn) || !isRecord(turn.request) || !isRecord(turn.expect)) {
        return fail(`${at} needs request and expect`);
      }
      if (turn.request.method !== 'GET' && turn.request.method !== 'POST') {
        fail(`${at}: request.method must be GET or POST`);
      }
      if (typeof turn.request.path !== 'string') fail(`${at}: request.path is missing`);
      if (typeof turn.expect.status !== 'number') fail(`${at}: expect.status is missing`);
    });
  });

  return data as unknown as Example;
}

/**
 * Loads every example file in a folder, in file-name order.
 *
 * @param dir - Folder to read. Defaults to {@link EXAMPLES_DIR}.
 * @returns The parsed examples.
 */
export function loadExamples(dir: string = EXAMPLES_DIR): Example[] {
  return readdirSync(dir)
    .filter((name) => EXAMPLE_FILE.test(name))
    .sort()
    .map((name) => parseExample(name, readFileSync(path.join(dir, name), 'utf8')));
}
