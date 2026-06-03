import { useMutation } from '@tanstack/react-query'
import {
  askFinancialAssistant,
  FinancialAssistantRequest,
} from '@/lib/ai-assistant-requests'

export function useFinancialAssistantMutation() {
  return useMutation({
    mutationFn: (input: FinancialAssistantRequest) => askFinancialAssistant(input),
  })
}
