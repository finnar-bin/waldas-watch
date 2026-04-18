import { useMutation, useQueryClient, type MutateOptions } from '@tanstack/react-query'
import {
  updateRecurringTransaction,
  type UpdateRecurringTransactionInput,
} from '@/lib/recurring-transactions-requests'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { enqueueOperation } from '@/lib/offline-queue'

type UpdateVariables = { id: string; input: UpdateRecurringTransactionInput }

export function useUpdateRecurringTransactionMutation(sheetId: string) {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  const mutation = useMutation({
    mutationFn: ({ id, input }: UpdateVariables) => updateRecurringTransaction(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-recurring-transactions', sheetId] })
    },
  })

  const mutateAsync = (
    variables: UpdateVariables,
    options?: MutateOptions<void, Error, UpdateVariables, unknown>,
  ): Promise<void> => {
    if (!isOnline) {
      enqueueOperation({ type: 'UPDATE_RECURRING_TRANSACTION', payload: { recurringId: variables.id, sheetId, input: variables.input } })
      return Promise.resolve()
    }
    return mutation.mutateAsync(variables, options)
  }

  const mutate = (
    variables: UpdateVariables,
    options?: MutateOptions<void, Error, UpdateVariables, unknown>,
  ): void => {
    if (!isOnline) {
      enqueueOperation({ type: 'UPDATE_RECURRING_TRANSACTION', payload: { recurringId: variables.id, sheetId, input: variables.input } })
      return
    }
    mutation.mutate(variables, options)
  }

  return { ...mutation, mutate, mutateAsync }
}
