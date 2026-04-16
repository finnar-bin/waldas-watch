import { useQuery } from '@tanstack/react-query'
import { getSheetTransactionCategories } from '@/lib/transaction-form-requests'

export function useSheetTransactionCategoriesQuery(
  sheetId: string,
  type: 'income' | 'expense',
) {
  return useQuery({
    queryKey: ['sheet-transaction-categories', sheetId, type],
    queryFn: () => getSheetTransactionCategories(sheetId, type),
    enabled: !!sheetId,
  })
}
