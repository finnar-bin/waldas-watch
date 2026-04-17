import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateSheetCurrency } from '@/lib/sheet-settings-requests'

export function useUpdateSheetCurrencyMutation(sheetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ currency, updatedBy }: { currency: string; updatedBy: string }) =>
      updateSheetCurrency(sheetId, currency, updatedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-currency', sheetId] })
    },
  })
}
