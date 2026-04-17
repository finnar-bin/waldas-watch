import { supabase } from './supabase-client'

export type TransactionCategoryOption = {
  id: string
  name: string
  icon: string
  type: 'income' | 'expense'
  defaultAmount: number | null
}

export type PaymentTypeOption = {
  id: string
  name: string
  icon: string
}

export type SheetTransactionOverviewCategory = {
  categoryId: string
  categoryName: string
  categoryIcon: string | null
  categoryType: 'income' | 'expense'
  budget: number | null
  totalAmount: number
}

export type CreateSheetTransactionInput = {
  sheetId: string
  createdBy: string
  amount: number
  type: 'income' | 'expense'
  date: string
  categoryId: string
  paymentTypeId: string | null
  description: string | null
}

export type CategoryDetail = {
  id: string
  name: string
  icon: string
  type: 'income' | 'expense'
  budget: number | null
}

export async function getCategoryById(categoryId: string): Promise<CategoryDetail | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, icon, type, budget')
    .eq('id', categoryId)
    .single()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    name: data.name,
    icon: data.icon,
    type: data.type as 'income' | 'expense',
    budget: data.budget != null ? Number(data.budget) : null,
  }
}

export async function getSheetTransactionCategories(
  sheetId: string,
  type: 'income' | 'expense',
): Promise<TransactionCategoryOption[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, icon, type, default_amount')
    .eq('sheet_id', sheetId)
    .eq('type', type)
    .order('name', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    icon: row.icon,
    type: row.type as 'income' | 'expense',
    defaultAmount: row.default_amount ? Number(row.default_amount) : null,
  }))
}

export async function getSheetPaymentTypes(
  sheetId: string,
): Promise<PaymentTypeOption[]> {
  const { data, error } = await supabase
    .from('payment_types')
    .select('id, name, icon')
    .eq('sheet_id', sheetId)
    .order('name', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    icon: row.icon,
  }))
}

export async function getSheetTransactionOverview(
  sheetId: string,
  year: number,
  month: number,
  type: 'income' | 'expense',
): Promise<SheetTransactionOverviewCategory[]> {
  const { data, error } = await supabase.rpc('transaction_overview', {
    target_sheet_id: sheetId,
    target_year: year,
    target_month: month - 1,
    target_type: type,
  })

  if (error) throw error

  return (data ?? []).map(
    (row: {
      category_id: string
      category_name: string
      category_icon: string | null
      category_type: string
      budget: number | null
      total_amount: number
    }) => ({
      categoryId: row.category_id,
      categoryName: row.category_name,
      categoryIcon: row.category_icon,
      categoryType: row.category_type as 'income' | 'expense',
      budget: row.budget,
      totalAmount: row.total_amount,
    }),
  )
}

export async function createSheetTransaction(
  input: CreateSheetTransactionInput,
): Promise<void> {
  const { error } = await supabase.from('transactions').insert({
    sheet_id: input.sheetId,
    created_by: input.createdBy,
    amount: input.amount,
    type: input.type,
    date: input.date,
    category_id: input.categoryId,
    payment_type_id: input.paymentTypeId,
    description: input.description,
  })

  if (error) throw error
}
