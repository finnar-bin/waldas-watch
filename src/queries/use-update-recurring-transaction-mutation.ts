import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  updateRecurringTransaction,
  UpdateRecurringTransactionInput,
} from '@/lib/recurring-transactions-requests'

export function useUpdateRecurringTransactionMutation(sheetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRecurringTransactionInput }) =>
      updateRecurringTransaction(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-recurring-transactions', sheetId] })
    },
  })
}
