/**
 * Self-tests for the example runner. These pass now, so when `npm run test:examples` fails it is
 * because the behaviour is missing, not because the runner is broken.
 */
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { loadExamples, parseExample } from './loadExamples.js';
import {
  checkExpect,
  expandRepeats,
  partialDiff,
  unknownExpectKeys,
  withSessionId,
} from './expectations.js';
import { HARNESS_FILE, HarnessNotBuiltError, loadHarness, makeAiStub } from './harness.js';
import { enabledExamples } from './enabled.js';

const examples = loadExamples();

describe('example files', () => {
  it('loads all 18 examples with 27 scenarios', () => {
    expect(examples).toHaveLength(18);
    expect(examples.reduce((n, e) => n + e.scenarios.length, 0)).toBe(27);
  });

  it('uses only expect keys the runner knows', () => {
    const typos = examples.flatMap((e) =>
      e.scenarios.flatMap((s) =>
        s.turns.flatMap((t, i) =>
          unknownExpectKeys(t.expect).map((k) => `${e.id} / ${s.name} / turn ${i + 1}: ${k}`),
        ),
      ),
    );
    expect(typos).toEqual([]);
  });

  it('only enables ids that exist', () => {
    const ids = examples.map((e) => e.id);
    expect(enabledExamples.filter((id) => !ids.includes(id))).toEqual([]);
  });

  it('rejects a file without a JSON block, naming the file', () => {
    expect(() => parseExample('99-broken.md', '# nothing here')).toThrow(/99-broken\.md/);
  });

  it('rejects an id that does not match the file name', () => {
    const md = '```json\n{"id":"other","scenarios":[]}\n```';
    expect(() => parseExample('99-broken.md', md)).toThrow(/does not match/);
  });
});

describe('request helpers', () => {
  it('expands $repeat placeholders anywhere in a body', () => {
    expect(expandRepeats({ type: 'text', text: { $repeat: 'a', times: 3 } })).toEqual({
      type: 'text',
      text: 'aaa',
    });
  });

  it('puts the session id into :id paths and refuses when there is none', () => {
    expect(withSessionId('/api/sessions/:id/turns', 'abc')).toBe('/api/sessions/abc/turns');
    expect(withSessionId('/api/sessions', undefined)).toBe('/api/sessions');
    expect(() => withSessionId('/api/sessions/:id', undefined)).toThrow(/needs a session id/);
  });
});

describe('partialDiff', () => {
  it('checks only the expected keys of objects', () => {
    expect(partialDiff({ a: 1, b: { c: 2, d: 3 } }, { b: { c: 2 } })).toEqual([]);
  });

  it('compares arrays exactly', () => {
    expect(partialDiff({ told: ['A', 'B'] }, { told: ['A'] })).toHaveLength(1);
  });

  it('names the path of a difference', () => {
    expect(partialDiff({ x: { y: 1 } }, { x: { y: 2 } }, 'state')[0]).toMatch(/^state\.x\.y:/);
  });
});

describe('checkExpect', () => {
  const body = {
    status: 'active',
    turn: 1,
    reply: { kind: 'list', text: 'I hold 13 storms in my records; and 5 more.', label: null },
    facts: [],
    choices: [
      { id: 'hear.cl-2020-058', label: 'x' },
      { id: 'leave', label: 'Leave' },
    ],
    suggestions: ['a', 'b', 'c'],
    progress: { favourBand: 'neutral', tokens: 0 },
    list: { total: 13, items: [] },
  };
  const seen = { status: 200, body, earlierBodies: [] };

  it('passes a matching turn', () => {
    expect(
      checkExpect(
        {
          status: 200,
          statusField: 'active',
          reply: {
            kind: 'list',
            label: null,
            textIncludes: ['in my records', '13', 'and 5 more'],
            textExcludes: ["I DON'T KNOW"],
          },
          choices: ['hear.cl-2020-058', 'leave'],
          suggestionsCount: 3,
          progress: { favourBand: 'neutral' },
          list: { total: 13, items: [] },
        },
        seen,
      ),
    ).toEqual([]);
  });

  it('reports a wrong status with the body, and nothing else', () => {
    const problems = checkExpect(
      { status: 201, reply: { kind: 'intro' } },
      { status: 404, body: { error: { code: 'NOT_FOUND' } }, earlierBodies: [] },
    );
    expect(problems).toEqual([expect.stringMatching(/expected 201, got 404 .*NOT_FOUND/)]);
  });

  it('checks textExcludes case-insensitively and textNotMatching as a regex', () => {
    const problems = checkExpect(
      { status: 200, reply: { textExcludes: ['IN MY RECORDS'], textNotMatching: 'and \\d+ more' } },
      seen,
    );
    expect(problems).toHaveLength(2);
  });

  it('checks stateUnchanged, state, AI calls and earlier responses', () => {
    const problems = checkExpect(
      {
        status: 200,
        stateUnchanged: true,
        state: { favour: 0 },
        aiCalls: 0,
        sameAsResponseOfTurn: 1,
      },
      {
        ...seen,
        stateBefore: { favour: 0 },
        stateAfter: { favour: 1 },
        aiCalls: 1,
        earlierBodies: [{ other: true }],
      },
    );
    expect(problems).toHaveLength(4);
  });

  it('reports unknown keys so typos cannot skip checks', () => {
    expect(checkExpect({ status: 200, replyy: {} }, seen)).toEqual(['unknown expect key "replyy"']);
  });
});

describe('harness', () => {
  it.skipIf(existsSync(HARNESS_FILE))(
    'falls back to createApp and explains that the Phase 5 harness is missing',
    async () => {
      const harness = await loadHarness();
      expect(harness.built).toBe(false);
      expect(() => harness.getState('x')).toThrow(HarnessNotBuiltError);
      expect(() => harness.setState('x', {})).toThrow(/Phase 5: server\/src\/testing\/harness\.ts/);
    },
  );

  it('builds AI stubs that answer, fail or hang, and records calls', async () => {
    const answer = makeAiStub({ enabled: true, stub: 'answer', reply: 'hi' });
    await expect(answer.options.fallback('question')).resolves.toBe('hi');
    expect(answer.calls).toBe(1);
    expect(answer.lastInput).toBe('question');

    const error = makeAiStub({ enabled: true, stub: 'error' });
    await expect(error.options.fallback('q')).rejects.toThrow('stubbed AI failure');

    const slow = makeAiStub({ enabled: true, stub: 'slow' });
    const raced = await Promise.race([
      slow.options.fallback('q').then(() => 'settled'),
      new Promise((resolve) => setTimeout(() => resolve('still waiting'), 20)),
    ]);
    expect(raced).toBe('still waiting');
    expect(slow.options.timeoutMs).toBe(50);
  });
});
