export type BudgetRolloverCategory = {
  id: string
  budget: number | null
  createdAt: string
}

export type ComputeBudgetRolloverInput = {
  categories: BudgetRolloverCategory[]
  monthlySpend: Map<string, Map<string, number>>
  enabledAt: string | null
  targetYear: number
  targetMonth: number
}

type YearMonth = { year: number; month: number }

function toYearMonth(dateString: string): YearMonth {
  const date = new Date(dateString)
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 }
}

function monthKey({ year, month }: YearMonth): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

function isBefore(a: YearMonth, b: YearMonth): boolean {
  return a.year !== b.year ? a.year < b.year : a.month < b.month
}

function laterYearMonth(a: YearMonth, b: YearMonth): YearMonth {
  return isBefore(a, b) ? b : a
}

function nextMonth({ year, month }: YearMonth): YearMonth {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }
}

/** The first day of the UTC month containing `iso`, as "YYYY-MM-01". */
export function monthStartDateString(iso: string): string {
  const { year, month } = toYearMonth(iso)
  return `${year}-${String(month).padStart(2, '0')}-01`
}

/**
 * Rollover is a recurrence, not a sum: each month's leftover only carries
 * forward if the previous month (including whatever it had carried in)
 * wasn't overspent — an overspend must zero out the accumulated cushion at
 * that point rather than become negative "debt" that erases future credit.
 * That step-by-step clamp can't be reproduced by summing every month's
 * (budget - spent) up front, so this walks forward one month at a time.
 */
export function computeBudgetRollover({
  categories,
  monthlySpend,
  enabledAt,
  targetYear,
  targetMonth,
}: ComputeBudgetRolloverInput): Map<string, number> {
  const result = new Map<string, number>()
  if (!enabledAt) return result

  const enabledMonth = toYearMonth(enabledAt)
  const target: YearMonth = { year: targetYear, month: targetMonth }

  for (const category of categories) {
    if (category.budget == null) continue

    const anchor = laterYearMonth(enabledMonth, toYearMonth(category.createdAt))
    if (!isBefore(anchor, target)) continue

    const categorySpend = monthlySpend.get(category.id)
    let carry = 0
    let cursor = anchor
    while (isBefore(cursor, target)) {
      const spent = categorySpend?.get(monthKey(cursor)) ?? 0
      carry = Math.max(0, category.budget + carry - spent)
      cursor = nextMonth(cursor)
    }
    result.set(category.id, carry)
  }

  return result
}
