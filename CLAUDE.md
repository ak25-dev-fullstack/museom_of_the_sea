# CLAUDE.md: Museum of the Sea

Context for Claude Code sessions in this repo. Humans: see `README.md`.

## Project

Bournemouth University, Level 5 Software Engineering group coursework (team of four):
**"Historical Figure – Interactive Conversational Experience"**, worth 70% of the unit.
Deadline: **15 December 2026, 12:00 midday**. Marked on the app and source code, a 6-minute
demo video, a 12-page group report, and the GitHub history.

**Concept:** the user is a visitor to the Museum of the Sea. A guide/curator (currently
Poseidon; see open decisions) leads them through galleries about the ancient Greeks and the sea.
The user talks to the guide through branching dialogue. Their choices change the guide's favour,
what they learn, which galleries unlock, a final quiz ("the trial"), and which ending they reach.
Content must be historically grounded and label **myth** and **historical fact** separately.

## Hard rules (from the brief: do not break these)

- **No LLM or generative AI for the core conversation.** Dialogue comes from our JSON content
  plus our own engine. AI may only be an optional extra, and any AI call must go through
  Express, **never from the frontend**, with keys in env vars only.
- The backend must do real work (state, logic, validation). It must not be a static file server.
- User choices must genuinely change the conversation (branching, state, consequences, unlocks).
- Responsive UI for mobile and desktop.
- JSDoc/TSDoc on significant functions, components and modules (the top marking band asks for it).
- No secrets in the repo. Only `.env.example` is committed.
- Every team member's contributions must be visible in GitHub: branches, PRs, issues, reviews.

## Marking weights (prioritise accordingly)

- **40% Architecture & implementation:** design, frontend/backend integration, quality,
  technical depth beyond taught examples.
- **30% UX & interaction:** engaging, varied conversation; polished, consistent, responsive UI.
- **30% SE practice:** requirements and design rationale, GitHub collaboration, systematic
  testing, security, error handling, robustness.

## Tech stack (decided)

- TypeScript everywhere (strict). npm workspaces monorepo: `shared/`, `server/`, `client/`.
- Server: Express 5, Zod (validation), helmet, cors, express-rate-limit, run with `tsx`.
- Client: React 19 + Vite. The Vite dev server proxies `/api` to `localhost:3001`.
- Tests: Vitest everywhere; Supertest (API); React Testing Library (components).
- ESLint (flat config at the root) + Prettier; GitHub Actions CI (`.github/workflows/ci.yml`).
- **Sessions are in memory** on the server (decided). They are lost on restart, which is
  acceptable.

## Architecture

**The server is in charge.** The engine and all game state live on the server. The client
only receives the _current node view_ (the text plus currently available choices), never the
full dialogue graph. This stops cheating and spoilers, and gives the backend real work.

```
React UI ──fetch──▶ Express API ──▶ in-memory session store
  (view only)        │ validate (Zod)
                     ▼
              Conversation engine (pure functions, no Express imports)
                     ▲
              Content loader ◀── server/content/*.json (schema + graph checked at startup)
```

- `server/src/app.ts` builds the app (no `listen`) so Supertest can use it; `index.ts` listens.
- Middleware order: helmet → cors → json (10kb limit) → rate limit → routes → notFound → errorHandler.
- Errors: throw `HttpError(status, code, message)`. `errorHandler` returns
  `{ error: { code, message, details? } }` (the `ApiErrorBody` type in `shared`).
- Validate input with `validate({ body, params })` from `server/src/middleware/validate.ts`.
- The engine must stay pure: `(state, input) → newState`. No I/O and no Express, so it is easy
  to unit-test.
- `shared/` holds **only** API request/response types. Content types belong to the server.
- The client talks to the API **only** through `client/src/api/client.ts`.

### Planned API

| Method | Route                                          | Notes                                                |
| ------ | ---------------------------------------------- | ---------------------------------------------------- |
| GET    | `/api/health`                                  | done                                                 |
| POST   | `/api/sessions`                                | start a visit → session id + first node view         |
| GET    | `/api/sessions/:id`                            | resume                                               |
| GET    | `/api/sessions/:id/galleries`                  | galleries with locked/unlocked status                |
| POST   | `/api/sessions/:id/galleries/:galleryId/enter` | 403 if locked                                        |
| POST   | `/api/sessions/:id/choices` `{ choiceId }`     | 400 for bad input, 409 if the choice isn't available |
| POST   | `/api/sessions/:id/trial/answers`              | final quiz                                           |
| POST   | `/api/sessions/:id/ask`                        | _optional_ AI extra, off by default, backend only    |

### Dialogue content schema (agreed shape; implement with Zod in `server/src/content/`)

```json
{
  "id": "sounion.columns",
  "gallery": "sounion",
  "speaker": "poseidon",
  "text": {
    "default": "These Doric columns were raised around 440 BC…",
    "variants": [
      { "when": [{ "type": "favour", "op": "<", "value": 0 }], "text": "Look, then. Quickly." }
    ]
  },
  "kind": "history",
  "source": "Temple of Poseidon, Sounion, c. 444–440 BC",
  "choices": [
    {
      "id": "ask-why-cape",
      "label": "Why build a temple on a cliff edge?",
      "next": "sounion.cape",
      "conditions": [],
      "effects": [
        { "type": "favour", "delta": 1 },
        { "type": "learn", "fact": "sounion-landmark" }
      ]
    }
  ]
}
```

- `kind`: `"history" | "myth"`. Every node must say which it is; history nodes should carry a `source`.
- Conditions: `favour` (op + value), `flag`, `knows` (a fact), `visited` (a node), `galleryUnlocked`.
- Effects: `favour` (delta), `setFlag`, `learn`, `unlockGallery`, `goto`.
- Visitor state: `{ currentNodeId, favour, flags, knowledge[], visited[], unlockedGalleries[], trialScore, ending }`.
- A graph checker (run in tests/CI) must ensure: no broken `next` links, no unreachable nodes,
  and every gallery can reach at least one ending.

## Team split and milestones

| Person | Technical area                                                                               | Also              |
| ------ | -------------------------------------------------------------------------------------------- | ----------------- |
| A      | Engine: schema, loader, conditions/effects, endings, graph checker, engine tests             | Gallery 1 content |
| B      | API & security: routes, validation, session store, security middleware, Supertest            | Gallery 2 content |
| C      | Frontend core: API client, state, DialoguePanel, ChoiceList, FavourMeter, Journal, RTL tests | Gallery 3 content |
| D      | UX & DevOps: design system, responsive layout, a11y, GalleryMap, Trial/Ending views, CI      | Gallery 4 content |

Milestones: M1 foundations (weeks 1–2) → M2 core loop (3–4) → M3 content and progression
(5–6) → M4 endings and hardening (7) → M5 README, video and report (8).
Branches: `feat/<issue#>-short-name`; merge to `main` only through a PR with one approving review.

## Open decisions (check before relying on these)

- **Historical figure:** Poseidon is a god, not a historical figure, which is a risk against the
  brief. The team is to ask the module leader. Fallback: a real guide (e.g. Themistocles,
  Pytheas of Massalia, Herodotus), with Poseidon as an exhibit subject. Keep content and
  wording easy to swap; don't hard-code "Poseidon" outside content files.
- Final gallery list (candidates: Temple of Sounion, Greek seafaring, Isthmian Games,
  shipwrecks, sea creatures; plan 4 core + 1 secret).
- Whether to build the optional AI extra at all.
- GitHub repo owner. The folder is not yet a git repo.

## Working conventions for Claude

- Commands: `npm run dev`, `npm test`, `npm run lint`, `npm run typecheck`,
  `npm run format`, `npm run build` (all from the repo root).
- Run `npm test`, `npm run lint` and `npm run typecheck` before calling work done.
- Add tests with every engine change, route and significant component.
- Add JSDoc/TSDoc on new modules, exported functions and components.
- **Keep `README.md` up to date** whenever setup, scripts, routes or the folder structure change.
- This is assessed group work: help the team learn and keep each member's contributions their
  own. Prefer explaining and reviewing over writing whole features nobody asked for.
- npm gotcha: npm 11.4 crashes (`Cannot read properties of null (reading 'edgesOut')`) on
  this repo. Use Node 22/24 LTS with a current npm, or `npx npm@latest install`.
