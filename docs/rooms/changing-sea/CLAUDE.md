# The changing sea room

Rules for any work on this room, where Poseidon talks about what is happening to the world's
climate and oceans (2020–2026) and what humans are doing about it. These add to the root
`CLAUDE.md`.

- **Source of truth:** `research/Poseidon_Climate_Events_2020-2026.xlsx` (366 events, each with
  at least one source). Room data is generated from it by an import script. Never hand-edit
  generated files; fix the spreadsheet or the script and re-run it.
- **Read the CSVs, not the .xlsx:** `research/events.csv` and `research/yearly-indicators.csv`
  are exact exports of the spreadsheet's two sheets, readable without any package. Temperature
  figures in the indicators come from different datasets and are not exactly comparable
  (2020's NASA figure uses a 1951–1980 baseline).
- **Facts are shown word for word.** Poseidon's lines can wrap a fact in his voice, but never
  change its numbers, dates, names or places.
- **Only claim a cause when the data does.** Say climate change caused or worsened an event only
  when that event's "Climate link" field is filled. Otherwise describe what happened without
  claiming a cause.
- **Every fact carries its source** (publisher and URL) in the API response.
- **2026 figures are provisional.** Keep the caveats from the spreadsheet's Notes column.
- **No LLM in the core conversation** (root `CLAUDE.md`). Matching questions, choosing events,
  mood and quizzes are all our own rules and data.
- **No logins or accounts** for this room for now. Visits are anonymous sessions.
- The plan and current phase are in `PLAN.md`. The conversation spec will be
  `CONVERSATION_SPEC.md` (Phase 1).
