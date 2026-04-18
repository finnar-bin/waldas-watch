import { useQuery } from "@tanstack/react-query";
import { getInviteByToken } from "@/lib/sheet-members-requests";

export function useInviteByTokenQuery(tokenHash: string) {
  return useQuery({
    queryKey: ["invite", tokenHash],
    queryFn: () => getInviteByToken(tokenHash),
    retry: false,
  });
}
