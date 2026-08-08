import { useQuery } from '@tanstack/react-query'
import {
  getSheetBudgetRollover,
  getSheetCategoryMonthlySpend,
} from '@/lib/sheet-settings-requests'
import { getSheetCategories } from '@/lib/categories-requests'
import { computeBudgetRollover, monthStartDateString } from '@/utils/compute-budget-rollover'

async function fetchSheetCategoryBudgetRollovers(
  sheetId: string,
  year: number,
  month: number,
  type: 'income' | 'expense',
): Promise<Map<string, number>> {
  const { enabled, enabledAt } = await getSheetBudgetRollover(sheetId)
  if (!enabled || !enabledAt) return new Map()

  const [categories, monthlySpend] = await Promise.all([
    getSheetCategories(sheetId),
    getSheetCategoryMonthlySpend(sheetId, type, monthStartDateString(enabledAt)),
  ])

  return computeBudgetRollover({
    categories: categories.filter((category) => category.type === type),
    monthlySpend,
    enabledAt,
    targetYear: year,
    targetMonth: month,
  })
}

export function useSheetCategoryBudgetRolloversQuery(
  sheetId: string,
  year: number,
  month: number,
  type: 'income' | 'expense',
) {
  return useQuery({
    queryKey: ['sheet-category-budget-rollovers', sheetId, year, month, type],
    queryFn: () => fetchSheetCategoryBudgetRollovers(sheetId, year, month, type),
    enabled: !!sheetId,
  })
}
