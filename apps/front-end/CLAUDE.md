@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The Next.js (App Router) frontend for Meme Battle Arena, a learning project (see `../back-end/docs/TECHSPEC.md`, especially §8–9) practicing Redux Toolkit, Tailwind v4, and Storybook-driven widgets on top of App Router. `TECHSPEC.md` is the source of truth for intended behavior — read it before non-trivial changes.

It's part of a yarn workspaces monorepo: this app depends on `@meme-battle-arena/contracts` (shared types/error codes, built separately — see root `CLAUDE.md`) and talks to the Express API in `apps/back-end`.

## Commands

```
yarn dev      # next dev
yarn build    # next build — NEXT_PUBLIC_* vars are baked in here, not read at runtime
yarn start    # next start
yarn lint     # eslint
```

No test script exists in this app. Requires the backend API running (see root `CLAUDE.md` / `docker-compose.yml`) and `.env.local` with `NEXT_PUBLIC_API_BASE_URL` pointing at it.

If `@meme-battle-arena/contracts` types seem stale, rebuild that package (`yarn build` in `packages/contracts`) — this app consumes its compiled `dist`, not live workspace source.

## Architecture

### Thin pages, fat layouts
`src/app/**/page.tsx` files are intentionally thin: each renders a component from `src/layout/<name>/index.tsx`, paired with `src/layout/<name>/index.hook.ts` for that page's data/state logic (Redux dispatches, derived state, handlers). When changing a page's behavior, the hook is almost always the file to edit, not the page or the layout component.

`(app)`-area pages are wrapped by `AuthGuard` (`src/components/guards/auth-guard.tsx`), which trusts a locally-decoded JWT `exp` rather than pinging the server to validate the session — the first real API call is what triggers the refresh flow on an actually-expired token. The auth pages (login, register, forgot-password) use the mirror-image `GuestGuard` (`src/components/guards/guest-guard.tsx`) to send already-logged-in visitors away instead; `reset-password` deliberately uses neither guard, since following a reset link while logged in is a legitimate flow.

### Redux (`src/store/slices/`)
- `common/auth.slice.ts` — access token + user.
- `memes.slice.ts`, `leaderboard.slice.ts` — standard TTL-cached list slices (check `src/lib/cache.ts` before assuming a thunk always refetches vs. serves cached data).
- `arena.slice.ts` — the one non-boilerplate state machine in the app:

```
idle → loading → ready → voting → revealed → (loop back to loading)
                              ↘ error
                    loading ↘ empty   (NOT_ENOUGH_MEMES)
```

`castVote` sets `optimisticWinnerId` synchronously on `pending`, before the server responds, so the UI can animate the selection immediately. On a rejected vote with error code `MATCHUP_NOT_PENDING` (the matchup expired or was already voted elsewhere), the thunk itself dispatches `fetchNextMatchup` rather than surfacing a dead-end error to the user — don't add separate error-recovery UI for that case, it's already handled in the thunk.

### API layer
`src/lib/api/endpoints.ts` (`API_ENDPOINTS.{AUTH,MEMES,BATTLES,LEADERBOARD}`) → `src/lib/api/client.ts` (axios instance with single-flight token refresh; `RETRY_EXCLUDED_ENDPOINTS` stops auth endpoints from retrying into a refresh loop) → one service per backend module in `src/lib/api/services/` (`auth.service.ts`, `meme.service.ts`, `battle.service.ts`, `leaderboard.service.ts`). Error codes returned by the API are mapped to user-facing messages in `src/lib/errors/`, keyed off the shared `ERROR_CODES` enum from `@meme-battle-arena/contracts` — add new mappings there, not inline at call sites.

### Widgets: two regimes
Pages **rebuilt from the `docs/UI-design/*.html` mockups** (currently landing, leaderboard, and login) are hand-built in-app: Tailwind + the `mba-*` design tokens from `globals.css`, page-specific pieces co-located in the page's `src/layout/<name>/` folder, and shared chrome in `src/components/shell/` (`SiteHeader` — sticky nav + user chip + theme toggle, used by landing and leaderboard; `AuthTicketShell` + `GoogleSignInButton` — the "admit-one ticket" card shell used by login, register, forgot-password, and reset-password, the last two having no mockup of their own and instead deriving from `login.html`'s ticket design). These pages deliberately do **not** use `@ntrs` components.

Pages **not yet redesigned** (arena, upload, my-memes) still follow the original TECHSPEC §9 rule: visual components (`MemeCard`, `VoteButton`, `BattleStage`, `UploadDropzone`, `Button`/`StatPill`/`PageHeader`) come from the external Storybook monorepo as `@ntrs/core` / `@ntrs/meme`, and `src/layout/**` only wires them to Redux/routing. When one of those pages gets rebuilt from its mockup, it moves to the first regime.

### Google sign-in
`NEXT_PUBLIC_GOOGLE_CLIENT_ID` (frontend, build-time) gates the "Continue with Google" button on login/register — unset, the button and its divider simply don't render (see `src/layout/login/index.hook.ts`'s `googleEnabled`). `src/lib/google-identity.ts` lazily loads the Google Identity Services script and runs the popup auth-code flow; the resulting one-time code is exchanged server-side (`POST /auth/google`), never verified client-side.
