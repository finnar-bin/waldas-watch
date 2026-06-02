import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  upsertMonthlySheetNote,
  type UpsertMonthlySheetNoteInput,
} from '@/lib/monthly-sheet-notes-requests'
import { getMonthlySheetNoteQueryKey } from '@/queries/use-monthly-sheet-note-query'

export function useUpsertMonthlySheetNoteMutation(
  sheetId: string,
  year: number,
  month: number,
  userId: string | undefined,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpsertMonthlySheetNoteInput) => upsertMonthlySheetNote(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getMonthlySheetNoteQueryKey(sheetId, year, month, userId),
      })
    },
  })
}
