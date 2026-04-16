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
