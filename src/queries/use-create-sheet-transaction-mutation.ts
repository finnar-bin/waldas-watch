import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createSheetTransaction,
  type CreateSheetTransactionInput,
} from '@/lib/transaction-form-requests'

export function useCreateSheetTransactionMutation(sheetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateSheetTransactionInput) => createSheetTransaction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-sheet-transactions', sheetId] })
      queryClient.invalidateQueries({
        queryKey: ['current-month-sheet-totals', sheetId],
      })
      queryClient.invalidateQueries({
        queryKey: ['current-month-sheet-category-totals', sheetId],
      })
      queryClient.invalidateQueries({
        queryKey: ['sheet-transaction-overview', sheetId],
      })
    },
  })
}
