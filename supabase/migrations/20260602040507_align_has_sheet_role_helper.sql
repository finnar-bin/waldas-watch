CREATE OR REPLACE FUNCTION "public"."has_sheet_role"("target_sheet_id" "uuid", "allowed_roles" "public"."user_role"[]) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.sheet_users su
    where su.sheet_id = target_sheet_id
      and su.user_id = auth.uid()
      and su.role = any(allowed_roles)
  );
$$;

ALTER FUNCTION "public"."has_sheet_role"("target_sheet_id" "uuid", "allowed_roles" "public"."user_role"[]) OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."has_sheet_role"("target_sheet_id" "uuid", "allowed_roles" "public"."user_role"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."has_sheet_role"("target_sheet_id" "uuid", "allowed_roles" "public"."user_role"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_sheet_role"("target_sheet_id" "uuid", "allowed_roles" "public"."user_role"[]) TO "service_role";
