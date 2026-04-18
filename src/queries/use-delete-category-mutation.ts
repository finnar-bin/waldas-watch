import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteCategory } from '@/lib/categories-requests'

export function useDeleteCategoryMutation(sheetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
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
}
