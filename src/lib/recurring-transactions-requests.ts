import { supabase } from './supabase-client'

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export type RecurringTransactionItem = {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string | null
  frequency: RecurringFrequency
  dayOfMonth: number | null
  nextProcessDate: string | null
  isActive: boolean
  categoryId: string
  categoryName: string
  categoryIcon: string
  paymentTypeId: string | null
  paymentTypeName: string | null
}

export type CreateRecurringTransactionInput = {
  sheetId: string
  createdBy: string
  type: 'income' | 'expense'
  categoryId: string
  paymentTypeId: string | null
  amount: number
  description: string | null
  frequency: RecurringFrequency
  dayOfMonth: number | null
}

export type UpdateRecurringTransactionInput = {
  type: 'income' | 'expense'
  categoryId: string
  paymentTypeId: string | null
  amount: number
  description: string | null
  frequency: RecurringFrequency
  dayOfMonth: number | null
}

export async function getSheetRecurringTransactions(
  sheetId: string,
): Promise<RecurringTransactionItem[]> {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .select(
      'id, type, amount, description, frequency, day_of_month, next_process_date, is_active, category_id, payment_type_id, categories(name, icon), payment_types(name)',
    )
    .eq('sheet_id', sheetId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => {
    const category = row.categories as unknown as { name: string; icon: string } | null
    const paymentType = row.payment_types as unknown as { name: string } | null

    return {
      id: row.id,
      type: row.type as 'income' | 'expense',
      amount: Number(row.amount),
      description: row.description,
      frequency: row.frequency as RecurringFrequency,
      dayOfMonth: row.day_of_month,
      nextProcessDate: row.next_process_date,
      isActive: row.is_active,
      categoryId: row.category_id,
      categoryName: category?.name ?? '',
      categoryIcon: category?.icon ?? '',
      paymentTypeId: row.payment_type_id,
      paymentTypeName: paymentType?.name ?? null,
    }
  })
}

export async function createRecurringTransaction(
  input: CreateRecurringTransactionInput,
): Promise<void> {
  const { error } = await supabase.from('recurring_transactions').insert({
    sheet_id: input.sheetId,
    created_by: input.createdBy,
    type: input.type,
    category_id: input.categoryId,
    payment_type_id: input.paymentTypeId,
    amount: input.amount,
    description: input.description,
    frequency: input.frequency,
    day_of_month: input.dayOfMonth,
    is_active: true,
  })

  if (error) throw error
}

export async function updateRecurringTransaction(
  id: string,
  input: UpdateRecurringTransactionInput,
): Promise<void> {
  const { error } = await supabase
    .from('recurring_transactions')
    .update({
      type: input.type,
      category_id: input.categoryId,
      payment_type_id: input.paymentTypeId,
      amount: input.amount,
      description: input.description,
      frequency: input.frequency,
      day_of_month: input.dayOfMonth,
    })
    .eq('id', id)

  if (error) throw error
}

export async function deleteRecurringTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('recurring_transactions').delete().eq('id', id)
  if (error) throw error
}
