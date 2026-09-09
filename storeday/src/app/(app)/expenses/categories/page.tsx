import { requireManagerContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BUCKETS, BUCKET_TONE } from "@/lib/expenses/constants";
import { ExpensesNav } from "@/components/expenses/expenses-nav";
import { CategoryEditor } from "@/components/expenses/category-editor";

export default async function ExpenseCategoriesPage() {
  const ctx = await requireManagerContext();
  const supabase = await createSupabaseServerClient();
  const { data: categories } = await supabase.from("expense_categories").select("*").eq("organization_id", ctx.org.id).order("sort_order").order("name");
  const list = categories ?? [];

  return (
    <div>
      <PageHeader title="Expense categories" description={ctx.isOwner ? "Every category rolls into one accounting bucket. The bucket decides which line of the day's P&L an expense lands on." : "Read-only: only the owner can change categories."} />
      <ExpensesNav active="categories" counts={{ categories: list.filter((c) => c.is_active).length }} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <CategoryEditor categories={list} isOwner={ctx.isOwner} />
        </div>
        <Card className="self-start">
          <CardHeader title="What the buckets do" description="Only Paid expenses count. Expected ones wait until confirmed." />
          <CardBody className="space-y-2.5">
            {BUCKETS.map((b) => (
              <div key={b.value} className="flex items-start gap-2">
                <Badge tone={BUCKET_TONE[b.value]} className="mt-0.5 w-[74px] justify-center">{b.label}</Badge>
                <p className="text-[12.5px] text-text-2">{b.description}</p>
              </div>
            ))}
            <p className="text-[12px] text-text-3 pt-1 border-t border-border">
              Net profit = total sales − (goods + labor + utilities + other). Deactivated categories keep their history but disappear from the pickers.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
