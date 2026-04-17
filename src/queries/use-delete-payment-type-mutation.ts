import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deletePaymentType } from '@/lib/payment-types-requests'

export function useDeletePaymentTypeMutation(sheetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (paymentTypeId: string) => deletePaymentType(paymentTypeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-payment-types', sheetId] })
    },
  })
}
