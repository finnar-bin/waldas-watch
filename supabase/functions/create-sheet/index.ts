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

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const { name, description, currency } = await req.json();
    if (!name || !currency) {
      return Response.json({ error: "Missing required fields" }, { status: 400, headers: corsHeaders });
    }

    const { data: sheet, error: sheetError } = await admin
      .from("sheets")
      .insert({ name, description: description ?? null, created_by: user.id })
      .select("id")
      .single();

    if (sheetError) throw sheetError;

    const sheetId = sheet.id;

    const { error: memberError } = await admin
      .from("sheet_users")
      .insert({ sheet_id: sheetId, user_id: user.id, role: "admin" });

    if (memberError) throw memberError;

    const { error: settingsError } = await admin
      .from("sheet_settings")
      .insert({ sheet_id: sheetId, currency, updated_by: user.id });

    if (settingsError) throw settingsError;

    const { error: paymentTypesError } = await admin
      .from("payment_types")
      .insert([
        { sheet_id: sheetId, created_by: user.id, name: "Cash", icon: "Coins" },
        { sheet_id: sheetId, created_by: user.id, name: "Credit Card", icon: "CreditCard" },
      ]);

    if (paymentTypesError) throw paymentTypesError;

    return Response.json({ sheetId }, { status: 201, headers: corsHeaders });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
});
