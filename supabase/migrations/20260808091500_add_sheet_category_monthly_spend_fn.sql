create or replace function public.sheet_category_monthly_spend(
  target_sheet_id uuid,
  target_type public.transaction_type,
  since date
)
returns table(category_id uuid, month date, spent numeric)
language sql
stable
set search_path to 'public'
as $$
  select
    t.category_id,
    date_trunc('month', t.date)::date as month,
    sum(t.amount) as spent
  from public.transactions t
  where t.sheet_id = target_sheet_id
    and t.type = target_type
    and t.date >= since
  group by t.category_id, date_trunc('month', t.date)
$$;

revoke all on function public.sheet_category_monthly_spend(uuid, public.transaction_type, date)
  from public, anon;

grant execute on function public.sheet_category_monthly_spend(uuid, public.transaction_type, date)
  to authenticated, service_role;
