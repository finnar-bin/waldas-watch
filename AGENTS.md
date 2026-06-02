# AGENTS

This file defines coding preferences for AI assistants working in this repo.

## Core Principles

- Follow KISS: prefer the simplest solution that is correct and maintainable.
- Favor reusable components/functions over one-off implementations.
- Avoid copy-pasting logic or UI patterns across screens.
- When a pattern appears more than once, extract a shared primitive.

## Tone & Copy

- This app is fun and playful. All user-facing copy (labels, placeholders, taglines, empty states, error messages) should reflect that personality.
- Lean into Pinoy (Filipino) humor — references to sweldo, pera, bahala na, and everyday Filipino life are welcome.
- Copy must still be accessible to non-Filipino users. Prefer Taglish over pure Tagalog, and make sure meaning is clear from context even if a word is unfamiliar.

## UI Development

- Use shared UI components from `src/components` whenever available.
- Keep styling consistent by using primitive-owned defaults, then extend only when needed.
- Always use `useForm` from `@mantine/form` for any form. Never manage form fields with individual `useState` calls. Use `form.getInputProps()` to bind fields and `form.onSubmit()` to handle submission.

## Code Organization

- Keep business logic in reusable functions/modules.
- Keep screen files focused on composition and flow, not duplicated implementation details.
- Prefer small abstractions with clear names over many ad-hoc inline blocks.
- React components must use PascalCase naming (for `function` and `const` component declarations).
- React component file names must use PascalCase (example: `UserAvatar.tsx`, `TransactionCategoryIcon.tsx`).
- Shared reusable helpers should live in `src/utils`.
  - In `src/utils`, use one helper per file.
  - In `src/utils`, do not use a `-utils` filename suffix. Use names like `format-date.ts`, not `format-date-utils.ts`.
- In `src/lib`, keep Supabase request/actions separate from helpers/utils.
- Naming convention:
- `*-requests.ts` for Supabase I/O (queries, mutations, RPC calls).
- In `src/utils`, helper files should be named by purpose without the `-utils` suffix (example: `format-date.ts`).
- Outside `src/utils`, use `*-utils.ts` for pure helpers/sanitizers/formatters with no Supabase calls.
- Do not mix request code and helper code in the same module.

## React Patterns

- Do not use IIFEs (`(() => { ... })()`) inside JSX to compute derived values. Use `useMemo` at the top of the component instead to keep JSX readable and derived logic traceable.

## State Management

- Separate server state from client/UI state.
- Use TanStack Query for Supabase-backed server state (fetching, caching, invalidation, optimistic updates).
- Do not use TanStack Query as a general UI state store.
- Prefer local `useState`/`useReducer` first for client/UI state.
- Use Context for lightweight shared client state.
- Introduce Zustand only when client/UI state becomes complex across multiple screens.

## Offline Phase Gate

- Before implementing any offline-related change, map it to a phase in `docs/offline-strategy.md`.
- This needs to immediately be followed upon project start.
- Do not implement Phase 2 or Phase 3 behavior unless explicitly requested by the user.
- Keep changes phase-scoped: avoid adding mutation queue/conflict logic while Phase 1 is active.

## Supabase Migrations

- Treat `supabase/.temp/project-ref` as mutable local CLI state, not as proof that an npm script is targeting the right project.
- `supabase db push`, `supabase db query --linked`, and `supabase migration list` use the currently linked project. Loading `.env.development` or `.env.production` does not change the linked project by itself.
- Before any `--linked` Supabase CLI command, link deliberately with `npm run db:link:dev` or `npm run db:link:prod`, or use a script that links first.
- Prefer `npm run db:push:dev` and `npm run db:push:prod` over raw `supabase db push`; these scripts relink before pushing.
- When checking whether a table is exposed through the Supabase REST/Data API, verify both Postgres metadata and the REST endpoint. A table can exist in Postgres while REST returns `PGRST205` if the migration was pushed to a different project or PostgREST has stale schema state.
- For new tables in exposed schemas, explicitly grant the intended API roles. Do not rely on tables being automatically exposed to the Data API.
- Keep dev and prod schema helpers aligned through migrations. If a helper such as `has_sheet_role` is used by RLS policies, make sure it exists in committed migrations and both environments before relying on it.

## Documentation

- Follow and update `docs/state-management.md` for state patterns and boundaries.
- Follow and update `docs/offline-strategy.md` for offline behavior and sync rules.
