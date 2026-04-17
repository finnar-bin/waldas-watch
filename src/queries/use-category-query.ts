import { useQuery } from '@tanstack/react-query'
import { getCategoryById } from '@/lib/transaction-form-requests'

export function useCategoryQuery(categoryId: string) {
  return useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => getCategoryById(categoryId),
    enabled: !!categoryId,
  })
}
