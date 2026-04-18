import { useMutation, useQueryClient, type MutateOptions } from '@tanstack/react-query'
import { deletePaymentType } from '@/lib/payment-types-requests'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { enqueueOperation } from '@/lib/offline-queue'

export function useDeletePaymentTypeMutation(sheetId: string) {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  const mutation = useMutation({
    mutationFn: (paymentTypeId: string) => deletePaymentType(paymentTypeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-payment-types', sheetId] })
    },
  })

  const mutateAsync = (
    paymentTypeId: string,
    options?: MutateOptions<void, Error, string, unknown>,
  ): Promise<void> => {
    if (!isOnline) {
      enqueueOperation({ type: 'DELETE_PAYMENT_TYPE', payload: { paymentTypeId, sheetId } })
      return Promise.resolve()
    }
    return mutation.mutateAsync(paymentTypeId, options)
  }

  const mutate = (
    paymentTypeId: string,
    options?: MutateOptions<void, Error, string, unknown>,
  ): void => {
    if (!isOnline) {
      enqueueOperation({ type: 'DELETE_PAYMENT_TYPE', payload: { paymentTypeId, sheetId } })
      return
    }
    mutation.mutate(paymentTypeId, options)
  }

  return { ...mutation, mutate, mutateAsync }
}
