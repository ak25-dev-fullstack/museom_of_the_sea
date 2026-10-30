# Museum of the Sea

An interactive conversational web app. You are a visitor to the Museum of the Sea, and your
guide leads you through galleries about the ancient Greeks and the sea. You talk to them
through branching dialogue, and your choices change their mood, what you learn, which galleries
unlock, and how your visit ends.

Built for the Bournemouth University Level 5 coursework _"Historical Figure – Interactive
Conversational Experience"_. The conversation is driven entirely by our own JSON content and
dialogue engine, with no generative AI at the core.

> **Status:** project scaffold (milestone M1). The health check works end to end; the
> conversation engine, session routes and gallery screens are next.

## Tech stack

| Layer    | Tools                                                                      |
| -------- | -------------------------------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite                                                 |
| Backend  | Node.js, Express 5, TypeScript, Zod                                        |
| Security | helmet, CORS, express-rate-limit, input validation, central error handling |
| Testing  | Vitest, Supertest (API), React Testing Library (components)                |
| Quality  | ESLint, Prettier, GitHub Actions CI                                        |

## Getting started

### Prerequisites

- **Node.js 22 LTS or newer** (see `.nvmrc`). Odd-numbered versions such as Node 23 are not
  supported.
- npm 10 or newer.

### Install

```bash
git clone <repo-url>
cd museum-of-the-sea
npm install
cp server/.env.example server/.env
```

`server/.env` holds local settings and secrets and is git-ignored. Never commit it.

### Run in development

```bash
npm run dev
```

This starts both apps:

- Client: http://localhost:5173
- API: http://localhost:3001 (the client reaches it through the Vite proxy at `/api`)

The home page shows **"Server: online"** when the two are connected.

## Scripts

Run these from the repo root.

| Command                | What it does                                         |
| ---------------------- | ---------------------------------------------------- |
| `npm run dev`          | Start the API and the client with hot reload         |
| `npm test`             | Run all server and client tests                      |
| `npm run lint`         | Lint all code with ESLint                            |
| `npm run typecheck`    | Type-check shared, server and client                 |
| `npm run format`       | Format all files with Prettier                       |
| `npm run format:check` | Check formatting without changing files (used in CI) |
| `npm run build`        | Production build of the client into `client/dist`    |
| `npm start`            | Start the API without hot reload                     |

To run one workspace's tests, use `npm test -w server` or `npm test -w client`. For watch
mode, use `npm run test:watch -w server`. For a coverage report, use
`npm run test:coverage -w server`.

## API

| Method | Route         | Description                                      |
| ------ | ------------- | ------------------------------------------------ |
| GET    | `/api/health` | Health check: `{ "status": "ok", "uptime": 12 }` |

Every error response has the same shape:

```json
{ "error": { "code": "NOT_FOUND", "message": "No route for GET /api/nope" } }
```

## Project structure

```
.
├── client/                  React frontend
│   └── src/
│       ├── api/             typed API client (the only place that calls fetch)
│       ├── assets/          media bundled by Vite (e.g. intro storm video)
│       ├── audio/           generated sound effects (Web Audio storm and thunder)
│       ├── components/      reusable UI components (e.g. StormScene background)
│       ├── content/         UI wording that may change (e.g. intro text)
│       ├── pages/           top-level screens (IntroPage, AuthPage)
│       ├── state/           client-side state (context/reducer)
│       ├── styles/          global styles and design tokens
│       └── test/            test setup
├── server/                  Express backend
│   ├── content/             dialogue and gallery data (JSON)
│   ├── src/
│   │   ├── app.ts           builds the Express app (used by tests)
│   │   ├── index.ts         starts the server
│   │   ├── config/          environment variable loading and validation
│   │   ├── content/         content schema and loader
│   │   ├── engine/          conversation engine (pure functions)
│   │   ├── middleware/      validation, 404 and error handling
│   │   ├── routes/          API routes
│   │   └── services/        session store
│   └── tests/               api/, engine/ and content/ tests
├── shared/                  TypeScript types shared by client and server
├── .github/                 CI workflow, PR and issue templates
├── CLAUDE.md                project context for Claude Code
└── README.md
```

## Contributing

1. Pick or create an issue, and assign yourself.
2. Create a branch: `feat/<issue-number>-short-name`, e.g. `feat/7-engine-conditions`.
3. Commit small, focused changes.
4. Open a pull request using the template, and link the issue (`Closes #7`).
5. Get one approving review from a teammate. CI must pass before merging.

Write JSDoc/TSDoc comments for significant functions, components and modules. Add tests with
every feature.

## Team

| Member | Area                                   |
| ------ | -------------------------------------- |
| _TBC_  | Conversation engine and content schema |
| _TBC_  | API, sessions and security             |
| _TBC_  | Frontend core and dialogue UI          |
| _TBC_  | UX design, accessibility and CI        |
