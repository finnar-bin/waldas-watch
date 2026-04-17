import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateCategory, UpdateCategoryInput } from '@/lib/categories-requests'

export function useUpdateCategoryMutation(sheetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCategoryInput }) =>
      updateCategory(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-categories', sheetId] })
      queryClient.invalidateQueries({ queryKey: ['sheet-transaction-categories', sheetId] })
    },
  })
}
