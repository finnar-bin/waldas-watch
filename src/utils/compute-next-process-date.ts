import type { RecurringFrequency } from "@/lib/recurring-transactions-requests";

/**
 * All arithmetic runs in UTC against the plain "YYYY-MM-DD" calendar date
 * (never a real instant), so the result never shifts by a day depending on
 * the caller's timezone or time-of-day. Callers are responsible for turning
 * "now" into that plain calendar date first (see `todayDateString`).
 */
export function computeNextProcessDate(
  current: string,
  frequency: RecurringFrequency,
  dayOfMonth: number | null,
  dayOfWeek: number | null = null,
): string {
  const [year, month, day] = current.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day));

  switch (frequency) {
    case "daily":
      next.setUTCDate(next.getUTCDate() + 1);
      break;
    case "weekly":
      if (dayOfWeek != null) {
        const diff = (dayOfWeek - next.getUTCDay() + 7) % 7 || 7;
        next.setUTCDate(next.getUTCDate() + diff);
      } else {
        next.setUTCDate(next.getUTCDate() + 7);
      }
      break;
    case "monthly":
      next.setUTCMonth(next.getUTCMonth() + 1);
      if (dayOfMonth) {
        const maxDay = new Date(
          Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0),
        ).getUTCDate();
        next.setUTCDate(Math.min(dayOfMonth, maxDay));
      }
      break;
    case "yearly":
      next.setUTCFullYear(next.getUTCFullYear() + 1);
      break;
  }

  return next.toISOString().split("T")[0];
}

/** Today's calendar date where the caller is standing, as "YYYY-MM-DD". */
export function todayDateString(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
