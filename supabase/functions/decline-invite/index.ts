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

    const { inviteId } = await req.json();
    if (!inviteId) {
      return Response.json({ error: "Missing inviteId" }, { status: 400, headers: corsHeaders });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const { data: invite, error: inviteError } = await admin
      .from("sheet_invites")
      .select("id, invited_email, status, expires_at")
      .eq("id", inviteId)
      .maybeSingle();

    if (inviteError) throw inviteError;
    if (!invite) {
      return Response.json({ error: "Invite not found." }, { status: 404, headers: corsHeaders });
    }

    if (invite.status !== "pending" || new Date(invite.expires_at) < new Date()) {
      return Response.json({ error: "This invite is no longer pending." }, { status: 400, headers: corsHeaders });
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

    const { error: updateError } = await admin
      .from("sheet_invites")
      .update({ status: "declined" })
      .eq("id", invite.id);

    if (updateError) throw updateError;

    return Response.json({ success: true }, { status: 200, headers: corsHeaders });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
});
