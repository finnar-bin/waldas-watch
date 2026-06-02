create table if not exists "public"."monthly_sheet_notes" (
    "id" "uuid" default "gen_random_uuid"() not null,
    "sheet_id" "uuid" not null,
    "year" integer not null,
    "month" integer not null,
    "note" text default ''::text not null,
    "created_by" "uuid" not null,
    "created_at" timestamp without time zone default "now"() not null,
    "updated_at" timestamp without time zone default "now"() not null,
    constraint "monthly_sheet_notes_pkey" primary key ("id"),
    constraint "monthly_sheet_notes_sheet_year_month_uq" unique ("sheet_id", "year", "month"),
    constraint "monthly_sheet_notes_month_check" check ((("month" >= 1) and ("month" <= 12))),
    constraint "monthly_sheet_notes_year_check" check (("year" >= 1900))
);

alter table only "public"."monthly_sheet_notes" force row level security;

alter table "public"."monthly_sheet_notes" owner to "postgres";

create index "monthly_sheet_notes_sheet_period_idx" on "public"."monthly_sheet_notes" using "btree" ("sheet_id", "year", "month");

alter table only "public"."monthly_sheet_notes"
    add constraint "monthly_sheet_notes_sheet_id_fkey" foreign key ("sheet_id") references "public"."sheets"("id") on delete cascade;

alter table "public"."monthly_sheet_notes" enable row level security;

create policy "monthly_sheet_notes_select_member" on "public"."monthly_sheet_notes" for select to "authenticated" using ("public"."is_sheet_member"("sheet_id"));

create policy "monthly_sheet_notes_insert_editor_admin" on "public"."monthly_sheet_notes" for insert to "authenticated" with check ((("created_by" = "auth"."uid"()) and (exists (select 1 from "public"."sheet_users" where (("sheet_users"."sheet_id" = "monthly_sheet_notes"."sheet_id") and ("sheet_users"."user_id" = "auth"."uid"()) and ("sheet_users"."role" in ('editor'::"public"."user_role", 'admin'::"public"."user_role")))))));

create policy "monthly_sheet_notes_update_editor_admin" on "public"."monthly_sheet_notes" for update to "authenticated" using ((exists (select 1 from "public"."sheet_users" where (("sheet_users"."sheet_id" = "monthly_sheet_notes"."sheet_id") and ("sheet_users"."user_id" = "auth"."uid"()) and ("sheet_users"."role" in ('editor'::"public"."user_role", 'admin'::"public"."user_role")))))) with check ((exists (select 1 from "public"."sheet_users" where (("sheet_users"."sheet_id" = "monthly_sheet_notes"."sheet_id") and ("sheet_users"."user_id" = "auth"."uid"()) and ("sheet_users"."role" in ('editor'::"public"."user_role", 'admin'::"public"."user_role"))))));

grant select, insert, update on table "public"."monthly_sheet_notes" to "authenticated";
grant all on table "public"."monthly_sheet_notes" to "service_role";

revoke all on table "public"."monthly_sheet_notes" from "anon";
