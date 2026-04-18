import { useMutation, useQueryClient, type MutateOptions } from '@tanstack/react-query'
import { updatePaymentType, type UpdatePaymentTypeInput } from '@/lib/payment-types-requests'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { enqueueOperation } from '@/lib/offline-queue'

type UpdateVariables = { id: string; input: UpdatePaymentTypeInput }

export function useUpdatePaymentTypeMutation(sheetId: string) {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  const mutation = useMutation({
    mutationFn: ({ id, input }: UpdateVariables) => updatePaymentType(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-payment-types', sheetId] })
    },
  })

  const mutateAsync = (
    variables: UpdateVariables,
    options?: MutateOptions<void, Error, UpdateVariables, unknown>,
  ): Promise<void> => {
    if (!isOnline) {
      enqueueOperation({ type: 'UPDATE_PAYMENT_TYPE', payload: { paymentTypeId: variables.id, sheetId, input: variables.input } })
      return Promise.resolve()
    }
    return mutation.mutateAsync(variables, options)
  }

  const mutate = (
    variables: UpdateVariables,
    options?: MutateOptions<void, Error, UpdateVariables, unknown>,
  ): void => {
    if (!isOnline) {
      enqueueOperation({ type: 'UPDATE_PAYMENT_TYPE', payload: { paymentTypeId: variables.id, sheetId, input: variables.input } })
      return
    }
    mutation.mutate(variables, options)
  }

  return { ...mutation, mutate, mutateAsync }
}
