import { useQuery } from '@tanstack/react-query'
import { getCategoryTransactions } from '@/lib/transactions-requests'

export function useCategoryTransactionsQuery(
  sheetId: string,
  categoryId: string,
  year: number,
  month: number,
) {
  return useQuery({
    queryKey: ['category-transactions', sheetId, categoryId, year, month],
    queryFn: () => getCategoryTransactions(sheetId, categoryId, year, month),
    enabled: !!sheetId && !!categoryId,
  })
}
