# Supabase Migrations Runbook

## Pending Migrations (push to dev + prod simultaneously at deploy time)

- **Fix `transaction_overview` month indexing** — The RPC currently does `(EXTRACT(MONTH FROM t.date)::integer - 1) = target_month`, treating `target_month` as 0-indexed. This is wrong — `EXTRACT(MONTH ...)` returns 1–12 naturally. Remove the `- 1` from the SQL, and also remove the `month - 1` workaround in `src/lib/transaction-form-requests.ts` (`getSheetTransactionOverview`). Same bug exists in `history_feed` at the same line — fix both in the same migration.

This repo uses Supabase CLI migrations as the single source of truth for schema changes.

## Rules

- Use only `supabase/migrations`.
- Apply changes to `dev` first, then `prod`.
- Do not create prod-only migrations.
- Use `supabase migration repair` only to fix migration history mismatches.

## Required Environment Variables

Use env files so contributors do not need shell exports.

1. Copy templates:

```bash
cp .env.development.example .env.development
cp .env.production.example .env.production
```

2. Fill values:

- `.env.development`:
  - `SUPABASE_PROJECT_REF_DEV`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- `.env.production`:
  - `SUPABASE_PROJECT_REF_PROD`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## Normal Migration Flow

1. Create a migration file:

```bash
supabase migration new <name>
```

2. Add SQL statements to the new file under `supabase/migrations/`.
3. Apply and test in dev:

```bash
npm run db:push:dev
```

4. Validate app behavior against dev.
5. Promote the exact same migration to prod:

```bash
npm run db:push:prod
```

6. Verify migration status:

```bash
npm run db:list
```

## Linking Shortcuts

- `npm run db:link:dev`
- `npm run db:link:prod`

These scripts load `.env.development` or `.env.production` automatically via `dotenv-cli`.

## Repair Commands (History Only)

Use only when local/remote migration history is out of sync.

Mark a migration as applied:

```bash
supabase migration repair <version> --status applied
```

Mark a migration as reverted:

```bash
supabase migration repair <version> --status reverted
```

Then verify:

```bash
supabase migration list
```
