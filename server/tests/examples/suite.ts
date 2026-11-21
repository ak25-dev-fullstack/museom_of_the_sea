/**
 * @module tests/examples/suite
 *
 * Turns the example conversations into Vitest tests: one `describe` per example file and one `it`
 * per scenario, each run end to end through the Express app with Supertest.
 *
 * - `examples.test.ts` (part of `npm test`) runs only the ids in `enabled.ts`.
 * - `all.examples.ts` (`npm run test:examples`) runs every example. Until the API exists (Phase 5)
 *   every scenario fails at `POST /api/sessions`.
 */
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { loadExamples, type Example, type ExampleScenario } from './loadExamples.js';
import { checkExpect, expandRepeats, needsState, withSessionId } from './expectations.js';
import { loadHarness, makeAiStub } from './harness.js';

/**
 * Runs one scenario and fails with a labelled message at the first turn that doesn't match.
 *
 * @param example - The example the scenario belongs to.
 * @param scenario - The scenario to run.
 */
export async function runScenario(example: Example, scenario: ExampleScenario): Promise<void> {
  const { setup } = scenario;
  const ai = setup.ai ? makeAiStub(setup.ai) : undefined;
  const harness = await loadHarness(ai ? { ai: ai.options } : undefined);
  const agent = request(harness.app);
  const label = `${example.id} / ${scenario.name}`;

  let sessionId: string | undefined;
  if (setup.start !== false) {
    const res = await agent.post('/api/sessions').send({ room: 'changing-sea', seed: setup.seed });
    expect(
      res.status,
      `${label} / setup: POST /api/sessions should start a visit; got ${res.status} ` +
        JSON.stringify(res.body),
    ).toBe(201);
    sessionId = (res.body as { sessionId?: string }).sessionId;
  }
  if (setup.state && Object.keys(setup.state).length > 0) {
    harness.setState(withSessionId(':id', sessionId), setup.state);
  }

  const earlierBodies: unknown[] = [];
  for (const [index, turn] of scenario.turns.entries()) {
    const where = `${label} / turn ${index + 1} (${turn.say})`;
    const read = (): unknown => harness.getState(withSessionId(':id', sessionId));
    const stateBefore = turn.expect.stateUnchanged === true ? read() : undefined;

    const { method, path, body, rawBody, contentType } = turn.request;
    const url = withSessionId(path, sessionId);
    let req = method === 'GET' ? agent.get(url) : agent.post(url);
    if (rawBody !== undefined) {
      req = req.set('Content-Type', contentType ?? 'application/json').send(rawBody);
    } else if (body !== undefined) {
      req = req.send(expandRepeats(body) as object);
    }
    const res = await req;

    const responseId = (res.body as { sessionId?: unknown } | undefined)?.sessionId;
    if (sessionId === undefined && typeof responseId === 'string') sessionId = responseId;

    // A wrong status is reported on its own, so only read the state when the status matched.
    const statusMatched = res.status === turn.expect.status;
    const problems = checkExpect(turn.expect, {
      status: res.status,
      body: res.body,
      stateBefore,
      stateAfter: statusMatched && needsState(turn.expect) ? read() : undefined,
      earlierBodies,
      aiCalls: ai?.calls,
      aiLastInput: ai?.lastInput,
    });
    earlierBodies.push(res.body);
    expect(problems, where).toEqual([]);
  }
}

/**
 * Registers the example tests.
 *
 * @param ids - Example ids to include (e.g. `03-question-year-and-category`). Omit for all.
 * @throws Error if an id doesn't match any example file.
 */
export function defineExampleSuite(ids?: readonly string[]): void {
  const all = loadExamples();
  const unknown = (ids ?? []).filter((id) => !all.some((e) => e.id === id));
  if (unknown.length > 0) throw new Error(`Unknown example ids: ${unknown.join(', ')}`);

  const chosen = ids ? all.filter((e) => ids.includes(e.id)) : all;
  for (const example of chosen) {
    describe(`${example.id}: ${example.title}`, () => {
      for (const scenario of example.scenarios) {
        it(scenario.name, () => runScenario(example, scenario));
      }
    });
  }
}
