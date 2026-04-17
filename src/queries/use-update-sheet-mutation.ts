import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateSheet, UpdateSheetInput } from '@/lib/sheets-requests'

export function useUpdateSheetMutation(sheetId: string, userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateSheetInput) => updateSheet(sheetId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-sheets', userId] })
    },
  })
}
