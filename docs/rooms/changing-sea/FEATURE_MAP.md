# The changing sea: feature map

Each feature in [`CONVERSATION_SPEC.md`](CONVERSATION_SPEC.md) and the example conversations in
[`examples/`](examples/) that cover it. Use it to see gaps before a slice starts: a feature with
no example needs a unit test in its slice, or a new example.

Example numbers refer to `examples/NN-*.md`. "Unit" means the slice's own engine or service unit
tests should cover it instead.

## Covered by examples

| Spec  | Feature                                                                                                          | Examples         |
| ----- | ---------------------------------------------------------------------------------------------------------------- | ---------------- |
| §3    | One turn through `POST …/turns`; a `4xx` changes nothing                                                         | 02, 09, 12, 14   |
| §4    | Start state; `visited` and `told` with no duplicates                                                             | 01, 02, 10       |
| §5    | Classification order: rude before repent                                                                         | 09, 10           |
| §5    | Climate question before meta ("what can you tell me about storms?")                                              | 13               |
| §5    | `clarify` for input that is empty after normalising                                                              | 12               |
| §5    | `meta` (greetings, "who are you"), no favour change                                                              | 13               |
| §5    | `noNeed` apology when not flooded, at any favour level                                                           | 13               |
| §5    | Off-topic −1                                                                                                     | 07, 12           |
| §6.1  | Normalising (accents: "El Niño")                                                                                 | 06, 16           |
| §6.2  | Synonym phrases → categories; years                                                                              | 03, 05, 14       |
| §6.2  | "humans doing" → Policy, Energy, Courts                                                                          | 04               |
| §6.2  | Exact event name                                                                                                 | 15               |
| §6.3  | Sort order (Ocean link, Climate link, Year, ID); skip told events                                                | 03, 05, 13, 15   |
| §6.3  | Year outside 2020–2026 → `noMatch`                                                                               | 06, 18           |
| §6.4  | `answer` +1; `alreadyTold` with no favour change                                                                 | 03, 05           |
| §6.4  | `noMatch` in character: 2020, 2026, the five titles, 3 suggestions, never "don't know"                           | 06, 18           |
| §6.5  | List question: count, up to 8 names, "and N more"                                                                | 14               |
| §6.5  | Exactly 8 matches (no "more"); exactly 1 match (still a `list`)                                                  | 14, 16           |
| §6.5  | `hear.*` choices: +1 if new, `alreadyTold` if told; they disappear                                               | 14, 16           |
| §6.5  | List with no matches → `noMatch`                                                                                 | 06               |
| §6.5  | List during a quiz: `hear` first, quiz untouched, quiz carries on                                                | 17               |
| §6.6  | Exhibit context reorders answers and lists; exact name still wins                                                | 15               |
| §7.1  | Intro and hub choices; `leave` everywhere except the flood                                                       | 01, 09           |
| §7.1  | Exhibit entries, `next`; choosing an exhibit opens entry 1                                                       | 02, 10           |
| §7.2  | Curated entries with their facts                                                                                 | 02, 10           |
| §8    | Rude −3; flood at ≤ −5 (from rude and from off-topic)                                                            | 07, 08           |
| §8.1  | Favour bands: `neutral`, `warm`, `cold`, `stormy`                                                                | 05, 07, 08, 09   |
| §8.2  | While flooded: flood reply, no change, `leave` → 409                                                             | 09, 18           |
| §8.2  | Repent → −2, `calm`; typed or the `apologise` choice                                                             | 09, 10           |
| §8.2  | A rude message straight after repenting re-floods (−5)                                                           | 09               |
| §9    | `quiz.start` appears once all three entries are seen                                                             | 02               |
| §9    | Right and wrong answers; a wrong answer shows the fact                                                           | 10, 17           |
| §9    | Pass → token; fail → review, then re-reading allows a retry                                                      | 10               |
| §9    | Flood mid-quiz pauses the quiz; repent resumes the same question (D18)                                           | 10               |
| §10   | Endings by tokens (0, 2, 5); facts learned in order; `VISIT_ENDED`                                               | 11               |
| §10   | `GET` after the end shows the ending                                                                             | 11               |
| §11   | Facts word for word with sources                                                                                 | 02–05, 10, 13–17 |
| §11   | Cause rule both ways (with and without a Climate link)                                                           | 02, 03, 15       |
| §11   | 2026 caveat                                                                                                      | 02, 04           |
| §13.1 | `POST /api/sessions` → 201 and the intro; `GET` resumes                                                          | 01               |
| §13.2 | Validation: empty, 301 chars, missing `type`, extra field, bad `choiceId`, non-UUID id, validation before lookup | 12               |
| §13.4 | Errors: 400, 404 `SESSION_NOT_FOUND`, 409, 413, `INVALID_JSON`                                                   | 12               |
| §17   | AI fallback: only on `noMatch`, labelled, no facts or favour, only the text is sent                              | 18               |
| §17   | AI failure and timeout fall back to `noMatch`; never used while flooded or when matched                          | 18               |

## Gaps (no example yet)

| Spec  | Feature                                                                                                        | Suggested cover                 |
| ----- | -------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| §6.2  | **Known words** (places and names, e.g. "floods in Pakistan")                                                  | New example, or unit (slice 2)  |
| §6.3  | Exact name at the hub, and exact name of an already-told event (`alreadyTold`)                                 | Unit (slice 2)                  |
| §6.5  | A bare "how many?" is not a list question                                                                      | Unit (slice 2)                  |
| §5    | "sorry, you idiot" counts as rude                                                                              | Unit (slice 3)                  |
| §8    | Favour clamped to −10..+10                                                                                     | Unit (slice 3)                  |
| §9    | `quiz.stop` (answers lost, back to the hub)                                                                    | Unit (slice 4) or new example   |
| §9    | `leave` during a quiz ends the visit                                                                           | Unit (slice 4)                  |
| §9    | Typed (non-list) question during a quiz keeps the question's options                                           | Unit (slice 4)                  |
| §9    | No `quiz.start` once the token is held; quizzes of the other three exhibits                                    | Unit (slice 4)                  |
| §10   | Farewell wording varies by favour band (wording only)                                                          | Unit (slice 4)                  |
| §12.3 | Content checks (lexicon, suggestions pool, cause phrases, categories)                                          | Content tests (Phase 3)         |
| §12.4 | Seeded wording: same seed and inputs give identical responses                                                  | Unit and replay test (slice 5)  |
| §13.1 | `/choices` alias behaves like `turns` with `type: "choice"`                                                    | API test (Phase 5)              |
| §13.1 | `GET` on an unknown or non-UUID session id                                                                     | API test (Phase 5)              |
| §13.2 | `POST /api/sessions` validation (wrong `room`, bad `seed`, extra field)                                        | API test (Phase 5)              |
| §13.4 | `429 RATE_LIMITED` (the limiter is skipped when `NODE_ENV=test`)                                               | API test with the limiter on    |
| §13.5 | Session store limits (2 h idle, 1,000 sessions), not decided yet                                               | Decide, then API test (Phase 5) |
| §17   | AI default timeout is 5000 ms; text capped at 600 chars; its own rate limit; startup fails if on without a key | Unit (AI-fallback slice)        |
