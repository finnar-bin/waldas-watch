import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { tokenHash } = await req.json();

    if (!tokenHash) {
      return Response.json({ error: "Missing tokenHash" }, { status: 400, headers: corsHeaders });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: invite, error } = await admin
      .from("sheet_invites")
      .select("id, sheet_id, invited_email, role, status, expires_at, sheets(name)")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (error) throw error;
    if (!invite) {
      return Response.json(null, { status: 200, headers: corsHeaders });
    }

    return Response.json(
      {
        id: invite.id,
        sheetId: invite.sheet_id,
        sheetName: (invite.sheets as { name: string } | null)?.name ?? "Unknown sheet",
        invitedEmail: invite.invited_email,
        role: invite.role,
        status: invite.status,
        expiresAt: invite.expires_at,
      },
      { status: 200, headers: corsHeaders },
    );
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
});
