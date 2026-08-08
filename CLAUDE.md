# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start dev server (http://localhost:5173)
npm run build             # Production build to dist/
npm run preview           # Preview production build
npm run typecheck         # tsc --noEmit -p tsconfig.app.json (no separate lint script exists; typecheck is the gate)
```

There is no test suite/runner configured in this repo.

### Supabase

`supabase db push`, `supabase migration list`, etc. with `--linked` act on whatever project the Supabase CLI is currently linked to — loading `.env.development`/`.env.production` does NOT change the link. `supabase/.temp/project-ref` is just local CLI state, not proof the right project is targeted. Always use the npm scripts below, which link deliberately before acting:

```bash
npm run db:link:dev / db:link:prod                 # Link CLI to dev/prod project
npm run db:push:dev / db:push:prod                  # Relink then push migrations
npm run db:list                                     # List migrations for currently linked project
npm run functions:deploy:dev / functions:deploy:prod # Deploy Edge Functions
```

When adding a table to an exposed schema, explicitly grant the intended API roles — tables are not auto-exposed to the Data API. If REST returns `PGRST205` for a table that exists in Postgres, check whether the migration landed on the project actually linked/queried. Keep helpers referenced by RLS policies (e.g. `has_sheet_role`) present in committed migrations for both dev and prod.

## Architecture

Waldas Watch is a collaborative budget-tracking PWA: React 19 + TypeScript, Vite 6, TanStack Router (file-based) + TanStack Query, Mantine 7, Supabase (Postgres/Auth/Edge Functions), deployed on Vercel with automatic deploys on push to `main`.

### Data flow layering

Each domain (transactions, categories, payment types, recurring transactions, sheets, sheet members, monthly notes, AI assistant) is threaded through three layers that must stay separate:

- `src/lib/*-requests.ts` — Supabase I/O only (queries, mutations, RPC calls). No pure helper logic here.
- `src/lib/*-utils.ts` (outside `src/utils`) — pure helpers/sanitizers/formatters with no Supabase calls. Utility modules must never import the Supabase client.
- `src/queries/use-*.ts` — one TanStack Query hook per file, wrapping a request function for use in components (e.g. `use-sheet-transaction-overview-query.ts` wraps `transactions-requests.ts`).

Screens under `src/routes` compose these hooks; business logic belongs in `src/lib`/`src/queries`, not inlined in route components.

### Routing

File-based routing via TanStack Router; the route tree is generated into `src/routeTree.gen.ts` (do not hand-edit). `src/routes/_auth.tsx` is the layout/guard for authenticated routes — everything under `src/routes/_auth/sheets/$sheetId/` operates within one budget sheet (dashboard, add-transaction, overview/, settings/). `src/routes/__root.tsx` renders global chrome (`OfflineBanner`, `SyncBanner`, `InstallBanner`) around every route via `<Outlet />`.

### State management (see `docs/state-management.md`)

- **Server state** (anything from Supabase: transactions, budgets, categories, profile) → TanStack Query only. Never use it as a general UI state store.
- **Client/UI state** (modals, tabs, wizard steps, draft form values) → local `useState`/`useReducer` first, `Context` for small shared state, Zustand only once client state is genuinely complex and cross-screen.
- **Forms** always use `useForm` from `@mantine/form` — never individual `useState` per field. Bind with `form.getInputProps()`, submit with `form.onSubmit()`, validate via the `validate` option.
- The Query cache is persisted to `localStorage` via `PersistQueryClientProvider` (`src/providers/QueryProvider.tsx`), cache-busted by `${__APP_VERSION__}-${__GIT_HASH__}` (injected at build time in `vite.config.ts` from `package.json` version + git short hash) so stale shapes don't survive a deploy.

### Offline support — phase-gated (see `docs/offline-strategy.md`)

Offline work is split into phases, and **agents must not implement behavior from a later phase without explicit user instruction**:

- **Phase 1 (complete)**: read-only offline — persisted query cache, offline/stale indicators.
- **Phase 2 (complete)**: write queue and replay — covers transactions, categories, payment types, recurring transactions, and sheet settings. Explicitly excludes sheet create/delete and sheet member operations (these go through auth/email flows and are not queued).
- **Phase 3 (not started)**: conflict-resolution UX and sync diagnostics — do not build this until asked.

The write queue itself lives in `src/lib/offline-queue.ts`: operations are tagged unions (`QueuedOperation`) persisted to `localStorage` under `waldas-watch-offline-queue`, each with `id`/`timestamp`/`retries` and a `MAX_RETRIES` cap; queue mutations dispatch a `waldas-watch:queue-changed` `CustomEvent` that UI (e.g. `SyncBanner`) listens for. When adding a new queueable mutation type, extend this union and follow the existing per-entity `CREATE_*`/`UPDATE_*`/`DELETE_*` naming.

Before any offline-related change, map it to a phase in `docs/offline-strategy.md` first.

### Waldi (AI assistant)

Waldi is an in-app budgeting assistant reachable from the bottom nav as a draggable bottom sheet, backed by the `financial-assistant` Supabase Edge Function (`supabase/functions/financial-assistant/index.ts`) and `src/lib/ai-assistant-requests.ts` / `src/queries/use-financial-assistant-mutation.ts` + `use-financial-assistant-starter-insights-query.ts`. Design constraints: stays scoped to budgeting topics (redirects unrelated prompts), returns short Markdown responses, thread is in-memory per session only (resets on new chat/refresh — nothing is persisted server-side beyond a rolling context summary), and is rate-limited against repeat sends while a response is in flight (`add_ai_rate_limits` migrations back this).

### Supabase Edge Functions

Located in `supabase/functions/`: `accept-invite`, `decline-invite`, `get-invite`, `create-sheet`, `process-recurring-transactions`, `financial-assistant`. These handle flows that need service-role privileges or scheduled/server-side execution rather than direct client RLS-scoped access.

## Code conventions

- KISS: prefer the simplest correct solution; extract a shared primitive once a pattern repeats, don't pre-abstract.
- React components and their files use PascalCase (`UserAvatar.tsx`).
- No IIFEs inside JSX for derived values — use `useMemo` at the top of the component instead.
- In `src/utils`: one helper per file, named by purpose without a `-utils` suffix (`format-date.ts`, not `format-date-utils.ts`).
- Outside `src/utils` (i.e. in `src/lib`), the suffix convention flips: `*-requests.ts` for Supabase I/O, `*-utils.ts` for pure helpers — never mixed in the same file.
- Reuse shared UI from `src/components` before adding new one-off UI.

## Tone & copy

App copy is playful and leans into Filipino (Taglish) humor — references to sweldo, pera, "bahala na", etc. Keep meaning clear to non-Filipino users even when a Filipino word is used (see README tagline: *"Because 'bahala na' is not a financial plan."*). Applies to labels, placeholders, empty states, and error messages.
