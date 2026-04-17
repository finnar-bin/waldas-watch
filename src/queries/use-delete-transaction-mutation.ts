import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteTransaction } from '@/lib/transactions-requests'

export function useDeleteTransactionMutation(sheetId: string, categoryId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (transactionId: string) => deleteTransaction(transactionId),
    onSuccess: (_, transactionId) => {
      queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] })
      queryClient.invalidateQueries({ queryKey: ['category-transactions', sheetId, categoryId] })
      queryClient.invalidateQueries({ queryKey: ['sheet-transaction-overview', sheetId] })
      queryClient.invalidateQueries({ queryKey: ['recent-sheet-transactions', sheetId] })
      queryClient.invalidateQueries({ queryKey: ['current-month-sheet-totals', sheetId] })
      queryClient.invalidateQueries({ queryKey: ['current-month-sheet-category-totals', sheetId] })
    },
  })
}
