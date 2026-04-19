import { supabase } from './supabase-client'

export type TransactionDetail = {
  id: string
  amount: number
  type: 'income' | 'expense'
  description: string | null
  date: string
  categoryId: string
  paymentTypeId: string | null
}

export async function getTransactionById(
  transactionId: string,
): Promise<TransactionDetail | null> {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, amount, type, description, date, category_id, payment_type_id')
    .eq('id', transactionId)
    .single()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    amount: Number(data.amount),
    type: data.type as 'income' | 'expense',
    description: data.description ?? null,
    date: data.date,
    categoryId: data.category_id,
    paymentTypeId: data.payment_type_id ?? null,
  }
}

export type CategoryTransaction = {
  id: string
  amount: number
  type: 'income' | 'expense'
  description: string | null
  date: string
  paymentTypeName: string | null
  paymentTypeIcon: string | null
  creatorDisplayName: string | null
  creatorEmail: string | null
  creatorAvatarUrl: string | null
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)

  if (error) throw error
}

export async function getCategoryTransactions(
  sheetId: string,
  categoryId: string,
  year: number,
  month: number,
): Promise<CategoryTransaction[]> {
  const { data, error } = await supabase.rpc('category_transactions', {
    target_sheet_id: sheetId,
    target_category_id: categoryId,
    target_year: year,
    target_month: month - 1,
  })

  if (error) throw error

  return (data ?? []).map((row: {
    transaction_id: string
    amount: number
    transaction_type: string
    description: string | null
    transaction_date: string
    payment_type_name: string | null
    payment_type_icon: string | null
    creator_display_name: string | null
    creator_email: string | null
    creator_avatar_url: string | null
  }) => ({
    id: row.transaction_id,
    amount: Number(row.amount),
    type: row.transaction_type as 'income' | 'expense',
    description: row.description,
    date: row.transaction_date,
    paymentTypeName: row.payment_type_name,
    paymentTypeIcon: row.payment_type_icon,
    creatorDisplayName: row.creator_display_name,
    creatorEmail: row.creator_email,
    creatorAvatarUrl: row.creator_avatar_url,
  }))
}

export type RecentSheetTransaction = {
  id: string
  amount: number
  type: 'income' | 'expense'
  description: string | null
  date: string
  categoryName: string | null
  categoryIcon: string | null
  creatorName: string | null
  creatorAvatarUrl: string | null
  creatorEmail: string | null
}

export type MonthlySheetTotals = {
  incomeTotal: number
  expenseTotal: number
  exceededBudgetTotal: number
}

export type MonthlyCategoryTotal = {
  categoryId: string
  categoryName: string
  totalAmount: number
}

export type MonthlySheetCategoryTotals = {
  income: MonthlyCategoryTotal[]
  expense: MonthlyCategoryTotal[]
}

export async function getRecentSheetTransactions(
  sheetId: string,
  limit = 5,
): Promise<RecentSheetTransaction[]> {
  const { data: txData, error: txError } = await supabase
    .from('transactions')
    .select(`id, amount, type, description, date, created_by, category:categories(name, icon)`)
    .eq('sheet_id', sheetId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (txError) throw txError

  const rows = txData ?? []

  const creatorIds = [...new Set(rows.map((r) => r.created_by).filter(Boolean))]
  const profileMap = new Map<string, { display_name: string | null; avatar_url: string | null; email: string | null }>()

  if (creatorIds.length > 0) {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, email')
      .in('id', creatorIds)

    if (profileError) throw profileError

    for (const p of profileData ?? []) {
      profileMap.set(p.id, {
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        email: p.email,
      })
    }
  }

  return rows.map((row) => {
    const category = row.category as unknown as { name: string; icon: string } | null
    const creator = profileMap.get(row.created_by) ?? null
    return {
      id: row.id,
      amount: row.amount,
      type: row.type as 'income' | 'expense',
      description: row.description ?? null,
      date: row.date,
      categoryName: category?.name ?? null,
      categoryIcon: category?.icon ?? null,
      creatorName: creator?.display_name ?? null,
      creatorAvatarUrl: creator?.avatar_url ?? null,
      creatorEmail: creator?.email ?? null,
    }
  })
}

export async function getCurrentMonthSheetTotals(
  sheetId: string,
): Promise<MonthlySheetTotals> {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10)

  const [{ data, error }, { data: categories, error: categoriesError }] =
    await Promise.all([
      supabase
        .from('transactions')
        .select('amount, type, category_id')
        .eq('sheet_id', sheetId)
        .gte('date', monthStart)
        .lte('date', monthEnd),
      supabase
        .from('categories')
        .select('id, budget')
        .eq('sheet_id', sheetId)
        .eq('type', 'expense')
        .gt('budget', 0),
    ])

  if (error) throw error
  if (categoriesError) throw categoriesError

  const rows = data ?? []
  const incomeTotal = rows
    .filter((r) => r.type === 'income')
    .reduce((sum, r) => sum + Number(r.amount), 0)
  const expenseTotal = rows
    .filter((r) => r.type === 'expense')
    .reduce((sum, r) => sum + Number(r.amount), 0)

  const budgetMap = new Map(
    (categories ?? []).map((c) => [c.id, Number(c.budget)])
  )
  const spentByCategory = new Map<string, number>()
  for (const row of rows.filter((r) => r.type === 'expense')) {
    spentByCategory.set(
      row.category_id,
      (spentByCategory.get(row.category_id) ?? 0) + Number(row.amount)
    )
  }
  let exceededBudgetTotal = 0
  for (const [categoryId, budget] of budgetMap) {
    const spent = spentByCategory.get(categoryId) ?? 0
    if (spent > budget) exceededBudgetTotal += spent - budget
  }

  return { incomeTotal, expenseTotal, exceededBudgetTotal }
}

export async function getCurrentMonthSheetCategoryTotals(
  sheetId: string,
): Promise<MonthlySheetCategoryTotals> {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10)

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, type, category_id, category:categories(name)')
    .eq('sheet_id', sheetId)
    .gte('date', monthStart)
    .lte('date', monthEnd)

  if (error) throw error

  const rows = data ?? []

  const aggregate = (type: 'income' | 'expense'): MonthlyCategoryTotal[] => {
    const map = new Map<string, { name: string; total: number }>()
    for (const row of rows.filter((r) => r.type === type)) {
      const existing = map.get(row.category_id)
      const name = (row.category as unknown as { name: string } | null)?.name ?? row.category_id
      map.set(row.category_id, {
        name,
        total: (existing?.total ?? 0) + Number(row.amount),
      })
    }
    return Array.from(map.entries()).map(([id, { name, total }]) => ({
      categoryId: id,
      categoryName: name,
      totalAmount: total,
    }))
  }

  return { income: aggregate('income'), expense: aggregate('expense') }
}
