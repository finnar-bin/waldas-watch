import { useMutation, useQueryClient } from '@tanstack/react-query'
import { revokeInvite } from '@/lib/sheet-members-requests'

export function useRevokeInviteMutation(sheetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (inviteId: string) => revokeInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-invites', sheetId] })
    },
  })
}
