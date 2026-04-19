-- Allow invited users to see their own pending invites
CREATE POLICY "sheet_invites_select_invited_email" ON "public"."sheet_invites"
FOR SELECT TO "authenticated"
USING (invited_email = (auth.jwt() ->> 'email'));

-- Allow users to see sheets where they have a pending non-expired invite
CREATE POLICY "sheets_select_for_invited" ON "public"."sheets"
FOR SELECT TO "authenticated"
USING (
  EXISTS (
    SELECT 1 FROM "public"."sheet_invites"
    WHERE "sheet_invites"."sheet_id" = "sheets"."id"
      AND "sheet_invites"."invited_email" = (auth.jwt() ->> 'email')
      AND "sheet_invites"."status" = 'pending'
      AND "sheet_invites"."expires_at" > now()
  )
);
