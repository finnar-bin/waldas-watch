import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPaymentType, CreatePaymentTypeInput } from '@/lib/payment-types-requests'

export function useCreatePaymentTypeMutation(sheetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreatePaymentTypeInput) => createPaymentType(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-payment-types', sheetId] })
    },
  })
}
