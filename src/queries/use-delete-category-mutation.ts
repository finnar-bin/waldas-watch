import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteCategory } from '@/lib/categories-requests'

export function useDeleteCategoryMutation(sheetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (categoryId: string) => deleteCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-categories', sheetId] })
      queryClient.invalidateQueries({ queryKey: ['sheet-transaction-categories', sheetId] })
    },
  })
}
