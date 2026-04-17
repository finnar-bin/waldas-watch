import { useQuery } from '@tanstack/react-query'
import { getSheetInvites } from '@/lib/sheet-members-requests'

export function useSheetInvitesQuery(sheetId: string) {
  return useQuery({
    queryKey: ['sheet-invites', sheetId],
    queryFn: () => getSheetInvites(sheetId),
    enabled: !!sheetId,
  })
}
