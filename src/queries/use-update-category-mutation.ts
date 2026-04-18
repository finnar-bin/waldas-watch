import { useMutation, useQueryClient, type MutateOptions } from '@tanstack/react-query'
import { updateCategory, type UpdateCategoryInput } from '@/lib/categories-requests'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { enqueueOperation } from '@/lib/offline-queue'

type UpdateVariables = { id: string; input: UpdateCategoryInput }

export function useUpdateCategoryMutation(sheetId: string) {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  const mutation = useMutation({
    mutationFn: ({ id, input }: UpdateVariables) => updateCategory(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-categories', sheetId] })
      queryClient.invalidateQueries({ queryKey: ['sheet-transaction-categories', sheetId] })
    },
  })

  const mutateAsync = (
    variables: UpdateVariables,
    options?: MutateOptions<void, Error, UpdateVariables, unknown>,
  ): Promise<void> => {
    if (!isOnline) {
      enqueueOperation({ type: 'UPDATE_CATEGORY', payload: { categoryId: variables.id, sheetId, input: variables.input } })
      return Promise.resolve()
    }
    return mutation.mutateAsync(variables, options)
  }

  const mutate = (
    variables: UpdateVariables,
    options?: MutateOptions<void, Error, UpdateVariables, unknown>,
  ): void => {
    if (!isOnline) {
      enqueueOperation({ type: 'UPDATE_CATEGORY', payload: { categoryId: variables.id, sheetId, input: variables.input } })
      return
    }
    mutation.mutate(variables, options)
  }

  return { ...mutation, mutate, mutateAsync }
}
