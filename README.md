# Museum of the Sea

> ## 👀 Teammates: preview the storm intro on your computer
>
> This branch (`aliya-idea-gen`) adds the opening intro (stormy sea video, Poseidon
> rising, thunder) and the login page. It is **not merged into `main`** yet. To try it:
>
> **1. Check you have Node.js 22 or newer** (run `node -v`). If not, install the LTS
> version from https://nodejs.org.
>
> **2. Get the branch.**
>
> If you have **not** cloned the repo yet:
>
> ```bash
> git clone https://github.com/ak25-dev-fullstack/museom_of_the_sea.git
> cd museom_of_the_sea
> git switch aliya-idea-gen
> ```
>
> If you **already** have the repo (commit or stash your own changes first):
>
> ```bash
> cd museom_of_the_sea
> git fetch origin
> git switch aliya-idea-gen
> git pull
> ```
>
> **3. Install and start** (from the repo root):
>
> ```bash
> npm install
> cp server/.env.example server/.env   # first time only
> npm run dev
> ```
>
> If `npm install` crashes with `Cannot read properties of null (reading 'edgesOut')`,
> run `npx npm@latest install` instead.
>
> **4. Open http://localhost:5173** in Chrome, Edge, Firefox or Safari.
> **Turn your sound on**, then click **Enter the storm**. Try **Skip intro**, both
> **New user** and **Existing user**, and resize the window to phone size.
> Stop the app with `Ctrl + C` in the terminal.
>
> **5. Go back to your own work** with `git switch main` (or your own branch).
>
> Feedback is welcome: leave a comment on the pull request or message Aliya.
> The login form is front end only for now (nothing is saved).

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
git clone https://github.com/ak25-dev-fullstack/museom_of_the_sea.git
cd museom_of_the_sea
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

The site opens on the storm intro, followed by the login page (front end only for now).

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
