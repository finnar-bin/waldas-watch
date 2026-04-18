# Offline Strategy

This document defines how offline support should work in Gastos.

## Goals

- Users can read recently loaded data without internet.
- Users can create and edit data while offline.
- Offline changes sync automatically when connectivity returns.
- UI makes sync status and failures clear.

## Non-goals (Initial Phase)

- Full multi-device real-time conflict merging.
- Complex collaborative editing conflict workflows.

## Scope

Offline support applies to:

- Transactions
- Budgets
- Categories
- User profile fields used in core flows

## Architecture

### Server State

- Use TanStack Query for Supabase-backed data.
- Persist query cache to device storage.
- Use stale data when offline.

### Mutations

- Queue writes while offline.
- Retry queued writes when online.
- Keep mutation order per entity to reduce inconsistency.

### Connectivity

- Track online/offline status centrally.
- Pause network-heavy actions when offline.
- Resume sync automatically when online.

## UX Requirements

- Show a global offline banner when disconnected.
- Show syncing indicator when replaying queued mutations.
- Show sync error state with retry action for failed items.
- Show last-updated timestamp for important lists.

## Data Consistency Rules

- Prefer server as source of truth after reconnect.
- Use optimistic updates locally for fast feedback.
- If server rejects a queued mutation, surface an actionable error.
- For conflicts, use last-write-wins in initial phase and log failures for later improvement.

## Security and Auth

- Keep authenticated session persisted locally when valid.
- If session expires offline, allow read-only access to cached data where safe.
- Require re-auth before replaying protected mutations after expiry.

## Rollout Plan

1. Read-only offline support
- Persist query cache.
- Show offline banner and stale states.

2. Offline write queue
- Queue mutations.
- Replay on reconnect with retry/backoff.

3. Conflict and failure hardening
- Add better conflict messaging.
- Add per-item sync diagnostics.

## Phase Schedule

- **Phase 1 (Complete)**:
  - Implemented during auth and core app shell build.
  - Scope: read-only offline foundation only (cache persistence + offline indicators).
- **Phase 2 (Complete)**:
  - Implemented after CRUD flows were stable.
  - Scope: offline mutation queue and replay for transactions, categories, payment types, recurring transactions, and sheet settings. Excluded: sheet create/delete and sheet member operations (auth/email flows).
- **Phase 3 (Not started — awaiting production usage feedback)**:
  - Start after real usage reveals conflict/error patterns.
  - Scope: conflict handling hardening and sync diagnostics.

## Agent Change Gate

Before making a change, classify it:

- If the change is cache persistence, offline read behavior, or connectivity indicators: Phase 1.
- If the change queues writes or replays writes after reconnect: Phase 2.
- If the change adds conflict-resolution UX, merge policies, or detailed sync diagnostics: Phase 3.

Agents should not jump phases without explicit user instruction.

## Testing Checklist

- App launch without internet shows cached data.
- Create/edit/delete while offline queues correctly.
- Reconnect replays queue successfully.
- Failed replay shows clear error and retry path.
- Session-expiry edge cases are handled gracefully.
