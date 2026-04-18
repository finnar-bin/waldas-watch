import { useMutation, useQueryClient, type MutateOptions } from '@tanstack/react-query'
import { deleteTransaction } from '@/lib/transactions-requests'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { enqueueOperation } from '@/lib/offline-queue'

export function useDeleteTransactionMutation(sheetId: string, categoryId: string) {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  const mutation = useMutation({
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

  const mutateAsync = (
    transactionId: string,
    options?: MutateOptions<void, Error, string, unknown>,
  ): Promise<void> => {
    if (!isOnline) {
      enqueueOperation({ type: 'DELETE_TRANSACTION', payload: { transactionId, sheetId, categoryId } })
      return Promise.resolve()
    }
    return mutation.mutateAsync(transactionId, options)
  }

  const mutate = (
    transactionId: string,
    options?: MutateOptions<void, Error, string, unknown>,
  ): void => {
    if (!isOnline) {
      enqueueOperation({ type: 'DELETE_TRANSACTION', payload: { transactionId, sheetId, categoryId } })
      return
    }
    mutation.mutate(transactionId, options)
  }

  return { ...mutation, mutate, mutateAsync }
}
