import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteRecurringTransaction } from '@/lib/recurring-transactions-requests'

export function useDeleteRecurringTransactionMutation(sheetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (recurringId: string) => deleteRecurringTransaction(recurringId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-recurring-transactions', sheetId] })
    },
  })
}
