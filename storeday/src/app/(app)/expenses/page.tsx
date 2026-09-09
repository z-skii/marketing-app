import { requireManagerContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveRange, shortRangeLabel, type RangePreset } from "@/lib/utils/time";
import { formatMoney } from "@/lib/utils/currency";
import { round2 } from "@/lib/calc/accounting";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Stat } from "@/components/ui/stat";
import { DateRangeBar, ParamSelect, StoreSelect } from "@/components/ui/filters";
import { ExpensesNav } from "@/components/expenses/expenses-nav";
import { ExpenseTable, type ExpenseListRow } from "@/components/expenses/expense-table";
import { AddExpenseButton } from "@/components/expenses/add-expense-button";
import { SearchBox } from "@/components/expenses/search-box";
import type { AccountingBucket } from "@/lib/expenses/constants";

const LIMIT = 300;

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await requireManagerContext();
  const sp = await searchParams;
  const range = resolveRange((sp.range as RangePreset) ?? "this_month", ctx.today, ctx.settings.week_starts_on, sp);
  const supabase = await createSupabaseServerClient();
  const locationIds = ctx.locations.map((l) => l.id);
  const location = sp.location && locationIds.includes(sp.location) ? sp.location : null;
  const status = sp.status === "paid" || sp.status === "expected" ? sp.status : null;
  const category = sp.category && /^[0-9a-f-]{36}$/i.test(sp.category) ? sp.category : null;
  const q = (sp.q ?? "").trim().slice(0, 80);
  // Characters PostgREST uses to parse `or=` filters are dropped from the search so the filter can never be malformed.
  const like = q ? `%${q.replace(/[,()"\\%]/g, " ").trim()}%` : null;

  // Make sure expected rows for recurring expenses exist up to today (idempotent; errors are not fatal for the page).
  await supabase.rpc("materialize_recurring_expenses", { p_org: ctx.org.id, p_until: ctx.today }).then(() => {}, () => {});

  const applyFilters = <T extends { in: (c: string, v: string[]) => T; eq: (c: string, v: string) => T; or: (f: string) => T; gte: (c: string, v: string) => T; lte: (c: string, v: string) => T }>(qb: T): T => {
    let b = qb.eq("organization_id", ctx.org.id).gte("business_date", range.from).lte("business_date", range.to);
    b = location ? b.eq("location_id", location) : b.in("location_id", locationIds);
    if (category) b = b.eq("category_id", category);
    if (status) b = b.eq("status", status);
    if (like) b = b.or(`vendor.ilike.${like},description.ilike.${like}`);
    return b;
  };

  const [{ data: categories }, { data: rows }, { data: totalsRows }] = await Promise.all([
    supabase.from("expense_categories").select("id, name, bucket, is_active").eq("organization_id", ctx.org.id).order("sort_order").order("name"),
    applyFilters(supabase.from("expenses").select("*, expense_categories(name, bucket), locations(name), receipts(id, content_type, original_filename)"))
      .order("business_date", { ascending: false }).order("created_at", { ascending: false }).limit(LIMIT + 1),
    applyFilters(supabase.from("expenses").select("amount, status, category_id")).limit(10000),
  ]);

  const cats = categories ?? [];
  const bucketOf = new Map(cats.map((c) => [c.id, c.bucket as AccountingBucket]));
  const totals = { paid: 0, expected: 0, goods: 0, labor: 0, utilities: 0, other: 0, count: 0 };
  for (const r of totalsRows ?? []) {
    const amt = Number(r.amount);
    totals.count++;
    if (r.status === "paid") { totals.paid = round2(totals.paid + amt); totals[bucketOf.get(r.category_id) ?? "other"] = round2((totals[bucketOf.get(r.category_id) ?? "other"] ?? 0) + amt); }
    else totals.expected = round2(totals.expected + amt);
  }

  const truncated = (rows?.length ?? 0) > LIMIT;
  const list: ExpenseListRow[] = (rows ?? []).slice(0, LIMIT).map((r) => {
    const cat = r.expense_categories as { name: string; bucket: string } | null;
    const loc = r.locations as { name: string } | null;
    const receipt = r.receipts as { id: string; content_type: string | null; original_filename: string | null } | null;
    return {
      id: r.id, business_date: r.business_date, location_id: r.location_id, location_name: loc?.name ?? "", category_id: r.category_id,
      category_name: cat?.name ?? "", bucket: cat?.bucket ?? "other", vendor: r.vendor, description: r.description, payment_method: r.payment_method,
      amount: Number(r.amount), status: r.status, recurring_expense_id: r.recurring_expense_id,
      receipt: receipt ? { id: receipt.id, content_type: receipt.content_type, original_filename: receipt.original_filename } : null,
    };
  });

  const currency = ctx.settings.currency;
  const activeCategories = cats.filter((c) => c.is_active);
  const canWrite = ctx.can("can_add_expenses");
  const hasFilters = Boolean(location || category || status || q);

  return (
    <div>
      <PageHeader title="Expenses" description={`Detailed expenses · ${shortRangeLabel(range)}`}
        actions={canWrite ? <AddExpenseButton organizationId={ctx.org.id} locations={ctx.locations} categories={activeCategories} today={ctx.today} currency={currency} defaultLocationId={location ?? undefined} /> : undefined} />
      <ExpensesNav active="list" />

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <DateRangeBar presets={["this_month", "today", "yesterday", "this_week", "last_week", "last_month", "this_year", "custom"]} />
        {ctx.locations.length > 1 && <StoreSelect locations={ctx.locations} />}
        <ParamSelect paramKey="category" placeholder="All categories" options={cats.map((c) => ({ value: c.id, label: c.is_active ? c.name : `${c.name} (inactive)` }))} />
        <ParamSelect paramKey="status" placeholder="Paid + expected" options={[{ value: "paid", label: "Paid" }, { value: "expected", label: "Expected" }]} />
        <SearchBox placeholder="Vendor or description" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        <Stat label="Paid" value={formatMoney(totals.paid, { currency })} sub={`${totals.count} ${totals.count === 1 ? "expense" : "expenses"}`} />
        <Stat label="Expected" value={formatMoney(totals.expected, { currency })} tone={totals.expected > 0 ? "warn" : "default"} sub="not yet paid" />
        <Stat label="Goods" value={formatMoney(totals.goods, { currency })} size="sm" />
        <Stat label="Labor" value={formatMoney(totals.labor, { currency })} size="sm" />
        <Stat label="Utilities" value={formatMoney(totals.utilities, { currency })} size="sm" />
        <Stat label="Other" value={formatMoney(totals.other, { currency })} size="sm" />
      </div>

      {list.length === 0 ? (
        <EmptyState title={hasFilters ? "No expenses match these filters" : `No expenses for ${range.label.toLowerCase()}`}
          description={hasFilters ? "Try a wider date range or clear the filters." : "Detailed expenses are added here or from Quick Close. Recurring bills show up automatically as Expected."}
          action={canWrite && !hasFilters ? <AddExpenseButton organizationId={ctx.org.id} locations={ctx.locations} categories={activeCategories} today={ctx.today} currency={currency} /> : undefined} />
      ) : (
        <>
          <ExpenseTable rows={list} organizationId={ctx.org.id} locations={ctx.locations} categories={cats} today={ctx.today} currency={currency} canWrite={canWrite} showStore={ctx.locations.length > 1} />
          {truncated && (
            <p className="mt-2 text-[12.5px] text-text-3">Showing the {LIMIT} most recent of {totals.count} expenses. The totals above include all of them; narrow the date range or filters to see the rest.</p>
          )}
        </>
      )}
    </div>
  );
}
