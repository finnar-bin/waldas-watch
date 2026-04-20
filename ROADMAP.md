# Waldas Watch — Product Roadmap

## Tier 1 — Must-Haves

These are core to making the app genuinely useful day-to-day.

### 1. Charts & Visualizations
Finance apps live or die by visualization. Numbers alone don't tell the story.
- Spending breakdown by category (pie/donut chart)
- Monthly income vs expenses (bar chart)
- Spending over time (line chart)

### 2. Transaction Search & Filter
Becomes painful once a sheet has 30+ transactions.
- Search by description or amount
- Filter by category, payment type, date range

### 3. Push Notifications for Category Reminders
The entire infrastructure is already in place (DB schema, RLS, Edge Function pattern). Just needs wiring up.
- Subscribe browser on login and save to `push_subscriptions`
- Edge Function that checks `due_reminder_frequency` on categories and sends notifications
- Deduplication via `category_reminder_deliveries`
- Scheduled cron trigger (daily)

---

## Tier 2 — Strong Differentiators

Features that make the app sticky and stand out.

### 4. Month-over-Month Spending Trends
Surface insights like "you spent 14% more on food than last month."
- Comparison view in Overview page
- Highlight categories over/under budget vs prior month

### 5. AI Financial Assistant
A chat drawer (FAB → bottom sheet) powered by Claude API via Supabase Edge Function.
- Proactive spending summary when opened
- Natural language questions ("why did I spend more this month?")
- Budget recommendations based on patterns
- Gate behind a paid tier if monetizing

### 6. CSV Export
Low effort, high trust signal — users feel safe knowing they can get their data out.
- Export transactions for a given sheet/date range
- Useful at tax time

---

## Tier 3 — Polish Later

Nice-to-haves once the core is solid.

- Bulk operations (multi-select delete, import)
- Tags/labels on transactions (beyond categories)
- Touch gestures (swipe to delete/edit)
- Offline queue detail view

---

## Suggested Build Order

`Charts → Search/Filter → Push Notifications → Trends → AI Assistant → CSV Export`

---

## Monetization Angle (future)

- Free tier: 1 sheet, core tracking
- Paid tier (~$3–5/month): multiple sheets, AI assistant, export, advanced analytics
- AI API cost (Claude Haiku) is negligible (~$0.0005/request), so even a small subscriber base is profitable
