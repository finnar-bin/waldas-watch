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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const { tokenHash } = await req.json();
    if (!tokenHash) {
      return Response.json({ error: "Missing tokenHash" }, { status: 400, headers: corsHeaders });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: invite, error: inviteError } = await admin
      .from("sheet_invites")
      .select("id, sheet_id, invited_email, role, status, expires_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (inviteError) throw inviteError;
    if (!invite) {
      return Response.json({ error: "Invite not found." }, { status: 404, headers: corsHeaders });
    }

    if (invite.status === "revoked") {
      return Response.json({ error: "This invite has been revoked." }, { status: 400, headers: corsHeaders });
    }

    if (invite.status === "accepted") {
      return Response.json({ error: "This invite has already been accepted." }, { status: 400, headers: corsHeaders });
    }

    if (invite.status !== "pending" || new Date(invite.expires_at) < new Date()) {
      return Response.json({ error: "This invite has expired." }, { status: 400, headers: corsHeaders });
    }

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;
    if (profile.email !== invite.invited_email) {
      return Response.json(
        { error: "This invite is for a different email address." },
        { status: 403, headers: corsHeaders },
      );
    }

    const { error: memberError } = await admin
      .from("sheet_users")
      .insert({ sheet_id: invite.sheet_id, user_id: user.id, role: invite.role });

    if (memberError) throw memberError;

    const { error: updateError } = await admin
      .from("sheet_invites")
      .update({
        status: "accepted",
        accepted_by: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    if (updateError) throw updateError;

    return Response.json({ sheetId: invite.sheet_id }, { status: 200, headers: corsHeaders });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
});
