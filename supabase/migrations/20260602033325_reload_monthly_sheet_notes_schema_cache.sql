grant select, insert, update on table "public"."monthly_sheet_notes" to "authenticated";
grant all on table "public"."monthly_sheet_notes" to "service_role";
revoke all on table "public"."monthly_sheet_notes" from "anon";

notify pgrst, 'reload schema';
