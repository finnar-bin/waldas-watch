import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updatePaymentType, UpdatePaymentTypeInput } from '@/lib/payment-types-requests'

export function useUpdatePaymentTypeMutation(sheetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePaymentTypeInput }) =>
      updatePaymentType(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-payment-types', sheetId] })
    },
  })
}
