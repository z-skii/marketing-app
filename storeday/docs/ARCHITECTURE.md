# Storeday — architecture & conventions

Read this before adding code. It is short on purpose.

## Product
Operating system for owners of one or more physical stores. Spreadsheet-speed daily accounting
(Quick Close, Rapid Entry, Month View), automatic labor from Verified Shift clock-ins, expenses,
schedules, Store Check checklists, dashboards, reports, notifications. Roles: owner / manager / employee.

## Stack
Next.js 16 (App Router, Server Components + Server Actions, `src/proxy.ts` for auth cookie refresh),
React 19, TypeScript, Tailwind v4 (tokens in `src/app/globals.css`), Supabase (Postgres, Auth,
Storage, Realtime, RLS). No ORM: the browser/server talk to Supabase via `@supabase/ssr` and RLS
is the security boundary. `lucide-react` for icons. `date-fns` + `@date-fns/tz` for dates.

## Directory map
```
supabase/migrations/     schema (0001), functions + RPCs + daily_accounting view (0002), RLS (0003), ops (0005)
src/types/database.ts    generated Supabase types (Database). Row types: Database["public"]["Tables"]["x"]["Row"]
src/config/site.ts       brand + public Supabase constants + siteUrl()
src/lib/supabase/        server.ts (createSupabaseServerClient, createSupabaseAdminClient), client.ts (browser singleton)
src/lib/auth.ts          getCurrentUser, getOrgContext, requireOrgContext, requireManagerContext, requireOwnerContext, pickLocation
src/lib/permissions.ts   role/permission helpers (pure)
src/lib/calc/            accounting.ts (computeDailyTotals etc.), payroll.ts (estimatePayroll), geo.ts (distance)
src/lib/utils/           currency.ts (formatMoney, parseMoneyInput), time.ts (todayIn, resolveRange, weeksInRange...), cn.ts
src/lib/data/            server-only query helpers (accounting.ts, team.ts)
src/lib/action-result.ts ActionResult<T> = {ok:true,data}|{ok:false,error}; ok(), fail()
src/components/ui/       button, badge (StatusBadge), card (Card, SectionLabel), stat (Stat, KV, ChangePill), form (Input, Select,
                         Textarea, Field, Checkbox, Switch, Alert, ErrorText), money-input (MoneyInput, focusNextNav),
                         modal (Modal, ConfirmDialog), toast (useToast), misc (PageHeader, EmptyState, Tabs, Segmented,
                         TableWrap, Spinner), filters (DateRangeBar, StoreSelect, ParamSelect, DateStepper), chart
src/components/layout/   AppShell (sidebar + mobile bottom nav), nav-config.ts
src/components/expenses/quick-expense-modal.tsx   "+ Add Detailed Expense" sheet (used by Quick Close)
src/app/(auth)/          sign-in, sign-up, forgot/reset password, verify-email, invite/[token]
src/app/onboarding/      7-step setup
src/app/(app)/           everything behind the app shell (requires org membership)
```

## Data rules (non-negotiable)
- A number is entered ONCE. Totals are derived: TS `computeDailyTotals()` for live UI, SQL view
  `daily_accounting` + `accounting_totals/accounting_by_day/accounting_by_location` for stored data.
  Never store total_sales/profit in daily_reports. Never re-implement the formulas.
- Labor = completed shifts (`worked_minutes` × `hourly_rate_snapshot`) — comes from `shifts`, via
  `labor_detail(p_loc, p_date)` for a day. Never ask a manager to type labor.
- Detailed expenses affect totals through their category `bucket` (goods|labor|utilities|other).
- Writes that must be transactional/audited go through RPCs: `save_daily_report_draft`,
  `edit_daily_report(id, patch, reason)`, `close_day`, `reopen_day`, `clock_in`, `clock_out`,
  `adjust_shift`, `create_manual_shift`, `accept_invitation`, `create_organization`,
  `materialize_recurring_expenses`, `run_org_checks`, `log_activity_public`.
  Closed days cannot be updated directly (trigger) — use `edit_daily_report` with a reason.
- "Today" is per location: `todayIn(location.timezone)` / `ctx.today` (org timezone). Dates are `YYYY-MM-DD` strings.
- Money: numbers in dollars, round with `round2`. Format with `formatMoney`. Inputs use `<MoneyInput>`.
- Employees must never see accounting. RLS enforces it; pages also gate with `requireManagerContext()`.

## Page conventions
- Server Component page: `const ctx = await requireManagerContext();` then `createSupabaseServerClient()` queries, pass plain data to client components.
- `searchParams` is a Promise in Next 16: `const sp = await searchParams;`
- Date filters via URL: `resolveRange((sp.range as RangePreset) ?? "today", ctx.today, ctx.settings.week_starts_on, sp)`; render `<DateRangeBar/>`.
- Store filter via `?location=` and `<StoreSelect locations={ctx.locations}/>`.
- Server actions live in `actions.ts` next to the route, return `ActionResult`, call `revalidatePath`.
  Forms use `useActionState(action, null)`; show `<ErrorText>`.
- Keep components small; a page file should mostly compose. Put reusable client components under `src/components/<feature>/`.
- Design: compact, dense, thin borders, tabular numbers (`tnum`), status badges. Use `Card`, `Stat`, `.table`,
  `PageHeader`. No gradients/glassmorphism/giant cards. Mobile: cards instead of wide tables; bottom nav exists already.
- Realtime: `getSupabaseBrowserClient().channel(...).on("postgres_changes", {...})` then `router.refresh()`.
- Storage buckets (private): `shift-photos`, `receipts`, `checklist-photos`. Paths start with `{organization_id}/{location_id}/`.
  Get signed URLs server-side via `supabase.storage.from(bucket).createSignedUrl(path, 600)` under the user's session.
- No fake buttons, no "coming soon". Every control does something real.

## Checks before finishing
`npm run typecheck` and `npm run lint` must pass. Run them in `storeday/`.
