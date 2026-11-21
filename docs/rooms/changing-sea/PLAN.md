# The changing sea: backend plan

How the backend for the changing sea room gets built with Claude Code, in phases, each with a
check that must pass before moving on.

**Scope:** a fully working, tested backend for this room, with designed conversation logic.
No logins or accounts: visits are anonymous, in-memory sessions (as the root `CLAUDE.md`
decides). The optional AI extra is out of scope until everything else is done.

**Deadline:** 15 December 2026, 12:00. This room's backend should be done by 4 December, so
the team has 5–8 December to fit the other rooms in before the feature freeze.

## Phases

| Phase                        | Dates          | Output                                                          | Gate before moving on                                      |
| ---------------------------- | -------------- | --------------------------------------------------------------- | ---------------------------------------------------------- |
| 0. Set up                    | 18–19 Nov      | Claude Code settings and hooks, room docs, research in the repo | Claude Code runs `npm test` green on your machine          |
| 1. Design the conversations  | 19–21 Nov      | `CONVERSATION_SPEC.md`, example conversations, decision log     | You have read and signed off the spec                      |
| 2. Set up verification       | 22 Nov         | Example-conversation test runner, feature map, terminal chat    | All examples exist as tests and fail under `test:examples` |
| 3. Data pipeline             | 23–24 Nov      | Import script, schemas, generated room data                     | Content checks pass; 10 events spot-checked by hand        |
| 4. Engine, one slice at once | 25–29 Nov      | Five small pull requests (see below)                            | Each slice's example conversations pass                    |
| 5. Express API               | 30 Nov – 1 Dec | Routes, services, in-memory sessions, validation, API docs      | A scripted chat over HTTP matches the examples             |
| 6. Harden and review         | 2–3 Dec        | Robustness and security fixes                                   | All checks green; JSDoc complete                           |
| 7. Hand over                 | 4 Dec          | README, report material, walkthrough                            | You can explain every folder                               |

Engine slices for Phase 4, one pull request each:

1. Room intro and moving through the dialogue with choices
2. Free-text climate questions, answered with sources
3. Mood: off-topic and rude input, the flood, repentance
4. Exhibit progress, quiz and tokens
5. Seeded replies, so a saved visit can be replayed exactly

Each slice: fresh session → plan mode → failing example test first → implement → run the
checks → review in a fresh subagent → clean up → pull request.

## Phase 0 checklist

- [x] `.claude/settings.json`: pre-approved test/lint/typecheck commands, `.env` reads denied
- [x] Hooks: format and lint every edited file; block edits to generated files and `.env`
- [x] ESLint rule that keeps `server/src/engine/` pure
- [x] Root `CLAUDE.md`: final four rooms, Claude Code setup, AI use log
- [x] Room `CLAUDE.md` with the data accuracy rules
- [x] Research workbook in `research/`
- [x] `docs/AI_USE_LOG.md`
- [ ] Private copies of the brief and rubric in `docs/_private/` (not committed)
- [ ] On your machine: `npm install`, open Claude Code in the repo, confirm it runs `npm test`
      without asking and that the hooks fire after an edit

## Phase 1 checklist

- [x] Design interview: every row of "To settle in Phase 1" decided (see `DECISIONS.md`, D1–D21)
- [x] `CONVERSATION_SPEC.md`: turns, state, input kinds, matching, exhibits, mood, quiz, endings, API
- [x] `examples/`: 15 example conversations with machine-readable expectations
- [x] `DECISIONS.md`: one entry per decision, for the report
- [ ] **Gate:** spec read and signed off (you)

## Phase 2 checklist

- [x] Example runner in `server/tests/examples/`: reads every `examples/*.md` JSON block, runs each
      scenario through the Express app with Supertest, and checks every `expect` key
- [x] Runner self-tests (`runner.test.ts`) pass, so failures mean missing behaviour, not a broken runner
- [x] `npm test` and CI run only the ids in `server/tests/examples/enabled.ts` (starts empty);
      `npm run test:examples` runs all of them
- [x] Examples 16 (one-match list), 17 (list during a quiz), 18 (AI fallback with a stub);
      facts copied from `events.csv` by script
- [x] `FEATURE_MAP.md`: each spec feature and the examples that cover it, with gaps
- [x] `npm run chat`: a small terminal chat against a running server
- [x] **Gate:** all examples exist as tests and fail under `test:examples` (27 of 27 fail at
      `POST /api/sessions` → 404, 22 Nov 2026), while `npm test`, lint, typecheck and
      format:check are green

**Who owns the test harness.** The Phase 4 engine slices test the engine directly with plain state
objects. The example runner runs end to end through the API from Phase 5, so
`server/src/testing/harness.ts` (`createTestHarness`, see `examples/README.md`) is a **Phase 5
deliverable**. Until then the runner falls back to `createApp()` and a clear "harness not built
yet" error.

**Note for the AI-fallback slice:** include a unit test that the service's **default** timeout is
**5000 ms** (spec §17). Example 18 passes `timeoutMs: 50` only to keep its slow-stub case fast.

## Design proposal to take into Phase 1

From the backend plan (18 Nov 2026). Phase 1 turns this into the spec.

**One visitor turn:**

1. The visitor clicks a choice or types a question. Both reach the same endpoint.
2. Classify the input in a fixed order: rude → repent → quiz answer → choice → climate
   question → off-topic.
3. Pull filters from the text: years (2020–2026), categories (via a synonym list), places and
   event names. "What are humans doing?" maps to the policy, energy and law categories.
4. Pick an event: exact name match first, then sea-related events, then events with a
   source-stated climate link, then the most recent. Skip events already told in this visit.
5. Fill a Poseidon line template with the facts, word for word.
6. Update mood: off-topic or rude input raises irritation. Above a limit the engine returns a
   `flood` effect, and only repenting clears it.
7. Save the turn and return the reply, choices, sources and screen effects.

**Suggested exhibits:** Warming waters, Ice and the poles, Storms and floods, Rising seas, and
What mortals have done (COP summits, treaties, renewables). About three curated entries each,
one quiz question per entry, a token for each one passed. The other events answer free-text
questions.

## To settle in Phase 1 (plan vs what the repo already decides)

| Topic          | Backend plan said                     | Repo already has                                | Suggested                                                              |
| -------------- | ------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------- |
| Storage        | SQLite with users and progress tables | In-memory sessions, decided                     | Follow the repo: in-memory, no accounts                                |
| Routes         | `/api/v1/conversations/...`           | `/api/sessions/...` with `choices`; `/ask` = AI | Extend `/api/sessions`; give free-text its own route that isn't `/ask` |
| Data location  | `data/topics/changing-sea/`           | `server/content/`                               | `server/content/changing-sea/`                                         |
| Dialogue shape | Lines per mood                        | Agreed node schema (text variants, conditions)  | Reuse the agreed schema; add what Q&A needs                            |
| Mood           | Irritation level 0–8+, flood, repent  | `favour` number with conditions                 | Decide if mood is `favour` or a new field                              |
| Progress       | Quiz per entry, tokens                | Galleries unlock, final trial, endings          | Decide how this room's quiz feeds the trial                            |
