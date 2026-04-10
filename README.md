# TenderTrack v2.0
### AIMS Kuwait — Bid & Contract Management System

A full-stack React SPA for managing government tenders, bid bonds, sales deals, and invoice tracking. Built with React 18, Supabase (PostgreSQL + Auth + Realtime), and Zustand.

---

## Quick Start

### 1. Clone / unzip
```bash
unzip tendertrack-spa.zip && cd tendertrack
```

### 2. Create your Supabase project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Open the **SQL Editor** and run the entire contents of `supabase/schema.sql`
3. Go to **Project Settings → API** and copy:
   - **Project URL** (looks like `https://xyz.supabase.co`)
   - **anon public** key

### 3. Configure environment
```bash
cp .env.example .env.local
```
Edit `.env.local`:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 4. Install and run
```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — sign up with your work email.

### 5. Build for production
```bash
npm run build        # outputs to dist/
npm run preview      # preview the production build locally
```

Deploy the `dist/` folder to any static host: **Vercel**, **Netlify**, Cloudflare Pages, or an S3 bucket.

---

## Team Setup

### First user = admin
The first person who signs up gets `viewer` role by default. Promote them to admin in Supabase:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@aims.com.kw';
```

### Role hierarchy
| Role    | Can do |
|---------|--------|
| admin   | Everything — manage team, delete any record, all settings |
| manager | Create & edit tenders, import data, bulk actions |
| viewer  | Read-only — view all tenders and reports |

### Promoting team members
```sql
UPDATE profiles SET role = 'manager' WHERE email = 'user@aims.com.kw';
```

---

## Migrating from the old v6 app

1. Open **Settings → Migrate v6**
2. Follow the wizard — it walks you through exporting from the old app's browser storage
3. Paste or upload the JSON → preview → import

---

## Features

| Module | Features |
|--------|----------|
| **Tenders** | CRUD, filters, sort, pagination (50/page), card + list view, NEW row highlight |
| **Bid Bonds** | Bond tracking, action alerts, expiry warnings per tender |
| **Analytics** | Win rate gauge, bar/pie charts via Recharts, loss analysis, owner scorecard |
| **Calendar** | Month grid with closing/follow-up/issue dates |
| **Board** | Kanban view across 6 pipeline stages |
| **Timeline** | Gantt-style bar chart, 1/3/6 month view |
| **Clients** | Auto-built from tender data, click for full history |
| **Intelligence** | Competitor tracking, win rate against each competitor |
| **Reports** | 6 one-click CSV exports |
| **Sales & Payments** | Full deal + invoice tracker with collection analytics |
| **Import** | AIMS Excel, CSV, JSON backup — 3-step wizard |
| **Print** | Per-tender print sheet → PDF via browser |
| **Realtime** | Supabase live sync — team changes appear instantly |
| **Notifications** | Overdue, due soon, bond expiry, follow-ups |
| **Dark mode** | Persisted to localStorage |
| **Roles** | admin / manager / viewer — gated throughout UI |

---

## Project structure

```
src/
├── components/
│   ├── layout/        Shell, Sidebar, TopBar
│   ├── settings/      SettingsModal, MigrationTool
│   ├── tenders/       NewTenderModal, DetailPanel, ImportModal, PrintModal, BulkStatusModal
│   └── ui/            Badge, KpiCard, Toasts, NotificationsPanel, RoleGuard, Spotlight…
├── hooks/             useAuth, usePermissions, useRealtime
├── lib/               constants, utils, supabase client
├── pages/             12 pages (Dashboard, Tenders, Deals, Analytics, Calendar…)
└── store/             Zustand store — all CRUD + realtime + notifications
supabase/
└── schema.sql         Full DB schema, RLS, triggers, realtime
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |

---

## Tech Stack

- **React 18** + **Vite 5** — fast dev + optimized builds
- **Supabase** — PostgreSQL, Row Level Security, Auth, Realtime
- **Zustand** — lightweight global state
- **React Router v6** — client-side routing
- **Recharts** — analytics charts
- **xlsx** — Excel import parsing
- **Tailwind CSS** + CSS custom properties — design system

---

*TenderTrack v2.0 · AIMS Kuwait · Internal Use Only*

## Password Reset

TenderTrack uses Supabase's built-in password reset flow.

**Setup (one time):** In Supabase Dashboard → Authentication → URL Configuration, add your app URL to **Redirect URLs**:
- Development: `http://localhost:5173/auth`
- Production: `https://your-app.vercel.app/auth`

Users click "Forgot password?" on the login page → receive email → click link → redirected to the app to set a new password.

## First Admin Bootstrap

The first user who signs up is automatically promoted to `admin`. For subsequent users, promote manually:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'you@aims.com.kw';
```
