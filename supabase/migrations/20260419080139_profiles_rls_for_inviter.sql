-- Allow invited users to view the profile of whoever invited them
CREATE POLICY "profiles_select_for_inviter" ON "public"."profiles"
FOR SELECT TO "authenticated"
USING (
  EXISTS (
    SELECT 1 FROM "public"."sheet_invites"
    WHERE "sheet_invites"."invited_by" = "profiles"."id"
      AND "sheet_invites"."invited_email" = (auth.jwt() ->> 'email')
      AND "sheet_invites"."status" = 'pending'
      AND "sheet_invites"."expires_at" > now()
  )
);
