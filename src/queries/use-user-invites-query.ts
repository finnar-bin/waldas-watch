import { useQuery } from "@tanstack/react-query";
import { getUserInvites } from "@/lib/sheet-members-requests";

export function useUserInvitesQuery(email: string | undefined) {
  return useQuery({
    queryKey: ["user-invites", email],
    queryFn: () => getUserInvites(email!),
    enabled: !!email,
  });
}
