import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

type RecurringFrequency = "daily" | "weekly" | "biweekly" | "monthly" | "yearly";

// Mirrors src/utils/compute-next-process-date.ts — kept in sync manually since
// this Deno function can't import from src/. Operates purely on "YYYY-MM-DD"
// calendar dates via UTC arithmetic so the result never depends on server TZ.
function computeNextProcessDate(
  current: string,
  frequency: RecurringFrequency,
  dayOfMonth: number | null,
  dayOfWeek: number | null,
): string {
  const [year, month, day] = current.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day));

  switch (frequency) {
    case "daily":
      next.setUTCDate(next.getUTCDate() + 1);
      break;
    case "weekly":
    case "biweekly": {
      const period = frequency === "biweekly" ? 14 : 7;
      if (dayOfWeek != null) {
        const diff = (dayOfWeek - next.getUTCDay() + 7) % 7 || period;
        next.setUTCDate(next.getUTCDate() + diff);
      } else {
        next.setUTCDate(next.getUTCDate() + period);
      }
      break;
    }
    case "monthly":
      next.setUTCMonth(next.getUTCMonth() + 1);
      if (dayOfMonth) {
        const maxDay = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
        next.setUTCDate(Math.min(dayOfMonth, maxDay));
      }
      break;
    case "yearly":
      next.setUTCFullYear(next.getUTCFullYear() + 1);
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
        rt.next_process_date,
        rt.frequency,
        rt.day_of_month,
        rt.day_of_week,
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
