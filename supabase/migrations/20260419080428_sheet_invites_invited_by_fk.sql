ALTER TABLE "public"."sheet_invites"
  ADD CONSTRAINT "sheet_invites_invited_by_profiles_id_fk"
  FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;

ALTER TABLE "public"."sheet_invites"
  ADD CONSTRAINT "sheet_invites_accepted_by_profiles_id_fk"
  FOREIGN KEY ("accepted_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;
