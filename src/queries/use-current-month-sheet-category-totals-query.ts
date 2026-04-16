import { useQuery } from '@tanstack/react-query'
import { getCurrentMonthSheetCategoryTotals } from '@/lib/transactions-requests'

export function useCurrentMonthSheetCategoryTotalsQuery(sheetId: string) {
  return useQuery({
    queryKey: ['current-month-sheet-category-totals', sheetId],
    queryFn: () => getCurrentMonthSheetCategoryTotals(sheetId),
    enabled: !!sheetId,
  })
}
