import { useMutation, useQueryClient, type MutateOptions } from '@tanstack/react-query'
import { updateSheetCurrency } from '@/lib/sheet-settings-requests'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { enqueueOperation } from '@/lib/offline-queue'

type UpdateCurrencyVariables = { currency: string; updatedBy: string }

export function useUpdateSheetCurrencyMutation(sheetId: string) {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  const mutation = useMutation({
    mutationFn: ({ currency, updatedBy }: UpdateCurrencyVariables) =>
      updateSheetCurrency(sheetId, currency, updatedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-currency', sheetId] })
    },
  })

  const mutateAsync = (
    variables: UpdateCurrencyVariables,
    options?: MutateOptions<void, Error, UpdateCurrencyVariables, unknown>,
  ): Promise<void> => {
    if (!isOnline) {
      enqueueOperation({ type: 'UPDATE_SHEET_CURRENCY', payload: { sheetId, ...variables } })
      return Promise.resolve()
    }
    return mutation.mutateAsync(variables, options)
  }

  const mutate = (
    variables: UpdateCurrencyVariables,
    options?: MutateOptions<void, Error, UpdateCurrencyVariables, unknown>,
  ): void => {
    if (!isOnline) {
      enqueueOperation({ type: 'UPDATE_SHEET_CURRENCY', payload: { sheetId, ...variables } })
      return
    }
    mutation.mutate(variables, options)
  }

  return { ...mutation, mutate, mutateAsync }
}
