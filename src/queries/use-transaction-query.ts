import { useQuery } from '@tanstack/react-query'
import { getTransactionById } from '@/lib/transactions-requests'

export function useTransactionQuery(transactionId: string) {
  return useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: () => getTransactionById(transactionId),
    enabled: !!transactionId,
  })
}
