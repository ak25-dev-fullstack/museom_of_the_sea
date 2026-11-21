# Example conversations

Eighteen worked conversations (27 scenarios) for the changing sea room. They follow
[`../CONVERSATION_SPEC.md`](../CONVERSATION_SPEC.md) exactly, and each scenario is a test in
`server/tests/examples/`.

## Running them

| Command                 | Runs                                                                                    | Expected now                  |
| ----------------------- | --------------------------------------------------------------------------------------- | ----------------------------- |
| `npm run test:examples` | **All** examples, end to end through the API                                            | Red until Phase 5             |
| `npm test` (and CI)     | Only the ids listed in `server/tests/examples/enabled.ts`, plus the runner's self-tests | Green (the list starts empty) |

Each engine or API slice adds the example ids it makes pass to `enabled.ts`, in its own pull
request, so CI stays green and a passing example can't quietly break later.

**Who owns what:** the Phase 4 engine slices test the engine **directly**, with plain state
objects, and don't need this runner. The runner tests end to end **through the API**, from
Phase 5. Its test harness, `server/src/testing/harness.ts`, is therefore a **Phase 5
deliverable**. Until it exists, the runner uses the plain `createApp()`, and any step that needs
session state fails with "test harness not built yet". Today every scenario fails earlier, at
`POST /api/sessions` → 404.

Each file has a plain-English list of turns, then a **machine-readable** JSON block that the
Phase 2 runner reads. Fact objects in the JSON were copied from `research/events.csv` by a
script, not typed by hand, so they are word for word. The script is in [`tools/`](tools/):
change an example there and regenerate, rather than editing the `.md` files by hand.

| File                               | What it covers                                                       |
| ---------------------------------- | -------------------------------------------------------------------- |
| `01-start-visit.md`                | Starting a visit, the intro view, `GET` to resume                    |
| `02-exhibit-walkthrough.md`        | Exhibit entries, the cause rule both ways, the 2026 caveat, a 409    |
| `03-question-year-and-category.md` | A typed question with year and category filters, scoring, +1         |
| `04-what-are-humans-doing.md`      | The "humans doing" mapping to Policy, Energy and Courts              |
| `05-repeated-questions.md`         | Repeats: the next untold event, then `alreadyTold`                   |
| `06-no-match.md`                   | `noMatch` in character: out-of-range year, empty result, empty list  |
| `07-off-topic.md`                  | Off-topic −1, and off-topic starting the flood                       |
| `08-rude-to-flood.md`              | Rude −3, then the flood                                              |
| `09-flood-and-repentance.md`       | Input while flooded, `leave` → 409, repent → −2, re-flood on purpose |
| `10-quiz.md`                       | Quiz pass with a flood mid-quiz (pause and resume); fail and retry   |
| `11-leave-and-endings.md`          | All three endings, `VISIT_ENDED`, `GET` after the end                |
| `12-validation-edge-cases.md`      | 400 / 404 / 409 / 413, the 300-character limit, `clarify`            |
| `13-meta-and-no-need.md`           | Greetings and help (`meta`), `noNeed` apologies                      |
| `14-count-and-list.md`             | List questions, "and N more", `hear.*` choices                       |
| `15-exhibit-context.md`            | The same question at the hub and inside an exhibit                   |
| `16-list-one-match.md`             | A list with exactly one match: still a `list`, one `hear` choice     |
| `17-list-during-quiz.md`           | A list mid-quiz: `hear` first, then the question's options           |
| `18-ai-fallback.md`                | The AI fallback with a stub: answer, error, timeout, not needed      |

All examples except 18 run with `AI_ENABLED` **off** (the default, spec §17).

## How the runner reads a file

```jsonc
{
  "id": "…",
  "scenarios": [
    {
      "name": "…",
      "setup": { "seed": 42, "state": {/* partial VisitState */} },
      "turns": [{ "say": "plain English", "request": {/* … */}, "expect": {/* … */} }],
    },
  ],
}
```

### `setup`

- `{ "seed": 42, "state": {} }`: create a session with `POST /api/sessions`
  `{ "room": "changing-sea", "seed": 42 }`, then use it.
- `state` is merged **over the start state**, which is `currentNodeId: "cs.intro"`, `favour: 0`,
  `flags.flooded: false`, `knowledge: []`, `visited: ["cs.intro"]`, `turn: 0`, and
  `changingSea: { status: "active", told: [], review: [], quiz: null, endingId: null }`. Objects
  merge key by key; arrays and values are replaced. A test helper on the session store sets this
  state directly (the only place tests reach past the API), and the view is rebuilt from it.
- `"start": false`: no session is created first (example 01 creates it as its first turn).
- `"ai": { "enabled": true, "stub": "answer" | "error" | "slow", "reply": "…" }` (example 18):
  the runner builds an AI stub and passes it to the harness, instead of a real AI service.
  - `answer` resolves with `reply`, `error` rejects, and `slow` never settles.
  - The stub records how many times it was called and the last text it got, for the `aiCalls`
    and `aiLastInput` checks.
  - The runner passes `timeoutMs: 50` **only** so the slow case finishes quickly. The real
    service's default timeout is 5000 ms, and the AI-fallback slice must unit-test that default.

### The harness contract (Phase 5)

`server/src/testing/harness.ts` must export:

```ts
createTestHarness(options?: {
  ai?: { enabled: boolean; fallback: (text: string) => Promise<string>; timeoutMs?: number };
}): {
  app: Express; // the app, with the session routes, wired to its own session store
  setState(sessionId: string, partial: Record<string, unknown>): void; // merge over the start state
  getState(sessionId: string): unknown; // the full VisitState
};
```

Each call gives a fresh app and store, so scenarios don't share sessions. The types and the
fallback live in `server/tests/examples/harness.ts`.

### `request`

- `method`, `path` (`:id` is the scenario's session id), and `body` (sent as JSON), or `rawBody`
  with `contentType` to send malformed JSON.
- `{ "$repeat": "a", "times": 301 }` anywhere in a body means that string repeated.

### `expect`

Only the keys that are listed are checked:

| Key                                                            | Check                                                                                                    |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `status`                                                       | HTTP status code                                                                                         |
| `error.code`                                                   | `body.error.code` for a 4xx                                                                              |
| `stateUnchanged`                                               | The session's state, including `turn`, is deep-equal to before the request                               |
| `statusField`                                                  | `body.status` (`active`, `flooded`, `ended`)                                                             |
| `turn`                                                         | `body.turn`                                                                                              |
| `reply.kind`, `reply.speaker`, `reply.factKind`, `reply.label` | equal                                                                                                    |
| `reply.textNotMatching`                                        | the regular expression does **not** match `reply.text`                                                   |
| `reply.textIncludes`                                           | each string appears in `reply.text` exactly (case-sensitive)                                             |
| `reply.textExcludes`                                           | each string does **not** appear in `reply.text` (case-insensitive): the cause phrases                    |
| `facts`                                                        | deep-equal, in order                                                                                     |
| `factIds`                                                      | `facts.map(f => f.eventId)` equal, in order (used for long ending lists)                                 |
| `choices`                                                      | `choices.map(c => c.id)` equal, in order (labels are content and not checked)                            |
| `suggestionsNonEmpty`                                          | `suggestions.length > 0`                                                                                 |
| `suggestionsCount`                                             | `suggestions.length` equal                                                                               |
| `input`, `quiz`, `ending`, `effects`, `list`                   | deep-equal                                                                                               |
| `progress`                                                     | each listed key deep-equal (`exhibits` in full when listed)                                              |
| `state`                                                        | the session's state after the turn: listed keys only, nested objects compared key by key, arrays exactly |
| `sameAsPreviousResponse` / `sameAsResponseOfTurn`              | the body deep-equals that earlier response                                                               |
| `aiCalls`                                                      | total AI stub calls so far in the scenario (0 if no stub)                                                |
| `aiLastInput`                                                  | the exact text the AI stub last received (only the visitor's text is sent)                               |

An unknown key in `expect` or `expect.reply` is reported as a failure, so a typo can't silently
skip a check. `runner.test.ts` also checks every example file for unknown keys on each `npm test`.

The guide's wording is never checked word for word, only what it must and must not contain. So
content writers can change the guide's voice without breaking tests. The speaker id is
`poseidon` here because that is the current guide in content; if the figure changes, change
`speaker` in these files.
