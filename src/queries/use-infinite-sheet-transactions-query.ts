import { useInfiniteQuery } from '@tanstack/react-query'
import { getSheetTransactionsPaginated, TransactionFilters } from '@/lib/transactions-requests'

const PAGE_SIZE = 20

export function useInfiniteSheetTransactionsQuery(
  sheetId: string,
  search: string,
  filters: TransactionFilters = {},
) {
  return useInfiniteQuery({
    queryKey: ['sheet-transactions-infinite', sheetId, search, filters],
    queryFn: ({ pageParam = 0 }) =>
      getSheetTransactionsPaginated(sheetId, pageParam as number, PAGE_SIZE, search, filters),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
    enabled: !!sheetId,
  })
}
