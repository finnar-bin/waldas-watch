import { supabase } from './supabase-client'

export type CreatePaymentTypeInput = {
  sheetId: string
  createdBy: string
  name: string
  icon: string
}

export type UpdatePaymentTypeInput = {
  name: string
  icon: string
}

export async function createPaymentType(input: CreatePaymentTypeInput): Promise<void> {
  const { error } = await supabase.from('payment_types').insert({
    sheet_id: input.sheetId,
    created_by: input.createdBy,
    name: input.name,
    icon: input.icon,
  })

  if (error) throw error
}

export async function updatePaymentType(id: string, input: UpdatePaymentTypeInput): Promise<void> {
  const { error } = await supabase
    .from('payment_types')
    .update({ name: input.name, icon: input.icon })
    .eq('id', id)

  if (error) throw error
}

export async function deletePaymentType(id: string): Promise<void> {
  const { error } = await supabase.from('payment_types').delete().eq('id', id)
  if (error) throw error
}
