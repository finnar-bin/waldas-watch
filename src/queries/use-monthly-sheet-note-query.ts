import { useQuery } from '@tanstack/react-query'
import { getMonthlySheetNote } from '@/lib/monthly-sheet-notes-requests'

export function getMonthlySheetNoteQueryKey(
  sheetId: string,
  year: number,
  month: number,
  userId: string | undefined,
) {
  return ['monthly-sheet-note', sheetId, year, month, userId ?? 'anonymous'] as const
}

export function useMonthlySheetNoteQuery(
  sheetId: string,
  year: number,
  month: number,
  userId: string | undefined,
) {
  return useQuery({
    queryKey: getMonthlySheetNoteQueryKey(sheetId, year, month, userId),
    queryFn: () => getMonthlySheetNote(sheetId, year, month),
    enabled: !!sheetId && !!userId,
  })
}
