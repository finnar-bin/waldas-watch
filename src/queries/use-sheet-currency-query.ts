import { useQuery } from '@tanstack/react-query'
import { getSheetCurrency } from '@/lib/sheet-settings-requests'

export function useSheetCurrencyQuery(sheetId: string) {
  return useQuery({
    queryKey: ['sheet-currency', sheetId],
    queryFn: () => getSheetCurrency(sheetId),
    enabled: !!sheetId,
  })
}
