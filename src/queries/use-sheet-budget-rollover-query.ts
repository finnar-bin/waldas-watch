import { useQuery } from '@tanstack/react-query'
import { getSheetBudgetRollover } from '@/lib/sheet-settings-requests'

export function useSheetBudgetRolloverQuery(sheetId: string) {
  return useQuery({
    queryKey: ['sheet-budget-rollover', sheetId],
    queryFn: () => getSheetBudgetRollover(sheetId),
    enabled: !!sheetId,
  })
}
