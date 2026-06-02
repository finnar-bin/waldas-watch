import { supabase } from './supabase-client'

export type MonthlySheetNote = {
  id: string
  sheetId: string
  year: number
  month: number
  note: string
}

export type UpsertMonthlySheetNoteInput = {
  sheetId: string
  year: number
  month: number
  note: string
  createdBy: string
}

export async function getMonthlySheetNote(
  sheetId: string,
  year: number,
  month: number,
): Promise<MonthlySheetNote | null> {
  const { data, error } = await supabase
    .from('monthly_sheet_notes')
    .select('id, sheet_id, year, month, note')
    .eq('sheet_id', sheetId)
    .eq('year', year)
    .eq('month', month)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    sheetId: data.sheet_id,
    year: data.year,
    month: data.month,
    note: data.note,
  }
}

export async function upsertMonthlySheetNote(input: UpsertMonthlySheetNoteInput): Promise<void> {
  const { error } = await supabase.from('monthly_sheet_notes').upsert(
    {
      sheet_id: input.sheetId,
      year: input.year,
      month: input.month,
      note: input.note,
      created_by: input.createdBy,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'sheet_id,year,month' },
  )

  if (error) throw error
}
