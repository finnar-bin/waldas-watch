-- Allow invited users to decline their own pending invites
CREATE POLICY "sheet_invites_decline_invited_email" ON "public"."sheet_invites"
FOR UPDATE TO "authenticated"
USING (
  invited_email = (auth.jwt() ->> 'email')
  AND status = 'pending'
)
WITH CHECK (status = 'declined');
