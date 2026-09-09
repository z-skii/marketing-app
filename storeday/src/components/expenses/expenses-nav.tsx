import { Tabs } from "@/components/ui/misc";

/** Sub-navigation shared by /expenses, /expenses/recurring and /expenses/categories. */
export function ExpensesNav({ active, counts }: { active: "list" | "recurring" | "categories"; counts?: Partial<Record<"list" | "recurring" | "categories", number>> }) {
  return (
    <Tabs items={[
      { href: "/expenses", label: "Expenses", active: active === "list", count: counts?.list },
      { href: "/expenses/recurring", label: "Recurring", active: active === "recurring", count: counts?.recurring },
      { href: "/expenses/categories", label: "Categories", active: active === "categories", count: counts?.categories },
    ]} />
  );
}
