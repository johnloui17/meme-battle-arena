# Coding Standards & Architecture

## 1. Purpose & scope

This document describes the architectural conventions and coding standards this codebase is built to. It is a **standard**, not a tour: it describes the *pattern* a route, a component, a store slice, or a utility should follow — not a specific feature implemented today. Anyone extending the app, or building a comparable app from scratch, should be able to follow these rules and produce code that looks like it belongs.

The guiding principle underneath every rule below: **push repetition down into a shared layer, and keep feature code limited to the decisions that are actually specific to that feature** (what data, what columns, what copy, what permission). Routing, chrome, HTTP plumbing, error formatting, and common UI should never be re-implemented per feature.

## 2. Project structure & responsibilities

| Layer | Responsibility | Should *not* contain |
|---|---|---|
| **Routing layer** | Maps URL structure to a feature. One thin file per route, whose only job is to render the one feature/layout component that owns the page. | Data fetching, business logic, markup beyond a single render call. |
| **Feature/layout layer** | Mirrors the route tree one level down from routing. Owns a page's data fetching, local state, effects, and permission decisions. Small features are a single file; larger ones grow a local `components/`, hooks, and types alongside the entry file. | Generic, reusable UI (that belongs one layer down), direct HTTP calls (that belongs in a service module). |
| **Domain components** | Cross-page pieces that carry business/domain awareness — navigation chrome, guards, metric cards, chart wrappers. Reusable across features in the same domain, but not generic enough to ship as a design-system primitive. | Page-level orchestration (fetching, routing decisions). |
| **Generic widgets** | A business-agnostic UI kit — button, table, modal, tabs, toast, confirm dialog, form controls. No knowledge of any domain concept; could be lifted into an unrelated app unchanged. | Any reference to a domain entity, permission, or API shape. |
| **Shared hooks** | Cross-cutting behavior reused by many features — debouncing, permission/role checks, an async-action wrapper, generic data-fetch. | One-off logic that only a single feature needs (that stays local to the feature). |
| **`lib` (infrastructure)** | The HTTP client and its interceptors, per-domain service modules, storage helpers, error-normalization helpers, and small single-purpose pure-function utilities. | React components, store logic. |
| **Store** | Global client state, organized per domain into slices with paired selectors. | Direct HTTP calls (delegated to service modules), UI logic. |
| **Shared types** | Domain entity shapes used by more than one slice/service. | Request/response shapes specific to a single endpoint (those stay local to the service file that defines the call). |
| **Constants/resources** | App-wide enums, permission keys, static config. | Feature-specific literals (those stay local to the feature). |
| **Providers** | Root-level context wiring (store, routing, theme) composed once at the top of the tree. | Feature logic. |

## 3. Naming & clean-code conventions

- **Casing**: kebab-case for every file and folder name; PascalCase only for the exported component/type identifier itself.
- **Suffixes signal role at a glance** — a file named `*.slice.ts` is a store slice, `*.selectors.ts` is derived-state readers, `*.service.ts` is an HTTP-backed domain API, `use-*.ts` is a hook. A reader should be able to tell what a file does from its name before opening it.
- **Barrel exports** are used deliberately, not everywhere: a shared widget exposes one public `index` entry point while splitting its internals (base render, hook + types) into sibling files; a folder of small unrelated re-exports (e.g. a "common" or "theme" grouping) gets a barrel purely for import convenience.
- **One concern per file** for utilities — a pure-function helper module does exactly one thing, is exported as a plain named function (not wrapped in a class), and gets a short comment only when the *why* isn't obvious from the name and signature.
- **Typing discipline**: strict mode is on, a path alias keeps imports from the source root short and unambiguous, and every component/function is fully typed — no implicit `any`.
- **Type placement**: co-locate a type with the component/module that owns it; promote it to a shared types module only once a second, unrelated consumer needs the same shape. Don't pre-emptively centralize types nobody else uses yet.
- **Lint/format**: a single flat lint config extending the framework's recommended and TypeScript rule sets is the source of truth for both correctness lint rules and formatting — no separate formatter config, no project-specific rule overrides layered on top. Consistency comes from the shared config, not from per-file style choices.
- **Comments**: default to none. Code should be self-explanatory through naming; a comment is only added to capture a non-obvious constraint, workaround, or invariant — never to restate what the code already says.

## 4. Components vs. widgets vs. lib/utils

Three different "reuse" layers exist, and the boundary between them is a standard, not a style choice:

- **Widgets** are the generic UI kit. A widget knows nothing about the app's domain — it takes data, columns, callbacks, and copy as props, and renders. Internally, a widget conventionally splits into: a public entry point (the thing other code imports, marked as a client boundary if interactive), a base render implementation, and a co-located hook/types module for its internal logic and prop types. This split keeps the "what other code sees" surface distinct from "how it works internally."
- **Components** are domain-aware but still cross-page — a permission guard, a metric card, a navigation shell, a chart wrapper. They know about the app's concepts (a permission, a metric, a domain entity) but not about any single page's specific data-fetching flow.
- **`lib`** is infrastructure with no UI at all: the HTTP client, service modules, storage helpers, error helpers, and pure-function utilities. Anything here should be usable outside of a React render — no hooks, no JSX.
- **Cross-cutting concerns belong in a wrapper, not inline checks.** Auth and permission gating are implemented once as guard components that wrap children and branch on a hook's result — not as repeated `if (!hasPermission)` checks scattered through feature code.
- **Styling variants** are handled through a variant-styling helper plus a single classname-merge utility, so no component hand-rolls conditional class string concatenation. Polymorphic "render as a different element" behavior goes through a composition/slot primitive rather than prop-drilling an element type.

## 5. State management & API layer standard

- **One global store**, sliced by domain. Each slice owns its own reducer logic and async thunks for that domain's fetches/mutations — no cross-domain slice reaching into another domain's shape.
- **Slices may cache freshness metadata** (last-fetched params/timestamp) so a re-mount with identical filters doesn't trigger a redundant network call. This is a deliberate simplification over pulling in a full query-caching library everywhere.
- **A single HTTP client instance** owns all outgoing requests, with two interceptor responsibilities:
  - *Request*: inject the current auth token from store state automatically — feature code never attaches auth headers itself.
  - *Response*: on an expired-token response, transparently refresh the token once (queuing any other concurrent requests behind that single refresh) and retry the original call; on a permissions-changed signal, re-resolve permissions and clear cached domain state while preserving the authenticated session.
- **Service modules are the only callers of the HTTP client.** One service module per domain wraps every endpoint for that domain as a plain async function. Feature code and store thunks call the service function; they never import the HTTP client directly. This is what lets error handling, URL construction, and request shaping change in one place without touching every feature.
- **Two consumption patterns**, chosen by whether the data is shared/cacheable or page-local:
  - Shared/list data: the feature component reads state via the store's selector, and triggers a fetch by dispatching a thunk inside an effect keyed on whatever filter/pagination params should cause a refetch.
  - One-off mutations or page-local reads: the feature component calls a service function directly, wrapped in a shared async-action hook that guards against double-submission and standardizes success/error callbacks (so every mutation has consistent loading/disable behavior without reimplementing it).
- **Shared types for shared shapes only**: domain entities used by more than one slice/service live in a shared types module; request/response shapes specific to one endpoint stay local to the service file that defines it.
- Where a full query-caching library isn't yet justified for an ad-hoc fetch, a minimal generic `{data, loading, error, refetch}` hook is an acceptable, explicitly-temporary stand-in — but it should be recognized and eventually replaced, not multiplied into a permanent pattern.

## 6. Anatomy of a route (generic walkthrough)

This is the standard shape every route in this style of app follows, independent of what the route is actually for:

1. **Route file** — lives in the routing tree at the path matching its URL. Contains no logic: it renders exactly one feature/layout component.
2. **Feature/layout component** — a client-side component living in a parallel tree, keyed by section/feature name rather than by URL segment. This decouples business logic from the router, so the feature can be reasoned about, tested, or reused independent of how it's routed to.
3. **Data acquisition on mount** — the feature component either dispatches a store thunk (shared/cacheable data) or calls a service function directly (page-local data), driven by an effect keyed on the params that should trigger a refetch.
4. **Shared section shell** — the page is composed inside a shell shared by every route in its section: an access guard plus navigation chrome (header/sidebar). The individual route supplies only its body content, not the surrounding frame.
5. **Standard body composition** — the body opens with a shared page-header widget (title, description, actions, back navigation) followed by a shared list/table widget fed with column definitions, data, loading flag, and empty-state copy. The route supplies configuration (columns, row actions), not table/list plumbing.
6. **Layered permission gating** — a coarse check at the section-shell level (can this user type be here at all) and a finer check inside the feature component (can this specific user perform this specific action), with the finer check swapping in a denial state in place of the real content rather than partially rendering.
7. **Mutation flow** — an action triggered from a row or page control goes through: async-action hook (guards double-submit) → service call → success/error toast → refetch of the underlying list to reflect the new state.

```
route file                 -> renders one feature component, nothing else
feature component (client)  -> effect: dispatch(thunk(params)) | service.call()
                             -> reads: useSelector(selectDomainSlice)
                             -> renders: <SectionShell>
                                           <PageHeader .../>
                                           <ListWidget data columns isLoading emptyMessage />
                                         </SectionShell>
mutation handler             -> useAsyncAction(() => service.mutate(payload), { onSuccess: refetch })
```

## 7. Fallback & error-handling standards

- **Errors are normalized once, then surfaced once.** A shared error-parsing utility maps backend error codes/shapes into a user-facing message; the result is shown through a single global toast/notification widget mounted once at the app root. Feature code catches the error and calls the normalizer — it does not construct its own error copy or its own alert UI.
- **Loading is a boolean, owned by the widget.** Feature code tracks a simple `isLoading` flag and passes it to the shared list/table widget, which is responsible for rendering its own spinner. Feature code does not build bespoke loading UI per page.
- **Empty state is a prop, not a component.** The shared list/table widget accepts an empty-state message/copy prop rather than every page building its own empty-state block.
- **Guards are layered, not duplicated.** A section-level guard handles the coarse "should this user be here at all" case before anything renders; a feature-level check handles the finer "can this user do this specific thing" case and swaps in a denial state. Neither layer re-implements the other's check.
- **Destructive actions are confirmed through a shared dialog**, never executed immediately on click.
- **Deliberate simplicity, stated as a standard**: this pattern intentionally does not use React error boundaries or skeleton loaders. Errors are handled at the call site (try/catch → normalize → toast) and loading is boolean-only. This is a stated trade-off favoring simplicity and consistency over per-page polish — it should be treated as the current standard, not silently worked around per feature. If a future need justifies boundaries or skeletons, that should be adopted as a new shared standard, not bolted onto one page.

## 8. How duplication is avoided (code simplification)

These are the mechanisms that keep feature code small, and they should keep being applied rather than re-solved per feature:

1. **Shared widgets absorb UI plumbing.** Table rendering, pagination, confirm dialogs, toasts, and page headers exist once; feature code supplies data and configuration, never markup for these concerns.
2. **The service layer absorbs HTTP/error-shape detail.** A feature calls one function and handles a resolved or rejected outcome; it never touches URLs, headers, or raw error payloads directly.
3. **Shared hooks absorb repeated control flow.** An async-action hook absorbs "loading + disable-while-in-flight + double-submit guard"; permission/role hooks absorb "check permission, then branch" — both patterns are written once and reused, not recreated in each feature.
4. **Centralized entity types prevent shape drift.** A domain entity is defined once and imported everywhere it's needed, so a slice and a service can't quietly disagree about what a record looks like.
5. **Slice-level freshness caching avoids redundant network calls** for data that hasn't gone stale, without requiring a full query-caching library.

When adding new code, the default question should be: *does this repeat something a widget, service, hook, or shared type already does?* If yes, extend or reuse that shared piece instead of writing a parallel one-off version.
