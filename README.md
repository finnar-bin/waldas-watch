# Waldas Watch

> *Because "bahala na" is not a financial plan.*

A collaborative budget tracking Progressive Web App. Create shared budget sheets with your household, track expenses and income by category, set budgets, and stay on top of your finances — even offline.

## Features

- **Shared sheets** — Invite collaborators with owner, editor, or viewer roles
- **Category budgets** — Set spending limits per category with visual progress tracking
- **Expense & income tracking** — Log transactions with category, payment method, date, and description
- **Monthly overview** — See how each category is trending for any month and year
- **Recurring transactions** — Set up repeating income or expenses (salary, subscriptions, etc.)
- **Multi-currency** — Each sheet has its own currency from 100+ supported options
- **Offline-first** — All write operations are queued locally and synced when back online
- **Installable PWA** — Add to home screen on Android and iOS for a native app experience

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 6 |
| Routing | TanStack Router (file-based) |
| Server state | TanStack Query (with localStorage persistence) |
| UI | Mantine 7 |
| Backend / Auth / DB | Supabase (PostgreSQL) |
| PWA | vite-plugin-pwa + Workbox |
| Hosting | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Installation

```bash
git clone https://github.com/your-username/waldas-watch.git
cd waldas-watch
npm install
```

### Environment Variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.development.example .env.development
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_PROJECT_REF_DEV=your-project-ref
```

For production, create `.env.production` with the equivalent production project values (add `SUPABASE_PROJECT_REF_PROD`).

### Run Locally

```bash
npm run dev
```

App runs at `http://localhost:5173`.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run typecheck` | TypeScript type check (no emit) |
| `npm run db:link:dev` | Link Supabase CLI to dev project |
| `npm run db:link:prod` | Link Supabase CLI to prod project |
| `npm run db:push:dev` | Push migrations to dev |
| `npm run db:push:prod` | Push migrations to prod |
| `npm run db:list` | List all migrations |
| `npm run functions:deploy:dev` | Deploy Edge Functions to dev |
| `npm run functions:deploy:prod` | Deploy Edge Functions to prod |

## Deployment

The app is hosted on Vercel. Deployments are triggered automatically on push to `main`.

**Manual deploy:**

```bash
npm run build
# then push to your connected Vercel project
```

`vercel.json` handles SPA routing rewrites and ensures `sw.js` is served with `no-cache` headers so PWA updates propagate immediately after each deployment.

## Project Structure

```
src/
├── routes/              # File-based routes (TanStack Router)
│   ├── __root.tsx       # Root layout (offline/sync/install banners)
│   ├── login.tsx
│   ├── signup.tsx
│   ├── invite/          # Accept sheet invites via token
│   └── _auth/           # Protected routes
│       └── sheets/
│           └── $sheetId/
│               ├── index.tsx          # Dashboard
│               ├── add-transaction.tsx
│               ├── overview/          # Category breakdown
│               └── settings/          # Sheet settings, categories, members
├── components/          # Shared UI components
├── queries/             # TanStack Query hooks (read + mutation)
├── lib/                 # Supabase client, API request functions, offline queue
├── hooks/               # Custom React hooks
├── providers/           # SessionProvider, QueryProvider
└── utils/               # Currency formatting, date formatting
```

## Offline Support

Waldas Watch queues write operations (create/update/delete for transactions, categories, payment types, etc.) in localStorage when the device is offline. When connectivity is restored, queued operations replay automatically. A banner in the UI shows the current sync state and lets users manually retry failed syncs.

## PWA Installation

**Android:** Open the app in Chrome → tap the browser menu → *Add to Home Screen*.

**iOS:** Open the app in Safari → tap the Share button → *Add to Home Screen*.

Once installed, the app runs in standalone mode with no browser chrome. Updates are delivered automatically the next time you open the app after a new deployment.

## License

[Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)](LICENSE)

You are free to share and adapt this code for non-commercial purposes, provided you give appropriate credit. Commercial use is not permitted.
