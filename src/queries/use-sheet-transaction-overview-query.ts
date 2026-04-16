import { useQuery } from '@tanstack/react-query'
import { getSheetTransactionOverview } from '@/lib/transaction-form-requests'

export function useSheetTransactionOverviewQuery(
  sheetId: string,
  year: number,
  month: number,
  type: 'income' | 'expense',
) {
  return useQuery({
    queryKey: ['sheet-transaction-overview', sheetId, year, month, type],
    queryFn: () => getSheetTransactionOverview(sheetId, year, month, type),
    enabled: !!sheetId,
  })
}
