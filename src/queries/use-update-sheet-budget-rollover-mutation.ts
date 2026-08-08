import { useMutation, useQueryClient, type MutateOptions } from '@tanstack/react-query'
import { updateSheetBudgetRollover } from '@/lib/sheet-settings-requests'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { enqueueOperation } from '@/lib/offline-queue'

type UpdateBudgetRolloverVariables = { enabled: boolean; updatedBy: string }

export function useUpdateSheetBudgetRolloverMutation(sheetId: string) {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  const mutation = useMutation({
    mutationFn: ({ enabled, updatedBy }: UpdateBudgetRolloverVariables) =>
      updateSheetBudgetRollover(sheetId, enabled, updatedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-budget-rollover', sheetId] })
      queryClient.invalidateQueries({ queryKey: ['sheet-category-budget-rollovers', sheetId] })
    },
  })

  const mutateAsync = (
    variables: UpdateBudgetRolloverVariables,
    options?: MutateOptions<void, Error, UpdateBudgetRolloverVariables, unknown>,
  ): Promise<void> => {
    if (!isOnline) {
      enqueueOperation({
        type: 'UPDATE_SHEET_BUDGET_ROLLOVER',
        payload: { sheetId, ...variables },
      })
      return Promise.resolve()
    }
    return mutation.mutateAsync(variables, options)
  }

  const mutate = (
    variables: UpdateBudgetRolloverVariables,
    options?: MutateOptions<void, Error, UpdateBudgetRolloverVariables, unknown>,
  ): void => {
    if (!isOnline) {
      enqueueOperation({
        type: 'UPDATE_SHEET_BUDGET_ROLLOVER',
        payload: { sheetId, ...variables },
      })
      return
    }
    mutation.mutate(variables, options)
  }

  return { ...mutation, mutate, mutateAsync }
}
