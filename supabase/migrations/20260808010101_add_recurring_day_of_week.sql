alter table "public"."recurring_transactions"
    add column "day_of_week" smallint;

alter table "public"."recurring_transactions"
    add constraint "recurring_transactions_day_of_week_check" check (("day_of_week" >= 0) and ("day_of_week" <= 6));
