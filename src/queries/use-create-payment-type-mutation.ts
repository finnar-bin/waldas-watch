import { useMutation, useQueryClient, type MutateOptions } from '@tanstack/react-query'
import { createPaymentType, type CreatePaymentTypeInput } from '@/lib/payment-types-requests'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { enqueueOperation } from '@/lib/offline-queue'

export function useCreatePaymentTypeMutation(sheetId: string) {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  const mutation = useMutation({
    mutationFn: (input: CreatePaymentTypeInput) => createPaymentType(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-payment-types', sheetId] })
    },
  })

  const mutateAsync = (
    input: CreatePaymentTypeInput,
    options?: MutateOptions<void, Error, CreatePaymentTypeInput, unknown>,
  ): Promise<void> => {
    if (!isOnline) {
      enqueueOperation({ type: 'CREATE_PAYMENT_TYPE', payload: input })
      return Promise.resolve()
    }
    return mutation.mutateAsync(input, options)
  }

  const mutate = (
    input: CreatePaymentTypeInput,
    options?: MutateOptions<void, Error, CreatePaymentTypeInput, unknown>,
  ): void => {
    if (!isOnline) {
      enqueueOperation({ type: 'CREATE_PAYMENT_TYPE', payload: input })
      return
    }
    mutation.mutate(input, options)
  }

  return { ...mutation, mutate, mutateAsync }
}
