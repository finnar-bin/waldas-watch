import type { RecurringFrequency } from "@/lib/recurring-transactions-requests";

export function computeNextProcessDate(
  current: Date,
  frequency: RecurringFrequency,
  dayOfMonth: number | null,
): string {
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
        const maxDay = new Date(
          next.getFullYear(),
          next.getMonth() + 1,
          0,
        ).getDate();
        next.setDate(Math.min(dayOfMonth, maxDay));
      }
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return next.toISOString().split("T")[0];
}
