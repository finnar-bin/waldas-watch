import { useQuery } from '@tanstack/react-query'
import { getCurrentMonthSheetTotals } from '@/lib/transactions-requests'

export function useCurrentMonthSheetTotalsQuery(sheetId: string) {
  return useQuery({
    queryKey: ['current-month-sheet-totals', sheetId],
    queryFn: () => getCurrentMonthSheetTotals(sheetId),
    enabled: !!sheetId,
  })
}
