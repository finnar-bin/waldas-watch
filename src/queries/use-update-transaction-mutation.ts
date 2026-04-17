import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateSheetTransaction, UpdateSheetTransactionInput } from '@/lib/transaction-form-requests'

export function useUpdateTransactionMutation(sheetId: string, categoryId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      transactionId,
      input,
    }: {
      transactionId: string
      input: UpdateSheetTransactionInput
    }) => updateSheetTransaction(transactionId, input),
    onSuccess: (_, { transactionId }) => {
      queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] })
      queryClient.invalidateQueries({ queryKey: ['category-transactions', sheetId, categoryId] })
      queryClient.invalidateQueries({ queryKey: ['sheet-transaction-overview', sheetId] })
      queryClient.invalidateQueries({ queryKey: ['recent-sheet-transactions', sheetId] })
      queryClient.invalidateQueries({ queryKey: ['current-month-sheet-totals', sheetId] })
      queryClient.invalidateQueries({ queryKey: ['current-month-sheet-category-totals', sheetId] })
    },
  })
}
