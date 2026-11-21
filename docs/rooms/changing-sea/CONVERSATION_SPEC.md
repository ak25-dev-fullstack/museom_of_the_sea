# The changing sea: conversation spec

Status: **draft for sign-off** (Phase 1, 21 Nov 2026). Decisions are numbered `D1`–`D21` in
[`DECISIONS.md`](DECISIONS.md). The worked examples in [`examples/`](examples/) become the
Phase 2 tests, so when this spec and an example disagree, fix one of them before coding.

This spec says **"the guide"** for the character who talks to the visitor. Who the guide is
(currently Poseidon) lives only in content files, so the figure can be swapped (root
`CLAUDE.md`, open decisions).

> **How to read this.** Normal text explains the idea. Boxes marked **Rule** are exact: code
> and tests depend on them, so don't change them without updating `DECISIONS.md` and the
> examples.

## Contents

1. [What the room is](#1-what-the-room-is)
2. [Words we use](#2-words-we-use)
3. [One turn, step by step](#3-one-turn-step-by-step)
4. [The state the server keeps](#4-the-state-the-server-keeps)
5. [Kinds of input and their rules](#5-kinds-of-input-and-their-rules)
6. [Matching a typed question to an event](#6-matching-a-typed-question-to-an-event)
7. [The visit: hub, exhibits and leaving](#7-the-visit-hub-exhibits-and-leaving)
8. [Mood (favour), the flood and repentance](#8-mood-favour-the-flood-and-repentance)
9. [The quiz and tokens](#9-the-quiz-and-tokens)
10. [Endings](#10-endings)
11. [Facts, sources and accuracy](#11-facts-sources-and-accuracy)
12. [Content files](#12-content-files)
13. [API](#13-api)
14. [Edge cases](#14-edge-cases)
15. [Full server vs plain Express](#15-full-server-vs-plain-express)
16. [Known limits and open points](#16-known-limits-and-open-points)
17. [Optional AI fallback (off by default)](#17-optional-ai-fallback-off-by-default)

---

## 1. What the room is

The visitor walks into the changing sea room. The guide welcomes them and offers five
**exhibits** about what has happened to the world's climate and oceans from 2020 to 2026, and what
people have done about it. The visitor can:

- **click choices** to walk through exhibits, take a short test (the **quiz**) and leave, or
- **type a question** at any time, such as "What hurricanes happened in 2020?", and the guide
  answers with a real event from our data, with its sources, or
- **ask for a count or a list**, such as "How many storms were there in 2020?", and the guide
  names the matching events and offers to tell any of them.

How the visitor behaves changes the guide's **mood** (favour). Rudeness can make the guide angry
enough to **flood** the room, and only an apology stops it. Passing each exhibit's quiz earns a
**token**. The number of tokens decides the **ending** when the visitor leaves.

No LLM is involved in the core conversation. Every reply comes from our content files, our data
and the rules in this spec (a hard rule in root `CLAUDE.md`). The only exception is an
**optional AI fallback** that is off by default, runs only on the server, and is always labelled
"AI, unverified" (§17, D21).

## 2. Words we use

| Word                | Meaning                                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| **Event**           | One row of `research/events.csv` (366 rows, IDs like `CL-2020-058`). Generated into room data in Phase 3. |
| **Fact**            | The fields of one event sent to the client, copied word for word, with its sources.                       |
| **Node**            | A hand-written step of dialogue in the agreed node schema (root `CLAUDE.md`): intro, hub, exhibit entry.  |
| **Exhibit**         | A themed group of three curated events, with a three-question quiz.                                       |
| **Entry**           | One of an exhibit's three events, shown as a node.                                                        |
| **Turn**            | One visitor input and the server's reply.                                                                 |
| **View**            | What the client receives each turn (`TurnResponse`): reply, facts, choices and progress. Never the graph. |
| **Favour**          | The guide's mood, a whole number from −10 to +10. Shared with the other rooms.                            |
| **Favour band**     | A word the client gets instead of the number: `warm`, `neutral`, `cold`, `stormy`.                        |
| **Flood**           | The angry state (`flags.flooded = true`). Only an apology works until it ends.                            |
| **Token**           | Proof that an exhibit's quiz was passed, stored as the knowledge fact `token:<exhibitId>`.                |
| **Normalised text** | The typed text after the normalising steps in §6.1.                                                       |
| **List question**   | A typed question asking how many events, or for a list of them (§6.5).                                    |
| **Exhibit context** | The exhibit the visitor is inside, which nudges typed questions towards its topics (§6.6).                |

## 3. One turn, step by step

Every visitor action (a click or a typed question) is one `POST /api/sessions/:id/turns`
request (D2). The server does this, in order:

1. **Validate the request** (Zod, through `validate()`). Bad shape → `400`, nothing changes.
2. **Load the session.** Unknown id → `404 SESSION_NOT_FOUND`. Visit already ended →
   `409 VISIT_ENDED`.
3. **Check a clicked choice is available.** If `choiceId` is not one of the choices in the view
   the visitor was last sent → `409 CHOICE_NOT_AVAILABLE`, nothing changes.
4. **Classify the input** into exactly one kind (§5), using the fixed order.
5. **Run the engine** for that kind: a pure function `(state, input, content) → { state, view }`.
   It picks the reply, the facts and the choices, and applies favour changes.
6. **Check for the flood** (§8). If favour has dropped to −5 or lower, the flood starts.
   - _(Optional, off by default.)_ If the engine's reply is `noMatch` and `AI_ENABLED` is on, the
     service may swap in an `aiAnswer` reply (§17). The engine itself never calls AI.
7. **Save** the new state and the view (so `GET` can return it again), and add 1 to `turn`.
8. **Return** the `TurnResponse` (§13.3).

Steps 1–3 and 7 happen in the route and service. Steps 4–6 (apart from the optional AI swap) are
the engine, which has no Express and no I/O (root `CLAUDE.md`). The AI swap is **not** engine code:
the engine finishes and returns its reply first, and only then does the `/turns` service decide
whether to call `aiFallback` (§17). Any `4xx` leaves the state exactly as it was, including `turn`.

## 4. The state the server keeps

Sessions live in memory (D1). The shared fields follow the visitor state in root `CLAUDE.md`, so
other rooms can read them. Fields only this room needs sit under `changingSea`.

```ts
interface VisitState {
  // shared with the museum (root CLAUDE.md)
  currentNodeId: string; // e.g. 'cs.intro', 'cs.hub', 'cs.warming-waters.2'
  favour: number; // whole number, −10..+10, starts at 0
  flags: { flooded: boolean }; // plus any flags other rooms add
  knowledge: string[]; // facts learned, incl. tokens: 'token:warming-waters'
  visited: string[]; // node ids, in first-visit order, no duplicates

  // this room only
  changingSea: {
    status: 'active' | 'ended'; // 'flooded' is derived from flags.flooded
    told: string[]; // event ids shown this visit, in order, no duplicates
    review: string[]; // exhibit ids whose quiz was failed and needs an entry re-read
    quiz: null | {
      exhibitId: string;
      questionIndex: 0 | 1 | 2; // the question now being asked
      answers: boolean[]; // true = correct, one per answered question
    };
    endingId: null | 'keeper-of-the-tides' | 'student-of-the-sea' | 'landlubber';
  };

  // bookkeeping
  seed: number; // fixes the wording picks (§12.4)
  turn: number; // successful turns so far; 0 after start
  lastView: TurnResponse; // returned by GET /api/sessions/:id
}
```

> **Rule (state).**
>
> - `favour` is always clamped to −10..+10 after each change.
> - A node id is added to `visited` and an event id to `told` the first time it is shown, never twice.
> - Exhibit progress (entries seen, token held) is **derived**, not stored: an entry is seen if its
>   node id is in `visited`; a token is held if `token:<exhibitId>` is in `knowledge`.
> - When the flood starts, `quiz` is **kept as it is** (the quiz pauses, D18).

## 5. Kinds of input and their rules

The input is either a **choice** (`{ type: 'choice', choiceId }`) or **text**
(`{ type: 'text', text }`). It is classified into exactly one kind, checking in this order (D16,
D17, D19):

> **Rule (classification order).** rude → repent → quiz answer → choice → list question →
> climate question → meta → off-topic.
>
> - Text inputs can only be **rude, repent, list question, climate question, meta, off-topic** (or
>   `clarify`, see below).
> - Choice inputs can only be **repent** (`apologise`), **quiz answer** (`q.…`) or **choice**
>   (including `hear.…`).
> - While **flooded**, only **repent** is acted on. A text input of any other kind gets a `flood`
>   reply and changes nothing except `turn`. The only available choice is `apologise`, so any other
>   `choiceId` is a `409` at step 3.

| Kind                 | How it is recognised                                                                                                         | What happens                                                                                                                | Favour                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| **rude**             | Normalised text contains a rude term from `lexicon.rude` as a whole word or phrase.                                          | Reply `rude`. Choices stay as they were. If this pushes favour to ≤ −5, reply is `flood` instead (§8).                      | −3                    |
| **repent**           | Text contains a `lexicon.repent` phrase, or the `apologise` choice. Rude is checked first, so "sorry, idiot" is rude.        | **Flooded:** reply `repent`, flood ends, favour set to −2, effect `calm`. **Not flooded:** reply `noNeed`, nothing changes. | set to −2 / 0         |
| **quiz answer**      | A choice whose id is one of the current quiz question's options (`q.<exhibit>.<n>.<a\|b\|c>`).                               | Mark it, give feedback, then the next question or the result (§9).                                                          | +1 if correct         |
| **choice**           | Any other available choice (`exhibit.*`, `next`, `hub`, `quiz.start`, `quiz.stop`, `leave`, `hear.*`).                       | Move to the node it names (§7). `hear.<id>` tells that event, like an `answer` (§6.5).                                      | 0 (`hear`: +1 if new) |
| **list question**    | A `lexicon.count` phrase ("how many", "list"…) **and** the rest of the text is a climate question (§6.5).                    | Reply `list`: the count and up to 8 event names, with a `hear.*` choice for each. Or `noMatch`.                             | 0                     |
| **climate question** | The normalised text has a year, a category synonym, a topic word, a known place or name word, or an exact event name (§6.2). | Pick an event (§6) and reply `answer`, `alreadyTold` or `noMatch`.                                                          | +1 on `answer` only   |
| **meta**             | Text contains a `lexicon.meta` phrase (greetings, "help", "who are you", "what can I ask").                                  | Reply `meta`: who the guide is and what to ask, plus `suggestions`. Choices stay as they were.                              | 0                     |
| **off-topic**        | None of the above (e.g. "What's for lunch?").                                                                                | Reply `offTopic`, a gentle nudge plus `suggestions`. If this pushes favour to ≤ −5, reply is `flood` instead.               | −1                    |
| _(clarify)_          | The text passed validation but is empty after normalising (e.g. `"???"`).                                                    | Reply `clarify`: "Speak plainly, visitor." Nothing changes.                                                                 | 0                     |

> **Rule (no need to apologise, D14).** An apology when not flooded gets reply `noNeed` and
> changes nothing, **at any favour level**, including negative favour. Apologising only does
> something while the room is flooded.

Why climate question comes before meta: "What can you tell me about storms?" contains a meta
phrase but is really a question, so the climate check wins. "What can I ask?" has no climate
words, so it falls through to meta.

## 6. Matching a typed question to an event

The goal is a predictable, explainable match with no AI (D7). Every step is a plain rule that a
unit test can check.

### 6.1 Normalise

> **Rule (normalise).**
>
> 1. Lowercase.
> 2. Remove accents (Unicode NFD, then drop combining marks): "Niño" → "nino".
> 3. Replace every run of characters that is not `a–z` or `0–9` with one space.
> 4. Trim and collapse spaces.
>
> Example: `"What's for lunch?"` → `"what s for lunch"`. `"Any El Niño news in 2020?"` →
> `"any el nino news in 2020"`.

All lexicon entries are stored already normalised, and matching is **whole word or whole
phrase**: a term matches only where it is surrounded by spaces or the ends of the text
(`" " + text + " "` contains `" " + term + " "`). So "hell" does not match "hello".

### 6.2 Pull out the filters

From the normalised text:

0. **Count phrases** (`lexicon.count`: "how many", "list"…). If one is found, note it (this may be
   a list question, §6.5) and remove it from the text before the steps below.
1. **Synonym phrases.** Go through `lexicon.synonyms` longest phrase first. Each hit adds its
   categories and is removed from the text, so "tropical storm" is not counted again as "storm".
2. **Years:** every 4-digit number from 1800 to 2099 (`\b(1[89]\d\d|20\d\d)\b`).
3. **Topic words** (`lexicon.topic`: climate, sea, ocean, warming…). These mark the text as a
   climate question but don't filter anything.
4. **Known words:** the remaining words that are 4 or more letters long, not in
   `lexicon.stop`, not topic words, and that appear in the **name index**: the set of words in any
   event's Event, Location or Region (built when the content loads). Words the index doesn't know
   are ignored.
5. **Exact name:** an event whose whole normalised Event name appears in the text (e.g. "hurricane
   helene"). If several match, the longest name wins.

> **Rule (is it a climate question?).** Yes if there is at least one year, category, topic word,
> known word or exact name. Otherwise it goes on to meta or off-topic.

"What are humans doing…?" works through synonym phrases: `humans doing`, `people doing`,
`mortals doing` and `doing about` all map to **Policy, diplomacy & COP summits**, **Energy
transition & finance** and **Courts & legal action**.

### 6.3 Pick the event

> **Rule (pick).**
>
> 1. If any year is outside **2020–2026** → `noMatch` (the guide only knows this period).
> 2. If there is an exact name → that event (`answer`, or `alreadyTold` if already in `told`).
> 3. Otherwise the candidates are all events where:
>    - Year is one of the years (if any were given), **and**
>    - Category is one of the categories (if any were given), **and**
>    - if there are known words: the event's Event, Location or Region contains at least one of
>      them as a whole word.
> 4. No candidates → `noMatch`.
> 5. Sort candidates by these keys, in order, **highest first**:
>    1. **Exhibit context** (D20): the event's Category is one of the current exhibit's
>       `categories` (§6.6). When the visitor is not inside an exhibit, this key is the same for
>       every event, so it changes nothing.
>    2. Ocean link = `Yes`
>    3. Climate link filled
>    4. Year
>    5. ID (as a string; IDs are numbered in order within a year)
>
>    "Most recent" therefore means **Year, then ID, descending**. The Date column is free text and
>    is **never parsed** (D7).
>
> 6. Answer with the first candidate **not in `told`**. If every candidate is in `told` →
>    `alreadyTold` with the first candidate.

Worked example ("What hurricanes happened in 2020?"): year 2020, category Tropical cyclone →
10 candidates. CL-2020-058 and CL-2020-015 both have Ocean link Yes and a Climate link, so the
higher ID, **CL-2020-058**, wins. Asking again gives **CL-2020-015** (example 05).

### 6.4 Replies from the pick

| Pick      | Reply kind    | Facts               | Favour | Notes                                                                                                |
| --------- | ------------- | ------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| new event | `answer`      | `[that event]`      | +1     | Event id added to `told`. Repeating a question gives the next untold event, so +1 is once per event. |
| all told  | `alreadyTold` | `[first candidate]` | 0      | "I have told you of this already." Shows the fact again.                                             |
| nothing   | `noMatch`     | `[]`                | 0      | In character: says what the guide's records cover, with 3 `suggestions` (rule below).                |

A typed question never moves the visitor: `currentNodeId` and the choices stay as they were
(except during the flood, §8).

> **Rule (noMatch stays in character).** The guide never admits ignorance; it describes what its
> records hold. A `noMatch` reply:
>
> - **never** contains `i don't know`, `i do not know`, `don't know` or `not sure` (checked
>   case-insensitively, in tests and in the §12.3 content check of `templates.json`);
> - **always** states the span of the records, so its text contains `2020` and `2026`;
> - **always** names the room's five themes by their exhibit titles: `Warming waters`,
>   `Ice and the poles`, `Storms and floods`, `Rising seas`, `What mortals have done`;
> - has `factKind: null`, `facts: []`, and **exactly 3** `suggestions`, picked by the seed from
>   `templates.suggestions` (§12.4). Every question in that list must itself get an `answer` or a
>   `list` reply (§12.3).
>
> The same rule applies to a list question with no matches.

### 6.5 List questions (count or list)

(D19.) "How many storms were there in 2020?" or "List the floods in 2022" asks about a group of
events, not one. The guide gives the count from its records, names up to eight, and offers to
tell any of them.

> **Rule (list question).**
>
> 1. **Recognised** when the normalised text contains a `lexicon.count` phrase **and**, with that
>    phrase removed, the text is a climate question (§6.2). Exact event names are ignored for
>    lists. A count phrase with nothing else ("how many?") is not a list question; it goes on to
>    meta or off-topic.
> 2. **Candidates and order** are exactly as in §6.3 steps 1, 3, 4 and 5, including exhibit
>    context. A year outside 2020–2026, or no candidates → `noMatch` (rule above).
> 3. `total` = the number of candidates, **including** events already told. `items` = the first
>    **8** candidates in sort order.
> 4. Reply kind `list`, `factKind: null`, `facts: []`, and
>    `list: { total, items: [{ eventId, event, year }] }`. The reply text contains:
>    - the exact phrase `in my records` (the count is of our records, not of the whole world);
>    - `total` written in digits;
>    - every item's Event name, word for word, joined with `"; "`;
>    - when `total > 8`, the exact text `and N more`, where N = `total − 8`.
> 5. **Choices:** one `hear.<eventId in lowercase>` per item, in the same order, labelled with the
>    Event name, then the current view's usual choices (§7.1).
> 6. **No favour change**, nothing added to `told`, `currentNodeId` unchanged.
> 7. **One match is still a `list`.** If `total` is 1 the reply is still `kind: "list"` with one item
>    and one `hear` choice. The text contains `in my records` and the total in digits (here `1`),
>    as in rule 4, and never `and N more`. It is not turned into an `answer`, because the visitor asked for a count and
>    must not get +1 favour for it without choosing to hear the event.
>
> **Rule (hear).** Choosing `hear.<id>` tells that event exactly like an `answer` (§6.4): reply
> `answer` with the fact, +1 favour and added to `told` if it is new; reply `alreadyTold` with no
> favour change if it was told before. The `hear.*` choices then disappear, and the choices go back
> to the current node's.
>
> **Rule (list question during a quiz).** A list question is allowed during a quiz. The reply shows
> the `hear.*` choices first, then the **current question's options** (not the node's usual
> choices). The quiz is untouched: same question, earlier answers kept, no score change. Choosing a
> `hear.*` choice tells the event as above (+1 if new), and the choices then go back to the
> current question's options, so the quiz carries on. A `hear.*` choice is never a quiz answer.

Worked example: "How many storms were there in 2020?" → "storms" maps to two categories, year 2020
→ **13** candidates. The first 8 are named, then "and 5 more" (example 14).

### 6.6 Exhibit context

(D20.) When the visitor is standing in an exhibit, a vague question like "What happened in 2020?"
should bring up that exhibit's kind of event first.

> **Rule (exhibit context).**
>
> - The visitor is **inside an exhibit** when `currentNodeId` is `cs.<exhibitId>.1`, `.2` or `.3`.
>   This includes a quiz on that exhibit (the node doesn't change during a quiz). At the intro, the
>   hub or the end there is no exhibit context.
> - Each exhibit lists its `categories` in `exhibits.json`:
>
>   | Exhibit          | `categories`                                                                                        |
>   | ---------------- | --------------------------------------------------------------------------------------------------- |
>   | `warming-waters` | Ocean, coral & marine life; El Niño / La Niña                                                       |
>   | `ice-poles`      | Sea ice, glaciers & polar                                                                           |
>   | `storms-floods`  | Tropical cyclone (hurricane/typhoon/cyclone); Storm, cold & winter weather; Flood, rain & landslide |
>   | `rising-seas`    | Sea level & coasts                                                                                  |
>   | `mortals`        | Policy, diplomacy & COP summits; Energy transition & finance; Courts & legal action                 |
>
> - Exhibit context is the **first sort key** (§6.3 step 5.1). It only **reorders**; it never
>   removes candidates. So when the question already names a category, context changes nothing
>   unless several categories are in play, and it never stops an exact name match.

Worked example: "What happened in 2020?" (year only, 59 candidates). At the hub the top pick is
**CL-2020-058** (Ocean link, Climate link). Inside Ice and the poles, the polar events come first,
so the pick is **CL-2020-043** "Arctic sea ice second-lowest summer extent" (example 15).

## 7. The visit: hub, exhibits and leaving

(D5, D6.) The visit starts at the **intro**, which works as the hub. Exhibits can be visited in
any order. Typed questions work everywhere except during the flood.

### 7.1 Nodes and choices

| Node                      | Reply kind   | Choices (in this order)                                                       |
| ------------------------- | ------------ | ----------------------------------------------------------------------------- |
| `cs.intro`                | `intro`      | 5 exhibit choices, `leave`                                                    |
| `cs.hub`                  | `hub`        | 5 exhibit choices, `leave`                                                    |
| `cs.<exhibit>.1` and `.2` | `exhibit`    | `quiz.start` (only if eligible), `next`, `hub`, `leave`                       |
| `cs.<exhibit>.3`          | `exhibit`    | `quiz.start` (only if eligible), `hub`, `leave`                               |
| quiz question (§9)        | `quiz`       | 3 options `q.<exhibit>.<n>.a/b/c`, `quiz.stop`, `leave`                       |
| quiz result (§9)          | `quizResult` | same as `cs.hub` (and `currentNodeId` becomes `cs.hub`)                       |
| list reply (§6.5)         | `list`       | `hear.<id>` for each listed event, then the usual choices of the current view |
| flooded (any node)        | `flood`      | `apologise` only                                                              |
| ended                     | `ending`     | none                                                                          |

Exhibit choice ids: `exhibit.warming-waters`, `exhibit.ice-poles`, `exhibit.storms-floods`,
`exhibit.rising-seas`, `exhibit.mortals`. Choosing one always opens entry 1. `next` goes to the
next entry, `hub` goes to `cs.hub`.

> **Rule (leave, D5).** `leave` is offered in **every** view **except while flooded**. During the
> flood the only choice is `apologise` (D9), so sending `leave` returns `409 CHOICE_NOT_AVAILABLE`.

Each exhibit entry is a node with an `eventId` (D4). Its reply text is the guide's line for that
entry plus the fact, and `facts` holds that one event. Showing an entry adds it to `visited` and
`told`. Favour doesn't change while browsing exhibits.

### 7.2 The exhibits

All facts are `kind: "history"`. Events with a filled Climate link are marked ✓; only those may
have the guide say climate change caused or worsened something (§11).

| Exhibit (`id`)                      | Entry 1                                                         | Entry 2                                                             | Entry 3                                                                    |
| ----------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Warming waters (`warming-waters`)   | CL-2023-027 Global sea surface temperature record               | CL-2025-001 Biggest coral bleaching event ever: 84% of reefs ✓      | CL-2026-044 Hottest day ever recorded for the world's seas                 |
| Ice and the poles (`ice-poles`)     | CL-2020-009 Antarctica's hottest temperature on record: 18.3 °C | CL-2024-034 Record-low sea ice at both poles                        | CL-2026-047 Greenland and Antarctica lost 11,309 billion tonnes of ice     |
| Storms and floods (`storms-floods`) | CL-2020-058 Record-breaking 2020 Atlantic hurricane season ✓    | CL-2020-015 Super Cyclone Amphan ✓                                  | CL-2024-029 Hurricane Helene                                               |
| Rising seas (`rising-seas`)         | CL-2021-020 Glaciers cause a fifth of sea-level rise            | CL-2026-034 Extreme coastal floods 12 times more frequent           | CL-2026-054 Thwaites 'Doomsday Glacier' sea-level estimate                 |
| What mortals have done (`mortals`)  | CL-2023-007 High Seas Treaty agreed and adopted                 | CL-2023-040 COP28: agreement to 'transition away' from fossil fuels | CL-2024-018 Law of the Sea tribunal: greenhouse gases are marine pollution |

The other 351 events can only be reached by typing a question.

## 8. Mood (favour), the flood and repentance

(D3, D8, D9.) Mood is the shared `favour` number, so the other rooms (and any museum ending) can
read how this room went.

> **Rule (favour changes).** All numbers live in one config object (`moodConfig`) so they can be
> tuned and tested.
>
> | Cause                                                         | Change               |
> | ------------------------------------------------------------- | -------------------- |
> | Start of visit                                                | favour = 0           |
> | Rude input (not flooded)                                      | −3                   |
> | Off-topic input (not flooded)                                 | −1                   |
> | `answer` to a typed question or a `hear.*` choice (new event) | +1                   |
> | List question (`list` reply)                                  | 0                    |
> | Correct quiz answer                                           | +1                   |
> | Repent while flooded                                          | favour **set** to −2 |
> | Everything else                                               | 0                    |
>
> After every change, clamp to −10..+10. Then: **if favour ≤ −5 and not flooded, the flood
> starts.**

### 8.1 Favour bands (what the client sees)

> **Note for the FavourMeter / client teammate:** the client **never gets the favour number**.
> Every response carries only `progress.favourBand` (D12). This stops visitors gaming the number,
> and lets us retune the numbers without touching the client.

> **Rule (bands).**
>
> | Band      | When                      |
> | --------- | ------------------------- |
> | `stormy`  | flooded (any favour)      |
> | `warm`    | favour ≥ 3                |
> | `neutral` | −1 ≤ favour ≤ 2           |
> | `cold`    | favour ≤ −2 (not flooded) |

### 8.2 The flood

> **Rule (flood starts).** On the turn the flood starts: `flags.flooded = true`, reply kind
> `flood`, `effects: ["flood"]`, `status: "flooded"`, choices `[apologise]`. If a quiz was in
> progress it **pauses**: `quiz` is kept with the same `questionIndex` and `answers` (D18).
>
> **Rule (while flooded).**
>
> - Any text that is not a repent (including rude and climate questions) → reply `flood`, no
>   favour change, nothing added to `told`, `effects: []`.
> - Any choice other than `apologise` → `409 CHOICE_NOT_AVAILABLE`, nothing changes.
> - `status` is `"flooded"` and `favourBand` is `"stormy"` in every response.
>
> **Rule (repent, D9).** A repent while flooded: `flags.flooded = false`, favour **set to −2**,
> reply `repent`, `effects: ["calm"]`. The visitor goes back to the view they were in:
>
> - no quiz in progress → the choices of `currentNodeId`;
> - quiz paused → the **same question** again, with its three options, `quiz.stop` and `leave`, and
>   the earlier answers kept (D18). The reply text is the apology line followed by the question.

Because repenting only brings favour to −2, **one rude message straight after repenting brings it
to −5 and floods again** (−2 − 3 = −5). This is on purpose: forgiveness, but on thin ice
(example 09). Off-topic input after repenting takes three turns to flood (−3, −4, −5).

## 9. The quiz and tokens

(D10.) Each exhibit has three multiple-choice questions, one per entry. Answers are choices, not
typed text, so marking is exact.

> **Rule (quiz).**
>
> - **Eligible:** all three entries of the exhibit are in `visited`, there is no
>   `token:<exhibitId>` in `knowledge`, and the exhibit is not in `review`. Eligible exhibit
>   entries show `quiz.start` as their first choice.
> - `quiz.start` → `quiz = { exhibitId, questionIndex: 0, answers: [] }`, reply `quiz`, with the
>   question text in `reply.text` and `quiz` info in the response.
> - **Answer** `q.<exhibit>.<n>.<x>`: record `true`/`false`. Correct → favour +1. Wrong → the
>   reply says so and gives the entry's fact in `facts` (with its sources) so the visitor sees the
>   right answer. Then:
>   - if fewer than 3 answers: `questionIndex + 1`, reply `quiz` with the next question;
>   - after the 3rd answer: reply `quizResult`, `quiz = null`, `currentNodeId = 'cs.hub'`,
>     choices as the hub.
> - **Pass = 2 or 3 correct.** Add `token:<exhibitId>` to `knowledge`, `effects: ["token"]`.
> - **Fail = 0 or 1 correct.** Add the exhibit to `review`. `quiz.start` stays hidden until the
>   visitor opens any entry of that exhibit again, which removes it from `review` (retry after
>   re-reading).
> - `quiz.stop` → `quiz = null`, answers are lost, go to `cs.hub`. `leave` during a quiz ends the
>   visit (the quiz is dropped).
> - Typed text during a quiz is handled as normal (§5), and the response's choices are still the
>   current question's options, so the quiz carries on.
> - **Flood during a quiz:** the quiz pauses and resumes at the same question after repenting (§8.2,
>   D18).

### 9.1 The questions (authored content, please review)

The question wording and the wrong options are **our own content**, not data. The correct option
always **quotes the event's fact word for word**. Where possible, wrong options use real numbers
from other events, so a visitor never "learns" an invented figure as true. These move to
`server/content/changing-sea/quiz.json` in Phase 3.

| Option id prefix     | Question                                                                            | a                                     | b                                        | c                                                           | Correct |
| -------------------- | ----------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------- | ----------------------------------------------------------- | ------- |
| `q.warming-waters.1` | What record did global daily sea surface temperature hit in August 2023?            | 25.19 °C                              | 21.02 °C                                 | 18.3 °C                                                     | b       |
| `q.warming-waters.2` | What share of the world's coral reef area hit bleaching-level heat stress?          | 83.7%                                 | 68.2%                                    | 21%                                                         | a       |
| `q.warming-waters.3` | Which day set the record for the hottest day measured in the world's seas?          | 31 Aug 2023                           | 6 Feb 2020                               | 22 August 2026                                              | c       |
| `q.ice-poles.1`      | What temperature was recorded on the Antarctic continent in February 2020?          | 18.3 °C                               | 17.5 °C                                  | 21.02 °C                                                    | a       |
| `q.ice-poles.2`      | What did Arctic sea ice have in December 2024?                                      | its highest December extent on record | an average December extent               | its lowest December extent on record                        | c       |
| `q.ice-poles.3`      | How much ice did the Greenland and Antarctic ice sheets lose between 1979 and 2023? | about 267 gigatonnes                  | about 11,309 gigatonnes                  | about 83.7 gigatonnes                                       | b       |
| `q.storms-floods.1`  | How many named storms formed in the record 2020 Atlantic hurricane season?          | 30 named storms                       | 14 named storms                          | 22 named storms                                             | a       |
| `q.storms-floods.2`  | Where was Super Cyclone Amphan the first super cyclonic storm since 1999?           | the Arabian Sea                       | the Bay of Bengal                        | the South China Sea                                         | b       |
| `q.storms-floods.3`  | Where did Hurricane Helene cause catastrophic flooding?                             | across the Caribbean islands          | along the coast of Maine                 | far inland across the south-eastern US and the Appalachians | c       |
| `q.rising-seas.1`    | What share of sea-level rise did glaciers cause (2000–2019)?                        | 83.7%                                 | 21%                                      | 68.2%                                                       | b       |
| `q.rising-seas.2`    | How much more frequent have 1-in-100-year coastal floods become since 1900?         | about 12 times more frequent          | about 2 times more frequent              | about 100 times more frequent                               | a       |
| `q.rising-seas.3`    | How much will Thwaites Glacier add to sea level by 2100, by one study's estimate?   | about 30±6 cm                         | about 3 m                                | about 30±6 mm                                               | c       |
| `q.mortals.1`        | What does the High Seas Treaty protect?                                             | fishing rights in coastal waters      | marine life in international waters      | shipping lanes in the Arctic                                | b       |
| `q.mortals.2`        | What did COP28's 'UAE Consensus' call for by 2030?                                  | tripling renewable capacity by 2030   | a firm phase-out of fossil fuels by 2030 | halving coal power by 2030                                  | a       |
| `q.mortals.3`        | What did ITLOS advise that greenhouse gases absorbed by the ocean count as?         | a natural resource                    | a shipping hazard                        | marine pollution                                            | c       |

Option ids are the prefix plus the letter, e.g. `q.warming-waters.1.b`. The order of options is
fixed (not shuffled), so tests stay exact. `q.mortals.2.b` is wrong on purpose: the fact says
"without a firm phase-out".

## 10. Endings

(D11.) The room has its own ending, shown when the visitor chooses `leave`.

> **Rule (ending).** On `leave` (not flooded): `changingSea.status = 'ended'`,
> `changingSea.endingId` set by the number of tokens:
>
> | Tokens | `endingId`            | Title               |
> | ------ | --------------------- | ------------------- |
> | 5      | `keeper-of-the-tides` | Keeper of the Tides |
> | 2–4    | `student-of-the-sea`  | Student of the Sea  |
> | 0–1    | `landlubber`          | Landlubber          |
>
> The reply is kind `ending`. The guide's farewell line is a text variant by favour band, so
> **favour changes only the wording, not the ending**. The response has `status: "ended"`,
> `choices: []`, `input.mode: "none"`, the `ending` object, and `facts` = **every event in
> `told`, in the order told**, each with its sources (the "what you learned" list).
>
> After the visit ends, every `POST …/turns` returns `409 VISIT_ENDED`.
> `GET /api/sessions/:id` still returns the ending view.

Tokens and favour stay in the shared state, so a future museum-wide trial can read them, but this
room does not depend on that.

## 11. Facts, sources and accuracy

These follow the room's `CLAUDE.md`.

> **Rule (facts word for word).** Every fact field is copied from the generated event data with no
> changes: no rounding, no reordering, no re-punctuating. The guide's own words go **around** the
> fact, never inside it.

> **Rule (cause claims, D15).** The guide's own words (openers, connecting lines, quiz feedback)
> may say that climate change caused, drove or worsened an event **only when that event's Climate
> link is filled**. When it is filled, the reply includes the Climate link text word for word.
> When it is empty, the guide's words must not contain any **cause phrase**:
> `caused by climate change`, `because of climate change`, `climate change caused`,
> `climate change made`, `driven by climate change`, `due to climate change`,
> `climate change worsened`.
>
> Fact text quoted from the data is the source speaking, and is shown as it is, even if it
> mentions a cause (e.g. CL-2026-034). Phase 3's content check lists the 10 events whose What
> happened mentions a cause while Climate link is empty: CL-2021-026, CL-2021-052, CL-2022-033,
> CL-2024-019, CL-2025-018, CL-2025-022, CL-2025-026, CL-2026-017, CL-2026-034, CL-2026-058. Fill
> in their Climate link in the spreadsheet where the source supports it.

> **Rule (sources).** Every fact in `facts` carries `sources`: Source 1, plus Source 2 when it is
> filled, each as `{ publisher, url, type }`.

> **Rule (2026 caveat).** If a fact's Year is 2026, the reply text includes the sentence
> `2026 figures may be revised.`, and `facts[].notes` carries the full Notes text.
> (Phase 3 check: CL-2026-045 is the one 2026 row whose Notes lacks this sentence.)

### 11.1 How an answer's text is built

```
reply.text = opener + " " + event + " (" + date + "): " + whatHappened
           + (humanImpact ? " " + impactLead + " " + humanImpact : "")
           + (climateLink ? " " + causeLead + " " + climateLink : "")
           + (year === 2026 ? " 2026 figures may be revised." : "")
```

- `opener`, `impactLead` and `causeLead` are guide lines from `templates.json` (several variants
  each; the seed picks one, §12.4). `causeLead` is used only when Climate link is filled.
- Exhibit entries use the same build, with the entry node's own text as the opener.
- Tests check that the text **contains** the fact fields and lacks cause phrases. They don't
  check the exact wording of guide lines, so content writers can change the voice freely.

## 12. Content files

All in `server/content/changing-sea/` (D1). Hand-written files are checked by Zod at startup;
generated files are never edited by hand.

| File                    | Hand-written or generated | What it holds                                                                                                                                                                       |
| ----------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `events.generated.json` | generated (Phase 3)       | All 366 events as `Fact` objects (§13.3), from the spreadsheet.                                                                                                                     |
| `nodes.json`            | hand-written              | Intro, hub, 15 exhibit entry nodes (agreed node schema + `eventId`), with `kind`.                                                                                                   |
| `exhibits.json`         | hand-written              | The 5 exhibits: id, title, entry node ids, `categories` for exhibit context (§6.6).                                                                                                 |
| `quiz.json`             | hand-written              | §9.1 questions: options and the correct letter.                                                                                                                                     |
| `templates.json`        | hand-written              | Guide lines by reply kind (`flood`, `repent`, `noNeed`, `meta`, `noMatch`, `list`…), answer openers by category, farewell lines by band, ending titles, and the `suggestions` pool. |
| `lexicon.json`          | hand-written              | Word lists: `rude`, `repent`, `meta`, `count`, `stop`, `topic`, `synonyms`.                                                                                                         |
| `guide.json`            | hand-written              | The guide's id and display name (`speaker`). The only place the figure is named.                                                                                                    |

### 12.1 Node schema addition (D4)

The agreed node schema (root `CLAUDE.md`) gets one optional field:

```json
{
  "id": "cs.warming-waters.1",
  "gallery": "changing-sea",
  "speaker": "<guide id>",
  "eventId": "CL-2023-027",
  "kind": "history",
  "text": { "default": "…", "variants": [] },
  "choices": []
}
```

When `eventId` is set, the node's `source` comes from the event, the node's text is the opener
(§11.1), and the loader checks the id exists. This room builds its choices from the rules in §7.1,
so its nodes keep `choices: []`. The graph checker treats them as reached from the hub and leading
back to it.

### 12.2 Lexicon (starting lists, Phase 3 fills them in)

All entries are stored normalised (§6.1).

- **`rude`:** `idiot`, `stupid`, `useless`, `dumb`, `shut up`, `hate you`, `you suck`, plus a
  profanity list added in Phase 3 (kept out of this doc). A unit test lists safe words that must
  **not** match (e.g. `scunthorpe`, `assess`, `class`, `hello`).
- **`repent`:** `sorry`, `apologise`, `apologize`, `apologies`, `my apologies`, `forgive me`,
  `pardon me`, `i apologise`, `i apologize`.
- **`meta`:** `hello`, `hi`, `hey`, `greetings`, `good morning`, `good afternoon`, `good evening`,
  `help`, `who are you`, `what are you`, `what can i ask`, `what can you tell me`,
  `what do you know`, `how does this work`.
- **`count`:** `how many`, `list`, `list the`, `count`, `name all`, `name the`. Removed from the
  text before the filters are pulled out (§6.2 step 0).
- **`topic`:** `climate`, `sea`, `seas`, `ocean`, `oceans`, `weather`, `warming`, `water`,
  `waters`, `planet`, `earth`, `world`, `environment`, `nature`, `tide`, `tides`.
- **`stop`:** question and filler words that never count as known words: `what whats happened
happen happening tell about the in of a an and did does do is are was were any news show how
why when where which who you your i us we there have has had with on for to from at this that
these those please know more give some year years much many big biggest worst most latest
recent thing things going me my it its s be been can could would should will last first new`.
- **`synonyms`** (phrase → categories):

| Phrases                                                                                      | Category                                                                                          |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| hurricane(s), typhoon(s), cyclone(s), tropical storm(s)                                      | Tropical cyclone (hurricane/typhoon/cyclone)                                                      |
| storm, storms                                                                                | Storm, cold & winter weather **and** Tropical cyclone                                             |
| windstorm, blizzard, snow, winter, cold                                                      | Storm, cold & winter weather                                                                      |
| flood, floods, flooding, rain, rainfall, landslide(s), monsoon                               | Flood, rain & landslide                                                                           |
| wildfire(s), fire(s), bushfire(s)                                                            | Wildfire                                                                                          |
| heatwave(s), heat wave, heat                                                                 | Heatwave & heat record                                                                            |
| drought(s)                                                                                   | Drought & water scarcity                                                                          |
| ice, sea ice, glacier(s), iceberg(s), arctic, antarctic, antarctica, polar, poles, greenland | Sea ice, glaciers & polar                                                                         |
| sea level(s), rising seas, coast(s), coastal                                                 | Sea level & coasts                                                                                |
| coral(s), reef(s), marine, fish, bleaching, ocean heat, acidification                        | Ocean, coral & marine life                                                                        |
| el nino, la nina                                                                             | El Niño / La Niña                                                                                 |
| temperature(s), hottest, warmest                                                             | Global temperature & climate records                                                              |
| co2, carbon dioxide, methane, emissions, greenhouse                                          | Greenhouse gases & emissions                                                                      |
| cop, treaty, treaties, paris agreement, pledge(s), policy, summit(s)                         | Policy, diplomacy & COP summits                                                                   |
| renewable(s), solar, wind power, coal, energy                                                | Energy transition & finance                                                                       |
| court(s), lawsuit, tribunal, legal, ruling                                                   | Courts & legal action                                                                             |
| study, report, attribution, ipcc                                                             | Science, reports & attribution                                                                    |
| health, locust(s)                                                                            | Ecosystems, health & society                                                                      |
| humans doing, people doing, mortals doing, doing about                                       | Policy, diplomacy & COP summits **and** Energy transition & finance **and** Courts & legal action |

Plurals are listed as separate entries; there is no stemming.

### 12.3 Content checks (Phase 3, run in tests and CI)

Every curated `eventId` exists; every quiz correct option text appears in that entry's What
happened; no guide line in `templates.json` or `nodes.json` contains a cause phrase unless it is
attached to an event with a Climate link; every lexicon entry is already normalised; no lexicon
term is in two of `rude`, `repent`, `meta`, `count`; no `noMatch` line contains `don't know`,
`do not know` or `not sure`; every `noMatch` line names 2020, 2026 and the five exhibit titles;
every question in `templates.suggestions` gets an `answer` or `list` reply when run through the
matcher; every exhibit's `categories` are real category names; the 10 cause-mismatch rows and the
CL-2026-045 note are reported.

### 12.4 Seeded wording

Each session has a `seed` (D16). Where `templates.json` has several equivalent lines for the same
spot, the engine picks one with a small seeded random generator (for example mulberry32) started
from `seed + turn`. The seed **only** picks wording. It never changes which event, choice or
ending is chosen. The same seed and the same inputs always give the same responses, which is what
engine slice 5 tests.

## 13. API

### 13.1 Routes

| Method | Route                       | Body                              | Success                                                | Errors                  |
| ------ | --------------------------- | --------------------------------- | ------------------------------------------------------ | ----------------------- |
| POST   | `/api/sessions`             | `{ room: "changing-sea", seed? }` | `201` + view (`intro`)                                 | 400                     |
| GET    | `/api/sessions/:id`         | none                              | `200` + last view                                      | 400, 404                |
| POST   | `/api/sessions/:id/turns`   | `TurnRequest`                     | `200` + view                                           | 400, 404, 409, 413, 429 |
| POST   | `/api/sessions/:id/choices` | `{ choiceId }`                    | same as `turns` with `type: "choice"` (thin alias, D2) | same                    |

There is **no** `/ask` route (D21). This room's AI fallback (§17) runs inside the `/turns`
service, only on `noMatch`, and only when `AI_ENABLED` is on.

When the museum's gallery routes exist (root `CLAUDE.md` planned API), entering the
`changing-sea` gallery produces the same `intro` view, and `room` in `POST /api/sessions`
becomes the starting gallery. That join is a later integration task, not part of this room's
tests.

### 13.2 Requests (validated with Zod)

```ts
// POST /api/sessions
const startBody = z
  .object({
    room: z.literal('changing-sea'),
    seed: z.number().int().min(0).max(2_147_483_647).optional(), // default: random
  })
  .strict();

// params on every :id route
const sessionParams = z.object({ id: z.string().uuid() });

// POST /api/sessions/:id/turns
const turnBody = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('choice'),
      choiceId: z
        .string()
        .min(1)
        .max(100)
        .regex(/^[a-z0-9.-]+$/),
    })
    .strict(),
  z
    .object({
      type: z.literal('text'),
      text: z.string().trim().min(1).max(300),
    })
    .strict(),
]);
```

> **Rule (validation order).** `params` are checked before `body` (as `validate()` already does),
> and validation runs **before** the session lookup. So a bad body on an unknown session id is a
> `400`, not a `404`.

### 13.3 Response: `TurnResponse` (in `shared/`, D12)

```ts
type ReplyKind =
  | 'intro'
  | 'hub'
  | 'exhibit'
  | 'answer'
  | 'alreadyTold'
  | 'noMatch'
  | 'clarify'
  | 'meta'
  | 'offTopic'
  | 'rude'
  | 'flood'
  | 'repent'
  | 'noNeed'
  | 'quiz'
  | 'quizResult'
  | 'list'
  | 'ending'
  | 'aiAnswer'; // only when AI_ENABLED is on (§17)

interface Source {
  publisher: string;
  url: string;
  type: string;
}

interface Fact {
  eventId: string; // 'CL-2020-058'
  event: string; // Event
  year: number; // Year
  date: string; // Date (free text, never parsed)
  category: string;
  region: string;
  location: string;
  oceanLink: boolean; // Ocean link === 'Yes'
  whatHappened: string;
  humanImpact: string | null;
  climateLink: string | null; // 'Climate link (as stated by source)'
  notes: string | null;
  sources: Source[]; // 1 or 2
}

interface TurnResponse {
  sessionId: string;
  status: 'active' | 'flooded' | 'ended';
  turn: number;
  reply: {
    kind: ReplyKind;
    speaker: string; // guide id from guide.json
    text: string;
    factKind: 'history' | 'myth' | null; // 'history' when facts are shown, 'myth' for the intro, else null
    label: string | null; // 'AI, unverified' on an aiAnswer; null otherwise
  };
  facts: Fact[];
  list: null | { total: number; items: { eventId: string; event: string; year: number }[] }; // list replies only
  choices: { id: string; label: string }[];
  suggestions: string[]; // example questions the client can offer (meta, offTopic, noMatch)
  input: { mode: 'both' | 'none'; maxLength: 300 };
  quiz: null | { exhibitId: string; questionNumber: 1 | 2 | 3; of: 3; paused: boolean };
  progress: {
    exhibits: { id: string; title: string; entriesSeen: 0 | 1 | 2 | 3; token: boolean }[];
    tokens: number; // 0..5
    favourBand: 'warm' | 'neutral' | 'cold' | 'stormy';
  };
  effects: ('flood' | 'calm' | 'token')[];
  ending: null | { id: string; title: string; tokens: string[] }; // tokens = exhibit ids
}
```

- `input.mode` is `both` (click or type) in every view except the ending, where it is `none`.
- `quiz.paused` is `true` while flooded with a quiz in progress.
- `effects` only lists what **started** on this turn. A client keeps showing the storm while
  `status === 'flooded'`.

### 13.4 Errors (existing `HttpError` and `errorHandler`)

All errors use the existing `{ error: { code, message, details? } }` body.

| Status | `code`                 | When                                                             |
| ------ | ---------------------- | ---------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`     | Body or params fail Zod (empty text, > 300 chars, bad id…)       |
| 400    | `INVALID_JSON`         | Body is not valid JSON                                           |
| 404    | `SESSION_NOT_FOUND`    | Well-formed id, but no such session                              |
| 404    | `NOT_FOUND`            | No such route                                                    |
| 409    | `CHOICE_NOT_AVAILABLE` | `choiceId` not in the current view (incl. `leave` while flooded) |
| 409    | `VISIT_ENDED`          | Any turn after the ending                                        |
| 413    | `PAYLOAD_TOO_LARGE`    | Body over 10kb                                                   |
| 429    | `RATE_LIMITED`         | Over 120 requests a minute (existing limiter)                    |

### 13.5 Session store (Phase 5 defaults)

In memory (D1). Proposed limits, kept in config: sessions expire after **2 hours** without a turn,
and the store holds at most **1,000** sessions (the oldest idle one is dropped first). These
protect a small server from memory growth; they aren't decided yet (§16).

## 14. Edge cases

| Input                                          | Result                                                                                   | Example     |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------- |
| Empty or whitespace-only text                  | `400 VALIDATION_ERROR` (Zod trims, min 1). No state change.                              | 12          |
| Text of 301+ characters (after trimming)       | `400 VALIDATION_ERROR`. Exactly 300 is allowed.                                          | 12          |
| Body over 10kb                                 | `413 PAYLOAD_TOO_LARGE` from the existing JSON limit.                                    | 12          |
| Only punctuation, e.g. `"???"`                 | `200`, reply `clarify`, no change.                                                       | 12          |
| A year outside 2020–2026 ("volcanoes in 2019") | `noMatch`, suggestions, no favour change. An honest question is not off-topic.           | 06          |
| In range but no events ("El Niño in 2020")     | `noMatch`, as above.                                                                     | 06          |
| The same question again                        | The next untold matching event (+1). When all are told: `alreadyTold`, no favour change. | 05          |
| A choice that is not on screen                 | `409 CHOICE_NOT_AVAILABLE`, no change.                                                   | 12          |
| A badly formed `choiceId` (spaces, capitals)   | `400 VALIDATION_ERROR`.                                                                  | 12          |
| Unknown but well-formed session id             | `404 SESSION_NOT_FOUND`.                                                                 | 12          |
| Session id that isn't a UUID                   | `400 VALIDATION_ERROR`.                                                                  | 12          |
| Extra fields in the body                       | `400 VALIDATION_ERROR` (`.strict()`).                                                    | 12          |
| `leave` while flooded                          | `409 CHOICE_NOT_AVAILABLE`.                                                              | 09          |
| Rude message while flooded                     | `flood` reply, no further favour change.                                                 | 09          |
| Apology while not flooded                      | `noNeed`, no change, at any favour level.                                                | 13          |
| "sorry, you idiot"                             | Rude (rude is checked first).                                                            | (unit test) |
| Flood in the middle of a quiz                  | Quiz pauses; resumes at the same question after repenting.                               | 10          |
| Any turn after the ending                      | `409 VISIT_ENDED`; `GET` still shows the ending.                                         | 11          |
| A list question with more than 8 matches       | 8 names, then `and N more`; `hear.*` choices for the 8.                                  | 14          |
| A list question with exactly 8 matches         | All 8 names, no `and … more`.                                                            | 14          |
| "how many?" with nothing else                  | Not a list question; goes on to meta or off-topic.                                       | (unit test) |
| A vague question inside an exhibit             | That exhibit's categories come first in the sort.                                        | 15          |

## 15. Full server vs plain Express

This spec assumes the **full server** that is in the repo now: Zod, `HttpError`, `validate()`,
`errorHandler`, helmet, cors and the rate limiter. If the team strips the server back to plain
Express, **the behaviour, status codes and error bodies in this spec must stay exactly the same**,
so the examples still pass. Only how it is done changes:

| Full server (assumed)                                               | If stripped back to plain Express                                                                                              |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Zod schemas (§13.2) through `validate({ body, params })`            | Hand-written checks in each route: `typeof`, trim, length, regex, a UUID regex, and rejecting unknown keys. More code to test. |
| Throw `HttpError(status, code, message)`                            | `res.status(n).json({ error: { code, message } })` in each route, or a small helper. Easy to make inconsistent.                |
| `errorHandler` maps `INVALID_JSON` / `PAYLOAD_TOO_LARGE`            | Need our own error middleware for body-parser errors, or those return Express's default HTML.                                  |
| Content files checked by Zod at startup                             | Hand-written checks in the loader. The checks in §12.3 still have to run.                                                      |
| `express-rate-limit` gives `429 RATE_LIMITED`                       | Drop the 429 row from the examples, or write a simple counter.                                                                 |
| `TurnResponse` type in `shared/`                                    | Unchanged (it is only a TypeScript type).                                                                                      |
| `AI_ENABLED` / `AI_API_KEY` checked by Zod in `config/env.ts` (§17) | Read and check `process.env` by hand at startup; still fail fast if AI is on without a key.                                    |

The engine (§§5–11) doesn't depend on this choice at all.

## 16. Known limits and open points

- **Unknown words are ignored.** "Tell me about volcanoes" has no year, category, topic or known
  word, so it is **off-topic** (−1). Adding words to `topic` or `synonyms` fixes cases like this
  without code.
- **No stemming or spelling help.** "huricane" won't match. Fuzzy matching could be a later extra
  (DECISIONS D7, options).
- **Session store limits** (§13.5) are defaults for Phase 5, not yet agreed.
- **Museum integration:** how `POST /api/sessions` and the gallery routes join up, and whether a
  museum-wide trial reads this room's tokens, is for the team once the other rooms exist.
- **Quiz wording** (§9.1) and the guide's lines are authored content: please review them before
  Phase 3.
- **Root `CLAUDE.md` and AI:** updated to match D21 (the AI extra is approved, runs only as a
  `noMatch` fallback inside `/turns`, and `/ask` is no longer reserved).

## 17. Optional AI fallback (off by default)

(D21.) The module leader approved an optional AI extra. It is built **later**, after the core
room works. This section is the design only, so the core code leaves room for it.

> **Rule (AI fallback).**
>
> - **Off by default.** It runs only when the env var `AI_ENABLED=true`. **All tests and examples
>   run with it off**, so every expected reply in `examples/` is the core engine's.
> - **Only on `noMatch`.** It runs only when the engine's reply to a **text** input is `noMatch`
>   (including a list question with no matches), and never while flooded. It never replaces any
>   other reply kind, and never runs for choices.
> - **Server only, outside the engine.** A separate service (`server/src/services/aiFallback.ts`)
>   is called by the `/turns` service **after** the engine. The engine stays pure (and ESLint
>   already stops it doing I/O). The frontend never calls an AI service and never sees a key.
> - **Keys in env vars only.** `AI_API_KEY` lives in `server/.env` (git-ignored) and is read only
>   in `config/env.ts`, which fails at startup if `AI_ENABLED` is on and the key is missing.
>   `.env.example` lists both names with no values.
> - **What is sent:** only the visitor's text (≤ 300 characters), with fixed instructions to answer
>   briefly about climate and the oceans. No session id, no state, nothing else about the visitor.
>   The visitor's text is sent as **separate user content**, never joined onto the instructions
>   (no string concatenation or templating), so typed text like "ignore your instructions" cannot
>   rewrite them. The instructions are a constant in the service and contain no visitor data.
> - **What comes back:** reply kind `aiAnswer`, `label: "AI, unverified"`, `factKind: null`,
>   `facts: []`, `list: null`, the same 3 suggestions, text cut to at most 600 characters, and sent
>   as plain text (the client must not render it as HTML). No favour change, nothing added to
>   `told`, and it never counts towards quiz, tokens or endings.
> - **Failure is invisible.** Timeout (5 seconds), error, or a refused request → the original
>   `noMatch` view is returned unchanged. The visitor never sees an AI error.
> - **Its own rate limit** (for example 10 a minute per visitor), on top of the existing limiter,
>   to cap cost.
> - **Tests:** a unit test of the service with a fake AI client, and one API test with a stub that
>   checks the `aiAnswer` shape and label. Neither makes a real network call.

Which AI provider to use, and whether it needs a new package (Node's built-in `fetch` may be
enough), is decided when it is built. Adding any package is the team's call (root `CLAUDE.md`).
