


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "drizzle";


ALTER SCHEMA "drizzle" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."category_due_reminder_frequency" AS ENUM (
    'specific_date',
    'daily',
    'weekly',
    'monthly'
);


ALTER TYPE "public"."category_due_reminder_frequency" OWNER TO "postgres";


CREATE TYPE "public"."invite_status" AS ENUM (
    'pending',
    'accepted',
    'declined',
    'revoked',
    'expired'
);


ALTER TYPE "public"."invite_status" OWNER TO "postgres";


CREATE TYPE "public"."recurring_frequency" AS ENUM (
    'daily',
    'weekly',
    'monthly',
    'yearly'
);


ALTER TYPE "public"."recurring_frequency" OWNER TO "postgres";


CREATE TYPE "public"."transaction_type" AS ENUM (
    'income',
    'expense'
);


ALTER TYPE "public"."transaction_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'viewer',
    'editor',
    'admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."category_transactions"("target_sheet_id" "uuid", "target_category_id" "uuid", "target_year" integer, "target_month" integer) RETURNS TABLE("transaction_id" "uuid", "amount" numeric, "transaction_type" "public"."transaction_type", "description" "text", "transaction_date" "date", "payment_type_name" "text", "payment_type_icon" "text", "creator_display_name" "text", "creator_email" "text", "creator_avatar_url" "text")
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  SELECT
    t.id AS transaction_id,
    t.amount,
    t.type AS transaction_type,
    t.description,
    t.date AS transaction_date,
    pt.name AS payment_type_name,
    pt.icon AS payment_type_icon,
    smd.display_name AS creator_display_name,
    smd.email AS creator_email,
    smd.avatar_url AS creator_avatar_url
  FROM public.transactions t
  LEFT JOIN public.payment_types pt
    ON pt.id = t.payment_type_id
  LEFT JOIN public.sheet_member_directory smd
    ON smd.sheet_id = t.sheet_id
   AND smd.member_id = t.created_by
  WHERE t.sheet_id = target_sheet_id
    AND t.category_id = target_category_id
    AND EXTRACT(YEAR FROM t.date)::integer = target_year
    AND (EXTRACT(MONTH FROM t.date)::integer - 1) = target_month
  ORDER BY t.date DESC, t.created_at DESC;
$$;


ALTER FUNCTION "public"."category_transactions"("target_sheet_id" "uuid", "target_category_id" "uuid", "target_year" integer, "target_month" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."dashboard_summary"("target_sheet_id" "uuid", "target_year" integer, "target_month" integer) RETURNS TABLE("income_total" numeric, "expense_total" numeric, "chart_data" "jsonb", "recent_transactions" "jsonb")
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  WITH month_totals AS (
    SELECT
      COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)::numeric AS income_total,
      COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)::numeric AS expense_total
    FROM public.transactions t
    WHERE t.sheet_id = target_sheet_id
      AND EXTRACT(YEAR FROM t.date)::integer = target_year
      AND (EXTRACT(MONTH FROM t.date)::integer - 1) = target_month
  ),
  year_series AS (
    SELECT
      month_index,
      COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)::numeric AS income,
      COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)::numeric AS expense
    FROM generate_series(0, 11) AS month_index
    LEFT JOIN public.transactions t
      ON t.sheet_id = target_sheet_id
     AND EXTRACT(YEAR FROM t.date)::integer = target_year
     AND (EXTRACT(MONTH FROM t.date)::integer - 1) = month_index
    GROUP BY month_index
    ORDER BY month_index
  ),
  recent_rows AS (
    SELECT
      t.id,
      t.amount,
      t.type,
      t.description,
      t.date,
      c.name AS category_name,
      c.icon AS category_icon,
      smd.display_name AS creator_display_name,
      smd.email AS creator_email,
      smd.avatar_url AS creator_avatar_url
    FROM public.transactions t
    INNER JOIN public.categories c
      ON c.id = t.category_id
    LEFT JOIN public.sheet_member_directory smd
      ON smd.sheet_id = t.sheet_id
     AND smd.member_id = t.created_by
    WHERE t.sheet_id = target_sheet_id
    ORDER BY t.created_at DESC
    LIMIT 5
  )
  SELECT
    mt.income_total,
    mt.expense_total,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'month', ys.month_index,
            'income', ys.income,
            'expense', ys.expense
          )
          ORDER BY ys.month_index
        )
        FROM year_series ys
      ),
      '[]'::jsonb
    ) AS chart_data,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', rr.id,
            'amount', rr.amount,
            'type', rr.type,
            'description', rr.description,
            'date', rr.date,
            'categoryName', rr.category_name,
            'categoryIcon', rr.category_icon,
            'creatorDisplayName', rr.creator_display_name,
            'creatorEmail', rr.creator_email,
            'creatorAvatarUrl', rr.creator_avatar_url
          )
          ORDER BY rr.date DESC, rr.id DESC
        )
        FROM recent_rows rr
      ),
      '[]'::jsonb
    ) AS recent_transactions
  FROM month_totals mt;
$$;


ALTER FUNCTION "public"."dashboard_summary"("target_sheet_id" "uuid", "target_year" integer, "target_month" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_any_user_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (id, email, display_name, avatar_url, updated_at)
  values (
    new.id,
    new.email,
    -- Prioritize 'display_name' (manual), then 'full_name' (google)
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    ),
    -- Prioritize 'avatar_url' (manual), then 'picture' (google)
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    ),
    now()
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_any_user_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_user_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update public.profiles
  set 
    display_name = new.raw_user_meta_data->>'display_name',
    avatar_url = new.raw_user_meta_data->>'avatar_url',
    updated_at = now()
  where id = new.id;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_user_update"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."history_feed"("target_sheet_id" "uuid", "target_year" integer, "target_month" integer, "target_type" "public"."transaction_type" DEFAULT NULL::"public"."transaction_type", "target_category_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("transaction_id" "uuid", "amount" numeric, "transaction_type" "public"."transaction_type", "description" "text", "transaction_date" "date", "category_id" "uuid", "category_name" "text", "category_type" "public"."transaction_type", "category_icon" "text", "payment_type_name" "text", "payment_type_icon" "text", "created_by" "uuid", "creator_display_name" "text", "creator_email" "text", "creator_avatar_url" "text")
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  SELECT
    t.id AS transaction_id,
    t.amount,
    t.type AS transaction_type,
    t.description,
    t.date AS transaction_date,
    c.id AS category_id,
    c.name AS category_name,
    c.type AS category_type,
    c.icon AS category_icon,
    pt.name AS payment_type_name,
    pt.icon AS payment_type_icon,
    t.created_by,
    smd.display_name AS creator_display_name,
    smd.email AS creator_email,
    smd.avatar_url AS creator_avatar_url
  FROM public.transactions t
  INNER JOIN public.categories c
    ON c.id = t.category_id
  LEFT JOIN public.payment_types pt
    ON pt.id = t.payment_type_id
  LEFT JOIN public.sheet_member_directory smd
    ON smd.sheet_id = t.sheet_id
   AND smd.member_id = t.created_by
  WHERE t.sheet_id = target_sheet_id
    AND EXTRACT(YEAR FROM t.date)::integer = target_year
    AND (EXTRACT(MONTH FROM t.date)::integer - 1) = target_month
    AND (target_type IS NULL OR t.type = target_type)
    AND (target_category_id IS NULL OR t.category_id = target_category_id)
  ORDER BY t.date DESC, t.created_at DESC;
$$;


ALTER FUNCTION "public"."history_feed"("target_sheet_id" "uuid", "target_year" integer, "target_month" integer, "target_type" "public"."transaction_type", "target_category_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_sheet_member"("target_sheet_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.sheet_users
    WHERE sheet_users.sheet_id = target_sheet_id
      AND sheet_users.user_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."is_sheet_member"("target_sheet_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."transaction_overview"("target_sheet_id" "uuid", "target_year" integer, "target_month" integer, "target_type" "public"."transaction_type") RETURNS TABLE("category_id" "uuid", "category_name" "text", "category_icon" "text", "category_type" "public"."transaction_type", "budget" numeric, "total_amount" numeric)
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  WITH category_totals AS (
    SELECT
      t.category_id,
      COALESCE(SUM(t.amount), 0)::numeric AS total_amount
    FROM public.transactions t
    WHERE t.sheet_id = target_sheet_id
      AND t.type = target_type
      AND EXTRACT(YEAR FROM t.date)::integer = target_year
      AND (EXTRACT(MONTH FROM t.date)::integer - 1) = target_month
    GROUP BY t.category_id
  )
  SELECT
    c.id AS category_id,
    c.name AS category_name,
    c.icon AS category_icon,
    c.type AS category_type,
    c.budget,
    COALESCE(ct.total_amount, 0)::numeric AS total_amount
  FROM public.categories c
  LEFT JOIN category_totals ct
    ON ct.category_id = c.id
  WHERE c.sheet_id = target_sheet_id
    AND c.type = target_type
  ORDER BY c.name ASC;
$$;


ALTER FUNCTION "public"."transaction_overview"("target_sheet_id" "uuid", "target_year" integer, "target_month" integer, "target_type" "public"."transaction_type") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
    "id" integer NOT NULL,
    "hash" "text" NOT NULL,
    "created_at" bigint
);


ALTER TABLE "drizzle"."__drizzle_migrations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "drizzle"."__drizzle_migrations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "drizzle"."__drizzle_migrations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "drizzle"."__drizzle_migrations_id_seq" OWNED BY "drizzle"."__drizzle_migrations"."id";



CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "icon" "text" NOT NULL,
    "sheet_id" "uuid" NOT NULL,
    "type" "public"."transaction_type" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "budget" numeric(10,2),
    "default_amount" numeric(10,2),
    "due_date" "date",
    "due_reminder_frequency" "public"."category_due_reminder_frequency",
    "due_last_notified_on" "date"
);

ALTER TABLE ONLY "public"."categories" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."category_reminder_deliveries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "local_date" "date" NOT NULL,
    "sent_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."category_reminder_deliveries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "icon" "text" NOT NULL,
    "sheet_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."payment_types" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "display_name" "text",
    "avatar_url" "text",
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "time_zone" "text",
    "push_notifications_enabled" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."push_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "endpoint" "text" NOT NULL,
    "p256dh_key" "text" NOT NULL,
    "auth_key" "text" NOT NULL,
    "user_agent" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."push_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recurring_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sheet_id" "uuid",
    "category_id" "uuid" NOT NULL,
    "payment_type_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "type" "public"."transaction_type" NOT NULL,
    "description" "text",
    "frequency" "public"."recurring_frequency" DEFAULT 'monthly'::"public"."recurring_frequency" NOT NULL,
    "day_of_month" numeric,
    "last_processed_at" timestamp without time zone,
    "next_process_date" "date" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."recurring_transactions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."recurring_overview" WITH ("security_invoker"='true') AS
 SELECT "rt"."sheet_id",
    "rt"."id",
    "rt"."amount",
    "rt"."type",
    "rt"."description",
    "rt"."frequency",
    "rt"."next_process_date",
    "rt"."is_active",
    "rt"."created_at",
    "c"."id" AS "category_id",
    "c"."name" AS "category_name",
    "c"."icon" AS "category_icon",
    "pt"."id" AS "payment_type_id",
    "pt"."name" AS "payment_type_name"
   FROM (("public"."recurring_transactions" "rt"
     JOIN "public"."categories" "c" ON (("c"."id" = "rt"."category_id")))
     LEFT JOIN "public"."payment_types" "pt" ON (("pt"."id" = "rt"."payment_type_id")));


ALTER VIEW "public"."recurring_overview" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sheet_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sheet_id" "uuid" NOT NULL,
    "invited_email" "text" NOT NULL,
    "role" "public"."user_role" DEFAULT 'viewer'::"public"."user_role" NOT NULL,
    "token_hash" "text" NOT NULL,
    "status" "public"."invite_status" DEFAULT 'pending'::"public"."invite_status" NOT NULL,
    "invited_by" "uuid" NOT NULL,
    "accepted_by" "uuid",
    "expires_at" timestamp without time zone NOT NULL,
    "accepted_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sheet_invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sheet_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sheet_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."user_role" DEFAULT 'viewer'::"public"."user_role" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."sheet_users" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."sheet_users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."sheet_member_directory" WITH ("security_invoker"='true') AS
 SELECT "su"."sheet_id",
    "su"."user_id" AS "member_id",
    "su"."role",
    "p"."display_name",
    "p"."avatar_url",
    "p"."email"
   FROM ("public"."sheet_users" "su"
     LEFT JOIN "public"."profiles" "p" ON (("p"."id" = "su"."user_id")));


ALTER VIEW "public"."sheet_member_directory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sheet_settings" (
    "sheet_id" "uuid" NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "updated_by" "uuid" NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."sheet_settings" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."sheet_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sheets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."sheets" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."sheets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "type" "public"."transaction_type" NOT NULL,
    "description" "text",
    "date" "date" DEFAULT "now"() NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "sheet_id" "uuid",
    "category_id" "uuid" NOT NULL,
    "payment_type_id" "uuid"
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


ALTER TABLE ONLY "drizzle"."__drizzle_migrations" ALTER COLUMN "id" SET DEFAULT "nextval"('"drizzle"."__drizzle_migrations_id_seq"'::"regclass");



ALTER TABLE ONLY "drizzle"."__drizzle_migrations"
    ADD CONSTRAINT "__drizzle_migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."category_reminder_deliveries"
    ADD CONSTRAINT "category_reminder_deliveries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_types"
    ADD CONSTRAINT "payment_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recurring_transactions"
    ADD CONSTRAINT "recurring_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sheet_invites"
    ADD CONSTRAINT "sheet_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sheet_settings"
    ADD CONSTRAINT "sheet_settings_pkey" PRIMARY KEY ("sheet_id");



ALTER TABLE ONLY "public"."sheet_users"
    ADD CONSTRAINT "sheet_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sheet_users"
    ADD CONSTRAINT "sheet_users_sheet_id_user_id_uq" UNIQUE ("sheet_id", "user_id");



ALTER TABLE ONLY "public"."sheets"
    ADD CONSTRAINT "sheets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



CREATE INDEX "categories_sheet_created_at_idx" ON "public"."categories" USING "btree" ("sheet_id", "created_at");



CREATE UNIQUE INDEX "category_reminder_deliveries_user_category_date_uq" ON "public"."category_reminder_deliveries" USING "btree" ("user_id", "category_id", "local_date");



CREATE INDEX "category_reminder_deliveries_user_date_idx" ON "public"."category_reminder_deliveries" USING "btree" ("user_id", "local_date");



CREATE INDEX "payment_types_sheet_id_idx" ON "public"."payment_types" USING "btree" ("sheet_id");



CREATE INDEX "profiles_email_idx" ON "public"."profiles" USING "btree" ("email");



CREATE UNIQUE INDEX "push_subscriptions_endpoint_uq" ON "public"."push_subscriptions" USING "btree" ("endpoint");



CREATE INDEX "push_subscriptions_user_active_idx" ON "public"."push_subscriptions" USING "btree" ("user_id", "is_active");



CREATE INDEX "push_subscriptions_user_id_idx" ON "public"."push_subscriptions" USING "btree" ("user_id");



CREATE INDEX "recurring_transactions_active_due_date_idx" ON "public"."recurring_transactions" USING "btree" ("next_process_date") WHERE ("is_active" = true);



CREATE INDEX "recurring_transactions_sheet_created_at_idx" ON "public"."recurring_transactions" USING "btree" ("sheet_id", "created_at");



CREATE INDEX "sheet_invites_email_status_expires_idx" ON "public"."sheet_invites" USING "btree" ("invited_email", "status", "expires_at");



CREATE INDEX "sheet_invites_sheet_email_status_idx" ON "public"."sheet_invites" USING "btree" ("sheet_id", "invited_email", "status");



CREATE INDEX "sheet_invites_sheet_status_expires_idx" ON "public"."sheet_invites" USING "btree" ("sheet_id", "status", "expires_at");



CREATE UNIQUE INDEX "sheet_invites_token_hash_uq" ON "public"."sheet_invites" USING "btree" ("token_hash");



CREATE INDEX "sheet_users_user_id_idx" ON "public"."sheet_users" USING "btree" ("user_id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_sheet_id_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."sheets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."category_reminder_deliveries"
    ADD CONSTRAINT "category_reminder_deliveries_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_types"
    ADD CONSTRAINT "payment_types_sheet_id_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."sheets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recurring_transactions"
    ADD CONSTRAINT "recurring_transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recurring_transactions"
    ADD CONSTRAINT "recurring_transactions_payment_type_id_payment_types_id_fk" FOREIGN KEY ("payment_type_id") REFERENCES "public"."payment_types"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."recurring_transactions"
    ADD CONSTRAINT "recurring_transactions_sheet_id_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."sheets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sheet_invites"
    ADD CONSTRAINT "sheet_invites_sheet_id_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."sheets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sheet_settings"
    ADD CONSTRAINT "sheet_settings_sheet_id_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."sheets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sheet_users"
    ADD CONSTRAINT "sheet_users_sheet_id_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."sheets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_payment_type_id_payment_types_id_fk" FOREIGN KEY ("payment_type_id") REFERENCES "public"."payment_types"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_sheet_id_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."sheets"("id") ON DELETE CASCADE;



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "categories_select_for_members" ON "public"."categories" FOR SELECT TO "authenticated" USING ("public"."is_sheet_member"("sheet_id"));



CREATE POLICY "categories_select_member" ON "public"."categories" FOR SELECT TO "authenticated" USING ("public"."is_sheet_member"("sheet_id"));



CREATE POLICY "categories_write_editor_admin" ON "public"."categories" TO "authenticated" USING ("public"."has_sheet_role"("sheet_id", ARRAY['editor'::"public"."user_role", 'admin'::"public"."user_role"])) WITH CHECK ("public"."has_sheet_role"("sheet_id", ARRAY['editor'::"public"."user_role", 'admin'::"public"."user_role"]));



ALTER TABLE "public"."category_reminder_deliveries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "category_reminder_deliveries_select_own" ON "public"."category_reminder_deliveries" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."payment_types" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payment_types_select_for_members" ON "public"."payment_types" FOR SELECT TO "authenticated" USING ("public"."is_sheet_member"("sheet_id"));



CREATE POLICY "payment_types_select_member" ON "public"."payment_types" FOR SELECT TO "authenticated" USING ("public"."is_sheet_member"("sheet_id"));



CREATE POLICY "payment_types_write_editor_admin" ON "public"."payment_types" TO "authenticated" USING ("public"."has_sheet_role"("sheet_id", ARRAY['editor'::"public"."user_role", 'admin'::"public"."user_role"])) WITH CHECK ("public"."has_sheet_role"("sheet_id", ARRAY['editor'::"public"."user_role", 'admin'::"public"."user_role"]));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert_own" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "profiles_select_for_sheet_members" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."sheet_users" "su_self"
     JOIN "public"."sheet_users" "su_target" ON (("su_target"."sheet_id" = "su_self"."sheet_id")))
  WHERE (("su_self"."user_id" = "auth"."uid"()) AND ("su_target"."user_id" = "profiles"."id"))))));



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



ALTER TABLE "public"."push_subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "push_subscriptions_delete_own" ON "public"."push_subscriptions" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "push_subscriptions_insert_own" ON "public"."push_subscriptions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "push_subscriptions_select_own" ON "public"."push_subscriptions" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "push_subscriptions_update_own" ON "public"."push_subscriptions" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."recurring_transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "recurring_transactions_delete_editor_admin" ON "public"."recurring_transactions" FOR DELETE TO "authenticated" USING ((("sheet_id" IS NOT NULL) AND "public"."has_sheet_role"("sheet_id", ARRAY['editor'::"public"."user_role", 'admin'::"public"."user_role"])));



CREATE POLICY "recurring_transactions_insert_editor_admin" ON "public"."recurring_transactions" FOR INSERT TO "authenticated" WITH CHECK ((("sheet_id" IS NOT NULL) AND "public"."has_sheet_role"("sheet_id", ARRAY['editor'::"public"."user_role", 'admin'::"public"."user_role"])));



CREATE POLICY "recurring_transactions_select_member" ON "public"."recurring_transactions" FOR SELECT TO "authenticated" USING ((("sheet_id" IS NOT NULL) AND "public"."is_sheet_member"("sheet_id")));



CREATE POLICY "recurring_transactions_update_editor_admin" ON "public"."recurring_transactions" FOR UPDATE TO "authenticated" USING ((("sheet_id" IS NOT NULL) AND "public"."has_sheet_role"("sheet_id", ARRAY['editor'::"public"."user_role", 'admin'::"public"."user_role"]))) WITH CHECK ((("sheet_id" IS NOT NULL) AND "public"."has_sheet_role"("sheet_id", ARRAY['editor'::"public"."user_role", 'admin'::"public"."user_role"])));



ALTER TABLE "public"."sheet_invites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sheet_invites_select_member" ON "public"."sheet_invites" FOR SELECT TO "authenticated" USING ("public"."is_sheet_member"("sheet_id"));



CREATE POLICY "sheet_invites_write_admin" ON "public"."sheet_invites" TO "authenticated" USING ("public"."has_sheet_role"("sheet_id", ARRAY['admin'::"public"."user_role"])) WITH CHECK ("public"."has_sheet_role"("sheet_id", ARRAY['admin'::"public"."user_role"]));



ALTER TABLE "public"."sheet_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sheet_settings_select_for_members" ON "public"."sheet_settings" FOR SELECT TO "authenticated" USING ("public"."is_sheet_member"("sheet_id"));



CREATE POLICY "sheet_settings_select_member" ON "public"."sheet_settings" FOR SELECT TO "authenticated" USING ("public"."is_sheet_member"("sheet_id"));



CREATE POLICY "sheet_settings_write_admin" ON "public"."sheet_settings" TO "authenticated" USING ("public"."has_sheet_role"("sheet_id", ARRAY['admin'::"public"."user_role"])) WITH CHECK ("public"."has_sheet_role"("sheet_id", ARRAY['admin'::"public"."user_role"]));



ALTER TABLE "public"."sheet_users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sheet_users_delete_admin" ON "public"."sheet_users" FOR DELETE TO "authenticated" USING ("public"."has_sheet_role"("sheet_id", ARRAY['admin'::"public"."user_role"]));



CREATE POLICY "sheet_users_insert_admin_or_creator_bootstrap" ON "public"."sheet_users" FOR INSERT TO "authenticated" WITH CHECK (("public"."has_sheet_role"("sheet_id", ARRAY['admin'::"public"."user_role"]) OR (("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."sheets" "s"
  WHERE (("s"."id" = "sheet_users"."sheet_id") AND ("s"."created_by" = "auth"."uid"())))))));



CREATE POLICY "sheet_users_select_for_members" ON "public"."sheet_users" FOR SELECT TO "authenticated" USING ("public"."is_sheet_member"("sheet_id"));



CREATE POLICY "sheet_users_update_admin" ON "public"."sheet_users" FOR UPDATE TO "authenticated" USING ("public"."has_sheet_role"("sheet_id", ARRAY['admin'::"public"."user_role"])) WITH CHECK ("public"."has_sheet_role"("sheet_id", ARRAY['admin'::"public"."user_role"]));



ALTER TABLE "public"."sheets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sheets_delete_admin" ON "public"."sheets" FOR DELETE TO "authenticated" USING ("public"."has_sheet_role"("id", ARRAY['admin'::"public"."user_role"]));



CREATE POLICY "sheets_insert_creator" ON "public"."sheets" FOR INSERT TO "authenticated" WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "sheets_select_for_members" ON "public"."sheets" FOR SELECT TO "authenticated" USING ("public"."is_sheet_member"("id"));



CREATE POLICY "sheets_select_member" ON "public"."sheets" FOR SELECT TO "authenticated" USING ("public"."is_sheet_member"("id"));



CREATE POLICY "sheets_update_admin" ON "public"."sheets" FOR UPDATE TO "authenticated" USING ("public"."has_sheet_role"("id", ARRAY['admin'::"public"."user_role"])) WITH CHECK ("public"."has_sheet_role"("id", ARRAY['admin'::"public"."user_role"]));



ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "transactions_delete_editor_admin" ON "public"."transactions" FOR DELETE TO "authenticated" USING ((("sheet_id" IS NOT NULL) AND "public"."has_sheet_role"("sheet_id", ARRAY['editor'::"public"."user_role", 'admin'::"public"."user_role"])));



CREATE POLICY "transactions_insert_editor_admin" ON "public"."transactions" FOR INSERT TO "authenticated" WITH CHECK ((("sheet_id" IS NOT NULL) AND "public"."has_sheet_role"("sheet_id", ARRAY['editor'::"public"."user_role", 'admin'::"public"."user_role"])));



CREATE POLICY "transactions_select_member" ON "public"."transactions" FOR SELECT TO "authenticated" USING ((("sheet_id" IS NOT NULL) AND "public"."is_sheet_member"("sheet_id")));



CREATE POLICY "transactions_update_editor_admin" ON "public"."transactions" FOR UPDATE TO "authenticated" USING ((("sheet_id" IS NOT NULL) AND "public"."has_sheet_role"("sheet_id", ARRAY['editor'::"public"."user_role", 'admin'::"public"."user_role"]))) WITH CHECK ((("sheet_id" IS NOT NULL) AND "public"."has_sheet_role"("sheet_id", ARRAY['editor'::"public"."user_role", 'admin'::"public"."user_role"])));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."category_transactions"("target_sheet_id" "uuid", "target_category_id" "uuid", "target_year" integer, "target_month" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."category_transactions"("target_sheet_id" "uuid", "target_category_id" "uuid", "target_year" integer, "target_month" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."category_transactions"("target_sheet_id" "uuid", "target_category_id" "uuid", "target_year" integer, "target_month" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."dashboard_summary"("target_sheet_id" "uuid", "target_year" integer, "target_month" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."dashboard_summary"("target_sheet_id" "uuid", "target_year" integer, "target_month" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."dashboard_summary"("target_sheet_id" "uuid", "target_year" integer, "target_month" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_any_user_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_any_user_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_any_user_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_user_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_user_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_user_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_sheet_role"("target_sheet_id" "uuid", "allowed_roles" "public"."user_role"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."has_sheet_role"("target_sheet_id" "uuid", "allowed_roles" "public"."user_role"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_sheet_role"("target_sheet_id" "uuid", "allowed_roles" "public"."user_role"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."history_feed"("target_sheet_id" "uuid", "target_year" integer, "target_month" integer, "target_type" "public"."transaction_type", "target_category_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."history_feed"("target_sheet_id" "uuid", "target_year" integer, "target_month" integer, "target_type" "public"."transaction_type", "target_category_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."history_feed"("target_sheet_id" "uuid", "target_year" integer, "target_month" integer, "target_type" "public"."transaction_type", "target_category_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_sheet_member"("target_sheet_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_sheet_member"("target_sheet_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_sheet_member"("target_sheet_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_sheet_member"("target_sheet_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."transaction_overview"("target_sheet_id" "uuid", "target_year" integer, "target_month" integer, "target_type" "public"."transaction_type") TO "anon";
GRANT ALL ON FUNCTION "public"."transaction_overview"("target_sheet_id" "uuid", "target_year" integer, "target_month" integer, "target_type" "public"."transaction_type") TO "authenticated";
GRANT ALL ON FUNCTION "public"."transaction_overview"("target_sheet_id" "uuid", "target_year" integer, "target_month" integer, "target_type" "public"."transaction_type") TO "service_role";


















GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."category_reminder_deliveries" TO "authenticated";
GRANT ALL ON TABLE "public"."category_reminder_deliveries" TO "service_role";



GRANT ALL ON TABLE "public"."payment_types" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_types" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."push_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."recurring_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."recurring_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."recurring_overview" TO "anon";
GRANT ALL ON TABLE "public"."recurring_overview" TO "authenticated";
GRANT ALL ON TABLE "public"."recurring_overview" TO "service_role";



GRANT ALL ON TABLE "public"."sheet_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."sheet_invites" TO "service_role";



GRANT ALL ON TABLE "public"."sheet_users" TO "authenticated";
GRANT ALL ON TABLE "public"."sheet_users" TO "service_role";



GRANT ALL ON TABLE "public"."sheet_member_directory" TO "anon";
GRANT ALL ON TABLE "public"."sheet_member_directory" TO "authenticated";
GRANT ALL ON TABLE "public"."sheet_member_directory" TO "service_role";



GRANT ALL ON TABLE "public"."sheet_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."sheet_settings" TO "service_role";



GRANT ALL ON TABLE "public"."sheets" TO "authenticated";
GRANT ALL ON TABLE "public"."sheets" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

revoke delete on table "public"."categories" from "anon";

revoke insert on table "public"."categories" from "anon";

revoke references on table "public"."categories" from "anon";

revoke select on table "public"."categories" from "anon";

revoke trigger on table "public"."categories" from "anon";

revoke truncate on table "public"."categories" from "anon";

revoke update on table "public"."categories" from "anon";

revoke delete on table "public"."category_reminder_deliveries" from "anon";

revoke insert on table "public"."category_reminder_deliveries" from "anon";

revoke references on table "public"."category_reminder_deliveries" from "anon";

revoke select on table "public"."category_reminder_deliveries" from "anon";

revoke trigger on table "public"."category_reminder_deliveries" from "anon";

revoke truncate on table "public"."category_reminder_deliveries" from "anon";

revoke update on table "public"."category_reminder_deliveries" from "anon";

revoke delete on table "public"."payment_types" from "anon";

revoke insert on table "public"."payment_types" from "anon";

revoke references on table "public"."payment_types" from "anon";

revoke select on table "public"."payment_types" from "anon";

revoke trigger on table "public"."payment_types" from "anon";

revoke truncate on table "public"."payment_types" from "anon";

revoke update on table "public"."payment_types" from "anon";

revoke delete on table "public"."profiles" from "anon";

revoke insert on table "public"."profiles" from "anon";

revoke references on table "public"."profiles" from "anon";

revoke select on table "public"."profiles" from "anon";

revoke trigger on table "public"."profiles" from "anon";

revoke truncate on table "public"."profiles" from "anon";

revoke update on table "public"."profiles" from "anon";

revoke delete on table "public"."push_subscriptions" from "anon";

revoke insert on table "public"."push_subscriptions" from "anon";

revoke references on table "public"."push_subscriptions" from "anon";

revoke select on table "public"."push_subscriptions" from "anon";

revoke trigger on table "public"."push_subscriptions" from "anon";

revoke truncate on table "public"."push_subscriptions" from "anon";

revoke update on table "public"."push_subscriptions" from "anon";

revoke delete on table "public"."recurring_transactions" from "anon";

revoke insert on table "public"."recurring_transactions" from "anon";

revoke references on table "public"."recurring_transactions" from "anon";

revoke select on table "public"."recurring_transactions" from "anon";

revoke trigger on table "public"."recurring_transactions" from "anon";

revoke truncate on table "public"."recurring_transactions" from "anon";

revoke update on table "public"."recurring_transactions" from "anon";

revoke delete on table "public"."sheet_invites" from "anon";

revoke insert on table "public"."sheet_invites" from "anon";

revoke references on table "public"."sheet_invites" from "anon";

revoke select on table "public"."sheet_invites" from "anon";

revoke trigger on table "public"."sheet_invites" from "anon";

revoke truncate on table "public"."sheet_invites" from "anon";

revoke update on table "public"."sheet_invites" from "anon";

revoke delete on table "public"."sheet_settings" from "anon";

revoke insert on table "public"."sheet_settings" from "anon";

revoke references on table "public"."sheet_settings" from "anon";

revoke select on table "public"."sheet_settings" from "anon";

revoke trigger on table "public"."sheet_settings" from "anon";

revoke truncate on table "public"."sheet_settings" from "anon";

revoke update on table "public"."sheet_settings" from "anon";

revoke delete on table "public"."sheet_users" from "anon";

revoke insert on table "public"."sheet_users" from "anon";

revoke references on table "public"."sheet_users" from "anon";

revoke select on table "public"."sheet_users" from "anon";

revoke trigger on table "public"."sheet_users" from "anon";

revoke truncate on table "public"."sheet_users" from "anon";

revoke update on table "public"."sheet_users" from "anon";

revoke delete on table "public"."sheets" from "anon";

revoke insert on table "public"."sheets" from "anon";

revoke references on table "public"."sheets" from "anon";

revoke select on table "public"."sheets" from "anon";

revoke trigger on table "public"."sheets" from "anon";

revoke truncate on table "public"."sheets" from "anon";

revoke update on table "public"."sheets" from "anon";

revoke delete on table "public"."transactions" from "anon";

revoke insert on table "public"."transactions" from "anon";

revoke references on table "public"."transactions" from "anon";

revoke select on table "public"."transactions" from "anon";

revoke trigger on table "public"."transactions" from "anon";

revoke truncate on table "public"."transactions" from "anon";

revoke update on table "public"."transactions" from "anon";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_any_user_change();

CREATE TRIGGER on_auth_user_updated AFTER UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_any_user_change();


