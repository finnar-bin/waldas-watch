import { supabase } from '@/lib/supabase-client'

export type FinancialAssistantPromptType =
  | 'quick_action'
  | 'free_text'
  | 'starter_insights'

export type QuickActionKey =
  | 'spending_trend'
  | 'top_categories'
  | 'budget_risk'
  | 'recurring_audit'
  | 'payday_forecast'
  | 'cut_twenty'
  | 'savings_opportunities'
  | 'daily_burn'
  | 'anomaly_detector'
  | 'investment_nudge'

export interface FinancialAssistantRequest {
  sheetId: string
  message: string
  promptType: FinancialAssistantPromptType
  quickActionKey?: QuickActionKey | null
  contextWindowMonths?: number
}

export interface FinancialAssistantResponse {
  answer: string
  suggestedFollowUps: string[]
  scope: 'in_scope' | 'out_of_scope'
  disclaimer: string | null
  starterInsights?: StarterInsight[]
}

export interface StarterInsight {
  id: string
  title: string
  body: string
  actionLabel: string
  actionPrompt: string
}

export async function askFinancialAssistant(
  input: FinancialAssistantRequest,
): Promise<FinancialAssistantResponse> {
  const { data, error } = await supabase.functions.invoke<FinancialAssistantResponse>(
    'financial-assistant',
    {
      body: {
        sheetId: input.sheetId,
        message: input.message,
        promptType: input.promptType,
        quickActionKey: input.quickActionKey ?? null,
        contextWindowMonths: input.contextWindowMonths ?? 6,
      },
    },
  )

  if (error) throw error
  if (!data) throw new Error('No response from assistant. Baka nag-merienda muna si AI.')
  return data
}

export async function getFinancialAssistantStarterInsights(
  sheetId: string,
): Promise<StarterInsight[]> {
  const response = await askFinancialAssistant({
    sheetId,
    message: '__starter__',
    promptType: 'starter_insights',
    contextWindowMonths: 6,
  })

  return response.starterInsights ?? []
}
