# Tech Spec — Meme Battle Arena

> Project 1 of the 20-project roadmap (`Docs/PROJECTS.md`). Users upload memes and vote in head-to-head matchups; an ELO leaderboard crowns the champions.
>
> This spec applies the standard architecture (`Docs/ARCHITECTURE-BOILERPLATE.md`) to this project. Where this document is silent, the boilerplate is the source of truth. Deviations from the standard are listed explicitly in §2.

---

## 1. Goals & Scope

**Primary goal: learn the stack.** The app is the excuse; the deliverable is you being comfortable with Next.js App Router, Redux Toolkit, Express, Storybook, Tailwind, and Docker working together the way the architecture standard prescribes. When a feature decision trades "more product" against "more learning per hour," pick learning — build the simple version yourself rather than installing a library that hides the concept.

**Tech → where you learn it in this project**

| Tech | The concept this project forces you to practice |
|---|---|
| **Express** | multipart file uploads (multer), route→controller→service→repository layering, transactional writes, the error envelope |
| **Redux Toolkit** | a real state machine (`arena` slice), optimistic updates + rollback, TTL-cached list slices, thunks |
| **Next.js** | App Router route groups, thin-page/fat-layout, `"use client"` boundaries, SSR-safe browser API guards |
| **Storybook** | first widgets built in isolation *before* wiring them into pages; stories as the component contract |
| **Tailwind v4** | design tokens in `globals.css`, dark mode, animation (vote reveal) |
| **Docker** | compose with a database + a persistent uploads volume; env vars baked at build vs read at runtime |

**What we're building**

- Upload a meme image (title + file).
- The Arena: the server deals two memes, you tap the winner, ratings update, next pair appears.
- ELO-style ratings (start 1200, K=32) recalculated transactionally on every vote.
- A leaderboard ranked by rating, with win/loss records.
- Simple email + password accounts (needed for upload ownership and one-vote-per-matchup).

**What it teaches (why each piece exists)**

| Learning goal | Where it lands |
|---|---|
| File uploads in Express | `multer` in the meme module (§7.3) |
| Redux voting state | `arena` slice with optimistic vote + rollback (§8.3) |
| First Storybook components | `MemeCard`, `VoteButton`, `LeaderboardTable` widgets (§9) |

**Out of scope (v1)** — comments, reporting/moderation queues, meme categories/tags, social login, S3/CDN storage, real-time updates, mobile app. Evolution paths in §12.

---

## 2. Deviations from the Architecture Standard

The boilerplate targets a multi-tenant B2B admin dashboard. This is a single-persona toy app, so we deliberately drop:

| Standard feature | Decision here | Why |
|---|---|---|
| Multi-tenancy (`tenant_id` scoping) | **Dropped.** One flat user pool. | No tenants exist. Repositories scope by `user_id` where ownership matters. |
| Permission system (`/authz/resolve`, `/authz/check`, `requirePermission`, `PermissionWrapper`) | **Dropped.** Two implicit rules only: must be logged in; may only delete your own meme. | A full RBAC catalog for a meme app is noise. Ownership checks live in the service layer. |
| `/admin/*` persona + section shells | **Dropped.** Single `(app)` area. | One persona. |
| Impersonation slice | **Dropped.** | N/A |
| Helm deployment values | **Deferred.** `docker-compose` only. | Beginner project; compose is the deployment target. |

Everything else — monorepo layout, contracts package, error/pagination envelopes, snake_case on the wire, thin-page/fat-layout, TTL slices, single-flight token refresh, route→controller→service→repository, widget/story rules — applies as written in the boilerplate.

---

## 3. Repository Layout

```
meme-battle-arena/
├── package.json                  # workspaces: ["apps/*", "packages/*"]
├── docker-compose.yml            # web + api + postgres (+ uploads volume)
├── apps/
│   ├── web/                      # Next.js App Router + Redux + Tailwind v4 + Storybook
│   └── api/                      # Express + TypeScript
├── packages/
│   └── contracts/                # shared: entities, ERROR_CODES, pagination types
│       └── src/{entities.ts, error-codes.ts, pagination.ts}
└── TECHSPEC.md
```

---

## 4. Domain Model & Database (Postgres)

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE refresh_tokens (              -- hashed, rotated on every use (boilerplate §22.1)
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ
);

CREATE TABLE memes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id    UUID NOT NULL REFERENCES users(id),
  title          TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  image_path     TEXT NOT NULL,            -- relative path under the uploads volume
  rating         INTEGER NOT NULL DEFAULT 1200,
  wins           INTEGER NOT NULL DEFAULT 0,
  losses         INTEGER NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'active',   -- 'active' | 'deleted'
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_memes_rating ON memes (rating DESC) WHERE status = 'active';

CREATE TABLE matchups (                    -- server-dealt pairs; a vote must reference one
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meme_a_id    UUID NOT NULL REFERENCES memes(id),
  meme_b_id    UUID NOT NULL REFERENCES memes(id),
  issued_to    UUID NOT NULL REFERENCES users(id),
  status       TEXT NOT NULL DEFAULT 'pending',    -- 'pending' | 'voted' | 'expired'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL               -- created_at + 5 minutes
);

CREATE TABLE votes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matchup_id      UUID NOT NULL UNIQUE REFERENCES matchups(id),  -- one vote per matchup, enforced by DB
  voter_id        UUID NOT NULL REFERENCES users(id),
  winner_meme_id  UUID NOT NULL REFERENCES memes(id),
  rating_delta    INTEGER NOT NULL,        -- points transferred, for history/debugging
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Why server-issued matchups instead of "POST the two meme ids you saw":** the client can't invent or replay pairs, one-vote-per-matchup is a DB constraint instead of application bookkeeping, and expiry prevents hoarding a favorable pair. This is the project's main "think about cheating" lesson.

### ELO rating

On each vote, inside a single transaction (`SELECT ... FOR UPDATE` on both memes):

```
expected_winner = 1 / (1 + 10^((loser_rating - winner_rating) / 400))
delta           = round(K * (1 - expected_winner))          # K = 32
winner: rating += delta, wins   += 1
loser:  rating -= delta, losses += 1
```

Ratings are integers, may go below 1200, floor at 100. `rating_delta` is stored on the vote.

### Matchup selection

`getNextMatchup(userId)`:
1. Pick meme A at random among active memes, weighted toward fewer total matches (`ORDER BY (wins + losses) ASC, random()` over a random sample) so new uploads get exposure.
2. Pick meme B: random active meme within ±200 rating of A (fallback: any other active meme). Never the same meme; excludes the user's own memes when the pool allows (needs ≥2 non-own active memes, else own memes are eligible).
3. Insert the `matchups` row (expires in 5 min) and return it with both memes expanded.

Requires ≥2 active memes; otherwise `409 NOT_ENOUGH_MEMES` and the UI shows an "upload more memes" empty state.

---

## 5. API Contract

Base path `/api/v1`. Error envelope, pagination envelope, snake_case, and the token model exactly per boilerplate §3.

### 5.1 Endpoints

| Method & path | Auth | Purpose |
|---|---|---|
| `POST /auth/register` | — | `{ email, password, display_name }` → auto-login response |
| `POST /auth/login` | — | → `{ access_token, user }` + HTTP-only refresh cookie |
| `POST /auth/token/refresh` | cookie | rotate refresh token, new `access_token` |
| `POST /auth/logout` | cookie | revoke + clear cookie |
| `POST /memes` | ✅ | `multipart/form-data`: `title`, `image` → 201 Meme |
| `GET /memes` | ✅ | paginated; `?uploader=me` for "my memes"; `?sort=newest\|rating` |
| `GET /memes/:id` | ✅ | single meme with record |
| `DELETE /memes/:id` | ✅ owner | soft delete (`status='deleted'`); meme leaves the arena & leaderboard, past votes stand |
| `POST /battles/next` | ✅ | deal a matchup → 200 Matchup (POST: it creates a row) |
| `POST /battles/:matchup_id/vote` | ✅ | `{ winner_meme_id }` → vote result (below) |
| `GET /leaderboard` | ✅ | paginated memes, `ORDER BY rating DESC`; rank included |
| `GET /health` | — | `{ status: "ok" }` |

Uploaded images are served statically at `GET /uploads/<file>` (see §7.3).

### 5.2 Key response shapes

```jsonc
// Matchup — POST /battles/next
{
  "id": "…", "expires_at": "…",
  "meme_a": { "id": "…", "title": "…", "image_url": "/uploads/ab12….webp", "rating": 1240 },
  "meme_b": { "id": "…", "title": "…", "image_url": "/uploads/cd34….png",  "rating": 1198 }
}

// Vote result — POST /battles/:id/vote  (fuels the post-vote reveal animation)
{
  "winner": { "id": "…", "old_rating": 1240, "new_rating": 1252 },
  "loser":  { "id": "…", "old_rating": 1198, "new_rating": 1186 },
  "rating_delta": 12
}

// Leaderboard row — GET /leaderboard
{ "rank": 1, "id": "…", "title": "…", "image_url": "…", "rating": 1493,
  "wins": 41, "losses": 12, "uploader": { "id": "…", "display_name": "…" } }
```

### 5.3 Error codes (`packages/contracts/src/error-codes.ts`)

Shared catalog; each code gets a friendly message in the web app's `lib/errors` in the same PR (golden rule 6).

```
VALIDATION_ERROR            400   TOKEN_MISSING / TOKEN_EXPIRED / TOKEN_INVALID  401
EMAIL_TAKEN                 409   INVALID_CREDENTIALS                            401
FORBIDDEN                   403   NOT_FOUND                                      404
FILE_TOO_LARGE              413   UNSUPPORTED_FILE_TYPE                          415
NOT_ENOUGH_MEMES            409   MATCHUP_NOT_PENDING (voted/expired/not yours)  409
INVALID_WINNER (id not in matchup) 400          INTERNAL_ERROR                   500
```

---

## 6. Contracts Package

```ts
// packages/contracts/src/entities.ts (excerpt)
export interface Meme {
  id: string;
  title: string;
  image_url: string;
  rating: number;
  wins: number;
  losses: number;
  uploader: { id: string; display_name: string };
  created_at: string;
}

export interface Matchup {
  id: string;
  meme_a: Meme;
  meme_b: Meme;
  expires_at: string;
}

export interface VoteResult {
  winner: { id: string; old_rating: number; new_rating: number };
  loser:  { id: string; old_rating: number; new_rating: number };
  rating_delta: number;
}
```

Plus `User`, `PaginatedResponse<T>`, `ListFilters`, `ERROR_CODES`. Both apps import `@meme-battle-arena/contracts`.

---

## 7. Backend (`apps/api`)

Structure, middleware chain, `ApiError` + `errorHandler`, `asyncHandler`, `validate(zod)`, and pagination helpers exactly per boilerplate §§18–23. Modules:

```
src/modules/
├── auth/     auth.routes.ts  auth.controller.ts  auth.service.ts  token.service.ts  auth.schemas.ts
├── meme/     meme.routes.ts  meme.controller.ts  meme.service.ts  meme.repository.ts  meme.schemas.ts  upload.ts
├── battle/   battle.routes.ts  battle.controller.ts  battle.service.ts  battle.repository.ts  battle.schemas.ts
└── leaderboard/  leaderboard.routes.ts  leaderboard.controller.ts  leaderboard.service.ts
```

### 7.1 Auth

Boilerplate §22.1 verbatim minus the `pv` permissions-version check: bcrypt password hashes, 15-min access JWT (`{ sub, display_name }`), 30-day rotating refresh cookie scoped to `path: /api/v1/auth`. `authenticate` middleware sets `req.user`.

### 7.2 Battle service — the interesting part

```ts
// battle.service.ts (shape)
getNext(userId)                    // selection algorithm from §4; inserts matchup row
castVote(userId, matchupId, winnerMemeId):
  // in one transaction:
  // 1. load matchup FOR UPDATE → must be status 'pending', issued_to === userId,
  //    not expired            → else MATCHUP_NOT_PENDING
  // 2. winnerMemeId must be meme_a or meme_b → else INVALID_WINNER
  // 3. lock both memes FOR UPDATE (in consistent id order, to avoid deadlocks)
  // 4. apply ELO (§4), update both memes, insert vote, set matchup status 'voted'
  // 5. return VoteResult with old/new ratings
```

The `UNIQUE` constraint on `votes.matchup_id` is the last line of defense against double-vote races.

### 7.3 File upload

- `multer` disk storage → `UPLOADS_DIR` (env, default `/data/uploads`, a compose volume).
- Filename: `<uuid><ext>` — never the client's name (path traversal, collisions).
- Accept `image/jpeg | png | webp | gif`; reject others with `415 UNSUPPORTED_FILE_TYPE`. Limit 5 MB → multer's limit error mapped to `413 FILE_TOO_LARGE` in the error handler.
- Trust magic bytes, not the client mime string: after save, sniff the header (`file-type` package); delete + 415 on mismatch.
- Served by `express.static(UPLOADS_DIR)` at `/uploads` with `Cache-Control: public, max-age=31536000, immutable` (filenames are content-unique). The API returns `image_url` as the absolute `/uploads/...` path.
- On upload failure after file write (e.g. DB insert throws), unlink the file — no orphans.

### 7.4 Env (`config/env.ts`, validated at boot)

`PORT`, `WEB_ORIGIN`, `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `UPLOADS_DIR`, `NODE_ENV`.

---

## 8. Frontend (`apps/web`)

Setup, folder structure, thin-page/fat-layout, API layer (endpoints → client → services), single-flight refresh, providers, Tailwind v4 tokens — all per boilerplate Parts II. Specifics below.

### 8.1 Routes

```
src/app/
├── layout.tsx                # providers, font, metadata
├── page.tsx                  # redirects → /arena (or /login)
├── login/  register/         # public
└── (app)/                    # AuthGuard-wrapped shell: header + nav
    ├── arena/page.tsx        → @/layout/arena        # the voting screen (home)
    ├── upload/page.tsx       → @/layout/upload
    ├── leaderboard/page.tsx  → @/layout/leaderboard
    └── my-memes/page.tsx     → @/layout/my-memes
```

`AuthGuard` is the boilerplate's minus permission resolution: rehydrate from secure storage → validate by calling `GET /memes?page_size=1`-style ping? **No** — keep it honest: validate by decoding the JWT exp locally and let the first real API call trigger the refresh flow. Redirect to `/login` when nothing is stored.

### 8.2 Redux slices

```
store/slices/
├── common/auth.slice.ts      # accessToken + user (boilerplate pattern)
├── arena.slice.ts            # current matchup + vote lifecycle (below)
├── memes.slice.ts            # "my memes" list — standard TTL list slice
└── leaderboard.slice.ts      # standard TTL list slice (TTL 60s — ratings move fast)
```

All register clear actions in `clearAllState`.

### 8.3 `arena.slice` — the voting state machine

```
status: 'idle' → 'loading' → 'ready' → 'voting' → 'revealed' → (next) → 'loading' …
                                    ↘ 'error' / 'empty' (NOT_ENOUGH_MEMES)
```

```ts
interface ArenaState {
  matchup: Matchup | null;
  status: "idle" | "loading" | "ready" | "voting" | "revealed" | "empty" | "error";
  optimisticWinnerId: string | null;   // set the instant the user clicks
  voteResult: VoteResult | null;       // server truth for the reveal (deltas)
  error: string | null;
  sessionStats: { votesCast: number }; // fun counter, resets per visit
}
```

- `fetchNextMatchup` thunk → `POST /battles/next`. No TTL cache — every call is a fresh deal.
- `castVote` thunk: reducer sets `optimisticWinnerId` + `status: 'voting'` immediately (cards animate at click time); on fulfil → `voteResult` + `'revealed'`; on reject → clear optimistic state, toast, back to `'ready'` (matchup still valid) or refetch if `MATCHUP_NOT_PENDING` (expired).
- The layout auto-dispatches `fetchNextMatchup` ~1.5 s after `'revealed'` (or instantly on "next" click / `→` key).
- Voting UX: click a card or press `←`/`→`. During `'voting'`/`'revealed'` inputs are ignored (double-vote guard in state, `useAsyncAction` as backup).

### 8.4 Upload flow

`upload` layout: client-side preview (`URL.createObjectURL`), title input, drag-and-drop zone. Submit via `memeService.upload(formData)` with axios `onUploadProgress` → progress bar. Success → toast → `clearMemesData()` → route to `/my-memes`. Client pre-validates type/size for fast feedback; the server remains the enforcer.

### 8.5 Services & endpoints

`API_ENDPOINTS.{AUTH, MEMES, BATTLES, LEADERBOARD}` in `endpoints.ts`; `auth.service.ts`, `meme.service.ts`, `battle.service.ts`, `leaderboard.service.ts` — one file per backend module, snake_case DTOs.

---

## 9. Widgets & Storybook

**Deviation from the boilerplate:** widgets are NOT built inside `apps/web/src/widgets`. They live in the shared design-system monorepo (`../storybook`, one Storybook for all 20 projects) and are consumed as npm packages:

- **`@ntrs/core`** — generic primitives every project installs: `Button`, `StatPill`, `PageHeader`, `AppShell`, `cn`, and the design tokens (`@ntrs/core/tokens.css` — **the package owns the tokens**; `apps/web/globals.css` imports them instead of defining its own).
- **`@ntrs/meme`** — this project's components: `MemeCard`, `VoteButton`, `RatingDelta`, `BattleStage`, `LeaderboardTable`, `UploadDropzone`. Other projects never install this package.

Workflow: a new widget is developed and storied in the storybook repo first (see each package's `CLAUDE.md` for placement rules — generic → core, meme-specific → meme), published via Changesets, then imported here. Already built there, with stories and play-function tests (vote fires once, cards not clickable after reveal):

| Component | Package | Key props |
|---|---|---|
| `MemeCard` | `@ntrs/meme` | `title, imageUrl, rating?, record?, delta?, state: "idle" \| "selected" \| "winner" \| "loser", onClick?` |
| `VoteButton` | `@ntrs/meme` | `side: "left" \| "right", disabled, onVote` |
| `RatingDelta` | `@ntrs/meme` | `delta: number` |
| `BattleStage` | `@ntrs/meme` | `memeA, memeB, phase: "ready" \| "voting" \| "revealed", selectedId?, result?, onVote?` — maps 1:1 onto the arena slice (§8.3) |
| `LeaderboardTable` | `@ntrs/meme` | `rows, isLoading, highlightIds?` (podium styling for top 3, loading/empty states) |
| `UploadDropzone` | `@ntrs/meme` | `state, previewUrl?, error?, accept, maxSizeMb, onFile` |
| `Button`, `StatPill`, `PageHeader`, `AppShell` | `@ntrs/core` | generic primitives |

Tailwind setup in `apps/web`: import `@ntrs/core/tokens.css` and add `@source "../node_modules/@ntrs"` so the app's Tailwind v4 build compiles the packages' classes.

What still lives in this repo: app-specific compositions that touch Redux/routing (the arena page orchestration, keyboard voting handler, modals wired to thunks) — they go in `src/layout/**` per the boilerplate, consuming the package components as controlled props. Missing primitives (`input`, `modal`, `confirm-dialog`, `toast`, `search-input`) get added to `@ntrs/core` when this project needs them.

---

## 10. Docker Compose

```yaml
services:
  db:
    image: postgres:16-alpine
    environment: { POSTGRES_DB: meme_arena, POSTGRES_USER: app, POSTGRES_PASSWORD: app }
    volumes: [db-data:/var/lib/postgresql/data]
  api:
    build: apps/api
    environment:
      DATABASE_URL: postgres://app:app@db:5432/meme_arena
      WEB_ORIGIN: http://localhost:3000
      UPLOADS_DIR: /data/uploads
      # JWT secrets via .env
    volumes: [uploads:/data/uploads]
    ports: ["4000:4000"]
    depends_on: [db]
  web:
    build: apps/web            # NEXT_PUBLIC_API_BASE_URL baked at build: http://localhost:4000
    ports: ["3000:3000"]
    depends_on: [api]
volumes: { db-data: {}, uploads: {} }
```

Dev loop runs `yarn dev` in both apps against compose's `db` only; full compose is the "it ships" check. Schema via plain SQL migration files run at api boot (keep tooling minimal; swap in a migration lib later if it hurts).

---

## 11. Build Plan (~2 weeks)

Follows the boilerplate's New Project Checklist order (§28), trimmed. Each phase names the concept it exists to teach and a **checkpoint** — a question you should be able to answer from memory before moving on. If you can't, that's the signal to reread what you just built, not to push forward.

1. **Scaffold** — monorepo, contracts package, compose with Postgres.
   *Learn:* workspaces, why shared types live in one package. **Checkpoint:** why does `contracts` exist instead of copying the `Meme` interface into both apps?
2. **Backend core** — `env.ts`, `app.ts`, error handler, pagination, `asyncHandler`; auth module end-to-end (register/login/refresh/logout, curl-tested).
   *Learn:* the Express middleware chain, JWT + rotating refresh cookie. **Checkpoint:** trace a thrown `ApiError` from service → client response body; explain why the refresh token is a cookie but the access token isn't.
3. **Frontend plumbing** — `cn`, constants, endpoints, axios client + refresh queue, auth slice, secure storage, `AuthGuard`, login/register pages, provider stack, `globals.css` tokens.
   *Learn:* interceptors, the single-flight refresh queue. **Checkpoint:** ten requests get 401 at once — how many refresh calls fire, and why?
4. **Meme module** — upload (multer + sniffing + static serving), list, delete; `upload-dropzone` widget + upload page + `memes` slice; Storybook initialized here with the first widgets.
   *Learn:* multipart uploads end-to-end, first widget-with-stories workflow. **Checkpoint:** why sniff magic bytes instead of trusting the mime type? Why is the dropzone a widget but the upload page a layout?
5. **Battle module** — matchup dealing + transactional ELO vote; unit-test `applyElo` and `castVote` guards (the only mandated backend tests).
   *Learn:* transactions, row locking, designing an API that can't be cheated. **Checkpoint:** what stops a user voting twice on the same matchup — name all three layers of defense.
6. **Arena page** — `arena` slice state machine, `meme-card`/`vote-button`/`rating-delta` widgets + stories, battle-stage layout, keyboard voting, reveal animation.
   *Learn:* the heart of the project — Redux as a state machine, optimistic UI + rollback. **Checkpoint:** walk the `status` transitions for a vote whose request fails.
7. **Leaderboard** — endpoint + slice + `leaderboard-table` widget + page.
   *Learn:* the standard TTL list-slice pattern (this one you build almost from muscle memory — that's the point). **Checkpoint:** when does the thunk serve from cache vs refetch?
8. **Polish & ship** — dark mode pass on every story, a11y panel clean, empty states (`NOT_ENOUGH_MEMES`), both Dockerfiles, full `docker compose up` demo with friends.
   *Learn:* multi-stage Docker builds, build-time vs runtime env vars. **Checkpoint:** why does changing `NEXT_PUBLIC_API_BASE_URL` require rebuilding the web image but changing `DATABASE_URL` doesn't require rebuilding the api image?

**Definition of done:** two fresh users on `docker compose up` can register, each upload a meme, vote ~10 rounds, and watch the leaderboard reorder — with no console errors and every widget documented in Storybook in both themes. **And** you can answer all eight checkpoints without looking — the app working but the concepts staying fuzzy means the project isn't done yet.

---

## 12. Evolution Paths (post-v1)

- **Storage:** local volume → S3/R2 pre-signed uploads (the `image_url` indirection already isolates this).
- **Anonymous voting:** session-cookie voters with rate limiting — revisit matchup `issued_to`.
- **Live arena:** Socket.io "rating just changed" ticker — deliberately saved for Project 10 (Trivia) skills.
- **Moderation:** report button + admin persona — would reintroduce the boilerplate's permission system properly.
- **TanStack Query** for the list slices, keeping Redux for auth + arena state (boilerplate §27 trade-off).
