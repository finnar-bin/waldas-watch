alter table public.sheet_settings
  add column budget_rollover_enabled boolean not null default false,
  add column budget_rollover_enabled_at timestamptz;
