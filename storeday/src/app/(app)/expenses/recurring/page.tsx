import { requireManagerContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { ExpensesNav } from "@/components/expenses/expenses-nav";
import { RecurringList } from "@/components/expenses/recurring-list";
import type { RecurringExpenseRow } from "@/app/(app)/expenses/actions";

export default async function RecurringExpensesPage() {
  const ctx = await requireManagerContext();
  const supabase = await createSupabaseServerClient();
  const locationIds = ctx.locations.map((l) => l.id);
  // Keep generated rows current before listing (idempotent; failures are not fatal here).
  await supabase.rpc("materialize_recurring_expenses", { p_org: ctx.org.id, p_until: ctx.today }).then(() => {}, () => {});

  const [{ data: rows }, { data: categories }] = await Promise.all([
    supabase.from("recurring_expenses").select("*, expense_categories(name, bucket), locations(name)").eq("organization_id", ctx.org.id).in("location_id", locationIds)
      .order("is_active", { ascending: false }).order("next_due_date").order("created_at"),
    supabase.from("expense_categories").select("id, name, bucket, is_active").eq("organization_id", ctx.org.id).order("sort_order").order("name"),
  ]);

  const list: RecurringExpenseRow[] = (rows ?? []).map((r) => {
    const { expense_categories: cat, locations: loc, ...rest } = r;
    return {
      ...rest, amount: Number(rest.amount),
      category_name: (cat as { name: string } | null)?.name ?? "", bucket: (cat as { bucket: string } | null)?.bucket ?? "other",
      location_name: (loc as { name: string } | null)?.name ?? "",
    };
  });

  return (
    <div>
      <PageHeader title="Recurring expenses" description={ctx.isOwner ? "Bills that repeat. Storeday creates each occurrence on its due date." : "Read-only: only the owner can change schedules."} />
      <ExpensesNav active="recurring" counts={{ recurring: list.length }} />
      <RecurringList rows={list} locations={ctx.locations} categories={categories ?? []} today={ctx.today} currency={ctx.settings.currency} isOwner={ctx.isOwner} />
    </div>
  );
}
