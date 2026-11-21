# The changing sea: decision log

Decisions made in Phase 1 (design interview, 21 Nov 2026), so the report can cite them. Each
entry gives the decision, the options we considered, and why. Section numbers (§) point to
[`CONVERSATION_SPEC.md`](CONVERSATION_SPEC.md).

To change a decision: add a new entry that replaces the old one (say which), then update the spec
and the examples.

---

### D1. Storage: in-memory sessions, data in `server/content/changing-sea/`

- **Decision:** visits are anonymous in-memory sessions, with no accounts. Generated and
  hand-written room data live in `server/content/changing-sea/`.
- **Options:** SQLite with users and progress tables under `data/topics/changing-sea/` (the
  original backend plan); in-memory with data at the repo root.
- **Why:** the repo had already decided in-memory sessions and `server/content/`. With no
  accounts, nothing needs to persist, and losing visits on restart is accepted. SQLite would add a
  dependency, a schema and migrations for no user benefit. One content folder per room keeps the
  rooms consistent. (§4, §12)

### D2. One `/turns` route for clicks and typed questions

- **Decision:** `POST /api/sessions/:id/turns` takes `{ type: 'choice', choiceId }` or
  `{ type: 'text', text }`. `/choices` stays as a thin alias. (`/ask` was reserved for the
  optional AI extra at first; D21 later dropped it, and AI runs as a `noMatch` fallback inside
  `/turns`.)
- **Options:** separate `/choices` and `/questions` routes; reuse `/ask`.
- **Why:** both kinds of input go through the same classification order (a typed "sorry" and a
  clicked "Apologise" must behave the same), so one handler keeps that order in one place. Using
  `/ask` would make markers think the room uses an LLM. (§3, §13.1)

### D3. Mood is the shared `favour`; the flood is a flag

- **Decision:** the guide's mood is the existing `favour` number. The flood is
  `flags.flooded`.
- **Options:** a new irritation level (0–8+) for this room only; irritation that drives favour.
- **Why:** one mood system to explain and test. The existing favour conditions and text variants
  keep working, and other rooms (and any museum ending) can read how this room went. (§8)

### D4. Agreed node schema plus `eventId`, and answer templates

- **Decision:** intro, hub and exhibit entries are nodes in the agreed schema, with one optional
  new field `eventId` that pulls facts from the generated event data. Answers to typed questions
  are built from per-category templates that wrap the fact fields word for word.
- **Options:** lines per mood (original plan); every event as a node with its facts copied in.
- **Why:** facts live in one place (generated from the spreadsheet), so they can't drift. The
  graph checker still works. 366 copied nodes would break the "never hand-edit facts" rule. (§11.1,
  §12.1)

### D5. Hub with free exhibit order; leave at any time except during the flood

- **Decision:** the intro is a hub offering five exhibits in any order. Typed questions work
  everywhere. `leave` is in every view **except while flooded**, when the only choice is
  `apologise`.
- **Options:** a fixed linear tour; exhibits that unlock in sequence.
- **Why:** free order gives real agency with no dead ends (UX marks). The museum's gallery unlocks
  already show the unlock mechanic. Removing `leave` during the flood (amended after review,
  matching D9) makes the flood a real consequence instead of something to walk away from. (§7.1)

### D6. Five exhibits, three curated events each

- **Decision:** Warming waters, Ice and the poles, Storms and floods, Rising seas, What mortals
  have done, using the 15 events in §7.2.
- **Options:** the same with some events swapped; four exhibits (drop Rising seas).
- **Why:** all are ocean-relevant and cover 2020–2026. They include three events with a source
  climate link, so the guide can state a cause where the data does. "What mortals have done"
  covers the room's second theme. 15 entries is enough for a 6-minute demo without padding. (§7.2)

### D7. Matching typed questions: normalise, filter, scored pick

- **Decision:** normalise the text, pull out years, category synonyms, topic words and known
  words, filter the events, then sort by Ocean link, then Climate link, then Year, then ID
  (highest first), skipping events already told. "Most recent" is Year then ID, descending; the
  free-text Date column is never parsed.
- **Options:** a fixed phrase → event lookup table; TF-IDF or fuzzy similarity.
- **Why:** deterministic and explainable, so every case can be an exact test. It handles
  combinations like "storms in 2022" that a lookup table would miss, and shows technical depth
  without an LLM. Fuzzy matching stays a possible later extra. Parsing dates like "Sep 2019 – Mar
  2020" would be fragile, while IDs are already in order within a year. (§6)

### D8. Favour numbers

- **Decision:** start 0, clamp −10..+10. Rude −3, off-topic −1, new typed answer +1, correct quiz
  answer +1. The flood starts at favour ≤ −5. All numbers in one `moodConfig` object.
- **Options:** gentler (flood at −8); harsher (rude −5, so one rude message floods).
- **Why:** two rude messages flood the room, so it's easy to show in the demo, but a polite visitor
  never floods by accident. +1 only for a new event stops farming favour by repeating a question.
  (§8)

### D9. The flood: only an apology works; repenting sets favour to −2

- **Decision:** while flooded, all other text gets a flood reply and changes nothing, and the only
  choice is `apologise`. Repenting clears the flood, sets favour to −2 and sends the `calm`
  effect. A rude message straight after (−2 − 3 = −5) floods again, on purpose.
- **Options:** block all input for a number of turns; reset favour to 0 on repent.
- **Why:** a timeout takes away agency; a reset to 0 would make rudeness free ("be rude, say sorry,
  back to normal"). −2 means forgiven, but on thin ice. (§8.2)

### D10. Quiz after each exhibit; one token per exhibit

- **Decision:** after all three entries of an exhibit are seen, the visitor can take a
  three-question multiple-choice quiz. Two correct earns the token `token:<exhibitId>`. A wrong
  answer shows the correct fact with its source. After a fail, the visitor must re-read an entry
  before retrying.
- **Options:** one question and one token per entry (15 tokens); typed answers.
- **Why:** five tokens are clear progress for the visitor and the hub. Choice answers are marked
  exactly, so tests are exact and visitors aren't failed for spelling. Re-reading before a retry
  stops guessing through. Tokens reuse the existing `learn` / `knows` mechanics. (§9)

### D11. The room has its own ending, decided by tokens

- **Decision:** `leave` ends the visit with one of three endings: 5 tokens Keeper of the Tides,
  2–4 Student of the Sea, 0–1 Landlubber. Favour changes only the farewell wording. After the
  ending, turns return `409 VISIT_ENDED`.
- **Options:** feed tokens into the museum-wide trial only; endings by favour; 4–6 endings by
  tokens × favour.
- **Why:** the room can be finished and tested on its own before the other rooms exist. Basing the
  ending on learning, not politeness, fits an educational brief. Tokens and favour stay in the
  shared state, so a museum trial can still use them later. (§10)

### D12. One `TurnResponse` view; favour shown only as a band

- **Decision:** every turn returns one view (§13.3) with reply, facts with sources, choices,
  suggestions, quiz info, progress and effects. The client gets `favourBand` (`warm`, `neutral`,
  `cold`, `stormy`), never the favour number.
- **Options:** the same with the raw favour exposed; a minimal text-and-choices response.
- **Why:** the client never sees the dialogue graph, and sources always arrive with the fact. Hiding
  the number stops gaming it and lets us retune numbers without changing the client. The
  FavourMeter shows the band. (§8.1, §13.3)

### D13. Edge cases

- **Decision:** empty or whitespace text → 400; over 300 characters → 400 (10kb body limit as a
  backstop); questions outside the data or years → `noMatch` with no favour change; a repeated
  question → the next untold event, then `alreadyTold`; off-topic means no climate or sea words at
  all.
- **Options:** treat every unmatched question as off-topic; reject repeats with a 409.
- **Why:** an honest question the guide can't answer shouldn't cost favour, or a curious visitor
  could flood the room. Repeating a question is normal in conversation, so it isn't an error.
  (§14)

### D14. Rude, repent and meta word lists in `lexicon.json`

- **Decision:** word lists live in content, matched as whole words or phrases on normalised text.
  Rude is checked before repent. An apology when not flooded gets `noNeed` and changes nothing, **at
  any favour level** (amended after review: no longer "only when favour < 0").
- **Options:** lists hard-coded in the engine; a sentiment library.
- **Why:** content can change without code. Whole-word matching avoids false positives like
  "Scunthorpe". A library would be a new dependency (blocked) and less predictable. Making
  apologies matter only during the flood keeps one clear rule. (§5, §12.2)

### D15. The cause rule covers the guide's own words

- **Decision:** the guide's lines may say climate change caused or worsened an event only when the
  event's Climate link is filled. Quoted fact text is the source speaking and is shown as is. A
  Phase 3 check lists the 10 rows whose What happened states a cause while Climate link is empty,
  so their Climate link can be filled in the spreadsheet.
- **Options:** swap CL-2026-034 out of the Rising seas exhibit and keep the rule strict; hide all
  10 mismatched rows until fixed.
- **Why:** changing a quote would break "facts word for word". The mismatched rows are mostly
  attribution studies, some of the most relevant content, so hiding them would weaken the room. The
  real fix belongs in the source data. (§11)

### D16. Classification order, seeded wording and authored quiz content (defaults)

- **Decision:** input is classified in the order rude → repent → quiz answer → choice → climate
  question → meta → off-topic (list questions were later added before climate questions, D19). Each session has a `seed` that only picks between equivalent guide
  lines. Quiz wording and wrong options are authored content; the correct option quotes the fact
  word for word.
- **Options:** other orders (e.g. climate question first); unseeded random wording; quiz options
  generated from data.
- **Why:** rude first means an apology can't hide an insult. A fixed seed makes replies
  replayable and testable while still varied. Authored quizzes read better than generated ones, and
  quoting the fact keeps the right answer accurate. (Defaults adopted in the plan; §5, §9.1,
  §12.4)

### D17. A neutral "meta" input kind

- **Decision:** greetings and questions about the conversation itself (hello, help, who are you,
  what can I ask) get a `meta` reply with suggestions and no favour change. They're checked after
  climate questions and before off-topic. Phrases live in `lexicon.meta`.
- **Options:** treat them as off-topic (−1); check them before climate questions.
- **Why:** saying hello or asking for help is polite, not off-topic, so it shouldn't cost favour.
  Checking climate questions first means "what can you tell me about storms?" is still answered as
  a question. (Added after review; §5)

### D18. A flood pauses an in-progress quiz

- **Decision:** if the flood starts during a quiz, the quiz state is kept. After repenting, the
  same question is shown again with earlier answers kept.
- **Options:** cancel the quiz on flood; count the flood as a failed quiz.
- **Why:** the flood is a mood consequence, not a test result. Losing quiz progress as well would
  punish twice, and resuming in place is easy to show and test (example 10). (Added after review;
  §8.2, §9)

### D19. List questions ("how many…", "list…")

- **Decision:** a typed question with a count phrase (`how many`, `list`, `count`, `name all`…)
  and climate filters gets a `list` reply. It uses the same filters and order as a normal
  question, gives the total "in my records", names up to 8 events (then "and N more"), and offers
  a `hear.<id>` choice for each. No favour change. Hearing one counts as an answer (+1 if new).
  It is checked after choices and before ordinary climate questions.
- **Options:** answer only with the top event (no count); list all matches with no cap; typed
  follow-ups ("tell me about the third one") instead of choices.
- **Why:** "how many" questions are natural, and a single event would answer the wrong question.
  Eight names fit on a phone screen. "In my records" keeps the count honest, because our 366 rows
  are a selection, not every event in the world. Choices to hear one turn a list into a branch the
  visitor controls, with no fuzzy follow-up parsing. No favour for the list itself stops farming. A single match is still a list (the visitor asked for
  a count), and a list asked during a quiz leaves the quiz untouched.
  (Added after review; §6.5, example 14)

### D20. Exhibit context in matching

- **Decision:** when the visitor is inside an exhibit (`currentNodeId` is `cs.<exhibit>.1–3`), the
  first sort key for typed questions and lists is "the event's Category is one of this exhibit's
  `categories`" (listed in `exhibits.json`). It only reorders candidates and never filters them,
  and an exact event name still wins.
- **Options:** no context; filter to the exhibit's categories only; a score bonus mixed with the
  other keys.
- **Why:** "What happened in 2020?" asked in front of the ice exhibit should bring up ice, which
  makes the guide feel aware of where the visitor is standing. Filtering would hide relevant
  answers from other categories. A plain first sort key is exact and testable, while a weighted
  bonus would be hard to explain. (Added after review; §6.3, §6.6, example 15)

### D21. Optional AI fallback on `noMatch` (off by default)

- **Decision:** the module leader approved an optional AI extra; it is built later. Design only
  for now: on a `noMatch` reply to typed text (not while flooded), if `AI_ENABLED` is on, a separate
  server-side service may answer instead, as reply kind `aiAnswer` labelled **"AI, unverified"**,
  with no facts, no favour change and nothing added to `told`. Keys live only in env vars, read in
  `config/env.ts`. AI is never called from the engine or the frontend. Any failure falls back to
  the normal `noMatch`. Off by default, and all tests run with it off.
- **Options:** no AI at all; AI through the reserved `/ask` route only; AI for every question.
- **Why:** the brief allows AI only as an extra outside the core conversation, through Express.
  Running it only on `noMatch` means it can never replace a sourced, word-for-word fact, and the
  label makes clear its answer is not from our data. Keeping it in a service outside the pure
  engine keeps the engine testable and the core AI-free. Off by default keeps tests deterministic
  and costs at zero. (Added after review; §3, §17)
