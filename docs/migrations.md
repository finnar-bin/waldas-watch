# Supabase Migrations Runbook

## Pending Migrations (push to dev + prod simultaneously at deploy time)

- **Fix `transaction_overview` month indexing** — The RPC currently does `(EXTRACT(MONTH FROM t.date)::integer - 1) = target_month`, treating `target_month` as 0-indexed. This is wrong — `EXTRACT(MONTH ...)` returns 1–12 naturally. Remove the `- 1` from the SQL, and also remove the `month - 1` workaround in `src/lib/transaction-form-requests.ts` (`getSheetTransactionOverview`). Same bug exists in `history_feed` at the same line — fix both in the same migration.

This repo uses Supabase CLI migrations as the single source of truth for schema changes.

## Rules

- Use only `supabase/migrations`.
- Apply changes to `dev` first, then `prod`.
- Do not create prod-only migrations.
- Use `supabase migration repair` only to fix migration history mismatches.
- Do not assume `.env.development` or `.env.production` changes the Supabase CLI target. Commands with `--linked` use the project in `supabase/.temp/project-ref`.
- Use `npm run db:push:dev` and `npm run db:push:prod` rather than raw `supabase db push`; those scripts relink before pushing.
- For new tables exposed through Supabase REST/Data API, explicitly grant the intended roles (`authenticated`, `service_role`, and only `anon` when public access is intentional). New tables may not be exposed automatically.
- Keep shared RLS helper functions, such as `has_sheet_role` and `is_sheet_member`, aligned through migrations before using them in new policies.

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

For new REST/Data API tables, verify both Postgres and REST. First confirm the CLI is linked to dev, then check table existence:

```bash
npm run db:link:dev
npx dotenv -e .env.development -- npx supabase db query --linked "select to_regclass('public.your_table_name');"
```

Then verify the app or REST endpoint. If REST returns `PGRST205`, confirm `supabase/.temp/project-ref` matches `VITE_SUPABASE_URL`, then reload PostgREST schema:

```sql
notify pgrst, 'reload schema';
```

If PostgREST still does not recognize new objects, run Supabase's documented notification queue refresh:

```sql
select pg_notification_queue_usage();
```

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

After switching targets, verify `supabase/.temp/project-ref` when in doubt. Avoid running environment-specific verification queries with `--linked` until the CLI has been linked to the intended project.

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
