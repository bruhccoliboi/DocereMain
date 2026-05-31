# Docere

**The Teacher's Journal**

Docere (Latin for "to teach") is a premium Progressive Web Application for independent educators. A private workspace to remember every lesson, track learner progress, manage schedules, handle reschedules, and track payments.

## Features

### Core workspace
- **Blank start**: No demo data. Build from scratch via onboarding.
- **Today dashboard**: Sessions, timeline, pending notes, payments, makeup lessons, weekly snapshot.
- **Learners**: Profiles with photo, goals, tags, learning items, billing snapshot.
- **Learning journey timeline**: Chronological session memory with voice notes.

### Session documentation
- **Voice notes**: Browser speech recognition + optional audio recording.
- **AI structuring**: Auto-extract summary, progress, homework, next focus (OpenAI optional, local fallback always works).
- **Session note editor**: Quick, detailed, and structured tabs.

### Scheduling
- **Day / week / month** calendar views.
- **Drag-and-drop** rescheduling on week/day grid.
- **Recurring rules** with 12-week session generation.
- **Duplicate sessions**, linked reschedules, makeup tracking.

### Studio Mode
- One-screen lesson prep: last session, goals, homework, focus, payment status.
- **Session timer** with visual progress ring.
- Mark complete and document without leaving Studio.

### Payments
- Monthly, per-session, package, group, custom billing.
- Package session decrement on attendance.
- Payment history (never overwritten).

### Reports
- Revenue and session **charts** (12-week revenue, 8-week sessions).
- CSV export for payments, JSON full backup.

### Productivity
- **Command palette** (`Cmd/Ctrl+K`): search and navigate.
- **Toast notifications** (Sonner).

### Cloud (optional)
- **Supabase auth** sign in/up in Settings.
- **Workspace snapshot sync** to `workspace_snapshots` table.
- Auto-sync on data changes when signed in.
- Import/export JSON backup locally.

### PWA
- Installable, service worker in production builds, offline local data.

## Design

Dark charcoal, olive accents, warm cream text. Space Grotesk, Inter, JetBrains Mono.

## Tech Stack

- Next.js 16, TypeScript, Tailwind CSS 4
- Framer Motion, Zustand, cmdk, Sonner
- @dnd-kit (calendar drag), Recharts (reports)
- Supabase (optional), @ducanh2912/next-pwa

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

Copy `.env.example` to `.env.local`:

```bash
# Optional Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Optional OpenAI (better note structuring)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

Run SQL in Supabase:
1. `supabase/schema.sql`
2. `supabase/migrations/002_workspace_snapshots.sql`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development |
| `npm run build` | Production (webpack + PWA) |
| `npm start` | Production server |

## Philosophy

Teaching is a craft. Docere is the workspace that remembers everything.
