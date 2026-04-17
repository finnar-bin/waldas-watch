import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCategory, CreateCategoryInput } from '@/lib/categories-requests'

export function useCreateCategoryMutation(sheetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCategoryInput) => createCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-categories', sheetId] })
      queryClient.invalidateQueries({ queryKey: ['sheet-transaction-categories', sheetId] })
    },
  })
}
