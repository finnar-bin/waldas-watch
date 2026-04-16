# State Management Guide

This project uses different tools for different kinds of state. Keep the boundary clear.

## 1) Server State (Data from Supabase)

Use TanStack Query for server state:

- Data fetching and caching
- Background refetching
- Loading/error states
- Mutations and invalidation
- Optimistic updates

Examples:

- Transactions
- Budgets
- Categories
- Profile/account data loaded from Supabase

## 2) Client/UI State (App-only state)

Use client state patterns for UI-only concerns:

- Local `useState`/`useReducer` first
- Context for small shared state
- Zustand only when client state is complex and shared across many screens

Examples:

- Modal open/close flags
- Active tab/filter selection
- Wizard step
- Temporary form drafts before submit

## Forms

Always use `useForm` from `@mantine/form` for any form in this project. Never manage form fields with individual `useState` calls.

- Use `form.getInputProps('field')` to bind inputs — it wires `value`, `onChange`, and `error` automatically.
- Use `form.onSubmit(handler)` for the submit handler — it validates before calling the handler.
- Define `validate` in `useForm` for field-level validation rules.

```ts
const form = useForm({
  initialValues: { ... },
  validate: {
    field: (v) => (condition ? null : 'Error message'),
  },
})
```

## Decision Rule

- If state comes from backend or needs cache/refetch/invalidation: use TanStack Query.
- If state is UI behavior only and not persisted remotely: use local state, Context, or Zustand.

## `src/lib` Module Boundaries

- Keep Supabase request/actions in `*-requests.ts` files.
- Keep pure helpers/utilities in `*-utils.ts` files.
- Utility modules must not import Supabase client modules.
- Do not combine Supabase calls and helper logic in the same `src/lib` file.
