import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";

function computeNextProcessDate(current: Date, frequency: RecurringFrequency, dayOfMonth: number | null): string {
  const next = new Date(current);

  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      if (dayOfMonth) {
        const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(dayOfMonth, maxDay));
      }
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return next.toISOString().split("T")[0];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret) {
    const provided = req.headers.get("x-cron-secret");
    if (provided !== cronSecret) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const today = new Date().toISOString().split("T")[0];

    const { data: due, error: fetchError } = await admin
      .from("recurring_transactions")
      .select("*")
      .eq("is_active", true)
      .lte("next_process_date", today);

    if (fetchError) throw fetchError;
    if (!due || due.length === 0) {
      return Response.json({ processed: 0 }, { headers: corsHeaders });
    }

    let processed = 0;

    for (const rt of due) {
      const { error: insertError } = await admin
        .from("transactions")
        .insert({
          sheet_id: rt.sheet_id,
          category_id: rt.category_id,
          payment_type_id: rt.payment_type_id,
          amount: rt.amount,
          type: rt.type,
          description: rt.description,
          date: rt.next_process_date,
          created_by: rt.created_by,
        });

      if (insertError) {
        console.error(`Failed to insert transaction for recurring ${rt.id}:`, insertError.message);
        continue;
      }

      const nextDate = computeNextProcessDate(
        new Date(rt.next_process_date),
        rt.frequency,
        rt.day_of_month,
      );

      const { error: updateError } = await admin
        .from("recurring_transactions")
        .update({ last_processed_at: new Date().toISOString(), next_process_date: nextDate })
        .eq("id", rt.id);

      if (updateError) {
        console.error(`Failed to update next_process_date for recurring ${rt.id}:`, updateError.message);
        continue;
      }

      processed++;
    }

    return Response.json({ processed }, { headers: corsHeaders });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
});
