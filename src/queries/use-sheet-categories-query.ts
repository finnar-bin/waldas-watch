import { useQuery } from '@tanstack/react-query'
import { getSheetCategories } from '@/lib/categories-requests'

export function useSheetCategoriesQuery(sheetId: string) {
  return useQuery({
    queryKey: ['sheet-categories', sheetId],
    queryFn: () => getSheetCategories(sheetId),
    enabled: !!sheetId,
  })
}
