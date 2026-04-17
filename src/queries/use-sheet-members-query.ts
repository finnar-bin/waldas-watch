import { useQuery } from '@tanstack/react-query'
import { getSheetMembers } from '@/lib/sheet-members-requests'

export function useSheetMembersQuery(sheetId: string) {
  return useQuery({
    queryKey: ['sheet-members', sheetId],
    queryFn: () => getSheetMembers(sheetId),
    enabled: !!sheetId,
  })
}
