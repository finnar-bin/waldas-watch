import { useQuery } from '@tanstack/react-query'
import { getSheetPaymentTypes } from '@/lib/transaction-form-requests'

export function useSheetPaymentTypesQuery(sheetId: string) {
  return useQuery({
    queryKey: ['sheet-payment-types', sheetId],
    queryFn: () => getSheetPaymentTypes(sheetId),
    enabled: !!sheetId,
  })
}
