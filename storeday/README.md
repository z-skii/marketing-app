# Storeday

**Everything that happened in your stores today, in one place.**

Storeday is an operating system for owners of one or more physical stores (convenience stores,
smoke shops, gas stations, small retail, restaurants, barber shops). It keeps the speed of the
accounting spreadsheet and removes the manual work: type the day's numbers once, and sales,
expenses, labor, profit, weekly/monthly totals, rankings and comparisons are calculated for you.
Employees clock in with a live photo + GPS (Verified Shift), and their hours become labor cost
automatically.

## What's in V1

| Area | Pages |
|---|---|
| Accounting | Quick Close (60–90 s daily closeout), Rapid Entry (all stores in one keyboard-driven grid), Month View (spreadsheet + weekly summary + inline edit), Day record with audit history |
| Expenses | Expense list/filters, detailed expenses from Quick Close, recurring expenses (Expected vs Paid), categories with accounting buckets, receipt upload (OCR-ready columns, no fake OCR) |
| Team | Employees, hourly rate history, invitations, manager permissions, payroll estimate (overtime rules) |
| Verified Shift | Employee clock screen (live camera + GPS radius), shift detail with photos & verification, manager time adjustments with reasons, manual shifts, Who's Working (realtime) |
| Operations | Schedules (week grid, copy week, recurring), Store Check opening/closing checklists with photo items, store status (opened/closed by whom) |
| Owner | Dashboard (30-second read), store dashboards, location rankings, Daily Brief (rule-based, AI-ready), reports + CSV export, notifications with thresholds, activity log |
| Platform | Multi-tenant orgs, owner/manager/employee roles, Supabase RLS, PWA (installable on phones), dark/light mode |

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Supabase (Postgres, Auth, Storage, Realtime, RLS) · Vercel.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the directory map, data rules and conventions.

## Setup (production)

The Supabase project `storeday` (`wkvdleevitpdbmeukurm`) already has every migration in
`supabase/migrations/` applied, plus the private storage buckets. To finish:

1. **Supabase → Authentication → URL Configuration**: set *Site URL* to your deployed URL and
   add `https://<your-domain>/**` (and `http://localhost:3000/**`) to *Redirect URLs*.
   Confirmation and reset emails link through `/auth/callback`.
2. **Supabase → Authentication → Email**: the built-in mailer is rate-limited (a few emails/hour).
   Add custom SMTP before inviting a whole team, or share invitation links directly (the app always
   shows the link to copy).
3. **Vercel**: import the repo, set *Root Directory* to `storeday`, and add the environment variables
   from `.env.example`. `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API keys) enables invitation
   emails and the hourly cron; `CRON_SECRET` protects `/api/cron/hourly`. The public URL and anon key
   have safe defaults in `src/config/site.ts`.
4. Sign up, create your business, add your first store (address lookup or "use my location"), and
   you're in. Settings → Data → **Load demo data** creates a separate demo business with 3 stores,
   10 employees and 30 days of numbers so you can see everything populated.

New migrations: add a file under `supabase/migrations/` and apply it with the Supabase SQL editor
or `supabase db push`; regenerate `src/types/database.ts` with `supabase gen types`.

## Local development

```bash
npm install
cp .env.example .env.local        # point at the real Supabase project …
npm run dev
```

…or fully offline against a local Postgres with the bundled Supabase-compatible dev server:

```bash
createdb storeday                 # role app/app (see scripts/db-reset.sh)
npm run db:reset                  # applies supabase/local/*.sql + supabase/migrations/*.sql
npm run local:supabase            # auth + REST + storage shim on :54321 (see scripts/local-supabase/README.md)
npm run dev:local                 # next dev pointed at the shim
```

Checks: `npm run typecheck`, `npm run lint`, `npm test` (calculation + SQL tests), `npm run build`.

## Key design decisions

- **One number, entered once.** `daily_reports` stores only what a manager types. Totals live in the
  `daily_accounting` view and `computeDailyTotals()`; nothing is stored twice.
- **Labor is automatic.** Completed shifts × hourly rate snapshot. Managers never type labor.
- **Closed days never change silently.** A trigger blocks direct updates; `edit_daily_report` requires a
  reason and writes before/after to `activity_logs`; every close writes an immutable `closeout_reports` snapshot.
- **RLS is the security boundary.** Owners see their organization, managers their assigned stores,
  employees only themselves. Employees cannot query accounting tables at all.
- **Verified Shift is realistic.** Live camera only, server-side timestamps, GPS radius with accuracy
  tolerance, repeat-photo hashing, device metadata, audit log. Issues are flagged for review, not auto-accused.
