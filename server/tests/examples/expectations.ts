/**
 * @module tests/examples/expectations
 *
 * Pure helpers that turn an example turn's `expect` object into a list of problems. They don't
 * call Vitest, so they can be unit-tested on their own (see `runner.test.ts`). The keys and their
 * meaning are defined in `docs/rooms/changing-sea/examples/README.md`.
 */
import { isDeepStrictEqual } from 'node:util';
import type { ExampleExpect } from './loadExamples.js';

/** Every key an `expect` object may use. Anything else is reported as a typo. */
export const EXPECT_KEYS = [
  'status',
  'error',
  'stateUnchanged',
  'statusField',
  'turn',
  'reply',
  'facts',
  'factIds',
  'choices',
  'suggestionsNonEmpty',
  'suggestionsCount',
  'input',
  'quiz',
  'ending',
  'effects',
  'list',
  'progress',
  'state',
  'sameAsPreviousResponse',
  'sameAsResponseOfTurn',
  'aiCalls',
  'aiLastInput',
] as const;

/** Every key `expect.reply` may use. */
export const REPLY_KEYS = [
  'kind',
  'speaker',
  'factKind',
  'label',
  'textIncludes',
  'textExcludes',
  'textNotMatching',
] as const;

/** Everything the runner observed for one turn, passed to {@link checkExpect}. */
export interface Observed {
  status: number;
  body: unknown;
  /** Session state before the request (only read when `stateUnchanged` is expected). */
  stateBefore?: unknown;
  /** Session state after the request (only read when `state` or `stateUnchanged` is expected). */
  stateAfter?: unknown;
  /** Response bodies of earlier turns in this scenario, in order. */
  earlierBodies: unknown[];
  /** AI stub calls so far in this scenario. */
  aiCalls?: number;
  /** The last text the AI stub received. */
  aiLastInput?: string;
}

/** Object check that also tells TypeScript the value is a plain record. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Short JSON for failure messages. */
function show(value: unknown): string {
  const text = JSON.stringify(value);
  return text === undefined ? 'undefined' : text.length > 300 ? `${text.slice(0, 300)}…` : text;
}

/**
 * Replaces `{ "$repeat": "a", "times": n }` anywhere in a value with the repeated string.
 *
 * @param value - A request body from an example.
 * @returns A copy with every placeholder expanded.
 */
export function expandRepeats(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(expandRepeats);
  if (!isRecord(value)) return value;
  const keys = Object.keys(value);
  if (keys.length === 2 && typeof value.$repeat === 'string' && typeof value.times === 'number') {
    return value.$repeat.repeat(value.times);
  }
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, expandRepeats(v)]));
}

/**
 * Puts the session id into a route path.
 *
 * @param routePath - A path that may contain `:id`.
 * @param sessionId - The scenario's session id, if there is one yet.
 * @returns The path with `:id` replaced.
 * @throws Error if the path needs an id and there is none.
 */
export function withSessionId(routePath: string, sessionId: string | undefined): string {
  if (!routePath.includes(':id')) return routePath;
  if (sessionId === undefined) {
    throw new Error(`${routePath} needs a session id, but no session has been created`);
  }
  return routePath.replace(':id', sessionId);
}

/**
 * Compares a value with a partial expectation: objects are compared key by key (only the
 * expected keys), arrays and other values must be exactly equal.
 *
 * @param actual - The observed value.
 * @param expected - The expected (partial) value.
 * @param at - Path used in messages, e.g. `state.changingSea`.
 * @returns One message per difference; empty when they match.
 */
export function partialDiff(actual: unknown, expected: unknown, at = ''): string[] {
  if (isRecord(expected)) {
    if (!isRecord(actual)) return [`${at || '(root)'}: expected an object, got ${show(actual)}`];
    return Object.entries(expected).flatMap(([key, value]) =>
      partialDiff(actual[key], value, at ? `${at}.${key}` : key),
    );
  }
  return isDeepStrictEqual(actual, expected)
    ? []
    : [`${at || '(root)'}: expected ${show(expected)}, got ${show(actual)}`];
}

/**
 * Lists keys in an `expect` object (or its `reply`) that the runner doesn't know, so a typo in an
 * example can't silently skip a check.
 *
 * @param expect - One turn's expectation.
 * @returns The unknown keys, as `key` or `reply.key`.
 */
export function unknownExpectKeys(expect: Record<string, unknown>): string[] {
  const top = Object.keys(expect).filter((k) => !(EXPECT_KEYS as readonly string[]).includes(k));
  const reply = isRecord(expect.reply)
    ? Object.keys(expect.reply)
        .filter((k) => !(REPLY_KEYS as readonly string[]).includes(k))
        .map((k) => `reply.${k}`)
    : [];
  return [...top, ...reply];
}

/**
 * Says whether checking this expectation needs the session state.
 *
 * @param expect - One turn's expectation.
 * @returns `true` if `state` or `stateUnchanged` is expected.
 */
export function needsState(expect: ExampleExpect): boolean {
  return expect.state !== undefined || expect.stateUnchanged === true;
}

/**
 * Checks one turn's response against its expectation.
 *
 * A wrong HTTP status is reported on its own (with the response body), because the other checks
 * mean nothing then.
 *
 * @param expect - The turn's `expect` object.
 * @param seen - What the runner observed.
 * @returns One message per problem; empty when the turn passes.
 */
export function checkExpect(expect: ExampleExpect, seen: Observed): string[] {
  const problems = unknownExpectKeys(expect).map((k) => `unknown expect key "${k}"`);
  if (seen.status !== expect.status) {
    return [
      ...problems,
      `status: expected ${expect.status}, got ${seen.status} with body ${show(seen.body)}`,
    ];
  }

  const body = isRecord(seen.body) ? seen.body : {};
  const equal = (name: string, actual: unknown, wanted: unknown): void => {
    if (!isDeepStrictEqual(actual, wanted)) {
      problems.push(`${name}: expected ${show(wanted)}, got ${show(actual)}`);
    }
  };

  if (isRecord(expect.error)) {
    const error = isRecord(body.error) ? body.error : {};
    equal('error.code', error.code, expect.error.code);
  }
  if (expect.stateUnchanged === true) {
    if (!isDeepStrictEqual(seen.stateBefore, seen.stateAfter)) {
      problems.push(
        `stateUnchanged: state changed from ${show(seen.stateBefore)} to ${show(seen.stateAfter)}`,
      );
    }
  }
  if ('statusField' in expect) equal('status (body)', body.status, expect.statusField);
  if ('turn' in expect) equal('turn', body.turn, expect.turn);

  if (isRecord(expect.reply)) {
    const reply = isRecord(body.reply) ? body.reply : {};
    const text = typeof reply.text === 'string' ? reply.text : '';
    for (const key of ['kind', 'speaker', 'factKind', 'label'] as const) {
      if (key in expect.reply) equal(`reply.${key}`, reply[key], expect.reply[key]);
    }
    for (const part of (expect.reply.textIncludes as string[] | undefined) ?? []) {
      if (!text.includes(part))
        problems.push(`reply.text should include ${show(part)}: ${show(text)}`);
    }
    for (const part of (expect.reply.textExcludes as string[] | undefined) ?? []) {
      if (text.toLowerCase().includes(part.toLowerCase())) {
        problems.push(`reply.text must not include ${show(part)}: ${show(text)}`);
      }
    }
    if (typeof expect.reply.textNotMatching === 'string') {
      if (new RegExp(expect.reply.textNotMatching).test(text)) {
        problems.push(`reply.text must not match /${expect.reply.textNotMatching}/: ${show(text)}`);
      }
    }
  }

  for (const key of ['facts', 'input', 'quiz', 'ending', 'effects', 'list'] as const) {
    if (key in expect) equal(key, body[key], expect[key]);
  }
  if ('factIds' in expect) {
    const facts = Array.isArray(body.facts) ? body.facts : [];
    equal(
      'factIds',
      facts.map((f) => (isRecord(f) ? f.eventId : f)),
      expect.factIds,
    );
  }
  if ('choices' in expect) {
    const choices = Array.isArray(body.choices) ? body.choices : [];
    equal(
      'choices',
      choices.map((c) => (isRecord(c) ? c.id : c)),
      expect.choices,
    );
  }
  const suggestions = Array.isArray(body.suggestions) ? body.suggestions : undefined;
  if (expect.suggestionsNonEmpty === true && !(suggestions && suggestions.length > 0)) {
    problems.push(`suggestions: expected at least one, got ${show(body.suggestions)}`);
  }
  if ('suggestionsCount' in expect) {
    equal('suggestions.length', suggestions?.length, expect.suggestionsCount);
  }
  if (isRecord(expect.progress)) {
    const progress = isRecord(body.progress) ? body.progress : {};
    for (const [key, wanted] of Object.entries(expect.progress)) {
      equal(`progress.${key}`, progress[key], wanted);
    }
  }
  if (expect.state !== undefined) {
    problems.push(...partialDiff(seen.stateAfter, expect.state, 'state'));
  }
  if (expect.sameAsPreviousResponse === true) {
    equal('body (same as previous response)', seen.body, seen.earlierBodies.at(-1));
  }
  if (typeof expect.sameAsResponseOfTurn === 'number') {
    const n = expect.sameAsResponseOfTurn;
    equal(`body (same as turn ${n})`, seen.body, seen.earlierBodies[n - 1]);
  }
  if ('aiCalls' in expect) equal('aiCalls', seen.aiCalls ?? 0, expect.aiCalls);
  if ('aiLastInput' in expect) equal('aiLastInput', seen.aiLastInput, expect.aiLastInput);

  return problems;
}
