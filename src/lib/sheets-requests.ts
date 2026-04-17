import { supabase } from './supabase-client'

export type UserSheet = {
  id: string
  name: string
  description: string | null
  role: 'viewer' | 'editor' | 'admin'
}

export interface UpdateSheetInput {
  name: string
  description: string | null
}

export async function deleteSheet(sheetId: string): Promise<void> {
  const { error } = await supabase.from('sheets').delete().eq('id', sheetId)
  if (error) throw error
}

export async function updateSheet(sheetId: string, input: UpdateSheetInput): Promise<void> {
  const { error } = await supabase
    .from('sheets')
    .update({ name: input.name, description: input.description || null })
    .eq('id', sheetId)

  if (error) throw error
}

export async function getUserSheets(userId: string): Promise<UserSheet[]> {
  const { data, error } = await supabase
    .from('sheet_users')
    .select('role, sheet:sheets(id, name, description)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => {
    const sheet = row.sheet as unknown as { id: string; name: string; description: string | null }
    return {
      id: sheet.id,
      name: sheet.name,
      description: sheet.description ?? null,
      role: row.role as UserSheet['role'],
    }
  })
}
