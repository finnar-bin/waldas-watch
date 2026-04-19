import { useMutation, useQueryClient } from "@tanstack/react-query";
import { declineInvite } from "@/lib/sheet-members-requests";

export function useDeclineInviteMutation(email: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => declineInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-invites", email] });
    },
  });
}
