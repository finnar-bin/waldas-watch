import { useMutation, useQueryClient, type MutateOptions } from '@tanstack/react-query'
import { createCategory, type CreateCategoryInput } from '@/lib/categories-requests'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { enqueueOperation } from '@/lib/offline-queue'

export function useCreateCategoryMutation(sheetId: string) {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  const mutation = useMutation({
    mutationFn: (input: CreateCategoryInput) => createCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-categories', sheetId] })
      queryClient.invalidateQueries({ queryKey: ['sheet-transaction-categories', sheetId] })
    },
  })

  const mutateAsync = (
    input: CreateCategoryInput,
    options?: MutateOptions<void, Error, CreateCategoryInput, unknown>,
  ): Promise<void> => {
    if (!isOnline) {
      enqueueOperation({ type: 'CREATE_CATEGORY', payload: input })
      return Promise.resolve()
    }
    return mutation.mutateAsync(input, options)
  }

  const mutate = (
    input: CreateCategoryInput,
    options?: MutateOptions<void, Error, CreateCategoryInput, unknown>,
  ): void => {
    if (!isOnline) {
      enqueueOperation({ type: 'CREATE_CATEGORY', payload: input })
      return
    }
    mutation.mutate(input, options)
  }

  return { ...mutation, mutate, mutateAsync }
}
