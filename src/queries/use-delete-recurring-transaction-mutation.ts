import { useMutation, useQueryClient, type MutateOptions } from '@tanstack/react-query'
import { deleteRecurringTransaction } from '@/lib/recurring-transactions-requests'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { enqueueOperation } from '@/lib/offline-queue'

export function useDeleteRecurringTransactionMutation(sheetId: string) {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  const mutation = useMutation({
    mutationFn: (recurringId: string) => deleteRecurringTransaction(recurringId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-recurring-transactions', sheetId] })
    },
  })

  const mutateAsync = (
    recurringId: string,
    options?: MutateOptions<void, Error, string, unknown>,
  ): Promise<void> => {
    if (!isOnline) {
      enqueueOperation({ type: 'DELETE_RECURRING_TRANSACTION', payload: { recurringId, sheetId } })
      return Promise.resolve()
    }
    return mutation.mutateAsync(recurringId, options)
  }

  const mutate = (
    recurringId: string,
    options?: MutateOptions<void, Error, string, unknown>,
  ): void => {
    if (!isOnline) {
      enqueueOperation({ type: 'DELETE_RECURRING_TRANSACTION', payload: { recurringId, sheetId } })
      return
    }
    mutation.mutate(recurringId, options)
  }

  return { ...mutation, mutate, mutateAsync }
}
