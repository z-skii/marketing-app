import Link from "next/link";
import { requireManagerContext, pickLocation } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadDayContext } from "@/lib/data/accounting";
import { todayIn } from "@/lib/utils/time";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { QuickCloseForm } from "@/components/accounting/quick-close-form";
import type { LaborRow, StoreOption } from "@/components/accounting/types";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function QuickClosePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await requireManagerContext();
  const sp = await searchParams;
  if (ctx.locations.length === 0) {
    return (
      <>
        <PageHeader title="Quick Close" back={{ href: "/accounting", label: "Accounting" }} />
        <EmptyState title="Add a store first" description="Quick Close records the day for one store at a time." action={<Link href="/stores/new" className="inline-flex h-8.5 items-center rounded-md bg-accent px-3 text-[13.5px] font-medium text-white">Add store</Link>} />
      </>
    );
  }
  const location = pickLocation(ctx, sp.location) ?? ctx.locations[0];
  const today = todayIn(location.timezone);
  const date = sp.date && DATE_RE.test(sp.date) && sp.date <= today ? sp.date : today;

  const supabase = await createSupabaseServerClient();
  const [day, { data: locSettings }, { data: categories }] = await Promise.all([
    loadDayContext(supabase, location.id, date),
    supabase.from("location_settings").select("starting_cash, require_closing_checklist, require_cash_count").eq("location_id", location.id).maybeSingle(),
    supabase.from("expense_categories").select("id,name,bucket").eq("organization_id", ctx.org.id).eq("is_active", true).order("sort_order"),
  ]);

  const stores: StoreOption[] = ctx.locations.map((l) => ({ id: l.id, name: l.name, timezone: l.timezone }));
  const labor: LaborRow[] = day.labor.map((r) => ({
    shift_id: r.shift_id, employee_id: r.employee_id, employee_name: r.employee_name, clock_in_at: r.clock_in_at, clock_out_at: r.clock_out_at,
    worked_minutes: r.worked_minutes, hourly_rate: r.hourly_rate == null ? null : Number(r.hourly_rate), labor_cost: r.labor_cost == null ? null : Number(r.labor_cost),
    status: r.status, verification_status: r.verification_status,
  }));

  return (
    <>
      <PageHeader title="Quick Close" description="Enter the day's numbers once. Totals update as you type; the draft saves itself." back={{ href: "/accounting", label: "Accounting" }}
        actions={<Link href={`/accounting/rapid-entry?date=${date}`} className="text-[13px] text-accent hover:underline">Rapid Entry →</Link>} />
      <QuickCloseForm
        key={`${location.id}:${date}`}
        organizationId={ctx.org.id}
        location={{ id: location.id, name: location.name, timezone: location.timezone }}
        locations={stores}
        date={date}
        today={today}
        settings={{ currency: ctx.settings.currency, cashCheckEnabled: ctx.settings.cash_check_enabled, otherSalesEnabled: ctx.settings.other_sales_enabled, weekStartsOn: ctx.settings.week_starts_on }}
        startingCash={Number(locSettings?.starting_cash ?? 0)}
        requireClosingChecklist={Boolean(locSettings?.require_closing_checklist)}
        requireCashCount={Boolean(locSettings?.require_cash_count)}
        report={day.report}
        labor={labor}
        laborSummary={day.laborSummary}
        expenses={day.expenses.map((e) => ({ id: e.id, amount: e.amount, category_name: e.category_name, bucket: e.bucket, vendor: e.vendor, description: e.description, payment_method: e.payment_method, status: e.status }))}
        lastCloseout={day.lastCloseout}
        categories={categories ?? []}
        canEditClosed={ctx.isOwner || ctx.can("can_edit_closed_days")}
        canAddExpenses={ctx.can("can_add_expenses")}
      />
    </>
  );
}
