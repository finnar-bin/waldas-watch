import { createClient } from 'npm:@supabase/supabase-js@2'

type PromptType = 'quick_action' | 'free_text' | 'starter_insights'

type Scope = 'in_scope' | 'out_of_scope'

type RequestBody = {
  sheetId?: string
  message?: string
  promptType?: PromptType
  quickActionKey?: string | null
  contextWindowMonths?: number
  conversationMessages?: ConversationMessage[]
  conversationSummary?: string | null
}

type ConversationMessage = {
  role?: 'user' | 'assistant'
  content?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FINANCE_TERMS = [
  'budget', 'spend', 'spending', 'expense', 'expenses', 'income', 'savings', 'save',
  'debt', 'loan', 'credit', 'cashflow', 'cash flow', 'invest', 'investment', 'stocks',
  'mutual fund', 'etf', 'portfolio', 'retirement', 'gastos', 'sweldo', 'pera', 'ipon',
  'subscription', 'subscriptions', 'recurring', 'bill', 'bills', 'utilities', 'category',
  'categories', 'month', 'monthly', 'afford', 'trim', 'cut',
]

const HARD_BLOCK_TERMS = [
  'homework', 'assignment', 'lyrics', 'recipe', 'movie', 'travel plan', 'programming',
  'code bug', 'medical diagnosis', 'legal advice', 'relationship advice', 'politics',
]

function hasHardBlock(message: string): boolean {
  const lower = message.toLowerCase()
  return HARD_BLOCK_TERMS.some((term) => lower.includes(term))
}

function isFinanceScoped(message: string): boolean {
  const lower = message.toLowerCase()
  if (hasHardBlock(message)) return false
  return FINANCE_TERMS.some((term) => lower.includes(term))
}

function monthStart(date: Date): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString().slice(0, 10)
}

function monthEnd(date: Date): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).toISOString().slice(0, 10)
}

function buildOutOfScopeResponse(conversationSummary: string | null) {
  return {
    answer:
      'I can only help with budgeting and finance questions. Try asking about your spending trend, savings, debt plan, or beginner investment steps.',
    suggestedFollowUps: [
      'Show my spending trend this month vs recent months.',
      'What category is draining my budget the most?',
      'How much can I safely set aside for savings this month?',
    ],
    scope: 'out_of_scope' as const,
    disclaimer: null,
    conversationSummary,
  }
}

function toCurrency(value: number): string {
  return `P${Math.round(value).toLocaleString()}`
}

function buildRateLimitResponse(retryAfterSeconds: number) {
  return {
    error: 'Rate limit exceeded',
    retryAfterSeconds,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: authError,
    } = await admin.auth.getUser(token)

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
    }

    const body = (await req.json()) as RequestBody
    const sheetId = body.sheetId
    const promptType = body.promptType ?? 'free_text'
    const message = body.message?.trim() ?? ''
    const contextWindowMonths = Math.min(Math.max(body.contextWindowMonths ?? 6, 1), 12)
    const conversationSummary = (body.conversationSummary ?? null)?.slice(0, 2000) ?? null
    const conversationMessages = (body.conversationMessages ?? [])
      .filter((item) => item.role === 'user' || item.role === 'assistant')
      .filter((item) => typeof item.content === 'string' && item.content.trim().length > 0)
      .slice(-20)
      .map((item) => ({
        role: item.role!,
        content: item.content!.trim().slice(0, 1000),
      }))

    if (!sheetId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400, headers: corsHeaders })
    }

    if (promptType !== 'starter_insights' && !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400, headers: corsHeaders })
    }

    if (promptType !== 'starter_insights' && message.length > 500) {
      return Response.json({ error: 'Message too long. Keep it under 500 characters.' }, { status: 400, headers: corsHeaders })
    }

    const { data: membership, error: membershipError } = await admin
      .from('sheet_users')
      .select('sheet_id')
      .eq('sheet_id', sheetId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (membershipError) throw membershipError
    if (!membership) {
      return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders })
    }

    if (
      promptType !== 'starter_insights' &&
      (hasHardBlock(message) || (!isFinanceScoped(message) && !conversationSummary && conversationMessages.length === 0))
    ) {
      return Response.json(buildOutOfScopeResponse(conversationSummary), { status: 200, headers: corsHeaders })
    }

    const now = new Date()
    const fromDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (contextWindowMonths - 1), 1))

    const [{ data: transactions, error: txError }, { data: categories, error: catError }, { data: recurring, error: recurringError }] = await Promise.all([
      admin
        .from('transactions')
        .select('amount, type, date, category_id')
        .eq('sheet_id', sheetId)
        .gte('date', monthStart(fromDate))
        .lte('date', monthEnd(now)),
      admin
        .from('categories')
        .select('id, name, type, budget')
        .eq('sheet_id', sheetId),
      admin
        .from('recurring_transactions')
        .select('amount, type, frequency, next_process_date')
        .eq('sheet_id', sheetId),
    ])

    if (txError) throw txError
    if (catError) throw catError
    if (recurringError) throw recurringError

    const categoryMap = new Map((categories ?? []).map((c) => [c.id, c]))

    const monthly = new Map<string, { income: number; expense: number }>()
    const categorySpend = new Map<string, number>()

    for (const row of transactions ?? []) {
      const rowDate = new Date(`${row.date}T00:00:00Z`)
      const key = `${rowDate.getUTCFullYear()}-${String(rowDate.getUTCMonth() + 1).padStart(2, '0')}`
      const bucket = monthly.get(key) ?? { income: 0, expense: 0 }
      const amount = Number(row.amount)
      if (row.type === 'income') {
        bucket.income += amount
      } else {
        bucket.expense += amount
        if (row.category_id) {
          categorySpend.set(row.category_id, (categorySpend.get(row.category_id) ?? 0) + amount)
        }
      }
      monthly.set(key, bucket)
    }

    const topCategories = [...categorySpend.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([categoryId, total]) => ({
        name: categoryMap.get(categoryId)?.name ?? 'Unknown',
        total,
      }))

    const budgetRisks = (categories ?? [])
      .filter((c) => c.type === 'expense' && Number(c.budget) > 0)
      .map((c) => {
        const spent = categorySpend.get(c.id) ?? 0
        const budget = Number(c.budget)
        return {
          name: c.name,
          budget,
          spent,
          utilization: budget > 0 ? spent / budget : 0,
        }
      })
      .sort((a, b) => b.utilization - a.utilization)
      .slice(0, 5)

    const monthKeys = [...monthly.keys()].sort()
    const currentMonthKey = monthKeys[monthKeys.length - 1] ?? ''
    const previousMonthKey = monthKeys[monthKeys.length - 2] ?? ''

    const byCategoryByMonth = new Map<string, Map<string, number>>()
    for (const row of transactions ?? []) {
      if (row.type !== 'expense' || !row.category_id) continue
      const rowDate = new Date(`${row.date}T00:00:00Z`)
      const monthKey = `${rowDate.getUTCFullYear()}-${String(rowDate.getUTCMonth() + 1).padStart(2, '0')}`
      if (!byCategoryByMonth.has(row.category_id)) {
        byCategoryByMonth.set(row.category_id, new Map<string, number>())
      }
      const categoryMonths = byCategoryByMonth.get(row.category_id)!
      categoryMonths.set(monthKey, (categoryMonths.get(monthKey) ?? 0) + Number(row.amount))
    }

    const overBudgetAmount = budgetRisks.reduce((sum, risk) => {
      const over = risk.spent - risk.budget
      return sum + (over > 0 ? over : 0)
    }, 0)

    const biggestIncrease = [...byCategoryByMonth.entries()]
      .map(([categoryId, months]) => {
        const current = months.get(currentMonthKey) ?? 0
        const previous = months.get(previousMonthKey) ?? 0
        const growthPct = previous > 0 ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0)
        return {
          name: categoryMap.get(categoryId)?.name ?? 'Category',
          current,
          growthPct,
        }
      })
      .sort((a, b) => b.growthPct - a.growthPct)[0]

    const starterInsights = [
      {
        id: 'over_budget',
        title: 'Over budget this month',
        body:
          overBudgetAmount > 0
            ? `You exceeded your budget by ${toCurrency(overBudgetAmount)} this month.`
            : 'You are currently within budget. Nice steady pacing so far.',
        actionLabel: 'Explain why',
        actionPrompt: 'Explain why I am over budget this month.',
      },
      {
        id: 'category_spike',
        title: 'Category unusually high',
        body:
          biggestIncrease && biggestIncrease.current > 0
            ? `${biggestIncrease.name} is up about ${Math.round(biggestIncrease.growthPct)}% versus last month.`
            : 'No major category spikes detected versus last month.',
        actionLabel: 'Analyze',
        actionPrompt: 'Analyze why one category is unusually high this month.',
      },
      {
        id: 'recurring_detected',
        title: 'Recurring subscriptions detected',
        body:
          (recurring?.length ?? 0) > 0
            ? `You have ${(recurring?.length ?? 0)} recurring charges currently active.`
            : 'No recurring charges detected yet. Add one to track subscriptions.',
        actionLabel: 'Review',
        actionPrompt: 'Review my recurring subscription expenses and suggest what to keep or cut from my budget.',
      },
    ]

    if (promptType === 'starter_insights') {
      return Response.json(
        {
          answer: '',
          suggestedFollowUps: [],
          scope: 'in_scope' as const,
          disclaimer: null,
          starterInsights,
        },
        { status: 200, headers: corsHeaders },
      )
    }

    const model = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini'
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      return Response.json(
        { error: 'AI is not configured on the server. Set OPENAI_API_KEY.' },
        { status: 500, headers: corsHeaders },
      )
    }

    const { data: rateLimitRows, error: rateLimitError } = await admin.rpc(
      'check_ai_rate_limit',
      {
        target_user_id: user.id,
        max_requests: 10,
        window_seconds: 60,
      },
    )

    if (rateLimitError) throw rateLimitError

    const rateLimit = rateLimitRows?.[0] as
      | { allowed: boolean; retry_after_seconds: number }
      | undefined

    if (!rateLimit?.allowed) {
      return Response.json(
        buildRateLimitResponse(rateLimit?.retry_after_seconds ?? 60),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Retry-After': String(rateLimit?.retry_after_seconds ?? 60),
          },
        },
      )
    }

    const context = {
      promptType: body.promptType ?? 'free_text',
      quickActionKey: body.quickActionKey ?? null,
      monthsCovered: contextWindowMonths,
      monthlySummary: [...monthly.entries()].sort(([a], [b]) => a.localeCompare(b)),
      topCategories,
      budgetRisks,
      recurringCount: recurring?.length ?? 0,
      recurringPreview: (recurring ?? []).slice(0, 8),
    }

    const systemPrompt = [
      'You are Walda AI, a playful but practical budgeting assistant for a Filipino-friendly app.',
      'Use concise Taglish with clear English context.',
      'Only answer finance and budgeting topics; if prompt is unrelated, refuse and redirect to finance.',
      'Allowed: budgeting, spending, savings, debt planning, and beginner investment tips.',
      'Do not give legal, medical, or tax directives. No guaranteed returns.',
      'Use provided context only; if data is missing, say so plainly.',
      'Use conversation summary and recent messages only to resolve follow-ups and user preferences.',
      'Return JSON only with keys: answer, suggestedFollowUps, scope, disclaimer, conversationSummary.',
      'conversationSummary must be a compact factual summary under 800 characters. Include durable user goals, constraints, preferences, and prior conclusions. Do not include sensitive raw transaction lists.',
    ].join(' ')

    const userPrompt = JSON.stringify({
      userMessage: message,
      conversationSummary,
      recentConversationMessages: conversationMessages,
      context,
      outputRules: {
        scope: 'must be in_scope unless unrelated topic',
        followUpsCount: 3,
        disclaimer: 'required when investment advice appears, otherwise null',
        conversationSummary:
          'update the previous summary using recent messages and this response; keep it concise and factual',
      },
    })

    const llmResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    })

    if (!llmResponse.ok) {
      const errText = await llmResponse.text()
      throw new Error(`LLM request failed: ${errText}`)
    }

    const payload = await llmResponse.json()
    const content = payload?.choices?.[0]?.message?.content
    if (!content) throw new Error('Empty AI response')

    const parsed = JSON.parse(content) as {
      answer?: string
      suggestedFollowUps?: string[]
      scope?: Scope
      disclaimer?: string | null
      conversationSummary?: string | null
    }

    const response = {
      answer: parsed.answer ?? 'No answer generated. Try asking again with a clearer budget question.',
      suggestedFollowUps: Array.isArray(parsed.suggestedFollowUps)
        ? parsed.suggestedFollowUps.slice(0, 3)
        : [
            'Can you break this down by category?',
            'What should I adjust this week?',
            'Give me one practical next step.',
          ],
      scope: parsed.scope === 'out_of_scope' ? 'out_of_scope' : 'in_scope',
      disclaimer: parsed.disclaimer ?? null,
      conversationSummary:
        typeof parsed.conversationSummary === 'string'
          ? parsed.conversationSummary.slice(0, 2000)
          : conversationSummary,
    }

    return Response.json(response, { status: 200, headers: corsHeaders })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json(
      { error: message },
      { status: 500, headers: corsHeaders },
    )
  }
})
