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
