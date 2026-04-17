import { useMutation, useQueryClient } from '@tanstack/react-query'
import { removeSheetMember } from '@/lib/sheet-members-requests'

export function useRemoveSheetMemberMutation(sheetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sheetUserId: string) => removeSheetMember(sheetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-members', sheetId] })
    },
  })
}
