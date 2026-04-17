import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteSheet } from '@/lib/sheets-requests'

export function useDeleteSheetMutation(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sheetId: string) => deleteSheet(sheetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-sheets', userId] })
    },
  })
}
