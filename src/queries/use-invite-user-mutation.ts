import { useMutation, useQueryClient } from '@tanstack/react-query'
import { inviteUser, InviteUserInput } from '@/lib/sheet-members-requests'

export function useInviteUserMutation(sheetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: InviteUserInput) => inviteUser(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-invites', sheetId] })
    },
  })
}
