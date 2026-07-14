# Meme Battle Arena — Frontend Summary

## Routes (7 total)

| Route | Page | AuthGuard | Purpose |
|---|---|---|---|
| `/` | `src/app/page.tsx` | No | Demo/landing page showing widget packages work |
| `/login` | `src/app/login/page.tsx` | No | Email + password login form |
| `/register` | `src/app/register/page.tsx` | No | Display name + email + password registration |
| `/arena` | `src/app/arena/page.tsx` | **Yes** | Core battle screen — two memes head-to-head, vote with click or arrow keys |
| `/upload` | `src/app/upload/page.tsx` | **Yes** | Drag-and-drop meme upload with title + preview + progress bar |
| `/my-memes` | `src/app/my-memes/page.tsx` | **Yes** | Grid of user's uploaded memes with delete |
| `/leaderboard` | `src/app/leaderboard/page.tsx` | **Yes** | Ranked table of all memes by ELO rating |

No dynamic routes, no API routes, no middleware.

---

## Architecture Pattern

Every page follows the same structure:

```
src/app/<route>/page.tsx          ← thin 5-line server component, just renders the layout
src/layout/<route>/index.tsx      ← "use client" component, the actual UI
src/layout/<route>/index.hook.ts  ← custom hook with all Redux dispatches + local state
```

The **root layout** (`src/app/layout.tsx`) wraps everything in `<ReduxProvider><RouterProvider>` with Geist fonts.

---

## Redux Store (4 slices)

```
RootState = { auth, memes, arena, leaderboard }
```

### `auth.slice` — Session Management

| What | Detail |
|---|---|
| **State** | `accessToken`, `user`, `status`, `error` |
| **Actions** | `setAuth` (hydrate from storage), `setTokens` (refresh), `logout` (clear everything + wipe secure storage) |
| **Thunks** | `registerUser`, `loginUser` (both persist to `react-secure-storage`), `logoutUser` (calls API then dispatches `logout`) |

### `arena.slice` — Battle State Machine

| What | Detail |
|---|---|
| **State** | `matchup`, `status`, `optimisticWinnerId`, `voteResult`, `error`, `sessionStats.votesCast` |
| **Status flow** | `idle → loading → ready → voting → revealed → loading (loop)` |
| **Thunks** | `fetchNextMatchup` (POST `/battles/next`), `castVote` (POST `/battles/:id/vote`) |
| **Key behaviors** | Optimistic UI on vote (sets `optimisticWinnerId` before server responds). Auto-fetches next matchup 1500ms after reveal. On `MATCHUP_NOT_PENDING` error, auto-fetches a fresh matchup instead of dead-ending. |

### `memes.slice` — Meme CRUD + Cache

| What | Detail |
|---|---|
| **State** | `list.data`, `list.pagination`, `list.isLoading`, `list.filters`, `list.lastFetched`, `details`, `cache.ttl (5 min)` |
| **Actions** | `setFilters` (resets page to 1), `setPage`, `clearMemesData`, `clearMemeDetails` |
| **Thunks** | `fetchMemes` (cache-aware), `refreshMemes` (bypass cache), `uploadMeme` (with progress callback), `deleteMeme` (optimistic removal) |

### `leaderboard.slice` — Rankings + Cache

| What | Detail |
|---|---|
| **State** | `data`, `pagination`, `isLoading`, `error`, `lastFetched`, `cache.ttl (60s)` |
| **Thunks** | `fetchLeaderboard` (cache-aware), `refreshLeaderboard` (bypass cache) |

### Global: `clearAllState` (in `store/actions.ts`)

Dispatches every slice's clear/logout action. Triggered by the API client when refresh token fails → wipes all state → navigates to `/login`.

---

## API Layer

**Axios client** (`src/lib/api/client.ts`):
- Base URL from `NEXT_PUBLIC_API_BASE_URL` (default `localhost:4000`)
- Request interceptor: attaches `Authorization: Bearer <token>` from Redux
- Response interceptor: on 401, performs **single-flight token refresh** (one in-flight promise shared by concurrent 401s). On refresh failure → `clearAllState()` + redirect to `/login`.
- Circular dependency between store↔client broken via lazy `require()` at runtime.

**Services** (all thin wrappers around the axios client):

| Service | Methods |
|---|---|
| `auth.service.ts` | `register(data)`, `login(data)`, `logout()` |
| `battle.service.ts` | `getNext()`, `vote(matchupId, winnerMemeId)` |
| `meme.service.ts` | `list(filters)`, `get(id)`, `upload(data, onProgress)`, `remove(id)` |
| `leaderboard.service.ts` | `list(filters)` |

---

## Components

| Component | File | Purpose |
|---|---|---|
| `AuthGuard` | `src/components/guards/auth-guard.tsx` | Rehydrates auth from secure storage on mount, checks JWT expiry, redirects to `/login` if invalid, renders `null` until token present |
| `AuthStatus` | `src/components/common/auth-status.tsx` | Shows login link or user name + nav links + logout button (used on home page) |

---

## Key Hooks

| Hook | File | What it does |
|---|---|---|
| `useAsyncAction` | `src/hooks/use-async-action.ts` | Wraps any async function with `isLoading` state + double-execution guard via ref |
| `useArena` | `src/layout/arena/index.hook.ts` | Dispatches `fetchNextMatchup` on mount (once), auto-advances after reveal (1500ms), keyboard voting (ArrowLeft/Right), guards double-vote |
| `useLogin` | `src/layout/login/index.hook.ts` | Form state + dispatches `loginUser`, redirects to `/` on success |
| `useRegister` | `src/layout/register/index.hook.ts` | Form state + dispatches `registerUser`, redirects to `/` on success |
| `useUpload` | `src/layout/upload/index.hook.ts` | File validation (MIME + 5MB limit), drag-and-drop state, progress tracking, dispatches `uploadMeme` + `clearMemesData`, redirects to `/my-memes` |
| `useLeaderboard` | `src/layout/leaderboard/index.hook.ts` | Dispatches `fetchLeaderboard` on mount, maps entries to rows, computes `highlightIds` for current user's memes |
| `useMyMemes` | `src/layout/my-memes/index.hook.ts` | Sets filter `uploaderMe: true`, dispatches `fetchMemes`, `window.confirm()` before `deleteMeme` |

---

## Providers

| Provider | File | Purpose |
|---|---|---|
| `ReduxProvider` | `src/providers/redux-provider.tsx` | Wraps children with `<Provider store={store}>` |
| `RouterProvider` | `src/providers/router-provider.tsx` | Captures Next.js router into a module-level singleton so non-component code (API client) can navigate |

---

## Utilities

| File | What |
|---|---|
| `src/lib/cache.ts` | `isCacheValid(lastFetched, ttl)` + `listParamsMatch(a, b)` — used by memes/leaderboard cache logic |
| `src/lib/storage/auth-storage.ts` | `saveAuthData/loadAuthData/clearAuthData` via `react-secure-storage` |
| `src/lib/utils/jwt.ts` | `decodeAccessToken` (base64 decode payload), `isTokenExpired` (checks `exp`) |
| `src/lib/utils/navigation.ts` | Module-level router singleton for use outside React tree |
| `src/lib/errors/error-codes.ts` | Maps `ERROR_CODES` enum to user-friendly strings |
| `src/lib/errors/index.ts` | `extractApiError(error)` — normalizes any thrown value into `{ errorCode, errorMessage }` |
| `src/lib/utils.ts` | `cn()` — Tailwind class merging via `clsx` + `tailwind-merge` |
| `src/resources/constants.ts` | `API.BASE_URL`, `API.TIMEOUT` |

---

## Key Data Flows

**Auth:** Login/Register → `auth.slice` stores token in Redux + persists to secure storage → `AuthGuard` rehydrates on page load → API client attaches token on every request → 401 triggers single-flight refresh → refresh failure wipes everything.

**Arena:** Mount → `fetchNextMatchup()` → status `ready` → user clicks/presses arrow → `castVote.pending` sets `optimisticWinnerId` (instant UI feedback) → server confirms → `revealed` shows result → 1500ms delay → `fetchNextMatchup()` again.

**Upload:** File drop/select → client validation → `uploadMeme()` with progress callback → on success → `clearMemesData()` (invalidates cache) → redirect to `/my-memes`.

**Delete:** Confirm dialog → `deleteMeme(id)` → optimistic removal from `state.memes.list.data` array (no refetch needed).

**Session expiry:** Any API 401 → axios interceptor → refresh attempt → failure → `clearAllState()` (dispatches `logout` + `clearMemesData` + `resetArena` + `clearLeaderboardData`) → navigate to `/login`.
