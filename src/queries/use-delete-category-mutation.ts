import { useMutation, useQueryClient, type MutateOptions } from '@tanstack/react-query'
import { deleteCategory } from '@/lib/categories-requests'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { enqueueOperation } from '@/lib/offline-queue'

export function useDeleteCategoryMutation(sheetId: string) {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  const mutation = useMutation({
    mutationFn: (categoryId: string) => deleteCategory(categoryId),
    onSuccess: (_, categoryId) => {
      queryClient.invalidateQueries({ queryKey: ['sheet-categories', sheetId] })
      queryClient.invalidateQueries({ queryKey: ['sheet-transaction-categories', sheetId] })
      queryClient.removeQueries({ queryKey: ['category-transactions', sheetId, categoryId] })
      queryClient.invalidateQueries({ queryKey: ['recent-sheet-transactions', sheetId] })
      queryClient.invalidateQueries({ queryKey: ['sheet-transaction-overview', sheetId] })
      queryClient.invalidateQueries({ queryKey: ['current-month-sheet-totals', sheetId] })
      queryClient.invalidateQueries({ queryKey: ['current-month-sheet-category-totals', sheetId] })
    },
  })

  const mutateAsync = (
    categoryId: string,
    options?: MutateOptions<void, Error, string, unknown>,
  ): Promise<void> => {
    if (!isOnline) {
      enqueueOperation({ type: 'DELETE_CATEGORY', payload: { categoryId, sheetId } })
      return Promise.resolve()
    }
    return mutation.mutateAsync(categoryId, options)
  }

  const mutate = (
    categoryId: string,
    options?: MutateOptions<void, Error, string, unknown>,
  ): void => {
    if (!isOnline) {
      enqueueOperation({ type: 'DELETE_CATEGORY', payload: { categoryId, sheetId } })
      return
    }
    mutation.mutate(categoryId, options)
  }

  return { ...mutation, mutate, mutateAsync }
}
