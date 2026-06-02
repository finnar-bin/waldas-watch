import { useQuery } from '@tanstack/react-query'
import { getFinancialAssistantStarterInsights } from '@/lib/ai-assistant-requests'

export function useFinancialAssistantStarterInsightsQuery(
  sheetId: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['financial-assistant-starter-insights', sheetId],
    queryFn: () => getFinancialAssistantStarterInsights(sheetId),
    enabled: enabled && !!sheetId,
  })
}
