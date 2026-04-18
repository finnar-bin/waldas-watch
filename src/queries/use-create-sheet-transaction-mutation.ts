import { useMutation, useQueryClient, type MutateOptions } from '@tanstack/react-query'
import {
  createSheetTransaction,
  type CreateSheetTransactionInput,
} from '@/lib/transaction-form-requests'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { enqueueOperation } from '@/lib/offline-queue'

export function useCreateSheetTransactionMutation(sheetId: string) {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  const mutation = useMutation({
    mutationFn: (input: CreateSheetTransactionInput) => createSheetTransaction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-sheet-transactions', sheetId] })
      queryClient.invalidateQueries({ queryKey: ['current-month-sheet-totals', sheetId] })
      queryClient.invalidateQueries({ queryKey: ['current-month-sheet-category-totals', sheetId] })
      queryClient.invalidateQueries({ queryKey: ['sheet-transaction-overview', sheetId] })
    },
  })

  const mutateAsync = (
    input: CreateSheetTransactionInput,
    options?: MutateOptions<void, Error, CreateSheetTransactionInput, unknown>,
  ): Promise<void> => {
    if (!isOnline) {
      enqueueOperation({ type: 'CREATE_TRANSACTION', payload: input })
      return Promise.resolve()
    }
    return mutation.mutateAsync(input, options)
  }

  const mutate = (
    input: CreateSheetTransactionInput,
    options?: MutateOptions<void, Error, CreateSheetTransactionInput, unknown>,
  ): void => {
    if (!isOnline) {
      enqueueOperation({ type: 'CREATE_TRANSACTION', payload: input })
      return
    }
    mutation.mutate(input, options)
  }

  return { ...mutation, mutate, mutateAsync }
}
