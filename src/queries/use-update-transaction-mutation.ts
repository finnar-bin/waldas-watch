import { useMutation, useQueryClient, type MutateOptions } from '@tanstack/react-query'
import { updateSheetTransaction, type UpdateSheetTransactionInput } from '@/lib/transaction-form-requests'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { enqueueOperation } from '@/lib/offline-queue'

type UpdateVariables = {
  transactionId: string
  input: UpdateSheetTransactionInput
}

export function useUpdateTransactionMutation(sheetId: string, categoryId: string) {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  const mutation = useMutation({
    mutationFn: ({ transactionId, input }: UpdateVariables) =>
      updateSheetTransaction(transactionId, input),
    onSuccess: (_, { transactionId }) => {
      queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] })
      queryClient.invalidateQueries({ queryKey: ['category-transactions', sheetId, categoryId] })
      queryClient.invalidateQueries({ queryKey: ['sheet-transaction-overview', sheetId] })
      queryClient.invalidateQueries({ queryKey: ['recent-sheet-transactions', sheetId] })
      queryClient.invalidateQueries({ queryKey: ['current-month-sheet-totals', sheetId] })
      queryClient.invalidateQueries({ queryKey: ['current-month-sheet-category-totals', sheetId] })
    },
  })

  const mutateAsync = (
    variables: UpdateVariables,
    options?: MutateOptions<void, Error, UpdateVariables, unknown>,
  ): Promise<void> => {
    if (!isOnline) {
      enqueueOperation({
        type: 'UPDATE_TRANSACTION',
        payload: { transactionId: variables.transactionId, sheetId, categoryId, input: variables.input },
      })
      return Promise.resolve()
    }
    return mutation.mutateAsync(variables, options)
  }

  const mutate = (
    variables: UpdateVariables,
    options?: MutateOptions<void, Error, UpdateVariables, unknown>,
  ): void => {
    if (!isOnline) {
      enqueueOperation({
        type: 'UPDATE_TRANSACTION',
        payload: { transactionId: variables.transactionId, sheetId, categoryId, input: variables.input },
      })
      return
    }
    mutation.mutate(variables, options)
  }

  return { ...mutation, mutate, mutateAsync }
}
