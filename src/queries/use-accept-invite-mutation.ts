import { useMutation, useQueryClient } from "@tanstack/react-query";
import { acceptInvite } from "@/lib/sheet-members-requests";

export function useAcceptInviteMutation(email?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tokenHash: string) => acceptInvite(tokenHash),
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["user-sheets"] }),
        queryClient.invalidateQueries({ queryKey: ["user-invites", email] }),
        queryClient.invalidateQueries({ queryKey: ["sheet-invites", data.sheetId] }),
        queryClient.invalidateQueries({ queryKey: ["sheet-members", data.sheetId] }),
      ]);
    },
  });
}
