import { useQuery } from '@tanstack/react-query'
import { getSheetRecurringTransactions } from '@/lib/recurring-transactions-requests'

export function useSheetRecurringTransactionsQuery(sheetId: string) {
  return useQuery({
    queryKey: ['sheet-recurring-transactions', sheetId],
    queryFn: () => getSheetRecurringTransactions(sheetId),
    enabled: !!sheetId,
  })
}
