import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createSheet, CreateSheetInput } from '@/lib/sheets-requests'

export function useCreateSheetMutation(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateSheetInput) => createSheet(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-sheets', userId] })
    },
  })
}
