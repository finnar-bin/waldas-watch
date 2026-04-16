import { useQuery } from '@tanstack/react-query'
import { getRecentSheetTransactions } from '@/lib/transactions-requests'

export function useRecentSheetTransactionsQuery(sheetId: string, limit = 5) {
  return useQuery({
    queryKey: ['recent-sheet-transactions', sheetId, limit],
    queryFn: () => getRecentSheetTransactions(sheetId, limit),
    enabled: !!sheetId,
  })
}
