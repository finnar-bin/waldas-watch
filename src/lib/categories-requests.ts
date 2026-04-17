import { supabase } from './supabase-client'

export type CategoryItem = {
  id: string
  name: string
  icon: string
  type: 'income' | 'expense'
  budget: number | null
  defaultAmount: number | null
}

export type CreateCategoryInput = {
  sheetId: string
  createdBy: string
  name: string
  icon: string
  type: 'income' | 'expense'
  budget: number | null
  defaultAmount: number | null
}

export type UpdateCategoryInput = {
  name: string
  icon: string
  budget: number | null
  defaultAmount: number | null
}

export async function getSheetCategories(sheetId: string): Promise<CategoryItem[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, icon, type, budget, default_amount')
    .eq('sheet_id', sheetId)
    .order('name', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    icon: row.icon,
    type: row.type as 'income' | 'expense',
    budget: row.budget != null ? Number(row.budget) : null,
    defaultAmount: row.default_amount != null ? Number(row.default_amount) : null,
  }))
}

export async function createCategory(input: CreateCategoryInput): Promise<void> {
  const { error } = await supabase.from('categories').insert({
    sheet_id: input.sheetId,
    created_by: input.createdBy,
    name: input.name,
    icon: input.icon,
    type: input.type,
    budget: input.budget,
    default_amount: input.defaultAmount,
  })

  if (error) throw error
}

export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update({
      name: input.name,
      icon: input.icon,
      budget: input.budget,
      default_amount: input.defaultAmount,
    })
    .eq('id', id)

  if (error) throw error
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}
