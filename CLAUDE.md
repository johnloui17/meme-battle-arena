# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Meme Battle Arena: users upload memes and vote in head-to-head matchups; an ELO leaderboard ranks them. It's a learning project (see `TECHSPEC.md`) whose real goal is practicing Next.js App Router, Redux Toolkit, Express, Storybook, Tailwind v4, and Docker together per a shared architecture standard. **`TECHSPEC.md` is the source of truth for intended behavior** — read it before making non-trivial changes; this file only covers what the standard checklist items ask for (commands + big-picture architecture).

Yarn workspaces monorepo: `apps/back-end` (Express API), `apps/front-end` (Next.js web app), `packages/contracts` (shared types, published as `@meme-battle-arena/contracts`).

## Commands

There are no root-level scripts — run everything from the relevant workspace.

**Backend** (`apps/back-end`):
```
yarn dev                          # tsx watch src/index.ts
yarn build                        # tsc + copy SQL migrations into dist
yarn typecheck                    # tsc --noEmit
yarn test                         # vitest run
yarn test battle.logic            # run a single test file (vitest run <pattern>)
```
Requires a running Postgres (`docker compose up db`) and a `.env` (see `.env.example`: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `UPLOADS_DIR`, `WEB_ORIGIN`, `PORT`). SQL migrations in `src/db/migrations/*.sql` run at boot via `src/db/migrate.ts` — no migration framework, just numbered plain-SQL files.

**Frontend** (`apps/front-end`):
```
yarn dev                          # next dev
yarn build                        # next build
yarn lint                         # eslint
```
No test script exists for the frontend. `NEXT_PUBLIC_API_BASE_URL` and other `NEXT_PUBLIC_*` vars are baked in at build time, not read at runtime — changing them requires a rebuild (relevant when working with the Docker image).

**Contracts** (`packages/contracts`): `yarn build` (tsup, emits CJS + `.d.ts` to `dist/`). Both apps import from `dist`, so after editing `src/entities.ts` / `error-codes.ts` / `pagination.ts` you must rebuild this package before the apps pick up the change (no live workspace linking of source).

**Full stack:** `docker compose up` builds/runs `db` + `back-end` (web is not yet in `docker-compose.yml` — currently frontend runs standalone via `yarn dev` against the composed API/db).

## Architecture

### Shared contract, one direction of truth
`packages/contracts/src/` defines `Meme`, `Matchup`, `VoteResult`, `User`, `PaginatedResponse<T>`, and `ERROR_CODES` — both apps import these instead of redefining shapes. The wire format is snake_case; error codes are a fixed enum shared by backend responses and the frontend's `lib/errors` (which maps each code to a user-facing message).

### Backend: route → controller → service → repository
`apps/back-end/src/modules/{auth,meme,battle,leaderboard}/` each follow `*.routes.ts → *.controller.ts → *.service.ts → *.repository.ts`, with `*.schemas.ts` (zod) validated by the `validate` middleware. Errors are thrown as `ApiError` and normalized by the central `error-handler` middleware; async route handlers are wrapped in `asyncHandler`.

The two things worth understanding before touching them:

- **Matchup dealing + voting (`battle` module) is the core invariant of the app.** `POST /battles/next` server-deals a matchup (a `matchups` row with a 5-minute expiry) rather than trusting the client to say which two memes it saw — this is what makes "one vote per matchup" a DB constraint (`UNIQUE` on `votes.matchup_id`) instead of app bookkeeping, and it's why a matchup can't be replayed or invented client-side. `castVote` runs in one transaction: locks the matchup row (`FOR UPDATE`), validates it's `pending`/unexpired/owned by the caller, locks both meme rows in a consistent id order (deadlock avoidance), applies the ELO update (K=32, `packages/back-end/src/modules/battle/battle.logic.ts` — the pure, unit-tested part), and writes the vote atomically.
- **Uploads (`meme` module)** write to disk via multer under `UPLOADS_DIR`, renamed to `<uuid><ext>` (never the client filename), then are sniffed by magic bytes (`file-type`) post-write — the declared MIME type is never trusted. Files are served back via `express.static` at `/uploads/...`.

### Frontend: thin pages, fat layouts, widgets live outside this repo
`src/app/**/page.tsx` files are thin and just render a component from `src/layout/<name>/index.tsx`, paired with `src/layout/<name>/index.hook.ts` for the page's data/state logic (Redux dispatches, local state). `(app)`-area pages are wrapped by `AuthGuard` (`src/components/guards/auth-guard.tsx`), which trusts a locally-decoded JWT `exp` and lets the first real API call trigger the refresh flow rather than pinging the server just to validate the session.

**Redux (`src/store/slices/`)**: `common/auth.slice.ts` (token + user), `arena.slice.ts`, `memes.slice.ts`, `leaderboard.slice.ts` (the latter two are TTL-cached list slices — check `src/lib/cache.ts` before assuming a thunk always refetches). The `arena` slice is the one non-boilerplate state machine in the app:

```
idle → loading → ready → voting → revealed → (loop back to loading)
                              ↘ error
                    loading ↘ empty   (NOT_ENOUGH_MEMES)
```

`castVote` sets `optimisticWinnerId` synchronously on `pending` (so the UI can animate the selection before the server responds), and on a rejected vote with `MATCHUP_NOT_PENDING` (the matchup expired/was already voted), the thunk itself dispatches `fetchNextMatchup` rather than surfacing a dead-end error.

**API layer**: `src/lib/api/endpoints.ts` (`API_ENDPOINTS.{AUTH,MEMES,BATTLES,LEADERBOARD}`) → `src/lib/api/client.ts` (axios, single-flight refresh — `RETRY_EXCLUDED_ENDPOINTS` prevents refresh-loop retries on auth endpoints themselves) → one service per backend module in `src/lib/api/services/`.

**Widgets are not in this repo.** Per `TECHSPEC.md` §9, all visual components (`MemeCard`, `VoteButton`, `BattleStage`, `LeaderboardTable`, `UploadDropzone`, plus generic `Button`/`StatPill`/`PageHeader`/`AppShell`) live in an external shared Storybook monorepo and are consumed as the `@ntrs/core` and `@ntrs/meme` npm packages (design tokens included — `apps/front-end` imports `@ntrs/core/tokens.css` rather than defining its own). Anything in `src/layout/**` that wires those components to Redux/routing does belong in this repo; new/changed visual components do not — they're developed and storied in the other repo first.

### Data model
Postgres tables (`users`, `refresh_tokens`, `memes`, `matchups`, `votes`) and the full ELO/matchup-selection algorithm are documented in `TECHSPEC.md` §4 — read it there rather than re-deriving from migrations if you need the selection/rating logic explained.
