import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createRecurringTransaction,
  CreateRecurringTransactionInput,
} from '@/lib/recurring-transactions-requests'

export function useCreateRecurringTransactionMutation(sheetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateRecurringTransactionInput) => createRecurringTransaction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-recurring-transactions', sheetId] })
    },
  })
}
