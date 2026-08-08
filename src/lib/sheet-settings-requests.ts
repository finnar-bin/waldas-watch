import { supabase } from './supabase-client'

export async function getSheetCurrency(sheetId: string): Promise<string> {
  const { data, error } = await supabase
    .from('sheet_settings')
    .select('currency')
    .eq('sheet_id', sheetId)
    .single()

  if (error) throw error
  return data?.currency ?? 'USD'
}

export async function updateSheetCurrency(
  sheetId: string,
  currency: string,
  updatedBy: string,
): Promise<void> {
  const { error } = await supabase
    .from('sheet_settings')
    .upsert({ sheet_id: sheetId, currency, updated_by: updatedBy }, { onConflict: 'sheet_id' })

  if (error) throw error
}

export type SheetBudgetRollover = {
  enabled: boolean
  enabledAt: string | null
}

export async function getSheetBudgetRollover(sheetId: string): Promise<SheetBudgetRollover> {
  const { data, error } = await supabase
    .from('sheet_settings')
    .select('budget_rollover_enabled, budget_rollover_enabled_at')
    .eq('sheet_id', sheetId)
    .single()

  if (error) throw error

  return {
    enabled: data?.budget_rollover_enabled ?? false,
    enabledAt: data?.budget_rollover_enabled_at ?? null,
  }
}

export async function updateSheetBudgetRollover(
  sheetId: string,
  enabled: boolean,
  updatedBy: string,
): Promise<void> {
  const { error } = await supabase.from('sheet_settings').upsert(
    {
      sheet_id: sheetId,
      budget_rollover_enabled: enabled,
      budget_rollover_enabled_at: enabled ? new Date().toISOString() : null,
      updated_by: updatedBy,
    },
    { onConflict: 'sheet_id' },
  )

  if (error) throw error
}

export async function getSheetCategoryMonthlySpend(
  sheetId: string,
  type: 'income' | 'expense',
  since: string,
): Promise<Map<string, Map<string, number>>> {
  const { data, error } = await supabase.rpc('sheet_category_monthly_spend', {
    target_sheet_id: sheetId,
    target_type: type,
    since,
  })

  if (error) throw error

  const result = new Map<string, Map<string, number>>()
  for (const row of data ?? []) {
    const monthKey = (row.month as string).slice(0, 7)
    const categorySpend = result.get(row.category_id) ?? new Map<string, number>()
    categorySpend.set(monthKey, Number(row.spent))
    result.set(row.category_id, categorySpend)
  }
  return result
}
