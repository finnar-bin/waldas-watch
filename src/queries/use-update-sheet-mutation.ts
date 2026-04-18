import { useMutation, useQueryClient, type MutateOptions } from '@tanstack/react-query'
import { updateSheet, type UpdateSheetInput } from '@/lib/sheets-requests'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { enqueueOperation } from '@/lib/offline-queue'

export function useUpdateSheetMutation(sheetId: string, userId: string | undefined) {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  const mutation = useMutation({
    mutationFn: (input: UpdateSheetInput) => updateSheet(sheetId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-sheets', userId] })
    },
  })

  const mutateAsync = (
    input: UpdateSheetInput,
    options?: MutateOptions<void, Error, UpdateSheetInput, unknown>,
  ): Promise<void> => {
    if (!isOnline) {
      enqueueOperation({ type: 'UPDATE_SHEET', payload: { sheetId, userId: userId ?? '', input } })
      return Promise.resolve()
    }
    return mutation.mutateAsync(input, options)
  }

  const mutate = (
    input: UpdateSheetInput,
    options?: MutateOptions<void, Error, UpdateSheetInput, unknown>,
  ): void => {
    if (!isOnline) {
      enqueueOperation({ type: 'UPDATE_SHEET', payload: { sheetId, userId: userId ?? '', input } })
      return
    }
    mutation.mutate(input, options)
  }

  return { ...mutation, mutate, mutateAsync }
}
