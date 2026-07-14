# AGENTS.md

## Repo structure

Yarn workspaces monorepo. Three packages:

```
apps/back-end/     Express API (port 4000)
apps/front-end/    Next.js 16 App Router (port 3000)
packages/contracts/ Shared types + error codes (@meme-battle-arena/contracts)
```

`apps/back-end/docs/TECHSPEC.md` is the source of truth for intended behavior. `CLAUDE.md` has architecture details. Read both before non-trivial changes.

## Commands

No root-level scripts. Run from the relevant workspace.

### Backend (`apps/back-end`)

```sh
yarn dev            # tsx watch src/index.ts
yarn build          # tsc + copies SQL migrations into dist
yarn typecheck      # tsc --noEmit
yarn test           # vitest run (all)
yarn test battle.logic  # single file (vitest run <pattern>)
```

Requires Postgres. Easiest way: `docker compose up db` from repo root. Then create `.env` from `.env.example` (or run the full stack with `docker compose up` which starts db + back-end).

### Frontend (`apps/front-end`)

```sh
yarn dev            # next dev
yarn build          # next build
yarn lint           # eslint
```

No test script exists. `.env.local` must have `NEXT_PUBLIC_API_BASE_URL` pointing at the backend.

### Contracts (`packages/contracts`)

```sh
yarn build          # tsup -> dist/ (CJS + .d.ts)
yarn dev            # tsup --watch
```

**Critical:** Both apps import from `dist/`, not live workspace source. After editing `src/entities.ts`, `error-codes.ts`, or `pagination.ts`, you must `yarn build` in this package before the apps see the change.

## Gotchas

- **`NEXT_PUBLIC_*` vars are baked at build time**, not runtime. Changing `NEXT_PUBLIC_API_BASE_URL` requires a rebuild, even in dev.
- **No migration framework.** SQL files in `apps/back-end/src/db/migrations/*.sql` run at boot in numeric order via `src/db/migrate.ts`. Just add numbered `.sql` files.
- **Contracts rebuild.** If types look stale in either app, rebuild `packages/contracts` first. This is the #1 source of confusing type errors.
- **Widgets are external.** `@ntrs/core` and `@ntrs/meme` are npm packages from a separate Storybook repo. Do not add new visual components under `apps/front-end/src/`. Only add wiring (Redux/routing integration) in `src/layout/`.
- **Frontend has no tests.** Only the backend has vitest tests.
- **Upload files** are sniffed by magic bytes (`file-type`), never trusting the client MIME type. Filenames are replaced with `<uuid><ext>`.

## Environment files

| File | Purpose |
|---|---|
| `.env` (root) | Docker compose secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`) |
| `apps/back-end/.env` | Backend config (`DATABASE_URL`, `JWT_*`, `UPLOADS_DIR`, `WEB_ORIGIN`, `PORT`) |
| `apps/front-end/.env.local` | Frontend config (`NEXT_PUBLIC_API_BASE_URL`) |

See `.env.example` files for reference values.

## Verification order

When making changes across packages: **contracts build → backend typecheck/test → frontend lint/build**.
