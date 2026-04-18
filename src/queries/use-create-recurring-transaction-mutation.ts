import { useMutation, useQueryClient, type MutateOptions } from '@tanstack/react-query'
import {
  createRecurringTransaction,
  type CreateRecurringTransactionInput,
} from '@/lib/recurring-transactions-requests'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { enqueueOperation } from '@/lib/offline-queue'

export function useCreateRecurringTransactionMutation(sheetId: string) {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  const mutation = useMutation({
    mutationFn: (input: CreateRecurringTransactionInput) => createRecurringTransaction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-recurring-transactions', sheetId] })
    },
  })

  const mutateAsync = (
    input: CreateRecurringTransactionInput,
    options?: MutateOptions<void, Error, CreateRecurringTransactionInput, unknown>,
  ): Promise<void> => {
    if (!isOnline) {
      enqueueOperation({ type: 'CREATE_RECURRING_TRANSACTION', payload: input })
      return Promise.resolve()
    }
    return mutation.mutateAsync(input, options)
  }

  const mutate = (
    input: CreateRecurringTransactionInput,
    options?: MutateOptions<void, Error, CreateRecurringTransactionInput, unknown>,
  ): void => {
    if (!isOnline) {
      enqueueOperation({ type: 'CREATE_RECURRING_TRANSACTION', payload: input })
      return
    }
    mutation.mutate(input, options)
  }

  return { ...mutation, mutate, mutateAsync }
}
