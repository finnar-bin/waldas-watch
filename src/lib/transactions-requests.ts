import { supabase } from './supabase-client'

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

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, type')
    .eq('sheet_id', sheetId)
    .gte('date', monthStart)
    .lte('date', monthEnd)

  if (error) throw error

  const rows = data ?? []
  const incomeTotal = rows
    .filter((r) => r.type === 'income')
    .reduce((sum, r) => sum + Number(r.amount), 0)
  const expenseTotal = rows
    .filter((r) => r.type === 'expense')
    .reduce((sum, r) => sum + Number(r.amount), 0)

  return { incomeTotal, expenseTotal }
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
